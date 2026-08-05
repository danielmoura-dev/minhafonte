<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BotAllowedNumber;
use App\Models\BotNotification;
use App\Models\WhatsappBot;
use App\Services\AuditService;
use App\Services\BotNotificationService;
use App\Services\EvolutionApiService;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppBotController extends Controller
{
    public function __construct(private EvolutionApiService $evolution)
    {
    }

    public function edit(): Response
    {
        $bot = WhatsappBot::fromCompany(Auth::id())->first();

        $numbers = BotAllowedNumber::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        $notification = BotNotification::fromCompany(Auth::id())
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
        abort_unless($number->company_id === Auth::id(), 403);

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
            ['company_id' => Auth::id(), 'type' => BotNotification::TYPE_DAILY_SALES],
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
     */
    public function sendTestNotification(BotNotificationService $service): RedirectResponse
    {
        $notification = BotNotification::fromCompany(Auth::id())
            ->where('type', BotNotification::TYPE_DAILY_SALES)
            ->first();

        $sent = $service->sendDailySales(Auth::user(), $notification);

        if ($sent === 0) {
            return back()->with('error', 'Nada enviado: confira se o bot está conectado e se há números com notificações ativadas.');
        }

        return back()->with('success', "Resumo enviado agora para {$sent} número(s)!");
    }

    /**
     * Cria/garante a instância e retorna o QR code para parear.
     */
    public function connect(): JsonResponse
    {
        $companyId = Auth::id();

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
        $bot = WhatsappBot::fromCompany(Auth::id())->first();

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
        $bot = WhatsappBot::fromCompany(Auth::id())->first();

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
            ['company_id' => Auth::id(), 'phone' => $phone],
            ['name' => $data['name']],
        );

        return back()->with('success', 'Número autorizado com sucesso!');
    }

    public function destroyNumber(BotAllowedNumber $number): RedirectResponse
    {
        abort_unless($number->company_id === Auth::id(), 403);

        $number->delete();

        return back()->with('success', 'Número removido.');
    }
}
