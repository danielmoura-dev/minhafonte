<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\Order;

class OrderPolicy
{
    public function viewAny(Company $company): bool
    {
        return true;
    }

    public function view(Company $company, Order $order): bool
    {
        return $order->company_id === $company->id;
    }

    public function create(Company $company): bool
    {
        return true;
    }

    public function update(Company $company, Order $order): bool
    {
        return $order->company_id === $company->id;
    }

    public function delete(Company $company, Order $order): bool
    {
        return $order->company_id === $company->id;
    }
}
