<?php

namespace App\Jobs;

use App\Models\BotAllowedNumber;
use App\Models\WhatsappBot;
use App\Services\EvolutionApiService;
use App\Services\GeminiBotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessBotMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 120;

    public function __construct(
        public string $instanceName,
        public array $data,
    ) {
    }

    public function handle(EvolutionApiService $evolution, GeminiBotService $gemini): void
    {
        $bot = WhatsappBot::where('instance_name', $this->instanceName)->first();
        if (! $bot) {
            return;
        }

        $key       = $this->data['key'] ?? [];
        $remoteJid = $key['remoteJid'] ?? '';

        // Ignora mensagens enviadas pelo próprio bot, grupos e broadcasts
        if (($key['fromMe'] ?? false) || ! str_ends_with($remoteJid, '@s.whatsapp.net')) {
            return;
        }

        // Ignora mensagens antigas (sincronização de histórico ao conectar o QR):
        // só responde mensagens recebidas nos últimos 2 minutos.
        $timestamp = (int) ($this->data['messageTimestamp'] ?? 0);
        if ($timestamp > 0 && $timestamp < now()->subMinutes(2)->getTimestamp()) {
            return;
        }

        $phone = preg_replace('/\D/', '', explode('@', $remoteJid)[0]);

        // Whitelist: só números autorizados conversam com o bot (demais: silêncio).
        // Compara com e sem o nono dígito (o WhatsApp varia o formato do JID).
        $allowed = BotAllowedNumber::fromCompany($bot->company_id)
            ->whereIn('phone', BotAllowedNumber::phoneVariants($phone))
            ->exists();

        if (! $allowed) {
            return;
        }

        [$text, $audio] = $this->extractContent($evolution, $key['id'] ?? null);

        if ($text === null && $audio === null) {
            $evolution->sendText(
                $this->instanceName,
                $phone,
                'Por enquanto só entendo mensagens de *texto* e *áudio*. 🙂'
            );

            return;
        }

        $companyName = $bot->company?->fantasy_name
            ?? $bot->company?->company_name
            ?? 'sua empresa';

        $attachments = [];

        try {
            $answer      = $gemini->reply($bot->company_id, $phone, $text, $audio, $companyName);
            $attachments = $gemini->attachments();
        } catch (\Throwable $e) {
            Log::error('Bot: falha ao gerar resposta', [
                'instance' => $this->instanceName,
                'error'    => $e->getMessage(),
            ]);

            $answer = 'Não consegui processar sua mensagem agora. Tente novamente em instantes.';
        }

        $evolution->sendText($this->instanceName, $phone, $answer);

        // Arquivos pedidos na conversa (comprovantes) vão depois do texto.
        // Falhar aqui não pode apagar a resposta que já foi enviada.
        foreach ($attachments as $file) {
            try {
                $evolution->sendMedia($this->instanceName, $phone, $file['path'], $file['caption'] ?? '');
            } catch (\Throwable $e) {
                Log::error('Bot: falha ao enviar anexo', [
                    'instance' => $this->instanceName,
                    'file'     => $file['path'] ?? null,
                    'error'    => $e->getMessage(),
                ]);

                $evolution->sendText(
                    $this->instanceName,
                    $phone,
                    'Não consegui enviar o comprovante agora. 😕 Ele está anexado na venda, dentro do sistema.'
                );
            }
        }
    }

    /**
     * @return array{0: ?string, 1: ?array} [texto, áudio]
     */
    private function extractContent(EvolutionApiService $evolution, ?string $messageId): array
    {
        $message = $this->data['message'] ?? [];

        $text = $message['conversation']
            ?? $message['extendedTextMessage']['text']
            ?? null;

        if ($text !== null && trim($text) !== '') {
            return [trim($text), null];
        }

        if (isset($message['audioMessage'])) {
            // Com base64=true no webhook, a mídia já vem no payload
            if (! empty($message['base64'])) {
                return [null, [
                    'base64'   => $message['base64'],
                    'mimetype' => $message['audioMessage']['mimetype'] ?? 'audio/ogg',
                ]];
            }

            // Fallback: baixa pela API
            if ($messageId) {
                $media = $evolution->getMediaBase64($this->instanceName, $messageId);
                if ($media) {
                    return [null, $media];
                }
            }
        }

        return [null, null];
    }
}
