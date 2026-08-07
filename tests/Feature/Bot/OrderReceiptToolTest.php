<?php

namespace Tests\Feature\Bot;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Services\BotToolsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * O bot envia o comprovante anexado a uma venda.
 *
 * Comprovante é documento financeiro, então o teste guarda principalmente o
 * isolamento: a venda de uma empresa nunca pode ser alcançada pelo bot de
 * outra, mesmo acertando o número.
 */
class OrderReceiptToolTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'empresa@teste.com', 'password' => bcrypt('x'),
        ]);
    }

    private function order(int $number, ?Company $owner = null): Order
    {
        $company = $owner ?? $this->company;

        $customer = Customer::create([
            'company_id' => $company->id, 'type' => 'pf',
            'name' => 'PADARIA CENTRAL', 'is_active' => true,
        ]);

        return Order::create([
            'company_id' => $company->id, 'customer_id' => $customer->id,
            'order_number' => $number, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => 250, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);
    }

    private function pay(Order $order, float $amount, ?string $receipt = 'jpg'): void
    {
        $path = null;

        if ($receipt) {
            $path = UploadedFile::fake()
                ->create("comprovante.{$receipt}", 10)
                ->store('receipts', 'public');
        }

        $order->payments()->create([
            'company_id'   => $order->company_id,
            'amount'       => $amount,
            'method'       => 'pix',
            'paid_at'      => now(),
            'receipt_path' => $path,
        ]);

        $order->recalculatePayment();
    }

    public function test_enfileira_o_comprovante_da_venda(): void
    {
        $order = $this->order(42);
        $this->pay($order, 250);

        $tools  = new BotToolsService($this->company->id);
        $result = $tools->execute('order_receipts', ['order_number' => 42]);

        $this->assertTrue($result['found']);
        $this->assertSame(1, $result['receipts']);
        $this->assertSame('PADARIA CENTRAL', $result['customer']);

        $anexos = $tools->attachments();

        $this->assertCount(1, $anexos);
        $this->assertFileExists($anexos[0]['path']);
        $this->assertStringContainsString('Venda #42', $anexos[0]['caption']);
        $this->assertStringContainsString('R$ 250,00', $anexos[0]['caption']);

        fwrite(STDERR, "\ncomprovante: venda #42 -> 1 arquivo com legenda '{$anexos[0]['caption']}'\n");
    }

    public function test_envia_todos_quando_ha_varios_pagamentos(): void
    {
        $order = $this->order(7);
        $this->pay($order, 100);
        $this->pay($order, 150, 'pdf');

        $tools  = new BotToolsService($this->company->id);
        $result = $tools->execute('order_receipts', ['order_number' => 7]);

        $this->assertSame(2, $result['receipts']);
        $this->assertCount(2, $tools->attachments());

        // O PDF é identificado para ser enviado como documento, não como foto.
        $this->assertTrue(collect($result['sent'])->contains('is_pdf', true));

        fwrite(STDERR, "comprovante: 2 pagamentos -> 2 arquivos (um deles PDF)\n");
    }

    public function test_venda_sem_comprovante_nao_envia_nada(): void
    {
        $order = $this->order(9);
        $this->pay($order, 250, receipt: null);

        $tools  = new BotToolsService($this->company->id);
        $result = $tools->execute('order_receipts', ['order_number' => 9]);

        $this->assertTrue($result['found']);
        $this->assertSame(0, $result['receipts']);
        $this->assertSame([], $tools->attachments());
        $this->assertStringContainsString('não têm comprovante', $result['message']);

        fwrite(STDERR, "comprovante: venda paga sem anexo avisa e não manda arquivo\n");
    }

    public function test_venda_sem_pagamento_avisa(): void
    {
        $this->order(11);

        $result = (new BotToolsService($this->company->id))
            ->execute('order_receipts', ['order_number' => 11]);

        $this->assertSame(0, $result['receipts']);
        $this->assertStringContainsString('ainda não tem pagamento', $result['message']);
    }

    public function test_venda_inexistente_nao_inventa(): void
    {
        $result = (new BotToolsService($this->company->id))
            ->execute('order_receipts', ['order_number' => 999]);

        $this->assertFalse($result['found']);
        $this->assertStringContainsString('não encontrada', $result['message']);

        fwrite(STDERR, "comprovante: venda inexistente responde 'não encontrada'\n");
    }

    public function test_nao_alcanca_a_venda_de_outra_empresa(): void
    {
        $outra = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'outra@teste.com', 'password' => bcrypt('x'),
        ]);

        $alheia = $this->order(42, owner: $outra);
        $this->pay($alheia, 999);

        // Mesmo acertando o número, o bot da minha empresa não alcança.
        $tools  = new BotToolsService($this->company->id);
        $result = $tools->execute('order_receipts', ['order_number' => 42]);

        $this->assertFalse($result['found']);
        $this->assertSame([], $tools->attachments());

        fwrite(STDERR, "comprovante: venda de outra empresa não é alcançada nem com o número certo\n");
    }

    public function test_venda_excluida_nao_devolve_comprovante(): void
    {
        $order = $this->order(15);
        $this->pay($order, 250);
        $order->delete();

        $tools  = new BotToolsService($this->company->id);
        $result = $tools->execute('order_receipts', ['order_number' => 15]);

        $this->assertFalse($result['found']);
        $this->assertSame([], $tools->attachments());

        fwrite(STDERR, "comprovante: venda excluída não devolve comprovante\n");
    }

    /**
     * O caso real: perguntaram qual a venda ANTERIOR à #48 que tem
     * comprovante. Sem esta função a IA chutava a #47 (que não tinha) e
     * anunciava um envio que nunca acontecia.
     */
    public function test_lista_a_venda_anterior_que_tem_comprovante(): void
    {
        $this->pay($this->order(48), 250);          // tem
        $this->order(47);                            // sem pagamento
        $this->pay($this->order(46), 100, null);     // pago, mas sem anexo
        $this->pay($this->order(45), 300);           // tem

        $result = (new BotToolsService($this->company->id))
            ->execute('orders_with_receipts', ['before_order_number' => 48]);

        // Pula a 47 e a 46 sozinha, e devolve a 45 em primeiro.
        $this->assertSame(1, $result['count']);
        $this->assertSame(45, $result['orders'][0]['order_number']);
        $this->assertSame(1, $result['orders'][0]['receipts']);

        fwrite(STDERR, "\ncomprovante: 'anterior à #48 com comprovante' -> #45 (pula 47 e 46)\n");
    }

    public function test_lista_as_vendas_com_comprovante_da_mais_recente(): void
    {
        $this->pay($this->order(10), 100);
        $this->pay($this->order(30), 200);
        $this->order(20);   // sem pagamento, fica de fora

        $result = (new BotToolsService($this->company->id))
            ->execute('orders_with_receipts', []);

        $this->assertSame(2, $result['count']);
        $this->assertSame([30, 10], array_column($result['orders'], 'order_number'));

        fwrite(STDERR, "comprovante: lista da mais recente para a mais antiga\n");
    }

    public function test_avisa_quando_nenhuma_anterior_tem_comprovante(): void
    {
        $this->pay($this->order(48), 250);
        $this->order(47);   // sem pagamento

        $result = (new BotToolsService($this->company->id))
            ->execute('orders_with_receipts', ['before_order_number' => 48]);

        $this->assertSame(0, $result['count']);
        $this->assertStringContainsString('Nenhuma venda anterior à #48', $result['message']);

        fwrite(STDERR, "comprovante: sem anterior com anexo, avisa em vez de sugerir uma qualquer\n");
    }

    public function test_nao_lista_venda_de_outra_empresa(): void
    {
        $outra = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'outra@teste.com', 'password' => bcrypt('x'),
        ]);

        $this->pay($this->order(5, owner: $outra), 999);

        $result = (new BotToolsService($this->company->id))
            ->execute('orders_with_receipts', []);

        $this->assertSame(0, $result['count']);

        fwrite(STDERR, "comprovante: listagem não mistura empresas\n");
    }

    public function test_arquivo_sumido_do_disco_nao_quebra(): void
    {
        $order = $this->order(20);
        $this->pay($order, 250);

        // Registro existe, arquivo não (limpeza manual, restore parcial, etc.)
        Storage::disk('public')->deleteDirectory('receipts');

        $tools  = new BotToolsService($this->company->id);
        $result = $tools->execute('order_receipts', ['order_number' => 20]);

        $this->assertSame(0, $result['receipts']);
        $this->assertSame([], $tools->attachments());
        $this->assertStringContainsString('não foi encontrado no servidor', $result['message']);

        fwrite(STDERR, "comprovante: arquivo ausente no disco avisa em vez de quebrar\n");
    }
}
