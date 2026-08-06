<?php

namespace App\Policies;

/** Acesso ao módulo de produtos. */
class ProductPolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'products';
    }
}
