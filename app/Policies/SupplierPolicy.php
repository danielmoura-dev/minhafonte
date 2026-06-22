<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\Supplier;

class SupplierPolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function view(Company $company, Supplier $supplier): bool
    {
        return $supplier->company_id === $company->id;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, Supplier $supplier): bool
    {
        return $supplier->company_id === $company->id;
    }

    public function delete(Company $company, Supplier $supplier): bool
    {
        return $supplier->company_id === $company->id;
    }
}
