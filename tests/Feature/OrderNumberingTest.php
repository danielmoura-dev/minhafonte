<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderNumberingTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleted_sale_does_not_free_its_number(): void
    {
        $company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);
        $customer = Customer::create([
            'company_id' => $company->id, 'type' => 'pf', 'name' => 'cliente', 'is_active' => true,
        ]);
        $product = Product::create([
            'company_id' => $company->id, 'code' => 'p1', 'name' => 'produto', 'default_price' => 10,
            'controls_stock' => false, 'min_quantity' => 0, 'current_stock' => 0, 'active' => true,
        ]);

        $this->actingAsCompany($company);

        $create = fn () => $this->post(route('orders.store'), [
            'customer_id' => $customer->id,
            'issue_date'  => now()->toDateString(),
            'items'       => [[
                'product_id' => $product->id, 'quantity' => 1,
                'unit_price' => 10, 'stock_action' => 'none',
            ]],
        ])->assertRedirect();

        $create();  // #1
        $create();  // #2

        $this->assertSame(2, Order::max('order_number'));

        // Exclui a última venda (#2)
        $second = Order::where('order_number', 2)->first();
        $this->delete(route('orders.destroy', $second))->assertRedirect();
        $this->assertSoftDeleted('orders', ['id' => $second->id]);

        // A próxima venda deve ser #3 — o número 2 não volta a ser usado
        $create();

        $newest = Order::orderByDesc('id')->first();
        $this->assertSame(3, $newest->order_number);

        // Nenhum número repetido entre ativas e excluídas
        $numbers = Order::withTrashed()->pluck('order_number')->all();
        $this->assertSame($numbers, array_unique($numbers));

        fwrite(STDERR, "\nnumeracao: #1, #2, excluiu #2 -> proxima virou #3 (sem repetir)\n");
    }
}
