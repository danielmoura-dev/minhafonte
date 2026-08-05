<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerProfileTest extends TestCase
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

    private function customer(string $name = 'cliente'): Customer
    {
        return Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf',
            'name' => $name, 'is_active' => true,
        ]);
    }

    private function order(Customer $customer, float $total, float $paid = 0, ?int $number = null): Order
    {
        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => $number ?? random_int(1, 99999),
            'issue_date' => now()->toDateString(), 'items_count' => 1, 'total' => $total,
            'stock_action' => 'none', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        $order->items()->create([
            'product_name' => 'agua 20l', 'unit_price' => $total,
            'quantity' => 1, 'subtotal' => $total, 'stock_action' => 'none',
        ]);

        if ($paid > 0) {
            $order->payments()->create([
                'company_id' => $this->company->id, 'amount' => $paid,
                'method' => 'cash', 'paid_at' => now(),
            ]);
            $order->recalculatePayment();
        }

        return $order->fresh();
    }

    public function test_profile_summarises_customer_finances(): void
    {
        $customer = $this->customer('padaria central');

        $this->order($customer, 100, 100);  // paga
        $this->order($customer, 200, 50);   // parcial
        $this->order($customer, 50);        // pendente

        $this->get(route('customers.show', $customer))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Customers/Show')
                ->where('summary.total_bought', fn ($v) => (float) $v === 350.0)
                ->where('summary.total_paid', fn ($v) => (float) $v === 150.0)
                ->where('summary.total_open', fn ($v) => (float) $v === 200.0)
                ->where('summary.orders_count', 3)
                ->where('summary.open_count', 2)
                ->has('orders', 3)
                ->has('topProducts', 1)
            );

        fwrite(STDERR, "\nperfil: comprou 350, pagou 150, em aberto 200 (3 compras, 2 em aberto)\n");
    }

    public function test_deleted_sale_leaves_customer_totals(): void
    {
        $customer = $this->customer();

        $this->order($customer, 100, 100);
        $deleted = $this->order($customer, 400);

        $this->delete(route('orders.destroy', $deleted))->assertRedirect();

        $this->get(route('customers.show', $customer))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('summary.total_bought', fn ($v) => (float) $v === 100.0)
                ->where('summary.orders_count', 1)
            );

        fwrite(STDERR, "perfil: venda excluída não conta no total do cliente\n");
    }

    public function test_index_shows_portfolio_stats(): void
    {
        $a = $this->customer('cliente a');
        $b = $this->customer('cliente b');
        $this->order($a, 300, 100);
        $this->order($b, 200, 200);

        $this->get(route('customers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.customers', 2)
                ->where('stats.customers_active', 2)
                ->where('stats.orders', 2)
                ->where('stats.total_sold', fn ($v) => (float) $v === 500.0)
                ->where('stats.total_open', fn ($v) => (float) $v === 200.0)
                ->where('stats.customers_owing', 1)
            );

        fwrite(STDERR, "carteira: 2 clientes, vendido 500, aberto 200, 1 devendo\n");
    }

    public function test_statement_and_summary_pdfs_render(): void
    {
        $customer = $this->customer();
        $this->order($customer, 120, 20);

        $statement = $this->get(route('customers.report', $customer));
        $statement->assertOk();
        $this->assertStringStartsWith('%PDF', $statement->getContent());

        $summary = $this->get(route('customers.report-all'));
        $summary->assertOk();
        $this->assertStringStartsWith('%PDF', $summary->getContent());

        fwrite(STDERR, "pdf: extrato do cliente e resumo geral gerados\n");
    }

    public function test_other_company_cannot_open_profile(): void
    {
        $customer = $this->customer();

        $intruder = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'o@e.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAs($intruder)
            ->get(route('customers.show', $customer))
            ->assertForbidden();
    }
}
