<?php

namespace Tests\Feature;

use App\Models\BotAllowedNumber;
use App\Models\BotNotification;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\WhatsappBot;
use App\Services\BotNotificationService;
use App\Services\EvolutionApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * O bot mostra "gravando áudio..."/"digitando..." por alguns segundos antes
 * de cada mensagem da notificação, na ordem: presença -> áudio -> presença
 * -> resumo -> presença -> itens.
 */
class BotNotificationPresenceTest extends TestCase
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

        WhatsappBot::create([
            'company_id'    => $this->company->id,
            'instance_name' => 'fontepro_' . $this->company->id,
            'status'        => 'connected',
        ]);

        BotAllowedNumber::create([
            'company_id' => $this->company->id, 'phone' => '5585999990001',
            'name' => 'dono', 'notifications_enabled' => true,
        ]);

        // Garante que a mensagem de itens também seja enviada (sem vendas
        // hoje, buildDailyMessages() não gera a 2ª mensagem).
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'cliente', 'is_active' => true,
        ]);
        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id, 'order_number' => 1,
            'issue_date' => now()->toDateString(), 'items_count' => 1, 'total' => 100,
            'stock_action' => 'none', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);
        $order->items()->create([
            'product_name' => 'FARDO 500ML', 'quantity' => 10, 'unit_price' => 10,
            'subtotal' => 100, 'stock_action' => 'none',
        ]);
    }

    public function test_shows_recording_then_composing_before_each_message(): void
    {
        config(['services.evolution.presence_delay' => 0]);

        $notification = BotNotification::create([
            'company_id' => $this->company->id, 'type' => BotNotification::TYPE_DAILY_SALES,
            'enabled' => true, 'send_time' => '19:00', 'days' => [1, 2, 3, 4, 5],
            'audio_file' => 'resumo_dia.mp3',
        ]);

        $instance = 'fontepro_' . $this->company->id;
        $phone    = '5585999990001';

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldReceive('sendPresence')->once()
            ->with($instance, $phone, 'recording', 0)->ordered();
        $evolution->shouldReceive('sendAudio')->once()
            ->with($instance, $phone, \Mockery::type('string'))->ordered();
        $evolution->shouldReceive('sendPresence')->once()
            ->with($instance, $phone, 'composing', 0)->ordered();
        $evolution->shouldReceive('sendText')->once()
            ->with($instance, $phone, \Mockery::type('string'))->ordered();
        $evolution->shouldReceive('sendPresence')->once()
            ->with($instance, $phone, 'composing', 0)->ordered();
        $evolution->shouldReceive('sendText')->once()
            ->with($instance, $phone, \Mockery::type('string'))->ordered();

        $sent = (new BotNotificationService($evolution))->sendDailySales($this->company, $notification);

        $this->assertSame(1, $sent);
        fwrite(STDERR, "\npresença: recording -> áudio -> composing -> resumo -> composing -> itens\n");
    }

    public function test_skips_recording_when_no_audio_configured(): void
    {
        config(['services.evolution.presence_delay' => 0]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldNotReceive('sendAudio');
        $evolution->shouldReceive('sendPresence')
            ->with(\Mockery::any(), \Mockery::any(), 'recording', \Mockery::any())
            ->never();
        $evolution->shouldReceive('sendPresence')
            ->with(\Mockery::any(), \Mockery::any(), 'composing', \Mockery::any())
            ->twice();
        $evolution->shouldReceive('sendText')->twice();

        $sent = (new BotNotificationService($evolution))->sendDailySales($this->company);

        $this->assertSame(1, $sent);
    }

    public function test_presence_delay_uses_configured_seconds(): void
    {
        // O BotNotificationService repassa segundos ao serviço; é o
        // EvolutionApiService quem converte para ms na chamada HTTP
        // (verificado em EvolutionApiServiceTest).
        config(['services.evolution.presence_delay' => 1]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldReceive('sendPresence')
            ->with(\Mockery::any(), \Mockery::any(), 'composing', 1)
            ->atLeast()->once();
        $evolution->shouldReceive('sendText');

        (new BotNotificationService($evolution))->sendDailySales($this->company);

        fwrite(STDERR, "presença: delay configurado (1s) repassado ao serviço\n");
    }

    public function test_presence_failure_does_not_block_the_message(): void
    {
        config(['services.evolution.presence_delay' => 0]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldReceive('sendPresence')->andThrow(new \RuntimeException('instância fora do ar'));
        $evolution->shouldReceive('sendText')->twice();

        $sent = (new BotNotificationService($evolution))->sendDailySales($this->company);

        $this->assertSame(1, $sent);
        fwrite(STDERR, "presença: falha ao mostrar presença não impede o envio da mensagem\n");
    }
}
