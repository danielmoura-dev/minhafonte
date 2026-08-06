<?php

namespace App\Console\Commands;

use App\Jobs\SendBotNotificationJob;
use App\Models\BotNotification;
use Illuminate\Console\Command;

/**
 * Roda a cada minuto pelo scheduler: enfileira as notificações do bot que
 * chegaram no horário configurado (1x por dia, tolerante a atrasos). O envio
 * em si roda na fila, pois mostra "gravando/digitando..." com pausas reais.
 */
class SendBotNotifications extends Command
{
    protected $signature = 'bot:notifications';

    protected $description = 'Enfileira as notificações automáticas do bot de WhatsApp que estiverem no horário';

    public function handle(): int
    {
        $due = BotNotification::with('company')
            ->where('enabled', true)
            ->get()
            ->filter(fn (BotNotification $n) => $n->isDue());

        foreach ($due as $notification) {
            if (! $notification->company) {
                continue;
            }

            // Marca como enviada ANTES de enfileirar, para não disparar de
            // novo a cada minuto enquanto o job aguarda a fila (falhas do
            // envio em si ficam registradas no log, dentro do job).
            $notification->update(['last_sent_at' => now()]);

            match ($notification->type) {
                BotNotification::TYPE_DAILY_SALES => SendBotNotificationJob::dispatch(
                    $notification->company_id,
                    $notification->id,
                ),
                default => null,
            };

            $this->line("{$notification->company->fantasy_name}: {$notification->type} -> enfileirada");
        }

        return self::SUCCESS;
    }
}
