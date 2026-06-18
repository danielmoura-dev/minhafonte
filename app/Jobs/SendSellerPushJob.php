<?php

namespace App\Jobs;

use App\Models\PushSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class SendSellerPushJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    public function __construct(
        private readonly int    $sellerId,
        private readonly string $title,
        private readonly string $body,
        private readonly string $url = '/vendedor/fabrica',
    ) {}

    public function handle(): void
    {
        $subscriptions = PushSubscription::where('seller_id', $this->sellerId)->get();

        if ($subscriptions->isEmpty()) return;

        $webPush = new WebPush([
            'VAPID' => [
                'subject'    => config('services.vapid.subject'),
                'publicKey'  => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ], [
            // urgência alta acorda o aparelho mesmo em Doze; TTL guarda 24h se offline
            'urgency' => 'high',
            'TTL'     => 86400,
        ]);

        $payload = json_encode([
            'title' => $this->title,
            'body'  => $this->body,
            'url'   => $this->url,
            'icon'  => '/web-app-manifest-192x192.png',
            'badge' => '/badge-96x96.png',
        ]);

        foreach ($subscriptions as $sub) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint'        => $sub->endpoint,
                    'contentEncoding' => 'aes128gcm',
                    'keys' => [
                        'p256dh' => $sub->p256dh,
                        'auth'   => $sub->auth,
                    ],
                ]),
                $payload
            );
        }

        foreach ($webPush->flush() as $report) {
            $endpoint = (string) $report->getEndpoint();

            if ($report->isSuccess()) {
                \Log::info('[Push] enviado com sucesso', ['endpoint' => $endpoint]);
                continue;
            }

            \Log::warning('[Push] falha no envio', [
                'endpoint' => $endpoint,
                'expired'  => $report->isSubscriptionExpired(),
                'reason'   => $report->getReason(),
            ]);

            if ($report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint', $endpoint)->delete();
            }
        }
    }
}
