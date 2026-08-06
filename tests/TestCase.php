<?php

namespace Tests;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Usuário criado pelo último actingAsCompany(). */
    protected ?User $actingUser = null;
    /**
     * Trava de segurança: se a config estiver cacheada (bootstrap/cache/config.php),
     * o Laravel ignora o phpunit.xml e os testes acabam rodando no banco REAL —
     * o que apagaria os dados de desenvolvimento ao usar RefreshDatabase.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $database = config('database.connections.' . config('database.default') . '.database');

        if ($database !== ':memory:' && ! str_contains((string) $database, 'testing')) {
            $this->fail(
                "Testes abortados: o banco de testes é \"{$database}\" e não o esperado \":memory:\".\n" .
                "Rode `php artisan config:clear` (config cacheada ignora o phpunit.xml) antes de testar."
            );
        }
    }

    /**
     * Autentica como um usuário da empresa.
     *
     * Sem `$permissions`, cria o dono (que ignora permissões) — é o
     * equivalente ao comportamento antigo, quando a própria empresa logava.
     * Passe um array para simular um funcionário com acesso restrito.
     *
     * Retorna `$this` para permitir `->get()` / `->post()` encadeados.
     */
    protected function actingAsCompany(Company $company, ?array $permissions = null): static
    {
        $isOwner = $permissions === null;

        // Deslocamento proposital: o id do usuário NUNCA coincide com o da
        // empresa. Assim, um `Auth::id()` esquecido em código de escopo quebra
        // o teste em vez de passar por coincidência.
        $id    = $company->id + 1000 + ($isOwner ? 0 : 500);
        $email = $isOwner ? $company->email : "func{$id}@teste.local";

        // Reaproveita o usuário quando o teste autentica duas vezes ou já
        // criou a conta na mão (senão bateria no índice único do e-mail).
        $user = User::withTrashed()->find($id)
            ?? User::withTrashed()->where('email', $email)->first();

        $attributes = [
            'company_id'        => $company->id,
            'name'              => $company->fantasy_name ?: 'USUARIO TESTE',
            'email'             => $email,
            'password'          => 'Senha@12345',
            'permissions'       => $permissions,
            'is_owner'          => $isOwner,
            'is_active'         => true,
            'email_verified_at' => now(),
            'deleted_at'        => null,
        ];

        if (! $user) {
            $user = new User();
            $attributes['id'] = $id;   // só define o id ao criar
        }

        $user->forceFill($attributes)->save();

        $this->actingUser = $user;
        $this->actingAs($user);

        return $this;
    }
}
