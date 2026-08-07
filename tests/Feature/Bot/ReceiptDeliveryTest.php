<?php

namespace Tests\Feature\Bot;

use App\Jobs\ProcessBotMessageJob;
use App\Models\BotAllowedNumber;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\WhatsappBot;
use App\Services\EvolutionApiService;
use App\Services\GeminiBotService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Fluxo completo: a IA responde em texto e o arquivo sai logo depois.
 *
 * O envio da mídia é efeito colateral — se falhar, a resposta que já saiu não
 * pode ser perdida e o usuário precisa saber o que aconteceu.
 */
class ReceiptDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private string $instance;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'empresa@teste.com', 'password' => bcrypt('x'),
        ]);

        $this->instance = 'fontepro_' . $this->company->id;

        WhatsappBot::create([
            'company_id' => $this->company->id,
            'instance_name' => $this->instance,
            'status' => 'connected',
        ]);

        BotAllowedNumber::create([
            'company_id' => $this->company->id,
            'phone' => '5585999990001', 'name' => 'dono',
        ]);
    }

    private function orderWithReceipt(): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf',
            'name' => 'PADARIA CENTRAL', 'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => 42, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => 250, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        $order->payments()->create([
            'company_id'   => $this->company->id,
            'amount'       => 250, 'method' => 'pix', 'paid_at' => now(),
            'receipt_path' => UploadedFile::fake()->create('comprovante.jpg', 10)->store('receipts', 'public'),
        ]);

        return $order;
    }

    private function incoming(): array
    {
        return [
            'key' => [
                'remoteJid' => '5585999990001@s.whatsapp.net',
                'fromMe'    => false,
                'id'        => 'MSG1',
            ],
            'messageTimestamp' => now()->getTimestamp(),
            'message'          => ['conversation' => 'me manda o comprovante da venda 42'],
        ];
    }

    public function test_manda_o_texto_e_depois_o_arquivo(): void
    {
        $this->orderWithReceipt();

        $gemini = \Mockery::mock(GeminiBotService::class);
        $gemini->shouldReceive('reply')->once()->andReturn('Achei! Mandando o comprovante da venda #42 👇');
        $gemini->shouldReceive('attachments')->once()->andReturn([
            ['path' => Storage::disk('public')->path('receipts/comprovante.jpg'), 'caption' => 'Comprovante — Venda #42'],
        ]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldReceive('sendText')->once()
            ->with($this->instance, '5585999990001', 'Achei! Mandando o comprovante da venda #42 👇')
            ->ordered();
        $evolution->shouldReceive('sendMedia')->once()
            ->with($this->instance, '5585999990001', \Mockery::type('string'), 'Comprovante — Venda #42')
            ->ordered();

        (new ProcessBotMessageJob($this->instance, $this->incoming()))->handle($evolution, $gemini);

        fwrite(STDERR, "\nentrega: texto primeiro, arquivo depois\n");
    }

    public function test_falha_no_envio_do_arquivo_avisa_e_nao_derruba_a_resposta(): void
    {
        $this->orderWithReceipt();

        $gemini = \Mockery::mock(GeminiBotService::class);
        $gemini->shouldReceive('reply')->once()->andReturn('Mandando o comprovante 👇');
        $gemini->shouldReceive('attachments')->once()->andReturn([
            ['path' => '/caminho/que/nao/existe.jpg', 'caption' => 'Comprovante'],
        ]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldReceive('sendText')->once()
            ->with($this->instance, '5585999990001', 'Mandando o comprovante 👇')->ordered();

        $evolution->shouldReceive('sendMedia')->once()
            ->andThrow(new \RuntimeException('arquivo inacessível'));

        // O usuário não pode ficar esperando um arquivo que não vem.
        $evolution->shouldReceive('sendText')->once()
            ->with($this->instance, '5585999990001', \Mockery::pattern('/Não consegui enviar o comprovante/'))
            ->ordered();

        (new ProcessBotMessageJob($this->instance, $this->incoming()))->handle($evolution, $gemini);

        fwrite(STDERR, "entrega: falha no arquivo avisa o usuário e mantém a resposta\n");
    }

    public function test_conversa_sem_anexo_nao_chama_envio_de_midia(): void
    {
        $gemini = \Mockery::mock(GeminiBotService::class);
        $gemini->shouldReceive('reply')->once()->andReturn('Hoje foram 2 vendas.');
        $gemini->shouldReceive('attachments')->once()->andReturn([]);

        $evolution = \Mockery::mock(EvolutionApiService::class);
        $evolution->shouldReceive('sendText')->once();
        $evolution->shouldNotReceive('sendMedia');

        (new ProcessBotMessageJob($this->instance, $this->incoming()))->handle($evolution, $gemini);

        fwrite(STDERR, "entrega: pergunta comum não dispara envio de mídia\n");
    }
}
