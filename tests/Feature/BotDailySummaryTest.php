<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Services\BotNotificationService;
use App\Services\BotToolsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BotDailySummaryTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'company_name' => 'zilumina agua', 'fantasy_name' => 'zilumina', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAsCompany($this->company);
    }

    private function sale(string $customerName, array $items, float $paid = 0): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf',
            'name' => $customerName, 'is_active' => true,
        ]);

        $total = collect($items)->sum(fn ($i) => $i[1] * $i[2]);

        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => random_int(1, 9999), 'issue_date' => now()->toDateString(),
            'items_count' => count($items), 'total' => $total, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        foreach ($items as [$name, $qty, $price]) {
            $order->items()->create([
                'product_name' => $name, 'quantity' => $qty, 'unit_price' => $price,
                'subtotal' => $qty * $price, 'stock_action' => 'none',
            ]);
        }

        if ($paid > 0) {
            $order->payments()->create([
                'company_id' => $this->company->id, 'amount' => $paid,
                'method' => 'cash', 'paid_at' => now(),
            ]);
            $order->recalculatePayment();
        }

        return $order->fresh();
    }

    public function test_daily_messages_are_formatted(): void
    {
        $this->sale('padaria central', [['FARDO 500ML', 50, 25]], 1250);   // pago
        $this->sale('mercado sul', [['GARRAFAO 20L', 10, 12], ['FARDO 500ML', 5, 25]], 100); // parcial

        $summary = (new BotToolsService($this->company->id))->salesSummary();
        [$text, $items] = app(BotNotificationService::class)
            ->buildDailyMessages($this->company, $summary);

        fwrite(STDERR, "\n===== MENSAGEM 1 =====\n{$text}\n\n===== MENSAGEM 2 =====\n{$items}\n\n");

        $this->assertStringContainsString('ZILUMINA', $text);
        $this->assertStringContainsString('*2 vendas*', $text);
        $this->assertStringNotContainsString('PADARIA CENTRAL', $text);   // sem lista de clientes
        $this->assertStringContainsString('Maior venda', $text);
        $this->assertStringContainsString('R$ 1.250,00', $text);
        $this->assertStringContainsString('Menor venda', $text);
        $this->assertStringContainsString('R$ 245,00', $text);
        // Itens agregados entre as vendas: 50 + 5 fardos
        $this->assertStringContainsString('55x FARDO 500ML', $items);
        $this->assertStringContainsString('10x GARRAFAO 20L', $items);
    }

    public function test_day_without_sales(): void
    {
        $summary = (new BotToolsService($this->company->id))->salesSummary();
        [$text, $items] = app(BotNotificationService::class)
            ->buildDailyMessages($this->company, $summary);

        $this->assertStringContainsString('Nenhuma venda registrada hoje', $text);
        $this->assertNull($items);   // não manda a 2ª mensagem à toa
    }

    public function test_sales_summary_only_counts_today_and_ignores_deleted(): void
    {
        $today = $this->sale('cliente hoje', [['AGUA', 1, 100]]);
        $old   = $this->sale('cliente antigo', [['AGUA', 1, 999]]);
        $old->update(['issue_date' => now()->subDays(3)->toDateString()]);

        $deleted = $this->sale('cliente excluido', [['AGUA', 1, 500]]);
        $this->delete(route('orders.destroy', $deleted))->assertRedirect();

        $summary = (new BotToolsService($this->company->id))->salesSummary();

        $this->assertSame(1, $summary['sales_count']);
        $this->assertEquals(100, $summary['total_value']);

        fwrite(STDERR, "resumo: só a venda de hoje conta (antiga e excluída fora)\n");
    }
}
