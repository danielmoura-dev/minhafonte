<?php

namespace Tests\Feature\Settings;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Gerenciamento de usuários — o endpoint mais sensível da feature: o
 * route-model binding de {user} é global, então sem a policy o dono de uma
 * empresa alcançaria o usuário de outra só trocando o id na URL.
 */
class UserManagementTest extends TestCase
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

    public function test_dono_cria_usuario_sem_senha_e_com_permissoes_limpas(): void
    {
        $this->actingAsCompany($this->company)
            ->post(route('users.store'), [
                'name'        => 'daniel',
                'email'       => 'Daniel@Teste.com ',
                'permissions' => [
                    'orders'       => ['create', 'edit'],   // sem 'view' de propósito
                    'modulo_falso' => ['view'],
                ],
            ])->assertRedirect();

        $user = User::where('email', 'daniel@teste.com')->first();

        $this->assertNotNull($user, 'e-mail deveria ter sido normalizado para minúsculas');
        $this->assertNull($user->password);                   // define no 1º acesso
        $this->assertFalse($user->is_owner);
        $this->assertTrue($user->is_active);
        $this->assertNotNull($user->first_access_expires_at);
        $this->assertSame($this->company->id, $user->company_id);

        // sanitize(): implica 'view' e descarta o que não existe
        $this->assertSame(['view', 'create', 'edit'], $user->permissions['orders']);
        $this->assertArrayNotHasKey('modulo_falso', $user->permissions);

        fwrite(STDERR, "\nusuarios: criado sem senha, permissões saneadas ('view' implícito)\n");
    }

    public function test_funcionario_sem_a_permissao_nao_acessa(): void
    {
        $this->actingAsCompany($this->company, ['orders' => ['view']]);

        $this->get(route('users.index'))->assertForbidden();

        fwrite(STDERR, "usuarios: sem a permissão 'users', a tela não abre\n");
    }

    /**
     * Quem gerencia usuários não pode repassar esse poder adiante — senão a
     * permissão se espalha sozinha e o dono perde o controle.
     */
    public function test_quem_nao_e_dono_nao_concede_o_modulo_de_usuarios(): void
    {
        $this->actingAsCompany($this->company, ['users' => ['view', 'create', 'edit']]);

        $this->post(route('users.store'), [
            'name'        => 'CANDIDATO',
            'email'       => 'candidato@teste.com',
            'permissions' => ['users' => ['view', 'create'], 'orders' => ['view']],
        ])->assertSessionHasNoErrors();

        $criado = User::where('email', 'candidato@teste.com')->first();

        $this->assertArrayNotHasKey('users', $criado->permissions);
        $this->assertSame(['view'], $criado->permissions['orders']);

        // Nem na tela o módulo é oferecido a quem não é dono.
        $this->get(route('users.index'))
            ->assertInertia(fn ($page) => $page->missing('modules.users'));

        fwrite(STDERR, "usuarios: quem não é dono não consegue conceder 'users'\n");
    }

    public function test_dono_concede_o_modulo_de_usuarios_normalmente(): void
    {
        $this->actingAsCompany($this->company);

        $this->post(route('users.store'), [
            'name'        => 'GERENTE',
            'email'       => 'gerente@teste.com',
            'permissions' => ['users' => ['view', 'create']],
        ])->assertSessionHasNoErrors();

        $gerente = User::where('email', 'gerente@teste.com')->first();

        $this->assertSame(['view', 'create'], $gerente->permissions['users']);

        fwrite(STDERR, "usuarios: o dono concede 'users' sem restrição\n");
    }

    public function test_dono_nao_alcanca_usuario_de_outra_empresa(): void
    {
        $outra = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'outra@teste.com', 'password' => bcrypt('x'),
        ]);

        $alvo = User::create([
            'company_id' => $outra->id, 'name' => 'ALVO',
            'email' => 'alvo@outra.com', 'password' => 'Senha@12345',
        ]);

        $this->actingAsCompany($this->company);

        $this->put(route('users.update', $alvo), [
            'name' => 'INVADIDO', 'email' => 'invadido@teste.com',
        ])->assertForbidden();

        $this->delete(route('users.destroy', $alvo))->assertForbidden();
        $this->post(route('users.reset-password', $alvo), ['mode' => 'first_access'])->assertForbidden();

        $this->assertSame('ALVO', $alvo->fresh()->name);

        fwrite(STDERR, "usuarios: dono da empresa A não alcança usuário da empresa B\n");
    }

    public function test_dono_nao_pode_editar_a_si_mesmo_nem_outro_dono(): void
    {
        $this->actingAsCompany($this->company);

        $this->delete(route('users.destroy', $this->actingUser))->assertForbidden();
        $this->patch(route('users.toggle-status', $this->actingUser))->assertForbidden();

        fwrite(STDERR, "usuarios: o dono não se exclui nem se desativa\n");
    }

    public function test_reset_para_primeiro_acesso_zera_a_senha(): void
    {
        $this->actingAsCompany($this->company);

        $func = User::create([
            'company_id' => $this->company->id, 'name' => 'FUNC',
            'email' => 'func@teste.com', 'password' => 'Senha@12345',
            'first_access_at' => now(),
        ]);

        $this->post(route('users.reset-password', $func), ['mode' => 'first_access'])
            ->assertRedirect();

        $func->refresh();

        $this->assertNull($func->password);
        $this->assertNull($func->first_access_at);
        $this->assertNotNull($func->first_access_expires_at);

        fwrite(STDERR, "usuarios: reset 'primeiro acesso' zera a senha e reabre o prazo\n");
    }

    public function test_reset_manual_define_a_senha(): void
    {
        $this->actingAsCompany($this->company);

        $func = User::create([
            'company_id' => $this->company->id, 'name' => 'FUNC',
            'email' => 'func2@teste.com', 'password' => 'Senha@12345',
        ]);

        $this->post(route('users.reset-password', $func), [
            'mode'                  => 'manual',
            'password'              => 'NovaSenha@123',
            'password_confirmation' => 'NovaSenha@123',
        ])->assertRedirect();

        $this->assertTrue(Hash::check('NovaSenha@123', $func->fresh()->password));

        fwrite(STDERR, "usuarios: reset manual grava a senha escolhida pelo dono\n");
    }

    public function test_excluir_libera_o_email_para_novo_cadastro(): void
    {
        $this->actingAsCompany($this->company);

        $func = User::create([
            'company_id' => $this->company->id, 'name' => 'FUNC',
            'email' => 'reaproveitar@teste.com', 'password' => 'Senha@12345',
        ]);

        $this->delete(route('users.destroy', $func))->assertRedirect();

        $this->assertSoftDeleted('users', ['id' => $func->id]);

        // O e-mail precisa voltar a ficar livre, senão recadastrar a mesma
        // pessoa falharia por causa do índice único.
        $this->post(route('users.store'), [
            'name' => 'FUNC DE NOVO', 'email' => 'reaproveitar@teste.com',
        ])->assertSessionHasNoErrors();

        $this->assertSame(
            'FUNC DE NOVO',
            User::where('email', 'reaproveitar@teste.com')->value('name')
        );

        fwrite(STDERR, "usuarios: excluir libera o e-mail para recadastro\n");
    }

    public function test_desativar_bloqueia_o_acesso(): void
    {
        $this->actingAsCompany($this->company);

        $func = User::create([
            'company_id' => $this->company->id, 'name' => 'FUNC',
            'email' => 'func3@teste.com', 'password' => 'Senha@12345',
            'permissions' => ['orders' => ['view']],
        ]);

        $this->patch(route('users.toggle-status', $func))->assertRedirect();

        $this->assertFalse($func->fresh()->is_active);

        $this->actingAs($func->fresh());
        $this->get(route('orders.index'))->assertRedirect(route('login'));

        fwrite(STDERR, "usuarios: desativado não entra mais\n");
    }
}
