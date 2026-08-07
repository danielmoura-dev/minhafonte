<?php

namespace Tests\Feature\Permissions;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A permissão vale em três camadas; aqui testamos a que manda: as rotas.
 * A sidebar só esconde — quem barra de verdade é o middleware.
 */
class ModulePermissionTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'empresa@teste.com', 'password' => bcrypt('x'),
        ]);
    }

    public function test_so_ver_vendas_nao_deixa_criar(): void
    {
        $this->actingAsCompany($this->company, ['orders' => ['view']]);

        $this->get(route('orders.index'))->assertOk();

        $this->get(route('orders.create'))->assertForbidden();
        $this->post(route('orders.store'), [])->assertForbidden();

        fwrite(STDERR, "\npermissao: só 'view' em vendas -> lista abre, criar dá 403\n");
    }

    public function test_modulo_ausente_e_bloqueado(): void
    {
        $this->actingAsCompany($this->company, ['orders' => ['view']]);

        $this->get(route('products.index'))->assertForbidden();
        $this->get(route('customers.index'))->assertForbidden();
        $this->get(route('bank-accounts.index'))->assertForbidden();
        $this->get(route('dashboard'))->assertForbidden();

        fwrite(STDERR, "permissao: módulo fora do JSON dá 403\n");
    }

    public function test_recebimentos_e_separado_de_vendas(): void
    {
        // Vendedor que registra vendas mas não pode ver o financeiro.
        $this->actingAsCompany($this->company, ['orders' => ['view', 'create']]);

        $this->get(route('orders.index'))->assertOk();
        $this->get(route('receivables.index'))->assertForbidden();

        fwrite(STDERR, "permissao: quem vende não vê Recebimentos automaticamente\n");
    }

    /**
     * Recebimentos abria a sidebar mas dava 403: o controller autorizava
     * contra a policy de Vendas, então exigia os dois módulos.
     */
    public function test_recebimentos_funciona_sem_permissao_de_vendas(): void
    {
        $customer = Customer::create([
            'company_id' => $this->company->id, 'type' => 'pf', 'name' => 'CLIENTE', 'is_active' => true,
        ]);
        $order = Order::create([
            'company_id' => $this->company->id, 'customer_id' => $customer->id, 'order_number' => 1,
            'issue_date' => now()->toDateString(), 'items_count' => 1, 'total' => 100,
            'stock_action' => 'none', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        // SÓ recebimentos, sem nenhuma permissão de vendas
        $this->actingAsCompany($this->company, ['receivables' => ['view', 'create']]);

        $this->get(route('receivables.index'))->assertOk();
        $this->get(route('receivables.show', $order))->assertOk();

        $this->post(route('receivables.payments.store', $order), [
            'amount' => 50, 'method' => 'cash', 'paid_at' => now()->format('Y-m-d H:i:s'),
        ])->assertRedirect();

        $this->assertEquals(50, $order->fresh()->paid_total);

        // E continua sem enxergar Vendas
        $this->get(route('orders.index'))->assertForbidden();

        fwrite(STDERR, "permissao: só Recebimentos já abre e registra pagamento (sem Vendas)\n");
    }

    public function test_dono_acessa_tudo(): void
    {
        $this->actingAsCompany($this->company);

        $this->get(route('dashboard'))->assertOk();
        $this->get(route('orders.index'))->assertOk();
        $this->get(route('orders.create'))->assertOk();
        $this->get(route('products.index'))->assertOk();
        $this->get(route('receivables.index'))->assertOk();
        $this->get(route('users.index'))->assertOk();

        fwrite(STDERR, "permissao: dono continua acessando tudo (nada mudou para quem já usava)\n");
    }

    public function test_gerenciar_usuarios_pode_ser_delegado(): void
    {
        $this->actingAsCompany($this->company, [
            'users'  => ['view', 'create'],
            'orders' => ['view'],
        ]);

        $this->get(route('users.index'))->assertOk();

        $this->post(route('users.store'), [
            'name' => 'NOVO', 'email' => 'novo@teste.com',
        ])->assertSessionHasNoErrors();

        // Recebeu 'view' e 'create', mas não 'delete'
        $this->delete(route('users.destroy', \App\Models\User::where('email', 'novo@teste.com')->first()))
            ->assertForbidden();

        fwrite(STDERR, "permissao: gerenciar usuários pode ser delegado, ação por ação\n");
    }

    public function test_usuario_desativado_e_derrubado_na_hora(): void
    {
        $this->actingAsCompany($this->company, ['orders' => ['view']]);

        $this->get(route('orders.index'))->assertOk();

        // Desativado no meio da sessão: não espera o próximo login.
        $this->actingUser->update(['is_active' => false]);

        $this->get(route('orders.index'))->assertRedirect(route('login'));
        $this->assertGuest();

        fwrite(STDERR, "permissao: desativar derruba a sessão aberta na hora\n");
    }

    public function test_permissao_nao_atravessa_empresas(): void
    {
        $outra = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'outra@teste.com', 'password' => bcrypt('x'),
        ]);

        $customer = Customer::create([
            'company_id' => $outra->id, 'type' => 'pf', 'name' => 'CLIENTE', 'is_active' => true,
        ]);
        $order = Order::create([
            'company_id' => $outra->id, 'customer_id' => $customer->id, 'order_number' => 1,
            'issue_date' => now()->toDateString(), 'items_count' => 1, 'total' => 100,
            'stock_action' => 'none', 'payment_status' => 'pending', 'paid_total' => 0,
        ]);

        // Permissão TOTAL em vendas — mas de outra empresa.
        $this->actingAsCompany($this->company, ['orders' => ['view', 'create', 'edit', 'delete']]);

        $this->get(route('orders.show', $order))->assertForbidden();
        $this->delete(route('orders.destroy', $order))->assertForbidden();

        fwrite(STDERR, "permissao: permissão total não abre a venda de OUTRA empresa\n");
    }
}
