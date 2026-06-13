<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\Seller;

class SellerPolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function view(Company $company, Seller $seller): bool
    {
        return $seller->company_id === $company->id;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, Seller $seller): bool
    {
        return $seller->company_id === $company->id;
    }

    public function delete(Company $company, Seller $seller): bool
    {
        return $seller->company_id === $company->id;
    }
}