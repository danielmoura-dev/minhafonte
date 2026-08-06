<?php

namespace App\Policies;

/** Acesso ao módulo de contas bancárias. */
class BankAccountPolicy extends ModulePolicy
{
    protected function module(): string
    {
        return 'bank_accounts';
    }
}
