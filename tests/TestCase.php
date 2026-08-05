<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
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
}
