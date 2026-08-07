<?php

namespace Tests\Feature\Auth;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * O login passa por TODA conta existente, então é o ponto mais sensível da
 * migração para multiusuário: quem já usava o sistema precisa continuar
 * entrando com exatamente as mesmas credenciais.
 */
class LoginTest extends TestCase
{
    use RefreshDatabase;

    private function companyWithOwner(array $userOverrides = []): array
    {
        $company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'dono@teste.com', 'password' => Hash::make('Senha@12345'),
        ]);

        $user = User::create(array_merge([
            'company_id'        => $company->id,
            'name'              => 'DONO',
            'email'             => 'dono@teste.com',
            'password'          => 'Senha@12345',
            'is_owner'          => true,
            'is_active'         => true,
            'email_verified_at' => now(),
        ], $userOverrides));

        return [$company, $user];
    }

    public function test_dono_entra_com_as_credenciais_de_sempre(): void
    {
        [, $user] = $this->companyWithOwner();

        $this->post(route('login.store'), [
            'email'    => 'dono@teste.com',
            'password' => 'Senha@12345',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);

        fwrite(STDERR, "\nlogin: dono entra com e-mail e senha da empresa\n");
    }

    public function test_senha_errada_nao_autentica(): void
    {
        $this->companyWithOwner();

        $this->post(route('login.store'), [
            'email'    => 'dono@teste.com',
            'password' => 'Errada@12345',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();

        fwrite(STDERR, "login: senha errada não autentica\n");
    }

    public function test_usuario_desativado_recebe_mensagem_generica(): void
    {
        $this->companyWithOwner(['is_active' => false]);

        $response = $this->post(route('login.store'), [
            'email'    => 'dono@teste.com',
            'password' => 'Senha@12345',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();

        // Mesma mensagem de credencial inválida: não revela que a conta existe
        // mas está desativada.
        $this->assertSame(
            'E-mail ou senha incorretos.',
            session('errors')->first('email')
        );

        fwrite(STDERR, "login: desativado recebe a mesma mensagem de credencial inválida\n");
    }

    public function test_conta_sem_senha_vai_para_o_primeiro_acesso(): void
    {
        $company = Company::create([
            'company_name' => 'X', 'fantasy_name' => 'X', 'cnpj' => '2',
            'email' => 'empresa@teste.com', 'password' => Hash::make('Senha@12345'),
        ]);

        User::create([
            'company_id'              => $company->id,
            'name'                    => 'FUNCIONARIO',
            'email'                   => 'func@teste.com',
            'password'                => null,
            'permissions'             => ['orders' => ['view']],
            'first_access_expires_at' => now()->addDays(7),
        ]);

        $this->post(route('login.store'), [
            'email'    => 'func@teste.com',
            'password' => 'qualquer',
        ])->assertRedirect(route('first-access'));

        $this->assertGuest();

        fwrite(STDERR, "login: conta sem senha é levada ao primeiro acesso\n");
    }

    public function test_email_inexistente_nao_vaza_existencia(): void
    {
        $this->companyWithOwner();

        $this->post(route('login.store'), [
            'email'    => 'ninguem@teste.com',
            'password' => 'Senha@12345',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_usuario_sem_dashboard_cai_no_primeiro_modulo_permitido(): void
    {
        $company = Company::create([
            'company_name' => 'Y', 'fantasy_name' => 'Y', 'cnpj' => '3',
            'email' => 'y@teste.com', 'password' => Hash::make('Senha@12345'),
        ]);

        User::create([
            'company_id'  => $company->id,
            'name'        => 'VENDEDOR',
            'email'       => 'vendedor@teste.com',
            'password'    => 'Senha@12345',
            'permissions' => ['orders' => ['view', 'create']],
            'is_active'   => true,
        ]);

        // Sem isso o usuário cairia num 403 logo depois de entrar.
        $this->post(route('login.store'), [
            'email'    => 'vendedor@teste.com',
            'password' => 'Senha@12345',
        ])->assertRedirect(route('orders.index'));

        fwrite(STDERR, "login: quem não tem dashboard cai no 1º módulo liberado\n");
    }

    /**
     * O Laravel guarda a página que a pessoa tentou abrir antes de logar.
     * Se ela não tem acesso a essa página, voltar para lá jogaria o usuário
     * direto num 403 assim que entrasse.
     */
    public function test_nao_volta_para_a_pagina_pretendida_se_for_proibida(): void
    {
        $company = Company::create([
            'company_name' => 'Z', 'fantasy_name' => 'Z', 'cnpj' => '9',
            'email' => 'z@teste.com', 'password' => Hash::make('Senha@12345'),
        ]);

        User::create([
            'company_id'  => $company->id,
            'name'        => 'VENDEDOR',
            'email'       => 'vend@teste.com',
            'password'    => 'Senha@12345',
            'permissions' => ['orders' => ['view']],
            'is_active'   => true,
        ]);

        // Tenta abrir o dashboard deslogado: o Laravel guarda essa URL...
        $this->get(route('dashboard'))->assertRedirect(route('login'));

        // ...e depois de logar ele NÃO pode ser mandado de volta para lá.
        $this->post(route('login.store'), [
            'email'    => 'vend@teste.com',
            'password' => 'Senha@12345',
        ])->assertRedirect(route('orders.index'));

        fwrite(STDERR, "login: página pretendida proibida é descartada (vai para /pedidos)\n");
    }

    public function test_volta_para_a_pagina_pretendida_quando_permitida(): void
    {
        [, $user] = $this->companyWithOwner();

        $this->get(route('products.index'))->assertRedirect(route('login'));

        $this->post(route('login.store'), [
            'email'    => 'dono@teste.com',
            'password' => 'Senha@12345',
        ])->assertRedirect(route('products.index'));

        $this->assertAuthenticatedAs($user);

        fwrite(STDERR, "login: página pretendida permitida é respeitada\n");
    }

    public function test_logout_encerra_a_sessao(): void
    {
        [$company] = $this->companyWithOwner();

        $this->actingAsCompany($company)
            ->post(route('logout'))
            ->assertRedirect(route('login'));

        $this->assertGuest();
    }
}
