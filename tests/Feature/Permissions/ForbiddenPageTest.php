<?php

namespace Tests\Feature\Permissions;

use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Quando alguém perde uma permissão, o 403 precisa ser uma tela do sistema —
 * com menu e caminho de volta — e não a página crua do Laravel.
 *
 * O caso que quebrou: digitar a URL direto não manda o cabeçalho X-Inertia,
 * então o tratamento de erro era pulado e sobrava um "Forbidden" seco.
 */
class ForbiddenPageTest extends TestCase
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

    public function test_403_ao_digitar_a_url_mostra_a_tela_do_sistema(): void
    {
        $this->actingAsCompany($this->company, ['orders' => ['view']]);

        // Sem X-Inertia: é o que acontece ao digitar/colar a URL no navegador.
        $this->get(route('dashboard'))
            ->assertForbidden()
            ->assertInertia(fn ($page) => $page
                ->component('Error')
                ->where('status', 403)
                // O caminho de volta precisa ser uma página que ele abre —
                // mandar para o dashboard daria outro 403.
                ->where('home', route('orders.index'))
            );

        fwrite(STDERR, "\n403: URL direta renderiza a tela do sistema, com volta para /pedidos\n");
    }

    public function test_403_numa_navegacao_do_inertia_tambem(): void
    {
        $this->actingAsCompany($this->company, ['orders' => ['view']]);

        // A versão precisa bater, senão o Inertia devolve 409 (recarregar).
        $version = (new \App\Http\Middleware\HandleInertiaRequests())
            ->version(\Illuminate\Http\Request::create('/'));

        // Aqui a resposta é o JSON do Inertia (o assertInertia só lê página
        // inteira), então conferimos o componente direto no corpo.
        $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => (string) $version])
            ->get(route('products.index'))
            ->assertForbidden()
            ->assertHeader('X-Inertia', 'true')
            ->assertJsonPath('component', 'Error')
            ->assertJsonPath('props.status', 403);

        fwrite(STDERR, "403: navegação do Inertia também cai na tela do sistema\n");
    }

    public function test_usuario_sem_nenhum_modulo_vai_para_sem_acesso(): void
    {
        $this->actingAsCompany($this->company, []);

        $this->get(route('sem-acesso'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('NoAccess'));

        fwrite(STDERR, "403: quem não tem módulo nenhum tem a tela 'sem acesso'\n");
    }

    public function test_webhook_continua_recebendo_resposta_crua(): void
    {
        // A tela bonita é para o navegador; integração espera JSON.
        $this->postJson(route('webhooks.evolution'), [])
            ->assertForbidden()
            ->assertJson([]);

        fwrite(STDERR, "403: webhook segue com resposta padrão, sem HTML\n");
    }
}
