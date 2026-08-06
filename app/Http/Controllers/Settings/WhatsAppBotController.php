<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Jobs\SendBotNotificationJob;
use App\Models\BotAllowedNumber;
use App\Models\BotNotification;
use App\Models\WhatsappBot;
use App\Services\AuditService;
use App\Services\BotNotificationService;
use App\Services\EvolutionApiService;
use App\Support\Tenant;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppBotController extends Controller
{
    public function __construct(private EvolutionApiService $evolution)
    {
    }

    public function edit(): Response
    {
        $bot = WhatsappBot::fromCompany(Tenant::id())->first();

        $numbers = BotAllowedNumber::fromCompany(Tenant::id())
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'notifications_enabled']);

        $notification = BotNotification::fromCompany(Tenant::id())
            ->where('type', BotNotification::TYPE_DAILY_SALES)
            ->first();

        return Inertia::render('Settings/Bot', [
            'bot'            => $bot,
            'allowedNumbers' => $numbers,
            'configured'     => filled(config('services.evolution.api_key')) && filled(config('services.gemini.api_key')),
            'notification'   => $notification,
            'audioFiles'     => BotNotificationService::availableAudios(),
        ]);
    }

    /**
     * Liga/desliga as notificações automáticas para um número autorizado.
     */
    public function toggleNumberNotifications(BotAllowedNumber $number): RedirectResponse
    {
        abort_unless($number->company_id === Tenant::id(), 403);

        $number->update(['notifications_enabled' => ! $number->notifications_enabled]);

        return back()->with('success', $number->notifications_enabled
            ? "{$number->name} passará a receber as notificações."
            : "{$number->name} não receberá mais as notificações.");
    }

    /**
     * Salva a configuração do resumo diário de vendas.
     */
    public function saveNotification(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enabled'    => ['required', 'boolean'],
            'send_time'  => ['required', 'date_format:H:i'],
            'days'       => ['required', 'array', 'min:1'],
            'days.*'     => ['integer', 'between:1,7'],
            'audio_file' => ['nullable', 'string', Rule::in(BotNotificationService::availableAudios())],
        ], [
            'send_time.required'    => 'Informe o horário do envio.',
            'send_time.date_format' => 'Horário inválido (use HH:MM).',
            'days.required'         => 'Escolha ao menos um dia da semana.',
            'days.min'              => 'Escolha ao menos um dia da semana.',
            'audio_file.in'         => 'Áudio inválido.',
        ]);

        BotNotification::updateOrCreate(
            ['company_id' => Tenant::id(), 'type' => BotNotification::TYPE_DAILY_SALES],
            [
                'enabled'    => $data['enabled'],
                'send_time'  => $data['send_time'],
                'days'       => array_values(array_unique(array_map('intval', $data['days']))),
                'audio_file' => $data['audio_file'] ?? null,
            ],
        );

        AuditService::log(
            event:       'whatsapp_bot.notification_saved',
            description: 'Configuração do resumo diário de vendas atualizada.',
        );

        return back()->with('success', 'Notificação salva com sucesso!');
    }

    /**
     * Dispara o resumo diário agora, para o usuário validar o formato.
     * Roda na fila (mostra "gravando/digitando..." com pausas reais entre
     * as mensagens), então a tela não trava esperando o envio terminar.
     */
    public function sendTestNotification(): RedirectResponse
    {
        $companyId = Tenant::id();

        $connected = WhatsappBot::fromCompany($companyId)->where('status', 'connected')->exists();
        if (! $connected) {
            return back()->with('error', 'Conecte o bot antes de enviar notificações.');
        }

        $recipients = BotAllowedNumber::fromCompany($companyId)
            ->where('notifications_enabled', true)
            ->count();

        if ($recipients === 0) {
            return back()->with('error', 'Nenhum número com notificações ativadas.');
        }

        $notification = BotNotification::fromCompany($companyId)
            ->where('type', BotNotification::TYPE_DAILY_SALES)
            ->first();

        SendBotNotificationJob::dispatch($companyId, $notification?->id);

        return back()->with('success', "Enviando para {$recipients} número(s)... deve chegar no WhatsApp em instantes.");
    }

    /**
     * Cria/garante a instância e retorna o QR code para parear.
     */
    public function connect(): JsonResponse
    {
        $companyId = Tenant::id();

        $bot = WhatsappBot::firstOrCreate(
            ['company_id' => $companyId],
            ['instance_name' => 'fontepro_' . $companyId, 'status' => 'disconnected'],
        );

        try {
            if (! $this->evolution->instanceExists($bot->instance_name)) {
                $this->evolution->createInstance($bot->instance_name);
            }

            $res = $this->evolution->connect($bot->instance_name);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Não foi possível conectar à Evolution API. Verifique se o serviço está no ar.',
            ], 502);
        }

        $bot->update(['status' => 'connecting']);

        AuditService::log(
            event:       'whatsapp_bot.connect_started',
            auditable:   $bot,
            description: 'Conexão do bot de WhatsApp iniciada (QR code gerado).',
        );

        // Evolution retorna { base64: "data:image/png;base64,...", code: "..." }
        return response()->json([
            'qrcode' => $res['base64'] ?? null,
            'status' => 'connecting',
        ]);
    }

    /**
     * Polling do status da conexão (usado pela tela enquanto o QR está aberto).
     */
    public function status(): JsonResponse
    {
        $bot = WhatsappBot::fromCompany(Tenant::id())->first();

        if (! $bot) {
            return response()->json(['status' => 'disconnected', 'phone' => null]);
        }

        try {
            $state = $this->evolution->connectionState($bot->instance_name);
        } catch (\Throwable) {
            return response()->json(['status' => $bot->status, 'phone' => $bot->phone]);
        }

        $status = match ($state) {
            'open'       => 'connected',
            'connecting' => 'connecting',
            default      => 'disconnected',
        };

        $phone = $bot->phone;

        if ($status === 'connected' && ! $phone) {
            $phone = $this->evolution->connectedPhone($bot->instance_name);
        }

        if ($status !== $bot->status || $phone !== $bot->phone) {
            $bot->update(['status' => $status, 'phone' => $phone]);
        }

        return response()->json(['status' => $status, 'phone' => $phone]);
    }

    public function disconnect(): RedirectResponse
    {
        $bot = WhatsappBot::fromCompany(Tenant::id())->first();

        if ($bot) {
            try {
                $this->evolution->logout($bot->instance_name);
                $this->evolution->deleteInstance($bot->instance_name);
            } catch (\Throwable) {
                // Instância pode já não existir na Evolution — segue o fluxo
            }

            $bot->update(['status' => 'disconnected', 'phone' => null]);

            AuditService::log(
                event:       'whatsapp_bot.disconnected',
                auditable:   $bot,
                description: 'Bot de WhatsApp desconectado.',
            );
        }

        return back()->with('success', 'Bot desconectado.');
    }

    public function storeNumber(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
        ], [
            'name.required'  => 'Informe o nome.',
            'phone.required' => 'Informe o número de WhatsApp.',
        ]);

        $phone = BotAllowedNumber::normalizePhone($data['phone']);

        if (strlen($phone) < 10) {
            return back()->withErrors(['phone' => 'Número inválido. Use DDD + número (ex: 85 99999-8888).']);
        }

        // Sem DDI, assume Brasil
        if (! str_starts_with($phone, '55')) {
            $phone = '55' . $phone;
        }

        BotAllowedNumber::updateOrCreate(
            ['company_id' => Tenant::id(), 'phone' => $phone],
            ['name' => $data['name']],
        );

        return back()->with('success', 'Número autorizado com sucesso!');
    }

    public function destroyNumber(BotAllowedNumber $number): RedirectResponse
    {
        abort_unless($number->company_id === Tenant::id(), 403);

        $number->delete();

        return back()->with('success', 'Número removido.');
    }
}
