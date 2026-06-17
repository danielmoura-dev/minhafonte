<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SellerFabricaController extends Controller
{
    public function index(): Response
    {
        $seller = auth('seller')->user();

        $sales = $seller->sales()
            ->with('product')
            ->orderByDesc('sale_date')
            ->get();

        return Inertia::render('Seller/Fabrica', [
            'seller' => $seller->load('company'),
            'sales'  => $sales,
        ]);
    }
}
