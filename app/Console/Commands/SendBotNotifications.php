<?php

namespace App\Console\Commands;

use App\Models\BotNotification;
use App\Services\BotNotificationService;
use Illuminate\Console\Command;

/**
 * Roda a cada minuto pelo scheduler: envia as notificações do bot que
 * chegaram no horário configurado (1x por dia, tolerante a atrasos).
 */
class SendBotNotifications extends Command
{
    protected $signature = 'bot:notifications';

    protected $description = 'Envia as notificações automáticas do bot de WhatsApp que estiverem no horário';

    public function handle(BotNotificationService $service): int
    {
        $due = BotNotification::with('company')
            ->where('enabled', true)
            ->get()
            ->filter(fn (BotNotification $n) => $n->isDue());

        foreach ($due as $notification) {
            if (! $notification->company) {
                continue;
            }

            $sent = match ($notification->type) {
                BotNotification::TYPE_DAILY_SALES => $service->sendDailySales($notification->company, $notification),
                default                           => 0,
            };

            // Marca como enviada mesmo com 0 destinatários alcançados para
            // não tentar de novo a cada minuto (falhas ficam no log).
            $notification->update(['last_sent_at' => now()]);

            $this->line("{$notification->company->fantasy_name}: {$notification->type} -> {$sent} número(s)");
        }

        return self::SUCCESS;
    }
}
