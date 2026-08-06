<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Seller;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    private function order(string $customerName, array $items, float $paid = 0, ?string $city = null): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf',
            'name' => $customerName, 'city' => $city, 'is_active' => true,
        ]);

        $total = collect($items)->sum(fn ($i) => $i[1] * $i[2]);

        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => random_int(1, 99999), 'issue_date' => now()->toDateString(),
            'items_count' => count($items), 'total' => $total, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
            'delivery_city' => $city,
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

    public function test_dashboard_reflects_orders_not_commission_sales(): void
    {
        $this->order('padaria central', [['FARDO 500ML', 50, 5]], 150, 'fortaleza');   // total 250
        $this->order('mercado sul', [['GARRAFAO 20L', 10, 12]], 120, 'fortaleza');     // total 120, pago total

        // Venda de comissão (módulo antigo) não pode aparecer no dashboard
        $seller  = Seller::create([
            'company_id' => $this->company->id, 'name' => 'vendedor x', 'person_type' => 'individual',
            'phone' => '85999999999', 'city' => 'fortaleza', 'state' => 'CE',
            'seller_type' => 'commissioned', 'is_active' => true,
        ]);
        $product = Product::create([
            'company_id' => $this->company->id, 'code' => 'p1', 'name' => 'produto comissao',
            'default_price' => 999, 'controls_stock' => false, 'min_quantity' => 0,
            'current_stock' => 0, 'active' => true,
        ]);
        Sale::create([
            'company_id' => $this->company->id, 'seller_id' => $seller->id, 'product_id' => $product->id,
            'sale_date' => now()->toDateString(), 'unit_price' => 999, 'quantity' => 1, 'total' => 999,
            'payment_received' => true, 'commission_paid' => false, 'commission_percentage' => 10, 'commission_total' => 99.9,
        ]);

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Index')
                ->where('kpis.total_sold', fn ($v) => (float) $v === 370.0)   // 250 + 120, NUNCA 999 da comissão
                ->where('kpis.sales_count', 2)
                ->missing('kpis.commission_total')
                ->missing('kpis.commission_paid')
                ->missing('kpis.commission_pending')
                ->has('topCustomers', 2)
                ->where('topCustomers.0.name', 'PADARIA CENTRAL')  // maior total primeiro
                ->has('topProducts', 2)
            );

        fwrite(STDERR, "\ndashboard: total 370 (2 vendas de clientes), venda de comissão (999) fora\n");
    }

    public function test_deleted_order_is_excluded(): void
    {
        $keep    = $this->order('cliente ativo', [['AGUA', 1, 100]]);
        $deleted = $this->order('cliente excluido', [['AGUA', 1, 500]]);

        $this->delete(route('orders.destroy', $deleted))->assertRedirect();

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('kpis.total_sold', fn ($v) => (float) $v === 100.0)
                ->where('kpis.sales_count', 1)
            );

        fwrite(STDERR, "dashboard: venda excluída (500) não conta, só a ativa (100)\n");
    }

    public function test_top_products_aggregate_across_orders(): void
    {
        $this->order('cliente a', [['FARDO 500ML', 30, 5]]);
        $this->order('cliente b', [['FARDO 500ML', 20, 5], ['GARRAFAO 20L', 4, 12]]);

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('topProducts.0.name', 'FARDO 500ML')
                ->where('topProducts.0.quantity', fn ($v) => (float) $v === 50.0) // 30 + 20 somados
            );

        fwrite(STDERR, "dashboard: rank de produtos soma entre vendas (50 fardos)\n");
    }

    public function test_month_filter_scopes_by_issue_date(): void
    {
        $inMonth = $this->order('cliente mes', [['AGUA', 1, 50]]);

        $outOfMonth = $this->order('cliente fora', [['AGUA', 1, 999]]);
        $outOfMonth->update(['issue_date' => now()->subMonths(2)->toDateString()]);

        $this->get(route('dashboard', ['period' => 'month', 'month' => now()->format('Y-m')]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('kpis.sales_count', 1)
                ->where('kpis.total_sold', fn ($v) => (float) $v === 50.0)
            );
    }
}
