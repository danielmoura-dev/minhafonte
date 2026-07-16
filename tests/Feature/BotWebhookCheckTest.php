<?php

namespace Tests\Feature;

use App\Jobs\ProcessBotMessageJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BotWebhookCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_security_and_dispatch(): void
    {
        config(['services.evolution.webhook_token' => 'tok123']);
        Queue::fake();

        // Sem token → 403
        $this->post('/webhooks/evolution', ['event' => 'messages.upsert'])->assertForbidden();

        // Token errado → 403
        $this->post('/webhooks/evolution?token=errado', ['event' => 'messages.upsert'])->assertForbidden();

        // Token certo + messages.upsert → 200 e job na fila
        $this->post('/webhooks/evolution?token=tok123', [
            'event'    => 'messages.upsert',
            'instance' => 'fontepro_1',
            'data'     => [
                'key'     => ['remoteJid' => '5585999998888@s.whatsapp.net', 'fromMe' => false, 'id' => 'ABC'],
                'message' => ['conversation' => 'qual o estoque?'],
            ],
        ])->assertOk();

        Queue::assertPushed(ProcessBotMessageJob::class, 1);

        fwrite(STDERR, "\nwebhook: 403 sem token, 403 token errado, 200 + job com token certo\n");
    }

    public function test_job_ignores_unauthorized_numbers(): void
    {
        $company = \App\Models\Company::create([
            'company_name' => 'Teste Ltda',
            'fantasy_name' => 'Teste',
            'cnpj'         => '12345678000199',
            'email'        => 'teste@example.com',
            'password'     => bcrypt('secret'),
        ]);

        \App\Models\WhatsappBot::create([
            'company_id'    => $company->id,
            'instance_name' => 'fontepro_' . $company->id,
            'status'        => 'connected',
        ]);

        // Nenhum número autorizado cadastrado → o mock NÃO pode receber sendText
        $evolution = \Mockery::mock(\App\Services\EvolutionApiService::class);
        $evolution->shouldNotReceive('sendText');

        $gemini = \Mockery::mock(\App\Services\GeminiBotService::class);
        $gemini->shouldNotReceive('reply');

        $job = new ProcessBotMessageJob('fontepro_' . $company->id, [
            'key'     => ['remoteJid' => '5511888887777@s.whatsapp.net', 'fromMe' => false, 'id' => 'X1'],
            'message' => ['conversation' => 'oi'],
        ]);

        $job->handle($evolution, $gemini);

        fwrite(STDERR, "job: número não autorizado ignorado em silêncio (sem sendText, sem Gemini)\n");
        $this->assertTrue(true);
    }
}
