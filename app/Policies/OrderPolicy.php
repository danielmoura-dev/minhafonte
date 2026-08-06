<?php

namespace App\Policies;

/** Acesso ao módulo de vendas (pedidos). */
class OrderPolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'orders';
    }
}
