<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductMovement;
use App\Models\RawMaterial;
use App\Services\OrderStockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerItemStockActionTest extends TestCase
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

        $this->actingAs($this->company);
    }

    private function product(string $name, float $stock, bool $controls = true): Product
    {
        return Product::create([
            'company_id' => $this->company->id, 'code' => strtoupper($name), 'name' => $name,
            'default_price' => 10, 'controls_stock' => $controls, 'min_quantity' => 0,
            'current_stock' => $stock, 'active' => true,
        ]);
    }

    private function order(): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'cliente', 'is_active' => true,
        ]);

        return Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id, 'order_number' => 1,
            'issue_date' => now()->toDateString(), 'items_count' => 2, 'total' => 100,
            'stock_action' => 'mixed', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);
    }

    public function test_mixed_actions_in_the_same_sale(): void
    {
        $fardo    = $this->product('fardo 500ml', 120);
        $garrafao = $this->product('garrafao 20l', 30);

        // Receita do garrafão: 1 tampa por unidade
        $tampa = RawMaterial::create([
            'company_id' => $this->company->id, 'name' => 'tampa', 'unit' => 'unidade',
            'controls_stock' => true, 'current_price' => 1, 'min_quantity' => 0,
            'current_stock' => 100, 'active' => true,
        ]);
        $garrafao->recipeItems()->create(['raw_material_id' => $tampa->id, 'quantity' => 1]);

        $order = $this->order();
        $svc   = app(OrderStockService::class);

        $svc->apply($order, [
            ['product_id' => $fardo->id,    'quantity' => 50, 'stock_action' => 'deduct'],
            ['product_id' => $garrafao->id, 'quantity' => 10, 'stock_action' => 'produce'],
        ]);

        // Fardo: só baixa -> 120 - 50
        $this->assertEquals(70, (float) $fardo->fresh()->current_stock);

        // Garrafão: produz 10 (entra) e baixa 10 (sai) -> saldo igual, MP consumida
        $this->assertEquals(30, (float) $garrafao->fresh()->current_stock);
        $this->assertEquals(90, (float) $tampa->fresh()->current_stock);

        // Movimentações: fardo 1 (venda) · garrafão 2 (producao + venda)
        $this->assertSame(1, ProductMovement::where('order_id', $order->id)->where('product_id', $fardo->id)->count());
        $this->assertSame(2, ProductMovement::where('order_id', $order->id)->where('product_id', $garrafao->id)->count());

        fwrite(STDERR, "\nvenda mista: fardo 120->70 (baixa), garrafao 30->30 (produz+baixa), tampa 100->90\n");
    }

    public function test_none_action_leaves_stock_untouched(): void
    {
        $produto = $this->product('agua', 40);
        $order   = $this->order();

        app(OrderStockService::class)->apply($order, [
            ['product_id' => $produto->id, 'quantity' => 15, 'stock_action' => 'none'],
        ]);

        $this->assertEquals(40, (float) $produto->fresh()->current_stock);
        $this->assertSame(0, ProductMovement::where('order_id', $order->id)->count());
    }

    public function test_preview_shortages_is_per_item(): void
    {
        // Produto com pouco estoque, marcado para BAIXA -> deve faltar
        $curto = $this->product('curto', 5);
        // Mesmo estoque baixo, mas marcado para PRODUZIR -> não falta (entra e sai)
        $produzido = $this->product('produzido', 0);
        $mp = RawMaterial::create([
            'company_id' => $this->company->id, 'name' => 'rotulo', 'unit' => 'unidade',
            'controls_stock' => true, 'current_price' => 1, 'min_quantity' => 0,
            'current_stock' => 3, 'active' => true,
        ]);
        $produzido->recipeItems()->create(['raw_material_id' => $mp->id, 'quantity' => 1]);

        $shortages = app(OrderStockService::class)->previewShortages([
            ['product_id' => $curto->id,     'quantity' => 20, 'stock_action' => 'deduct'],
            ['product_id' => $produzido->id, 'quantity' => 10, 'stock_action' => 'produce'],
        ]);

        // Só o item em "baixa" gera falta de produto
        $this->assertCount(1, $shortages['products']);
        $this->assertSame('CURTO', $shortages['products'][0]['name']);
        $this->assertEquals(15, $shortages['products'][0]['lacking']);

        // Só o item em "produzir" gera falta de matéria-prima (10 - 3)
        $this->assertCount(1, $shortages['materials']);
        $this->assertSame('ROTULO', $shortages['materials'][0]['name']);
        $this->assertEquals(7, $shortages['materials'][0]['lacking']);

        fwrite(STDERR, "preview misto: falta 15 de CURTO (baixa) e 7 de ROTULO (producao)\n");
    }

    public function test_edit_reprocesses_with_changed_action(): void
    {
        $produto = $this->product('agua', 100);
        $order   = $this->order();
        $svc     = app(OrderStockService::class);

        // Venda original: baixa de 10 -> 90
        $svc->apply($order, [['product_id' => $produto->id, 'quantity' => 10, 'stock_action' => 'deduct']]);
        $this->assertEquals(90, (float) $produto->fresh()->current_stock);

        // Edição: estorna e passa a "não movimentar" -> volta a 100 e sem movimentações
        $svc->reverse($order);
        $svc->apply($order, [['product_id' => $produto->id, 'quantity' => 10, 'stock_action' => 'none']]);

        $this->assertEquals(100, (float) $produto->fresh()->current_stock);
        $this->assertSame(0, ProductMovement::where('order_id', $order->id)->count());

        fwrite(STDERR, "edicao: baixa 10 (90) -> trocada para 'nao movimentar' -> voltou a 100\n");
    }

    public function test_summarize_reports_mixed(): void
    {
        $svc = app(OrderStockService::class);

        $this->assertSame('deduct', $svc->summarize([
            ['stock_action' => 'deduct'], ['stock_action' => 'deduct'],
        ]));
        $this->assertSame('none', $svc->summarize([['stock_action' => 'none']]));
        $this->assertSame('mixed', $svc->summarize([
            ['stock_action' => 'deduct'], ['stock_action' => 'produce'],
        ]));
    }
}
