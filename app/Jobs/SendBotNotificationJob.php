<?php

namespace App\Jobs;

use App\Models\BotNotification;
use App\Models\Company;
use App\Services\BotNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Envia uma notificação do bot em segundo plano — necessário porque o envio
 * mostra "gravando/digitando..." com pausas reais entre as mensagens
 * (alguns segundos por destinatário), o que travaria uma requisição web.
 */
class SendBotNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(
        public int $companyId,
        public ?int $notificationId = null,
    ) {
    }

    public function handle(BotNotificationService $service): void
    {
        $company = Company::find($this->companyId);
        if (! $company) {
            return;
        }

        $notification = $this->notificationId
            ? BotNotification::find($this->notificationId)
            : null;

        $service->sendDailySales($company, $notification);
    }
}
