<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaidOrderEditCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_password_check(): void
    {
        $company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        // Padrão "adm" enquanto não houver senha própria
        $this->assertTrue($company->checkAdminPassword('adm'));
        $this->assertFalse($company->checkAdminPassword('errada'));

        // Após definir uma senha própria (cast hashed), "adm" deixa de valer
        $company->update(['admin_password' => 'segredo123']);
        $company->refresh();
        $this->assertFalse($company->checkAdminPassword('adm'));
        $this->assertTrue($company->checkAdminPassword('segredo123'));
        fwrite(STDERR, "\nadmin password: padrão adm ok, custom ok, senha errada barrada\n");
    }

    public function test_edit_paid_order_recalculates_status(): void
    {
        $company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        // Venda 150, pago 100 -> parcial
        $order = Order::create([
            'company_id' => $company->id, 'order_number' => 1,
            'issue_date' => now()->toDateString(), 'items_count' => 1, 'total' => 150,
            'stock_action' => 'none', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);
        $order->payments()->create(['company_id' => $company->id, 'amount' => 100, 'method' => 'cheque', 'paid_at' => now()]);
        $order->recalculatePayment();
        $this->assertSame('partial', $order->fresh()->payment_status);

        // Editar total para 100 e recalcular -> vira paga, saldo 0
        $order->update(['total' => 100]);
        $order->recalculatePayment();

        $fresh = $order->fresh();
        fwrite(STDERR, "cascade: total={$fresh->total} status={$fresh->payment_status} saldo={$fresh->remaining}\n");
        $this->assertSame('paid', $fresh->payment_status);
        $this->assertEquals(0, (float) $fresh->remaining);
    }

    public function test_edit_reprocesses_stock(): void
    {
        $company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);
        $product = \App\Models\Product::create([
            'company_id' => $company->id, 'code' => 'p1', 'name' => 'prod', 'default_price' => 10,
            'controls_stock' => true, 'min_quantity' => 0, 'current_stock' => 100, 'active' => true,
        ]);
        $this->actingAs($company);
        $svc = app(\App\Services\OrderStockService::class);

        $order = Order::create([
            'company_id' => $company->id, 'order_number' => 1, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => 50, 'stock_action' => 'deduct', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        // baixa de 10 -> 90
        $svc->apply($order, 'deduct', [['product_id' => $product->id, 'quantity' => 10]], false);
        $this->assertEquals(90, (float) $product->fresh()->current_stock);
        $this->assertSame(1, $order->movements()->count());

        // estorno -> volta a 100, sem movimentos
        $svc->reverse($order);
        $this->assertEquals(100, (float) $product->fresh()->current_stock);
        $this->assertSame(0, $order->movements()->count());

        // refaz com 5 -> 95
        $svc->apply($order, 'deduct', [['product_id' => $product->id, 'quantity' => 5]], false);
        $this->assertEquals(95, (float) $product->fresh()->current_stock);

        fwrite(STDERR, "edit stock: baixa 10 (90) -> estorno (100) -> refaz 5 (95) = " . $product->fresh()->current_stock . "\n");
    }

    public function test_delete_restores_stock(): void
    {
        $company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);
        $product = \App\Models\Product::create([
            'company_id' => $company->id, 'code' => 'p1', 'name' => 'prod', 'default_price' => 10,
            'controls_stock' => true, 'min_quantity' => 0, 'current_stock' => 100, 'active' => true,
        ]);
        $this->actingAs($company);
        $svc = app(\App\Services\OrderStockService::class);

        $order = Order::create([
            'company_id' => $company->id, 'order_number' => 1, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => 80, 'stock_action' => 'deduct', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);
        $svc->apply($order, 'deduct', [['product_id' => $product->id, 'quantity' => 8]], false);
        $this->assertEquals(92, (float) $product->fresh()->current_stock);

        // Simula o destroy: estorna + soft delete
        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $svc) {
            $svc->reverse($order);
            $order->delete();
        });

        $this->assertEquals(100, (float) $product->fresh()->current_stock);
        $this->assertSoftDeleted('orders', ['id' => $order->id]);
        $this->assertSame(0, \App\Models\ProductMovement::where('order_id', $order->id)->count());
        fwrite(STDERR, "delete stock: baixa 8 (92) -> excluir estorna (100), movimentos removidos\n");
    }

    public function test_uppercase_stored_on_create(): void
    {
        $company = Company::create([
            'company_name' => 'teste ltda', 'fantasy_name' => 'teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);
        $c = Customer::create(['company_id' => $company->id, 'type' => 'pf', 'name' => 'joão silva', 'city' => 'são paulo', 'email' => 'Ab@C.com']);

        $this->assertSame('JOÃO SILVA', $c->fresh()->name);
        $this->assertSame('SÃO PAULO', $c->fresh()->city);
        $this->assertSame('Ab@C.com', $c->fresh()->email); // email intacto
        fwrite(STDERR, "uppercase: {$c->name} / {$c->city} / email {$c->email}\n");
    }
}
