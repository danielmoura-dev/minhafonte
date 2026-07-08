<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\Customer;

class CustomerPolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function view(Company $company, Customer $customer): bool
    {
        return $customer->company_id === $company->id;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, Customer $customer): bool
    {
        return $customer->company_id === $company->id;
    }

    public function delete(Company $company, Customer $customer): bool
    {
        return $customer->company_id === $company->id;
    }
}
