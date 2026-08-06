<?php

namespace App\Policies;

/** Acesso ao módulo de vendedores. */
class SellerPolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'sellers';
    }
}
