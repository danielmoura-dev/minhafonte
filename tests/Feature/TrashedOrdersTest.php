<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrashedOrdersTest extends TestCase
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

    private function order(int $number, string $customerName = 'cliente'): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf',
            'name' => $customerName, 'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => $number, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => 100, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        $order->items()->create([
            'product_name' => 'produto teste', 'unit_price' => 100,
            'quantity' => 1, 'subtotal' => 100, 'stock_action' => 'none',
        ]);

        return $order;
    }

    public function test_only_deleted_orders_are_listed(): void
    {
        $active  = $this->order(1);
        $deleted = $this->order(2);

        $this->delete(route('orders.destroy', $deleted))->assertRedirect();

        $this->get(route('orders.trashed'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Orders/Trashed')
                ->has('orders.data', 1)
                ->where('orders.data.0.order_number', 2)
                ->has('orders.data.0.items', 1)   // itens continuam consultáveis
            );

        // A venda ativa continua na listagem normal e fora do histórico
        $this->get(route('orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.order_number', 1)
            );

        $this->assertNotNull($active->fresh());

        fwrite(STDERR, "\nhistorico: lista só a venda excluída (#2), com seus itens\n");
    }

    public function test_search_filters_trashed_orders(): void
    {
        $a = $this->order(10, 'padaria central');
        $b = $this->order(11, 'mercado sul');

        $this->delete(route('orders.destroy', $a))->assertRedirect();
        $this->delete(route('orders.destroy', $b))->assertRedirect();

        $this->get(route('orders.trashed', ['search' => 'padaria']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.order_number', 10)
            );

        // Busca também pelo número do pedido
        $this->get(route('orders.trashed', ['search' => '11']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('orders.data', 1));

        fwrite(STDERR, "historico: busca por cliente e por número funcionando\n");
    }

    public function test_other_company_does_not_see_deleted_orders(): void
    {
        $order = $this->order(1);
        $this->delete(route('orders.destroy', $order))->assertRedirect();

        $intruder = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'o@e.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAs($intruder)
            ->get(route('orders.trashed'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('orders.data', 0));
    }
}
