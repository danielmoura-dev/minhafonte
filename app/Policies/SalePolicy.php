<?php

namespace App\Policies;

/** Acesso ao módulo de vendas por comissão. */
class SalePolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'commission_sales';
    }
}
