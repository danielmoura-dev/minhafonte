<?php

namespace App\Policies;

use App\Models\BankAccount;
use App\Models\Company;

class BankAccountPolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, BankAccount $bankAccount): bool
    {
        return $bankAccount->company_id === $company->id;
    }

    public function delete(Company $company, BankAccount $bankAccount): bool
    {
        return $bankAccount->company_id === $company->id;
    }
}
