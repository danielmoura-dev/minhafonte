<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SellerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $seller = auth('seller')->user();

        $sales = $seller->sales()
            ->with('product')
            ->orderByDesc('sale_date')
            ->get();

        $summary = [
            'total_sold'       => $sales->sum('total'),
            'total_received'   => $sales->where('payment_received', true)->sum('total'),
            'total_pending'    => $sales->where('payment_received', false)->sum('total'),
            'total_commission' => $sales->sum('commission_total'),
        ];

        $pendingSales = $sales->where('payment_received', false)->values();

        return Inertia::render('Seller/Dashboard', [
            'seller'       => $seller->load('company'),
            'summary'      => $summary,
            'sales'        => $sales,
            'pendingSales' => $pendingSales,
        ]);
    }
}