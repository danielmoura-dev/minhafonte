<?php

namespace App\Http\Middleware\Seller;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfSellerAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth('seller')->check()) {
            return redirect()->route('seller.dashboard');
        }

        return $next($request);
    }
}