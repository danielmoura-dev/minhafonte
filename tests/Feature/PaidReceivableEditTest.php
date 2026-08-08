<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Corrigir pagamento de uma venda já quitada, liberado por senha de
 * administrador.
 *
 * O caso real: o recebimento foi lançado na conta bancária errada e, como a
 * venda estava quitada, a correção ficava travada — e o extrato da conta
 * nunca fechava na hora de bater o caixa.
 */
class PaidReceivableEditTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private BankAccount $contaCerta;
    private BankAccount $contaErrada;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'empresa@teste.com', 'password' => bcrypt('x'),
        ]);

        $this->contaCerta = BankAccount::create([
            'company_id' => $this->company->id, 'name' => 'CONTA CERTA', 'is_active' => true,
        ]);
        $this->contaErrada = BankAccount::create([
            'company_id' => $this->company->id, 'name' => 'CONTA ERRADA', 'is_active' => true,
        ]);

        $this->actingAsCompany($this->company);
    }

    /** Venda já quitada, com o pagamento lançado na conta errada. */
    private function vendaQuitada(float $total = 200): array
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf',
            'name' => 'PADARIA CENTRAL', 'is_active' => true,
        ]);

        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => 1, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => $total, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        $payment = $order->payments()->create([
            'company_id'      => $this->company->id,
            'bank_account_id' => $this->contaErrada->id,
            'amount'          => $total,
            'method'          => 'deposit',
            'paid_at'         => now(),
        ]);

        $order->recalculatePayment();

        return [$order->fresh(), $payment];
    }

    private function recebidoNa(BankAccount $conta): float
    {
        return (float) OrderPayment::where('bank_account_id', $conta->id)
            ->whereHas('order')
            ->sum('amount');
    }

    public function test_venda_quitada_bloqueia_correcao_sem_senha(): void
    {
        [$order, $payment] = $this->vendaQuitada();

        $this->assertSame('paid', $order->payment_status);

        $this->put(route('receivables.payments.update', $payment), [
            'amount'          => 200,
            'method'          => 'deposit',
            'bank_account_id' => $this->contaCerta->id,
            'paid_at'         => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        // Nada mudou: continua na conta errada
        $this->assertSame($this->contaErrada->id, $payment->fresh()->bank_account_id);

        fwrite(STDERR, "\nquitada: correção bloqueada enquanto não libera por senha\n");
    }

    public function test_senha_errada_nao_libera(): void
    {
        [$order] = $this->vendaQuitada();

        $this->post(route('receivables.unlock-edit', $order), ['admin_password' => 'errada'])
            ->assertSessionHasErrors('admin_password');

        $this->get(route('receivables.show', $order))
            ->assertInertia(fn ($page) => $page->where('canEditPayments', false));

        fwrite(STDERR, "quitada: senha errada não libera a correção\n");
    }

    /** O caso que originou a feature, ponta a ponta. */
    public function test_corrige_a_conta_errada_e_o_extrato_passa_a_bater(): void
    {
        [$order, $payment] = $this->vendaQuitada(200);

        // Antes: o dinheiro está todo na conta errada
        $this->assertEquals(200, $this->recebidoNa($this->contaErrada));
        $this->assertEquals(0, $this->recebidoNa($this->contaCerta));

        // Libera com a senha padrão de administrador
        $this->post(route('receivables.unlock-edit', $order), ['admin_password' => 'adm'])
            ->assertSessionHasNoErrors();

        $this->get(route('receivables.show', $order))
            ->assertInertia(fn ($page) => $page->where('canEditPayments', true));

        $this->put(route('receivables.payments.update', $payment), [
            'amount'          => 200,
            'method'          => 'deposit',
            'bank_account_id' => $this->contaCerta->id,
            'paid_at'         => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        // Depois: o extrato das duas contas reflete a correção
        $this->assertEquals(0, $this->recebidoNa($this->contaErrada));
        $this->assertEquals(200, $this->recebidoNa($this->contaCerta));

        // E a venda segue quitada — só o destino do dinheiro mudou
        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertEquals(200, (float) $order->paid_total);

        fwrite(STDERR, "quitada: conta corrigida — 200 saiu da conta errada e entrou na certa\n");
    }

    public function test_reduzir_o_valor_reabre_a_venda(): void
    {
        [$order, $payment] = $this->vendaQuitada(200);

        $this->post(route('receivables.unlock-edit', $order), ['admin_password' => 'adm']);

        $this->put(route('receivables.payments.update', $payment), [
            'amount'  => 150,
            'method'  => 'cash',
            'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        // A correção precisa refletir em tudo: saldo, situação e extrato
        $order->refresh();
        $this->assertSame('partial', $order->payment_status);
        $this->assertEquals(150, (float) $order->paid_total);
        $this->assertEquals(50, (float) $order->remaining);
        $this->assertEquals(0, $this->recebidoNa($this->contaErrada));

        fwrite(STDERR, "quitada: baixar 200 -> 150 reabre a venda (saldo 50) e ajusta o extrato\n");
    }

    public function test_correcao_continua_limitada_ao_total_da_venda(): void
    {
        [$order, $payment] = $this->vendaQuitada(200);

        $this->post(route('receivables.unlock-edit', $order), ['admin_password' => 'adm']);

        // O desbloqueio libera corrigir, não lançar mais do que a venda vale
        $this->put(route('receivables.payments.update', $payment), [
            'amount'  => 500,
            'method'  => 'cash',
            'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertSessionHasErrors('amount');

        $this->assertEquals(200, (float) $payment->fresh()->amount);

        fwrite(STDERR, "quitada: desbloqueio não permite pagar acima do total da venda\n");
    }

    public function test_desbloqueio_nao_vaza_para_outra_venda(): void
    {
        [$primeira] = $this->vendaQuitada(200);

        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'OUTRO', 'is_active' => true,
        ]);
        $segunda = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => 2, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => 100, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);
        $pagamentoDaSegunda = $segunda->payments()->create([
            'company_id' => $this->company->id, 'amount' => 100,
            'method' => 'cash', 'paid_at' => now(),
        ]);
        $segunda->recalculatePayment();

        $this->post(route('receivables.unlock-edit', $primeira), ['admin_password' => 'adm']);

        // A liberação vale só para a venda desbloqueada
        $this->get(route('receivables.show', $segunda))
            ->assertInertia(fn ($page) => $page->where('canEditPayments', false));

        $this->put(route('receivables.payments.update', $pagamentoDaSegunda), [
            'amount'  => 50,
            'method'  => 'cash',
            'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $this->assertEquals(100, (float) $pagamentoDaSegunda->fresh()->amount);

        fwrite(STDERR, "quitada: desbloqueio vale só para a venda liberada\n");
    }

    public function test_outra_empresa_nao_desbloqueia(): void
    {
        [$order] = $this->vendaQuitada();

        $intrusa = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'outra@teste.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAsCompany($intrusa)
            ->post(route('receivables.unlock-edit', $order), ['admin_password' => 'adm'])
            ->assertForbidden();

        fwrite(STDERR, "quitada: empresa de fora não desbloqueia a venda\n");
    }

    public function test_venda_em_aberto_continua_corrigindo_sem_senha(): void
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'CLIENTE', 'is_active' => true,
        ]);
        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id,
            'order_number' => 3, 'issue_date' => now()->toDateString(),
            'items_count' => 1, 'total' => 200, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);
        $payment = $order->payments()->create([
            'company_id' => $this->company->id, 'amount' => 50,
            'method' => 'cash', 'paid_at' => now(),
        ]);
        $order->recalculatePayment();

        $this->get(route('receivables.show', $order))
            ->assertInertia(fn ($page) => $page->where('canEditPayments', true));

        $this->put(route('receivables.payments.update', $payment), [
            'amount'  => 80,
            'method'  => 'cash',
            'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $this->assertEquals(80, (float) $payment->fresh()->amount);

        fwrite(STDERR, "aberta: correção segue livre, sem pedir senha\n");
    }
}
