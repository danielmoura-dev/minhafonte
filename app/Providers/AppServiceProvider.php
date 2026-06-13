<?php

namespace App\Providers;

use App\Models\Product;
use App\Models\Seller;
use App\Policies\ProductPolicy;
use App\Policies\SellerPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Seller::class, SellerPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
    }
}