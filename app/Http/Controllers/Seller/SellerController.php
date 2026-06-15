<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreSellerRequest;
use App\Http\Requests\Seller\UpdateSellerRequest;
use App\Models\Seller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SellerController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Seller::class);

        $sellers = Seller::fromCompany(Auth::id())
            ->when($request->search, fn ($q, $s) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('city', 'like', "%{$s}%")
            )
            ->when($request->seller_type, fn ($q, $t) =>
                $q->where('seller_type', $t)
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sellers/Index', [
            'sellers' => $sellers,
            'filters' => $request->only('search', 'seller_type'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Seller::class);

        return Inertia::render('Sellers/Create');
    }

    public function store(StoreSellerRequest $request): RedirectResponse
    {
        $this->authorize('create', Seller::class);

        $data = $request->validated();
        $data['company_id'] = Auth::id();

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('sellers/photos', 'public');
        }

        Seller::create($data);

        return redirect()
            ->route('sellers.index')
            ->with('success', 'Vendedor cadastrado com sucesso!');
    }

    public function show(Request $request, Seller $seller): Response
    {
        $this->authorize('view', $seller);

        $period = $request->get('period', 'month');
        $month  = $request->get('month', now()->format('Y-m'));

        $query = \App\Models\Sale::where('seller_id', $seller->id)->with('product');

        if ($period === 'month' && preg_match('/^\d{4}-\d{2}$/', $month)) {
            [$year, $mon] = explode('-', $month);
            $query->whereYear('sale_date', $year)->whereMonth('sale_date', $mon);
        }

        $sales = $query->orderByDesc('sale_date')->get();

        $totalSold       = $sales->sum('total');
        $totalReceived   = $sales->where('payment_received', true)->sum('total');
        $totalPending    = $sales->where('payment_received', false)->sum('total');
        $totalCommission = $sales->sum('commission_total');

        $topProducts = $sales->groupBy('product_id')->map(fn ($g) => [
            'name'     => $g->first()->product?->name ?? 'Produto removido',
            'quantity' => $g->sum('quantity'),
            'total'    => $g->sum('total'),
        ])->sortByDesc('total')->values()->take(8);

        $commissions = $sales->filter(fn ($s) => $s->commission_total > 0)->values();
        $payments    = $sales->filter(fn ($s) => $s->payment_received)->values();

        return Inertia::render('Sellers/Show', [
            'seller'  => $seller,
            'period'  => $period,
            'month'   => $month,
            'summary' => [
                'total_sold'       => $totalSold,
                'total_received'   => $totalReceived,
                'total_pending'    => $totalPending,
                'total_commission' => $totalCommission,
            ],
            'sales'              => $sales,
            'commissions'        => $commissions,
            'payments'           => $payments,
            'topProducts'        => $topProducts,
            'hasPendingPayment'  => $sales->contains(fn ($s) => !$s->payment_received),
            'hasPendingCommission' => $commissions->contains(fn ($s) => !$s->commission_paid),
        ]);
    }

    public function edit(Seller $seller): Response
    {
        $this->authorize('update', $seller);

        return Inertia::render('Sellers/Edit', [
            'seller' => $seller,
        ]);
    }

    public function update(UpdateSellerRequest $request, Seller $seller): RedirectResponse
    {
        $this->authorize('update', $seller);

        $data = $request->validated();
        unset($data['photo']);

        if ($request->hasFile('photo')) {
            if ($seller->photo) {
                Storage::disk('public')->delete($seller->photo);
            }
            $data['photo'] = $request->file('photo')->store('sellers/photos', 'public');
        }

        $seller->update($data);

        return redirect()
            ->route('sellers.show', $seller)
            ->with('success', 'Vendedor atualizado com sucesso!');
    }

    public function destroy(Seller $seller): RedirectResponse
    {
        $this->authorize('delete', $seller);

        if ($seller->photo) {
            Storage::disk('public')->delete($seller->photo);
        }

        $seller->delete();

        return redirect()
            ->route('sellers.index')
            ->with('success', 'Vendedor removido com sucesso!');
    }
}