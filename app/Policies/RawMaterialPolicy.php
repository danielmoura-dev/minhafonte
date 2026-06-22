<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\RawMaterial;

class RawMaterialPolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function view(Company $company, RawMaterial $rawMaterial): bool
    {
        return $rawMaterial->company_id === $company->id;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, RawMaterial $rawMaterial): bool
    {
        return $rawMaterial->company_id === $company->id;
    }

    public function delete(Company $company, RawMaterial $rawMaterial): bool
    {
        return $rawMaterial->company_id === $company->id;
    }
}
