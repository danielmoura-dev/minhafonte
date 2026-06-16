<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Seller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = Auth::id();
        $period    = $request->get('period', 'month');
        $month     = $request->get('month', now()->format('Y-m'));

        $salesQuery = Sale::fromCompany($companyId)->with(['seller', 'product']);

        if ($period === 'month' && preg_match('/^\d{4}-\d{2}$/', $month)) {
            [$year, $mon] = explode('-', $month);
            $salesQuery->whereYear('sale_date', $year)->whereMonth('sale_date', $mon);
        }

        $sales = $salesQuery->get();

        $topProducts = $sales->groupBy('product_id')->map(fn ($g) => [
            'name'     => $g->first()->product?->name ?? 'Produto removido',
            'quantity' => $g->sum('quantity'),
            'total'    => $g->sum('total'),
        ])->sortByDesc('total')->values()->take(8);

        $topSellers = $sales->groupBy('seller_id')->map(fn ($g) => [
            'name'        => $g->first()->seller?->name ?? 'Vendedor removido',
            'sales_count' => $g->count(),
            'total'       => $g->sum('total'),
            'commission'  => $g->sum('commission_total'),
        ])->sortByDesc('total')->values()->take(8);

        $byCity = $sales->groupBy(fn ($s) => $s->seller?->city ?? 'Não informada')
            ->map(fn ($g, $city) => [
                'city'  => $city,
                'count' => $g->count(),
                'total' => $g->sum('total'),
            ])->sortByDesc('total')->values()->take(8);

        $sellers = Seller::fromCompany($companyId)->get();

        return Inertia::render('Dashboard/Index', [
            'period' => $period,
            'month'  => $month,
            'kpis'   => [
                'total_sold'         => $sales->sum('total'),
                'total_received'     => $sales->where('payment_received', true)->sum('total'),
                'total_pending'      => $sales->where('payment_received', false)->sum('total'),
                'sales_count'        => $sales->count(),
                'commission_total'   => $sales->sum('commission_total'),
                'commission_paid'    => $sales->where('commission_paid', true)->sum('commission_total'),
                'commission_pending' => $sales->where('commission_paid', false)->filter(fn ($s) => $s->commission_total > 0)->sum('commission_total'),
            ],
            'topProducts'   => $topProducts,
            'topSellers'    => $topSellers,
            'byCity'        => $byCity,
            'totalSellers'  => $sellers->count(),
            'birthdayToday' => $sellers->filter(fn ($s) => $s->isBirthdayToday())->values(),
        ]);
    }
}
