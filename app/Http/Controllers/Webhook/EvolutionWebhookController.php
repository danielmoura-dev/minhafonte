<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessBotMessageJob;
use App\Models\WhatsappBot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvolutionWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        // Autenticação do webhook por token na URL
        if ($request->query('token') !== config('services.evolution.webhook_token')) {
            abort(403);
        }

        $event    = str_replace('.', '_', (string) $request->input('event'));
        $instance = (string) $request->input('instance');
        $data     = $request->input('data', []);

        if ($instance === '') {
            return response()->json(['ok' => true]);
        }

        if ($event === 'messages_upsert') {
            ProcessBotMessageJob::dispatch($instance, is_array($data) ? $data : []);
        }

        if ($event === 'connection_update') {
            $this->updateConnectionState($instance, is_array($data) ? $data : []);
        }

        return response()->json(['ok' => true]);
    }

    private function updateConnectionState(string $instance, array $data): void
    {
        $bot = WhatsappBot::where('instance_name', $instance)->first();
        if (! $bot) {
            return;
        }

        $state = $data['state'] ?? null;

        if ($state === 'open') {
            $bot->update(['status' => 'connected']);
        } elseif ($state === 'connecting') {
            $bot->update(['status' => 'connecting']);
        } elseif ($state === 'close') {
            $bot->update(['status' => 'disconnected']);
        }
    }
}
