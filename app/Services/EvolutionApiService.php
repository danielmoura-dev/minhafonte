<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Cliente HTTP da Evolution API (v2) — conexão WhatsApp via QR code (Baileys).
 */
class EvolutionApiService
{
    private function client(): PendingRequest
    {
        return Http::baseUrl(rtrim(config('services.evolution.url'), '/'))
            ->withHeaders(['apikey' => config('services.evolution.api_key')])
            ->timeout(30);
    }

    /**
     * Cria a instância da empresa já com webhook apontando para o Laravel.
     */
    public function createInstance(string $instanceName): array
    {
        $token = config('services.evolution.webhook_token');
        $base  = config('services.evolution.webhook_base');

        $webhookUrl = $base
            ? rtrim($base, '/') . '/webhooks/evolution?token=' . $token
            : route('webhooks.evolution', ['token' => $token]);

        return $this->client()->post('/instance/create', [
            'instanceName' => $instanceName,
            'integration'  => 'WHATSAPP-BAILEYS',
            'qrcode'       => true,
            'webhook'      => [
                'url'      => $webhookUrl,
                'byEvents' => false,
                'base64'   => true,
                'events'   => ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
            ],
        ])->throw()->json();
    }

    /**
     * Retorna o QR code (base64) para parear. Também reinicia o QR se expirado.
     */
    public function connect(string $instanceName): array
    {
        return $this->client()->get("/instance/connect/{$instanceName}")->throw()->json();
    }

    /**
     * Estado da conexão: open (conectado), connecting, close.
     */
    public function connectionState(string $instanceName): string
    {
        $res = $this->client()->get("/instance/connectionState/{$instanceName}")->json();

        return $res['instance']['state'] ?? 'close';
    }

    /**
     * Número conectado (ownerJid) quando o estado é open.
     */
    public function connectedPhone(string $instanceName): ?string
    {
        $res = $this->client()->get('/instance/fetchInstances', [
            'instanceName' => $instanceName,
        ])->json();

        $owner = $res[0]['ownerJid'] ?? null;

        return $owner ? preg_replace('/\D/', '', explode('@', $owner)[0]) : null;
    }

    public function instanceExists(string $instanceName): bool
    {
        $res = $this->client()->get('/instance/fetchInstances', [
            'instanceName' => $instanceName,
        ]);

        return $res->successful() && ! empty($res->json());
    }

    public function logout(string $instanceName): void
    {
        $this->client()->delete("/instance/logout/{$instanceName}");
    }

    public function deleteInstance(string $instanceName): void
    {
        $this->client()->delete("/instance/delete/{$instanceName}");
    }

    public function sendText(string $instanceName, string $number, string $text): void
    {
        $this->client()->post("/message/sendText/{$instanceName}", [
            'number' => $number,
            'text'   => $text,
        ])->throw();
    }

    /**
     * Baixa a mídia (áudio) de uma mensagem em base64.
     */
    public function getMediaBase64(string $instanceName, string $messageId): ?array
    {
        $res = $this->client()->post("/chat/getBase64FromMediaMessage/{$instanceName}", [
            'message'      => ['key' => ['id' => $messageId]],
            'convertToMp4' => false,
        ]);

        if (! $res->successful()) {
            return null;
        }

        $json = $res->json();

        return isset($json['base64'])
            ? ['base64' => $json['base64'], 'mimetype' => $json['mimetype'] ?? 'audio/ogg']
            : null;
    }
}
