<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Seller;
use App\Support\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = Tenant::id();
        $period    = $request->get('period', 'month');
        $month     = $request->get('month', now()->format('Y-m'));

        $ordersQuery = Order::fromCompany($companyId)->with(['customer', 'items']);

        if ($period === 'month' && preg_match('/^\d{4}-\d{2}$/', $month)) {
            [$year, $mon] = explode('-', $month);
            $ordersQuery->whereYear('issue_date', $year)->whereMonth('issue_date', $mon);
        }

        $orders = $ordersQuery->get();

        $topProducts = $orders->flatMap(fn ($o) => $o->items)
            ->groupBy('product_name')
            ->map(fn ($g, $name) => [
                'name'     => $name,
                'quantity' => round((float) $g->sum('quantity'), 3),
                'total'    => round((float) $g->sum('subtotal'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(8);

        $topCustomers = $orders->groupBy('customer_id')
            ->map(fn ($g) => [
                'name'         => $g->first()->customer?->name ?? 'Cliente removido',
                'orders_count' => $g->count(),
                'total'        => round((float) $g->sum('total'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(8);

        $byCity = $orders
            ->groupBy(fn ($o) => $o->delivery_city ?: ($o->customer?->city ?: 'Não informada'))
            ->map(fn ($g, $city) => [
                'city'  => $city,
                'count' => $g->count(),
                'total' => round((float) $g->sum('total'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(8);

        $sellers = Seller::fromCompany($companyId)->get();

        return Inertia::render('Dashboard/Index', [
            'period' => $period,
            'month'  => $month,
            'kpis'   => [
                'total_sold'     => round((float) $orders->sum('total'), 2),
                'total_received' => round((float) $orders->sum('paid_total'), 2),
                'total_pending'  => round((float) $orders->sum(fn ($o) => (float) $o->total - (float) $o->paid_total), 2),
                'sales_count'    => $orders->count(),
            ],
            'topProducts'   => $topProducts,
            'topCustomers'  => $topCustomers,
            'byCity'        => $byCity,
            'birthdayToday' => $sellers->filter(fn ($s) => $s->isBirthdayToday())->values(),
        ]);
    }
}
