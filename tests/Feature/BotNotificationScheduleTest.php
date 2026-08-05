<?php

namespace Tests\Feature;

use App\Models\BotAllowedNumber;
use App\Models\BotNotification;
use App\Models\Company;
use App\Models\WhatsappBot;
use App\Services\BotNotificationService;
use App\Services\EvolutionApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BotNotificationScheduleTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);
    }

    private function notification(array $overrides = []): BotNotification
    {
        return BotNotification::create(array_merge([
            'company_id' => $this->company->id,
            'type'       => BotNotification::TYPE_DAILY_SALES,
            'enabled'    => true,
            'send_time'  => '19:00',
            'days'       => [1, 2, 3, 4, 5],   // seg a sex
        ], $overrides));
    }

    public function test_only_fires_on_configured_days_and_time(): void
    {
        $n = $this->notification();

        // Quarta-feira 18:59 — ainda não
        Carbon::setTestNow(Carbon::parse('2026-08-05 18:59:00'));
        $this->assertFalse($n->isDue());

        // Quarta 19:00 — hora de enviar
        Carbon::setTestNow(Carbon::parse('2026-08-05 19:00:00'));
        $this->assertTrue($n->isDue());

        // Domingo 20:00 — fora dos dias configurados
        Carbon::setTestNow(Carbon::parse('2026-08-09 20:00:00'));
        $this->assertFalse($n->isDue());

        Carbon::setTestNow();
        fwrite(STDERR, "\nagenda: 18:59 não; 19:00 sim; domingo não\n");
    }

    public function test_does_not_send_twice_in_the_same_day(): void
    {
        $n = $this->notification();

        Carbon::setTestNow(Carbon::parse('2026-08-05 19:05:00'));
        $this->assertTrue($n->isDue());

        $n->update(['last_sent_at' => now()]);
        $this->assertFalse($n->isDue());   // já enviou hoje

        // No dia seguinte volta a valer
        Carbon::setTestNow(Carbon::parse('2026-08-06 19:00:00'));
        $this->assertTrue($n->fresh()->isDue());

        Carbon::setTestNow();
        fwrite(STDERR, "agenda: não repete no mesmo dia, volta no dia seguinte\n");
    }

    public function test_disabled_notification_never_fires(): void
    {
        $n = $this->notification(['enabled' => false]);

        Carbon::setTestNow(Carbon::parse('2026-08-05 19:00:00'));
        $this->assertFalse($n->isDue());
        Carbon::setTestNow();
    }

    public function test_sends_only_to_numbers_with_notifications_enabled(): void
    {
        WhatsappBot::create([
            'company_id' => $this->company->id,
            'instance_name' => 'fontepro_' . $this->company->id,
            'status' => 'connected',
        ]);

        BotAllowedNumber::create([
            'company_id' => $this->company->id, 'phone' => '5585999990001',
            'name' => 'recebe', 'notifications_enabled' => true,
        ]);
        BotAllowedNumber::create([
            'company_id' => $this->company->id, 'phone' => '5585999990002',
            'name' => 'nao recebe', 'notifications_enabled' => false,
        ]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        // Só o número ativado recebe (resumo + itens = 2 textos; sem áudio configurado)
        $evolution->shouldReceive('sendText')
            ->with('fontepro_' . $this->company->id, '5585999990001', \Mockery::any())
            ->atLeast()->once();
        $evolution->shouldNotReceive('sendAudio');

        $sent = (new BotNotificationService($evolution))->sendDailySales($this->company);

        $this->assertSame(1, $sent);
        fwrite(STDERR, "envio: só o número com notificações ativadas recebeu\n");
    }

    public function test_does_not_send_when_bot_is_disconnected(): void
    {
        WhatsappBot::create([
            'company_id' => $this->company->id,
            'instance_name' => 'fontepro_' . $this->company->id,
            'status' => 'disconnected',
        ]);
        BotAllowedNumber::create([
            'company_id' => $this->company->id, 'phone' => '5585999990001',
            'name' => 'x', 'notifications_enabled' => true,
        ]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldNotReceive('sendText');

        $sent = (new BotNotificationService($evolution))->sendDailySales($this->company);

        $this->assertSame(0, $sent);
    }
}
