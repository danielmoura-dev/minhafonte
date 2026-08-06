<?php

namespace App\Policies;

/** Acesso ao módulo de clientes. */
class CustomerPolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'customers';
    }
}
