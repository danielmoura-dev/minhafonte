<?php

namespace Tests\Feature\Ceo;

use App\Models\BankAccount;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Painel do Dono: só reapresenta números que já existem, mas precisa respeitar
 * as mesmas regras do resto do sistema — venda excluída não conta e nada
 * atravessa de uma empresa para outra.
 */
class CeoPanelTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private BankAccount $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'empresa@teste.com', 'password' => bcrypt('x'),
        ]);

        $this->account = BankAccount::create([
            'company_id' => $this->company->id, 'name' => 'CONTA PRINCIPAL',
            'bank' => 'Banco Teste', 'is_active' => true,
        ]);
    }

    private function sale(array $items, float $paid = 0, ?string $city = null, ?Company $owner = null): Order
    {
        $company = $owner ?? $this->company;

        $customer = Customer::create([
            'company_id' => $company->id, 'type' => 'pf',
            'name' => 'CLIENTE ' . uniqid(), 'city' => $city, 'is_active' => true,
        ]);

        $total = collect($items)->sum(fn ($i) => $i[1] * $i[2]);

        $order = Order::create([
            'company_id' => $company->id, 'customer_id' => $customer->id,
            'order_number' => random_int(1, 99999), 'issue_date' => now()->toDateString(),
            'items_count' => count($items), 'total' => $total, 'stock_action' => 'none',
            'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        foreach ($items as [$name, $q, $price]) {
            $order->items()->create([
                'product_name' => $name, 'quantity' => $q, 'unit_price' => $price,
                'subtotal' => $q * $price, 'stock_action' => 'none',
            ]);
        }

        if ($paid > 0) {
            $order->payments()->create([
                'company_id'      => $company->id,
                'bank_account_id' => $company->is($this->company) ? $this->account->id : null,
                'amount'          => $paid, 'method' => 'pix', 'paid_at' => now(),
            ]);
            $order->recalculatePayment();
        }

        return $order->fresh();
    }

    public function test_painel_mostra_os_numeros_de_destaque(): void
    {
        $this->sale([['FARDO 500ML', 10, 25]], paid: 250);   // 250 pago
        $this->sale([['GARRAFAO 20L', 5, 12]]);              // 60 em aberto

        $this->actingAsCompany($this->company)
            ->get(route('ceo.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Ceo/Index')
                ->where('highlights.accounts_total', 250)
                ->where('highlights.month_sold', 310)
                ->where('highlights.month_count', 2)
                ->where('highlights.open_total', 60)
            );

        fwrite(STDERR, "\nceo: painel soma 310 vendido, 250 recebido e 60 em aberto\n");
    }

    public function test_contas_mostram_quanto_entrou_em_cada_uma(): void
    {
        $this->sale([['AGUA', 1, 400]], paid: 400);

        // Recebimento em espécie (sem conta vinculada)
        $avulsa = $this->sale([['AGUA', 1, 100]]);
        $avulsa->payments()->create([
            'company_id' => $this->company->id, 'bank_account_id' => null,
            'amount' => 100, 'method' => 'cash', 'paid_at' => now(),
        ]);

        $this->actingAsCompany($this->company)
            ->get(route('ceo.bank-accounts'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Ceo/BankAccounts')
                ->where('accounts.0.name', 'CONTA PRINCIPAL')
                ->where('accounts.0.received_total', 400)
                ->where('accounts.0.received_count', 1)
                ->where('unlinked', 100)
                ->where('total', 500)
            );

        fwrite(STDERR, "ceo: conta com 400 + 100 em espécie = 500 no total\n");
    }

    public function test_venda_excluida_nao_conta_em_lugar_nenhum(): void
    {
        $this->sale([['AGUA', 1, 300]], paid: 300);

        // Venda com pagamento exige a senha de administrador para excluir.
        $excluida = $this->sale([['AGUA', 1, 700]], paid: 700);
        $this->actingAsCompany($this->company)
            ->delete(route('orders.destroy', $excluida), ['admin_password' => 'adm'])
            ->assertRedirect();

        // Confere que a exclusão aconteceu de fato — sem isto, um erro de
        // validação passaria batido (também devolve um redirect).
        $this->assertSoftDeleted('orders', ['id' => $excluida->id]);
        $this->assertDatabaseHas('order_payments', ['order_id' => $excluida->id]);

        $this->get(route('ceo.bank-accounts'))
            ->assertInertia(fn ($page) => $page
                ->where('accounts.0.received_total', 300)
                ->where('total', 300)
            );

        $this->get(route('ceo.sales', ['period' => 'total']))
            ->assertInertia(fn ($page) => $page
                ->where('summary.sold', 300)
                ->where('summary.sales_count', 1)
            );

        fwrite(STDERR, "ceo: venda excluída (700) sai das contas e das vendas\n");
    }

    public function test_vendas_filtram_por_dia_mes_e_total(): void
    {
        $this->sale([['AGUA', 2, 50]], paid: 100);            // hoje: 100

        $antiga = $this->sale([['AGUA', 1, 900]]);
        $antiga->update(['issue_date' => now()->subMonths(2)->toDateString()]);

        $this->actingAsCompany($this->company);

        $this->get(route('ceo.sales', ['period' => 'day']))
            ->assertInertia(fn ($page) => $page->where('summary.sold', 100));

        $this->get(route('ceo.sales', ['period' => 'month']))
            ->assertInertia(fn ($page) => $page->where('summary.sold', 100));

        $this->get(route('ceo.sales', ['period' => 'total']))
            ->assertInertia(fn ($page) => $page
                ->where('summary.sold', 1000)
                ->where('summary.received', 100)
                ->where('summary.pending', 900)
                ->where('summary.items_count', 3)
            );

        fwrite(STDERR, "ceo: filtro dia/mês = 100; total = 1000 (900 a receber)\n");
    }

    public function test_ranks_de_produtos_clientes_e_cidades(): void
    {
        $this->sale([['FARDO 500ML', 10, 30]], paid: 0, city: 'FORTALEZA');   // 300
        $this->sale([['FARDO 500ML', 5, 30], ['TAMPA', 100, 1]], city: 'SOBRAL'); // 150 + 100

        $this->actingAsCompany($this->company)
            ->get(route('ceo.ranks', ['period' => 'total']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Ceo/Ranks')
                // Fardo lidera somando as duas vendas: 300 + 150
                ->where('products.0.name', 'FARDO 500ML')
                ->where('products.0.total', 450)
                ->where('products.0.quantity', 15)
                ->where('cities.0.city', 'FORTALEZA')
                ->where('cities.0.total', 300)
                ->where('customers.0.total', 300)
            );

        fwrite(STDERR, "ceo: rank soma o produto entre vendas e agrupa por cidade\n");
    }

    public function test_outra_empresa_nao_aparece_no_painel(): void
    {
        $outra = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'outra@teste.com', 'password' => bcrypt('x'),
        ]);

        $this->sale([['AGUA', 1, 100]], paid: 100);                       // minha
        $this->sale([['AGUA', 1, 9999]], paid: 9999, owner: $outra);      // da outra

        $this->actingAsCompany($this->company)
            ->get(route('ceo.sales', ['period' => 'total']))
            ->assertInertia(fn ($page) => $page
                ->where('summary.sold', 100)
                ->where('summary.sales_count', 1)
            );

        $this->get(route('ceo.ranks', ['period' => 'total']))
            ->assertInertia(fn ($page) => $page->where('products.0.total', 100));

        fwrite(STDERR, "ceo: venda de outra empresa (9999) não aparece\n");
    }

    public function test_modulo_respeita_a_permissao(): void
    {
        // Sem o módulo 'ceo' liberado
        $this->actingAsCompany($this->company, ['orders' => ['view']]);

        $this->get(route('ceo.index'))->assertForbidden();
        $this->get(route('ceo.bank-accounts'))->assertForbidden();
        $this->get(route('ceo.sales'))->assertForbidden();
        $this->get(route('ceo.ranks'))->assertForbidden();

        // Com o módulo liberado, abre — mesmo sem permissão de contas ou vendas,
        // porque o painel é só leitura e tem permissão própria.
        $this->actingAsCompany($this->company, ['ceo' => ['view']]);

        $this->get(route('ceo.index'))->assertOk();
        $this->get(route('ceo.bank-accounts'))->assertOk();
        $this->get(route('ceo.sales'))->assertOk();
        $this->get(route('ceo.ranks'))->assertOk();

        fwrite(STDERR, "ceo: 403 sem o módulo; abre com 'ceo: view'\n");
    }
}
