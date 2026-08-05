<?php

namespace App\Services;

use App\Models\BotAllowedNumber;
use App\Models\BotNotification;
use App\Models\Company;
use App\Models\WhatsappBot;
use Illuminate\Support\Facades\Log;

/**
 * Notificações automáticas enviadas pelo bot de WhatsApp
 * (ex.: resumo diário de vendas no horário configurado).
 */
class BotNotificationService
{
    public function __construct(private EvolutionApiService $evolution)
    {
    }

    /**
     * Pasta dos áudios que podem abrir uma notificação.
     */
    public static function audioDir(): string
    {
        return base_path('audios');
    }

    /**
     * Arquivos de áudio disponíveis para seleção na página do bot.
     */
    public static function availableAudios(): array
    {
        $dir = self::audioDir();

        if (! is_dir($dir)) {
            return [];
        }

        return collect(scandir($dir))
            ->filter(fn ($f) => preg_match('/\.(mp3|ogg|m4a|wav)$/i', $f))
            ->values()
            ->all();
    }

    /**
     * Envia o resumo diário de vendas da empresa para os números com
     * notificações ativadas. Retorna quantos números receberam.
     */
    public function sendDailySales(Company $company, ?BotNotification $notification = null): int
    {
        $bot = WhatsappBot::fromCompany($company->id)->where('status', 'connected')->first();
        if (! $bot) {
            return 0;
        }

        $recipients = BotAllowedNumber::fromCompany($company->id)
            ->where('notifications_enabled', true)
            ->get();

        if ($recipients->isEmpty()) {
            return 0;
        }

        $summary = (new BotToolsService($company->id))->salesSummary();

        [$summaryText, $itemsText] = $this->buildDailyMessages($company, $summary);

        $audioPath = null;
        if ($notification?->audio_file) {
            $candidate = self::audioDir() . DIRECTORY_SEPARATOR . basename($notification->audio_file);
            $audioPath = is_file($candidate) ? $candidate : null;
        }

        $sent = 0;

        foreach ($recipients as $recipient) {
            try {
                if ($audioPath) {
                    $this->evolution->sendAudio($bot->instance_name, $recipient->phone, $audioPath);
                }

                $this->evolution->sendText($bot->instance_name, $recipient->phone, $summaryText);

                if ($itemsText !== null) {
                    $this->evolution->sendText($bot->instance_name, $recipient->phone, $itemsText);
                }

                $sent++;
            } catch (\Throwable $e) {
                Log::error('Bot: falha ao enviar notificação diária', [
                    'company' => $company->id,
                    'phone'   => $recipient->phone,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        return $sent;
    }

    /**
     * Monta as duas mensagens do resumo diário: [resumo, itens|null].
     */
    public function buildDailyMessages(Company $company, array $summary): array
    {
        $brand = mb_strtoupper($company->fantasy_name ?: $company->company_name, 'UTF-8');
        $money = fn (float $v) => 'R$ ' . number_format($v, 2, ',', '.');
        $qty   = fn ($v) => rtrim(rtrim(number_format((float) $v, 3, ',', '.'), '0'), ',');

        $weekdays = [1 => 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
        $dateLine = $weekdays[now()->isoWeekday()] . ', ' . now()->format('d/m/Y');

        $statusIcon = ['pago' => '✅', 'parcial' => '🔵', 'pendente' => '🕗'];

        // ── Mensagem 1: resumo das vendas ──
        $lines   = [];
        $lines[] = "💧 *{$brand}* — Resumo do dia";
        $lines[] = "📅 {$dateLine}";
        $lines[] = '';

        if ($summary['sales_count'] === 0) {
            $lines[] = 'Nenhuma venda registrada hoje.';

            return [implode("\n", $lines), null];
        }

        $plural  = $summary['sales_count'] === 1 ? 'venda' : 'vendas';
        $lines[] = "🛒 *{$summary['sales_count']} {$plural}* — total de *{$money($summary['total_value'])}*";
        $lines[] = '';

        foreach ($summary['sales'] as $i => $sale) {
            $icon    = $statusIcon[$sale['status']] ?? '▫️';
            $lines[] = ($i + 1) . '. ' . $sale['customer'] . ' — *' . $money($sale['total']) . "* {$icon}";
        }

        $lines[] = '';
        $lines[] = '✅ Recebido: *' . $money($summary['received_value']) . '*';
        if ($summary['open_value'] > 0) {
            $lines[] = '🕗 Em aberto: *' . $money($summary['open_value']) . '*';
        }

        $summaryText = implode("\n", $lines);

        // ── Mensagem 2: itens vendidos ──
        $itemLines   = [];
        $itemLines[] = '📦 *Itens vendidos hoje*';
        $itemLines[] = '';

        $totalPieces = 0;
        foreach ($summary['items_sold'] as $item) {
            $itemLines[] = '• ' . $qty($item['quantity']) . 'x ' . $item['product'];
            $totalPieces += (float) $item['quantity'];
        }

        $itemLines[] = '';
        $itemLines[] = 'Total de peças: *' . $qty($totalPieces) . '*';

        return [$summaryText, implode("\n", $itemLines)];
    }
}
