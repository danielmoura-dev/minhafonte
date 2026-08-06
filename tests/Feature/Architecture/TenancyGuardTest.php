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

    public function test_tenant_resolve_a_empresa_autenticada(): void
    {
        $company = \App\Models\Company::create([
            'company_name' => 'Teste', 'fantasy_name' => 'Teste Ltda', 'cnpj' => '1',
            'email' => 't@e.com', 'password' => bcrypt('x'),
        ]);

        $this->assertNull(\App\Support\Tenant::id());

        $this->actingAs($company);

        $this->assertSame($company->id, \App\Support\Tenant::id());
        $this->assertSame($company->id, \App\Support\Tenant::company()?->id);
        $this->assertSame('TESTE LTDA', \App\Support\Tenant::actorName());

        fwrite(STDERR, "tenancy: Tenant::id()/company()/actorName() resolvem a empresa logada\n");
    }
}
