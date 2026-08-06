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

class ProductIndicatorsTest extends TestCase
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

        $this->actingAsCompany($this->company);
    }

    private function product(string $name): Product
    {
        return Product::create([
            'company_id' => $this->company->id, 'code' => strtoupper($name), 'name' => $name,
            'default_price' => 10, 'controls_stock' => false, 'min_quantity' => 0,
            'current_stock' => 0, 'active' => true,
        ]);
    }

    private function order(Product $product, float $qty, float $price): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'cliente', 'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => random_int(1, 99999), 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => $qty * $price, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);
        $order->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'quantity' => $qty, 'unit_price' => $price, 'subtotal' => $qty * $price,
            'stock_action' => 'none',
        ]);

        return $order->fresh();
    }

    public function test_indicators_reflect_orders_not_commission_sales(): void
    {
        $fardo = $this->product('fardo 500ml');
        $this->order($fardo, 30, 5);   // 150
        $this->order($fardo, 20, 5);   // 100 -> total 250, qty 50

        $garrafao = $this->product('garrafao 20l');
        $this->order($garrafao, 4, 12); // 48

        // Venda de comissão do mesmo produto NÃO pode contaminar os indicadores
        $seller = Seller::create([
            'company_id' => $this->company->id, 'name' => 'vendedor x', 'person_type' => 'individual',
            'phone' => '85999999999', 'city' => 'fortaleza', 'state' => 'CE',
            'seller_type' => 'commissioned', 'is_active' => true,
        ]);
        Sale::create([
            'company_id' => $this->company->id, 'seller_id' => $seller->id, 'product_id' => $fardo->id,
            'sale_date' => now()->toDateString(), 'unit_price' => 999, 'quantity' => 100, 'total' => 99900,
            'payment_received' => true, 'commission_paid' => true, 'commission_percentage' => 10, 'commission_total' => 9990,
        ]);

        $response = $this->get(route('products.index'));
        $response->assertOk();

        $indicators = collect($response->viewData('page')['props']['productIndicators']);
        $grandTotal = $response->viewData('page')['props']['grandTotal'];

        $fardoRow = $indicators->firstWhere('id', $fardo->id);

        $this->assertEquals(50, $fardoRow['quantity']);   // 30 + 20, nunca 100 da comissão
        $this->assertEquals(250, $fardoRow['total']);      // nunca 99900
        $this->assertSame(2, $fardoRow['sales_count']);
        $this->assertArrayNotHasKey('commissions', $fardoRow);

        $this->assertEquals(298, (float) $grandTotal); // 250 + 48, sem a comissão

        fwrite(STDERR, "\nindicadores: fardo 50un/R$250 (comissão de 100un/R$99900 fora)\n");
    }

    public function test_deleted_order_is_excluded_from_indicators(): void
    {
        $product = $this->product('agua');
        $keep    = $this->order($product, 10, 2);   // 20
        $deleted = $this->order($product, 90, 2);   // 180

        $this->delete(route('orders.destroy', $deleted))->assertRedirect();

        $response = $this->get(route('products.index'));
        $indicators = collect($response->viewData('page')['props']['productIndicators']);
        $row = $indicators->firstWhere('id', $product->id);

        $this->assertEquals(10, $row['quantity']);
        $this->assertEquals(20, $row['total']);

        fwrite(STDERR, "indicadores: venda excluída (90un) não conta, só a ativa (10un)\n");
    }

    public function test_product_without_sales_shows_zeroed(): void
    {
        $product = $this->product('sem vendas');

        $response = $this->get(route('products.index'));
        $indicators = collect($response->viewData('page')['props']['productIndicators']);
        $row = $indicators->firstWhere('id', $product->id);

        $this->assertSame(0, $row['sales_count']);
        $this->assertEquals(0, $row['quantity']);
        $this->assertEquals(0, $row['total']);
    }
}
