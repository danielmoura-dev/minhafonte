<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EditPaymentTest extends TestCase
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

    private function order(float $total): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'cliente', 'is_active' => true,
        ]);

        return Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => random_int(1, 99999), 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => $total, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);
    }

    private function pay(Order $order, float $amount)
    {
        $this->post(route('receivables.payments.store', $order), [
            'amount' => $amount, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        return $order->payments()->latest('id')->first();
    }

    public function test_wrong_amount_can_be_corrected(): void
    {
        $order = $this->order(200);

        // Digitou 500 sem querer numa venda de 200
        $payment = $this->pay($order, 500);
        $this->assertSame('paid', $order->fresh()->payment_status);

        // Como ficou "paga", a correção é bloqueada (regra do usuário)
        $this->put(route('receivables.payments.update', $payment), [
            'amount' => 50, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $this->assertEquals(500, (float) $payment->fresh()->amount);

        fwrite(STDERR, "\ncorrecao: venda quitada bloqueia alteração (valor segue 500)\n");
    }

    public function test_partial_payment_amount_is_corrected_and_recalculated(): void
    {
        $order = $this->order(200);

        // Deveria ser 50, mas digitou 20
        $payment = $this->pay($order, 20);
        $this->assertSame('partial', $order->fresh()->payment_status);
        $this->assertEquals(180, (float) $order->fresh()->remaining);

        $this->put(route('receivables.payments.update', $payment), [
            'amount' => 50, 'method' => 'deposit', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $payment->refresh();
        $order->refresh();

        $this->assertEquals(50, (float) $payment->amount);
        $this->assertSame('deposit', $payment->method);

        // Saldo e situação recalculados
        $this->assertEquals(50, (float) $order->paid_total);
        $this->assertEquals(150, (float) $order->remaining);
        $this->assertSame('partial', $order->payment_status);

        fwrite(STDERR, "correcao: 20 -> 50; pago 50, saldo 150, status partial\n");
    }

    public function test_correction_can_settle_the_order(): void
    {
        $order   = $this->order(200);
        $payment = $this->pay($order, 20);

        // Corrige para o valor cheio -> venda passa a quitada
        $this->put(route('receivables.payments.update', $payment), [
            'amount' => 200, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertEquals(0, (float) $order->remaining);

        // E a partir daí não pode mais alterar
        $this->put(route('receivables.payments.update', $payment), [
            'amount' => 10, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $this->assertEquals(200, (float) $payment->fresh()->amount);

        fwrite(STDERR, "correcao: ao quitar, novas alterações ficam bloqueadas\n");
    }

    public function test_invalid_amount_is_rejected(): void
    {
        $order   = $this->order(200);
        $payment = $this->pay($order, 20);

        $this->from(route('receivables.show', $order))
            ->put(route('receivables.payments.update', $payment), [
                'amount' => 0, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('amount');

        $this->assertEquals(20, (float) $payment->fresh()->amount);
    }

    public function test_other_company_cannot_edit_payment(): void
    {
        $order   = $this->order(200);
        $payment = $this->pay($order, 20);

        $intruder = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'o@e.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAs($intruder)
            ->put(route('receivables.payments.update', $payment), [
                'amount' => 999, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
            ])
            ->assertForbidden();

        $this->assertEquals(20, (float) $payment->fresh()->amount);
    }
}
