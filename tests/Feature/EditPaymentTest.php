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

        $this->actingAsCompany($this->company);
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

    public function test_payment_above_remaining_is_rejected(): void
    {
        $order = $this->order(200);

        // Digitou 500 sem querer numa venda de 200: precisa ser recusado,
        // senão a venda quitaria por engano e travaria a correção.
        $this->from(route('receivables.show', $order))
            ->post(route('receivables.payments.store', $order), [
                'amount' => 500, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('amount');

        $order->refresh();
        $this->assertSame(0, $order->payments()->count());
        $this->assertSame('pending', $order->payment_status);

        fwrite(STDERR, "\nlimite: pagamento de 500 recusado numa venda de 200\n");
    }

    public function test_second_payment_cannot_exceed_remaining(): void
    {
        $order = $this->order(200);
        $this->pay($order, 150);   // sobra 50

        $this->from(route('receivables.show', $order))
            ->post(route('receivables.payments.store', $order), [
                'amount' => 80, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('amount');

        $this->assertEquals(150, (float) $order->fresh()->paid_total);

        // Exatamente o saldo é aceito
        $this->post(route('receivables.payments.store', $order), [
            'amount' => 50, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $this->assertSame('paid', $order->fresh()->payment_status);

        fwrite(STDERR, "limite: 2º pagamento de 80 recusado (saldo 50); 50 aceito e quitou\n");
    }

    public function test_correction_above_remaining_is_rejected(): void
    {
        $order = $this->order(200);
        $this->pay($order, 120);              // outro pagamento
        $payment = $this->pay($order, 30);    // este será corrigido

        // Teto para este pagamento: 200 - 120 = 80
        $this->from(route('receivables.show', $order))
            ->put(route('receivables.payments.update', $payment), [
                'amount' => 150, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
            ])
            ->assertSessionHasErrors('amount');

        $this->assertEquals(30, (float) $payment->fresh()->amount);

        // 80 é aceito e quita a venda
        $this->put(route('receivables.payments.update', $payment), [
            'amount' => 80, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $this->assertEquals(80, (float) $payment->fresh()->amount);
        $this->assertSame('paid', $order->fresh()->payment_status);

        fwrite(STDERR, "limite: correção de 150 recusada (teto 80); 80 aceito e quitou\n");
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

        $this->actingAsCompany($intruder)
            ->put(route('receivables.payments.update', $payment), [
                'amount' => 999, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
            ])
            ->assertForbidden();

        $this->assertEquals(20, (float) $payment->fresh()->amount);
    }
}
