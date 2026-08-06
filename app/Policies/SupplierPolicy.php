<?php

namespace App\Policies;

/** Acesso ao módulo de fornecedores. */
class SupplierPolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'suppliers';
    }
}
