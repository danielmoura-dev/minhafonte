<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\Sale;

class SalePolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function view(Company $company, Sale $sale): bool
    {
        return $sale->company_id === $company->id;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, Sale $sale): bool
    {
        return $sale->company_id === $company->id;
    }

    public function delete(Company $company, Sale $sale): bool
    {
        return $sale->company_id === $company->id;
    }
}