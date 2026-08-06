<?php

namespace Tests\Feature\Users;

use App\Models\Company;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * O JSON de permissões vem da tela, então nunca é gravado cru: `sanitize()`
 * descarta o que não existe e garante que quem edita também consegue ver.
 */
class PermissionsTest extends TestCase
{
    use RefreshDatabase;

    private function user(?array $permissions, bool $owner = false, bool $active = true): User
    {
        $company = Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => uniqid(),
            'email' => uniqid() . '@teste.com', 'password' => 'Senha@12345',
        ]);

        return User::create([
            'company_id'  => $company->id,
            'name'        => 'FULANO',
            'email'       => uniqid() . '@teste.com',
            'password'    => 'Senha@12345',
            'permissions' => $permissions,
            'is_owner'    => $owner,
            'is_active'   => $active,
        ]);
    }

    public function test_sanitize_descarta_modulo_e_acao_inexistentes(): void
    {
        $clean = Permissions::sanitize([
            'orders'        => ['view', 'create', 'voar'],   // ação inventada
            'modulo_falso'  => ['view'],                     // módulo inventado
            'receivables'   => ['delete'],                   // ação não existe nesse módulo
            'products'      => 'texto',                      // formato errado
        ]);

        $this->assertSame(['view', 'create'], $clean['orders']);
        $this->assertArrayNotHasKey('modulo_falso', $clean);
        $this->assertArrayNotHasKey('receivables', $clean);
        $this->assertArrayNotHasKey('products', $clean);

        fwrite(STDERR, "\npermissoes: sanitize descarta módulo/ação inexistente\n");
    }

    public function test_sanitize_implica_view(): void
    {
        $clean = Permissions::sanitize(['orders' => ['create', 'edit']]);

        $this->assertSame(['view', 'create', 'edit'], $clean['orders']);

        fwrite(STDERR, "permissoes: quem cria/edita também recebe 'view'\n");
    }

    public function test_sanitize_nunca_concede_gerenciar_usuarios(): void
    {
        // 'users' não está no catálogo justamente para não ser concedível.
        $this->assertSame([], Permissions::sanitize(['users' => ['view', 'create']]));
        $this->assertFalse(Permissions::exists('users'));

        fwrite(STDERR, "permissoes: 'users' não é concedível por payload\n");
    }

    public function test_has_permission_respeita_o_json(): void
    {
        $user = $this->user(['orders' => ['view', 'create']]);

        $this->assertTrue($user->hasPermission('orders', 'view'));
        $this->assertTrue($user->hasPermission('orders', 'create'));
        $this->assertFalse($user->hasPermission('orders', 'delete'));
        $this->assertFalse($user->hasPermission('products', 'view'));

        $this->assertTrue($user->hasModule('orders'));
        $this->assertFalse($user->hasModule('products'));

        fwrite(STDERR, "permissoes: usuário só passa nas ações que estão no JSON\n");
    }

    public function test_dono_passa_em_tudo_e_inativo_em_nada(): void
    {
        $dono = $this->user(null, owner: true);

        foreach (Permissions::moduleKeys() as $module) {
            $this->assertTrue($dono->hasPermission($module, 'view'), "dono deveria ver {$module}");
        }
        $this->assertTrue($dono->hasPermission('orders', 'delete'));

        // Desativado perde tudo, inclusive sendo dono.
        $inativo = $this->user(['orders' => ['view']], active: false);
        $this->assertFalse($inativo->hasPermission('orders', 'view'));

        $donoInativo = $this->user(null, owner: true, active: false);
        $this->assertFalse($donoInativo->hasPermission('orders', 'view'));

        fwrite(STDERR, "permissoes: dono passa em tudo; desativado (mesmo dono) não passa em nada\n");
    }

    public function test_home_route_leva_ao_primeiro_modulo_permitido(): void
    {
        $this->assertStringContainsString('/dashboard', $this->user(null, owner: true)->homeRoute());
        $this->assertStringContainsString('/pedidos', $this->user(['orders' => ['view']])->homeRoute());
        $this->assertStringContainsString('/produtos', $this->user(['products' => ['view']])->homeRoute());
        $this->assertStringContainsString('/sem-acesso', $this->user([])->homeRoute());

        fwrite(STDERR, "permissoes: homeRoute cai no 1º módulo liberado (ou /sem-acesso)\n");
    }
}
