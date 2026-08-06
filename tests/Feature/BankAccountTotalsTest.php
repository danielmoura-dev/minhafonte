<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankAccountTotalsTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private BankAccount $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        $this->account = BankAccount::create([
            'company_id' => $this->company->id, 'name' => 'conta principal',
            'bank' => 'banco x', 'is_active' => true,
        ]);

        $this->actingAsCompany($this->company);
    }

    private function paidOrder(float $amount): Order
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'cliente', 'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => random_int(1, 99999), 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => $amount, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        $order->payments()->create([
            'company_id' => $this->company->id, 'bank_account_id' => $this->account->id,
            'amount' => $amount, 'method' => 'deposit', 'paid_at' => now(),
        ]);

        $order->recalculatePayment();

        return $order;
    }

    private function accountTotal(): float
    {
        return (float) BankAccount::where('id', $this->account->id)
            ->withSum(['payments as received_total' => fn ($q) => $q->whereHas('order')], 'amount')
            ->first()
            ->received_total;
    }

    public function test_total_sums_payments_of_the_account(): void
    {
        $this->paidOrder(150);
        $this->paidOrder(50);

        $this->assertEquals(200, $this->accountTotal());
        fwrite(STDERR, "\nconta: 150 + 50 = " . $this->accountTotal() . "\n");
    }

    public function test_deleted_sale_stops_counting_in_the_account(): void
    {
        $keep   = $this->paidOrder(150);
        $delete = $this->paidOrder(50);

        $this->assertEquals(200, $this->accountTotal());

        // Exclui a venda de R$ 50 pela rota (venda paga exige senha de admin)
        $this->actingAsCompany($this->company)
            ->delete(route('orders.destroy', $delete), ['admin_password' => 'adm'])
            ->assertRedirect();

        $this->assertSoftDeleted('orders', ['id' => $delete->id]);

        // O pagamento continua na tabela, mas não pode mais contar na conta
        $this->assertDatabaseHas('order_payments', ['order_id' => $delete->id]);
        $this->assertEquals(150, $this->accountTotal());

        fwrite(STDERR, "exclusao: 200 -> " . $this->accountTotal() . " (venda de 50 excluida deixou de contar)\n");

        // A venda mantida segue intacta
        $this->assertNotNull($keep->fresh());
    }

    public function test_show_page_totals_ignore_deleted_sales(): void
    {
        $this->paidOrder(100);
        $deleted = $this->paidOrder(70);

        $this->actingAsCompany($this->company)
            ->delete(route('orders.destroy', $deleted), ['admin_password' => 'adm'])
            ->assertRedirect();

        $this->actingAsCompany($this->company)
            ->get(route('bank-accounts.show', $this->account))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Settings/BankAccountShow')
                ->where('totals.total', fn ($v) => (float) $v === 100.0)
                ->where('payments.total', 1)   // só 1 entrada no histórico
            );

        fwrite(STDERR, "extrato: total 100 e 1 entrada no historico (venda excluida fora)\n");
    }

    public function test_other_company_cannot_open_account(): void
    {
        $intruder = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'o@e.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAsCompany($intruder)
            ->get(route('bank-accounts.show', $this->account))
            ->assertForbidden();
    }

    public function test_payment_without_account_is_not_counted(): void
    {
        $this->paidOrder(100);

        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'x', 'is_active' => true,
        ]);
        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => 777, 'issue_date' => now()->toDateString(), 'items_count' => 1,
            'total' => 30, 'stock_action' => 'none', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);
        // Pagamento em espécie, sem conta vinculada
        $order->payments()->create([
            'company_id' => $this->company->id, 'bank_account_id' => null,
            'amount' => 30, 'method' => 'cash', 'paid_at' => now(),
        ]);

        $this->assertEquals(100, $this->accountTotal());

        $unlinked = OrderPayment::where('company_id', $this->company->id)
            ->whereNull('bank_account_id')->whereHas('order')->sum('amount');

        $this->assertEquals(30, (float) $unlinked);
    }
}
