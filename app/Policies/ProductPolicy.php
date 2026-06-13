<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\Product;

class ProductPolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function view(Company $company, Product $product): bool
    {
        return $product->company_id === $company->id;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, Product $product): bool
    {
        return $product->company_id === $company->id;
    }

    public function delete(Company $company, Product $product): bool
    {
        return $product->company_id === $company->id;
    }
}