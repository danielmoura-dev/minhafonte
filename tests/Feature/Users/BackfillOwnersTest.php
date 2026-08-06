<?php

namespace Tests\Feature\Users;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * O backfill roda contra o banco de produção, então precisa ser previsível:
 * cria um dono por empresa copiando o MESMO hash de senha (para ninguém
 * perder o login), é idempotente e nunca sobrescreve conta de outra empresa.
 */
class BackfillOwnersTest extends TestCase
{
    use RefreshDatabase;

    private function company(array $overrides = []): Company
    {
        static $n = 0;
        $n++;

        return Company::create(array_merge([
            'company_name' => "Empresa {$n}",
            'fantasy_name' => "Fantasia {$n}",
            'cnpj'         => (string) $n,
            'email'        => "empresa{$n}@teste.com",
            'password'     => Hash::make('Senha@12345'),
        ], $overrides));
    }

    public function test_cria_um_dono_por_empresa_preservando_a_senha(): void
    {
        $a = $this->company();
        $b = $this->company();

        $this->artisan('users:backfill-owners')->assertSuccessful();

        $this->assertSame(2, User::count());

        $owner = User::where('email', $a->email)->first();

        $this->assertTrue($owner->is_owner);
        $this->assertTrue($owner->is_active);
        $this->assertSame($a->id, $owner->company_id);
        // Hash copiado como está: a senha antiga continua valendo.
        $this->assertSame($a->password, $owner->password);
        $this->assertTrue(Hash::check('Senha@12345', $owner->password));

        $this->assertSame($b->id, User::where('email', $b->email)->value('company_id'));

        fwrite(STDERR, "\nbackfill: 1 dono por empresa, com o hash de senha preservado\n");
    }

    public function test_rodar_duas_vezes_nao_duplica(): void
    {
        $this->company();
        $this->company();

        $this->artisan('users:backfill-owners')->assertSuccessful();
        $this->artisan('users:backfill-owners')->assertSuccessful();

        $this->assertSame(2, User::count());

        fwrite(STDERR, "backfill: idempotente (rodou 2x, continua com 2 usuários)\n");
    }

    public function test_dry_run_nao_grava_nada(): void
    {
        $this->company();

        $this->artisan('users:backfill-owners', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, User::count());

        fwrite(STDERR, "backfill: --dry-run não grava\n");
    }

    public function test_ignora_empresa_excluida(): void
    {
        $this->company();
        $excluida = $this->company();
        $excluida->delete();

        $this->artisan('users:backfill-owners')->assertSuccessful();

        $this->assertSame(1, User::count());
        $this->assertNull(User::where('email', $excluida->email)->first());

        fwrite(STDERR, "backfill: empresa excluída fica de fora\n");
    }

    public function test_nao_sobrescreve_usuario_de_outra_empresa(): void
    {
        $dona = $this->company();
        $outra = $this->company(['email' => 'compartilhado@teste.com']);

        // Um usuário de OUTRA empresa já ocupa esse e-mail.
        User::create([
            'company_id' => $dona->id,
            'name'       => 'JA EXISTE',
            'email'      => 'compartilhado@teste.com',
            'password'   => 'Senha@12345',
        ]);

        $this->artisan('users:backfill-owners')->assertSuccessful();

        $intruso = User::where('email', 'compartilhado@teste.com')->first();

        // Continua pertencendo à empresa original, sem virar dono da outra.
        $this->assertSame($dona->id, $intruso->company_id);
        $this->assertFalse($intruso->is_owner);
        $this->assertNull(User::where('company_id', $outra->id)->first());

        fwrite(STDERR, "backfill: e-mail já usado por outra empresa é reportado, não sobrescrito\n");
    }
}
