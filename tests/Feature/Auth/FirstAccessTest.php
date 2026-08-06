<?php

namespace Tests\Feature\Auth;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * O primeiro acesso é identificado só pelo e-mail, então precisa ser
 * rigoroso: quem já tem senha, está desativado ou passou do prazo não
 * consegue reivindicar a conta — e a mensagem é sempre a mesma, para não
 * revelar quais e-mails existem.
 */
class FirstAccessTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'company_name' => 'Zilumina', 'fantasy_name' => 'Zilumina', 'cnpj' => '1',
            'email' => 'empresa@teste.com', 'password' => Hash::make('Senha@12345'),
        ]);
    }

    private function pending(array $overrides = []): User
    {
        return User::create(array_merge([
            'company_id'              => $this->company->id,
            'name'                    => 'FUNCIONARIO',
            'email'                   => 'func@teste.com',
            'password'                => null,
            'permissions'             => ['orders' => ['view']],
            'is_active'               => true,
            'first_access_expires_at' => now()->addDays(7),
        ], $overrides));
    }

    private function submit(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->post(route('first-access.store'), array_merge([
            'email'                 => 'func@teste.com',
            'password'              => 'Senha@12345',
            'password_confirmation' => 'Senha@12345',
        ], $overrides));
    }

    public function test_define_a_senha_e_entra(): void
    {
        $user = $this->pending();

        $this->submit()->assertRedirect(route('orders.index'));

        $user->refresh();

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->password);
        $this->assertTrue(Hash::check('Senha@12345', $user->password));
        $this->assertNotNull($user->first_access_at);
        $this->assertNull($user->first_access_expires_at);

        fwrite(STDERR, "\n1o acesso: senha definida, prazo encerrado e usuário autenticado\n");
    }

    public function test_quem_ja_tem_senha_e_recusado(): void
    {
        $this->pending(['password' => 'Senha@12345', 'first_access_at' => now()]);

        $this->submit(['password' => 'Nova@123456', 'password_confirmation' => 'Nova@123456'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();

        fwrite(STDERR, "1o acesso: conta que já tem senha não pode ser reivindicada\n");
    }

    public function test_prazo_vencido_e_recusado(): void
    {
        $this->pending(['first_access_expires_at' => now()->subDay()]);

        $this->submit()->assertSessionHasErrors('email');
        $this->assertGuest();

        fwrite(STDERR, "1o acesso: prazo vencido é recusado\n");
    }

    public function test_usuario_desativado_e_recusado(): void
    {
        $this->pending(['is_active' => false]);

        $this->submit()->assertSessionHasErrors('email');
        $this->assertGuest();

        fwrite(STDERR, "1o acesso: usuário desativado é recusado\n");
    }

    public function test_email_inexistente_recebe_a_mesma_mensagem(): void
    {
        $this->pending();

        $this->submit(['email' => 'ninguem@teste.com'])->assertSessionHasErrors('email');

        $this->assertSame(
            'Não foi possível concluir o primeiro acesso. Fale com o administrador da conta.',
            session('errors')->first('email')
        );

        fwrite(STDERR, "1o acesso: e-mail inexistente recebe mensagem genérica\n");
    }

    public function test_senha_fraca_e_sem_confirmacao_sao_barradas(): void
    {
        $this->pending();

        $this->submit(['password' => '123', 'password_confirmation' => '123'])
            ->assertSessionHasErrors('password');

        $this->submit(['password_confirmation' => 'Outra@12345'])
            ->assertSessionHasErrors('password');

        $this->assertGuest();
        $this->assertNull(User::where('email', 'func@teste.com')->value('password'));

        fwrite(STDERR, "1o acesso: senha fraca e confirmação divergente são barradas\n");
    }

    public function test_email_e_unico_entre_empresas(): void
    {
        $this->pending();

        $outra = Company::create([
            'company_name' => 'Outra', 'fantasy_name' => 'Outra', 'cnpj' => '2',
            'email' => 'outra@teste.com', 'password' => Hash::make('Senha@12345'),
        ]);

        // É o índice único global que torna "e-mail -> conta" inequívoco e
        // impede reivindicar o cadastro de outra empresa.
        $this->expectException(\Illuminate\Database\QueryException::class);

        User::create([
            'company_id' => $outra->id,
            'name'       => 'HOMONIMO',
            'email'      => 'func@teste.com',
            'password'   => null,
        ]);
    }
}
