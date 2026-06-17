<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SellerDashboardController extends Controller
{
    public function index(): Response
    {
        $seller = auth('seller')->user();

        $sales = $seller->clientSales()
            ->with('client')
            ->orderByDesc('sale_date')
            ->get();

        $summary = [
            'total'           => $sales->sum('amount'),
            'received'        => $sales->where('payment_received', true)->sum('amount'),
            'pending'         => $sales->where('payment_received', false)->sum('amount'),
            'clients_active'  => $seller->clients()->where('is_active', true)->count(),
        ];

        $recentSales = $sales->take(5);

        return Inertia::render('Seller/Dashboard', [
            'seller'      => $seller->load('company'),
            'summary'     => $summary,
            'recentSales' => $recentSales,
        ]);
    }
}
