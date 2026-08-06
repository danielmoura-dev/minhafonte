<?php

namespace Tests\Feature\Architecture;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Rede de segurança do escopo por empresa.
 *
 * Todo dado é filtrado por `company_id`, e `App\Support\Tenant` é o único
 * lugar autorizado a resolver esse id. Um `Auth::id()` solto em código de
 * tenancy é perigoso: quando o guard passar a autenticar usuários da empresa
 * (e não a empresa em si), ele vira silenciosamente uma leitura de OUTRA
 * empresa — sem erro, sem exceção, sem teste vermelho.
 */
class TenancyGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_nenhum_auth_id_cru_fora_do_tenant(): void
    {
        $offenders = collect(File::allFiles(app_path()))
            ->reject(fn ($file) => str_ends_with($file->getRelativePathname(), 'Support' . DIRECTORY_SEPARATOR . 'Tenant.php'))
            ->filter(fn ($file) => preg_match('/Auth::id\(\)|auth\(\)->id\(\)/', $file->getContents()))
            ->map(fn ($file) => 'app/' . str_replace('\\', '/', $file->getRelativePathname()))
            ->values()
            ->all();

        $this->assertSame(
            [],
            $offenders,
            "Use App\\Support\\Tenant::id() para escopo por empresa.\nArquivos:\n" . implode("\n", $offenders)
        );

        fwrite(STDERR, "\ntenancy: nenhum Auth::id() cru em app/ (só dentro de Tenant)\n");
    }

    public function test_tenant_resolve_a_empresa_do_usuario_logado(): void
    {
        $company = \App\Models\Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste Ltda', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        $this->assertNull(\App\Support\Tenant::id());

        $this->actingAsCompany($company);

        // O id do usuário NÃO é o da empresa — é justamente essa distinção
        // que o Tenant existe para resolver.
        $this->assertNotSame($company->id, $this->actingUser->id);

        $this->assertSame($company->id, \App\Support\Tenant::id());
        $this->assertSame($company->id, \App\Support\Tenant::company()?->id);
        $this->assertSame($this->actingUser->id, \App\Support\Tenant::user()?->id);

        // A auditoria passa a registrar QUEM agiu, não mais a empresa.
        $this->assertSame($this->actingUser->name, \App\Support\Tenant::actorName());

        fwrite(STDERR, "tenancy: Tenant resolve a empresa a partir do usuário (ids diferentes)\n");
    }

    /**
     * Toda rota autenticada precisa declarar o módulo que exige. Uma rota sem
     * gate é um endpoint aberto a qualquer usuário, por mais restrito que ele
     * seja — e é fácil esquecer ao adicionar uma rota nova.
     */
    public function test_toda_rota_autenticada_tem_gate(): void
    {
        // Rotas que não pertencem a módulo nenhum: encerrar a sessão, tratar
        // verificação de e-mail e a tela de "sem acesso" precisam funcionar
        // para qualquer usuário logado.
        $semGate = [
            'logout',
            'sem-acesso',
            'verification.notice',
            'verification.verify',
            'verification.send',
        ];

        $desprotegidas = collect(\Illuminate\Support\Facades\Route::getRoutes())
            ->filter(fn ($route) => in_array('auth', $route->gatherMiddleware(), true))
            ->reject(fn ($route) => in_array($route->getName(), $semGate, true))
            ->reject(fn ($route) => collect($route->gatherMiddleware())->contains(
                fn ($m) => is_string($m) && (str_starts_with($m, 'module:') || $m === 'owner')
            ))
            ->map(fn ($route) => $route->getName() ?? $route->uri())
            ->values()
            ->all();

        $this->assertSame(
            [],
            $desprotegidas,
            "Rotas autenticadas sem `module:`/`owner`:\n" . implode("\n", $desprotegidas)
        );

        fwrite(STDERR, "rotas: toda rota autenticada declara módulo/ação\n");
    }

    public function test_guard_web_autentica_usuario_e_nao_empresa(): void
    {
        $company = \App\Models\Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste', 'cnpj' => '2',
            'email' => 't2@e.com', 'password' => bcrypt('x'),
        ]);

        $this->actingAsCompany($company);

        $this->assertInstanceOf(\App\Models\User::class, auth('web')->user());

        fwrite(STDERR, "tenancy: guard web autentica App\\Models\\User\n");
    }
}
