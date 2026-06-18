<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreSellerRequest;
use App\Http\Requests\Seller\UpdateSellerRequest;
use App\Models\Seller;
use App\Services\AuditService;
use Barryvdh\DomPDF\Facade\Pdf;
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
            ->withCount([
                'sales',
                'sales as pending_payments_count'     => fn ($q) => $q->where('payment_received', false),
                'sales as pending_commissions_count'  => fn ($q) => $q->where('commission_paid', false)
                                                                       ->whereNotNull('commission_total')
                                                                       ->where('commission_total', '>', 0),
            ])
            ->when($request->search, fn ($q, $s) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('city', 'like', "%{$s}%")
            )
            ->when($request->seller_type, fn ($q, $t) =>
                $q->where('seller_type', $t)
            )
            ->when($request->filled('status'), fn ($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sellers/Index', [
            'sellers' => $sellers,
            'filters' => $request->only('search', 'seller_type', 'status'),
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

        $seller = Seller::create($data);

        AuditService::log(
            event:       'seller.created',
            auditable:   $seller,
            newValues:   ['name' => $seller->name, 'email' => $seller->email],
            description: "Vendedor '{$seller->name}' cadastrado.",
        );

        return redirect()
            ->route('sellers.index')
            ->with('success', 'Vendedor cadastrado com sucesso!');
    }

    public function show(Seller $seller): Response
    {
        $this->authorize('view', $seller);

        $seller->loadCount('sales');

        $sales = \App\Models\Sale::where('seller_id', $seller->id)
            ->with('product')
            ->orderByDesc('sale_date')
            ->get();

        $commissions = $sales
            ->whereNotNull('commission_total')
            ->where('commission_total', '>', 0)
            ->values();

        $payments = $sales->values();

        $pendingPaymentsCount     = $sales->where('payment_received', false)->count();
        $pendingCommissionsCount  = $commissions->where('commission_paid', false)->count();

        $salesCount  = $sales->count();
        $totalSold   = $sales->sum('total');
        $itemsCount  = $sales->sum('quantity');

        $salesByProduct = $sales
            ->groupBy(fn ($s) => $s->product?->name ?? 'Produto removido')
            ->map(fn ($group, $name) => [
                'name'     => $name,
                'count'    => $group->count(),
                'quantity' => $group->sum('quantity'),
                'total'    => $group->sum('total'),
            ])
            ->sortByDesc('total')
            ->values();

        $commissionSales = $sales->where('commission_percentage', '>', 0);

        $indicators = [
            'sales_count'          => $salesCount,
            'items_count'          => $itemsCount,
            'average_ticket'       => $salesCount > 0 ? round($totalSold / $salesCount, 2) : 0,
            'highest_sale'         => $sales->max('total') ?? 0,
            'lowest_sale'          => $sales->min('total') ?? 0,
            'average_commission'   => $commissionSales->count() > 0
                                        ? round($commissionSales->avg('commission_percentage'), 1)
                                        : null,
            'sales_by_product'     => $salesByProduct,
        ];

        return Inertia::render('Sellers/Show', [
            'seller'  => $seller,
            'summary' => [
                'total_sold'       => $totalSold,
                'total_received'   => $sales->where('payment_received', true)->sum('total'),
                'total_pending'    => $sales->where('payment_received', false)->sum('total'),
                'total_commission' => $sales->sum('commission_total'),
            ],
            'sales'                   => $sales,
            'commissions'             => $commissions,
            'payments'                => $payments,
            'pendingPaymentsCount'    => $pendingPaymentsCount,
            'pendingCommissionsCount' => $pendingCommissionsCount,
            'indicators'              => $indicators,
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

        AuditService::log(
            event:       'seller.updated',
            auditable:   $seller,
            description: "Vendedor '{$seller->name}' atualizado.",
        );

        return redirect()
            ->route('sellers.show', $seller)
            ->with('success', 'Vendedor atualizado com sucesso!');
    }

    public function destroy(Seller $seller): RedirectResponse
    {
        $this->authorize('delete', $seller);

        if ($seller->sales()->exists()) {
            return redirect()
                ->route('sellers.index')
                ->with('error', "O vendedor \"{$seller->name}\" possui vendas registradas e não pode ser excluído. Use a opção de inativar.");
        }

        if ($seller->photo) {
            Storage::disk('public')->delete($seller->photo);
        }

        AuditService::log(
            event:       'seller.deleted',
            auditable:   $seller,
            description: "Vendedor '{$seller->name}' removido permanentemente.",
        );

        $seller->delete();

        return redirect()
            ->route('sellers.index')
            ->with('success', 'Vendedor removido com sucesso!');
    }

    public function toggleStatus(Seller $seller): RedirectResponse
    {
        $this->authorize('update', $seller);

        $seller->update(['is_active' => ! $seller->is_active]);

        $status = $seller->is_active ? 'ativado' : 'inativado';

        AuditService::log(
            event:       'seller.status_changed',
            auditable:   $seller,
            description: "Vendedor '{$seller->name}' {$status}.",
        );

        return back()->with('success', "Vendedor {$status} com sucesso!");
    }

    public function report(Request $request, Seller $seller)
    {
        $this->authorize('view', $seller);

        $dateFrom = $request->date_from;
        $dateTo   = $request->date_to;
        $sections = $request->sections ?? [];

        $query = \App\Models\Sale::where('seller_id', $seller->id)->with('product');

        if ($dateFrom) $query->where('sale_date', '>=', $dateFrom);
        if ($dateTo)   $query->where('sale_date', '<=', $dateTo);

        $sales = $query->orderBy('sale_date')->get();

        $paidCommissions    = $sales->where('commission_paid', true)->where('commission_total', '>', 0)->values();
        $pendingCommissions = $sales->where('commission_paid', false)->whereNotNull('commission_total')->where('commission_total', '>', 0)->values();
        $paidPayments       = $sales->where('payment_received', true)->values();
        $pendingPayments    = $sales->where('payment_received', false)->values();

        $pdf = Pdf::loadView('pdf.seller-report', [
            'seller'                 => $seller,
            'company'                => Auth::user(),
            'dateFrom'               => $dateFrom,
            'dateTo'                 => $dateTo,
            'sections'               => $sections,
            'sales'                  => $sales,
            'paidCommissions'        => $paidCommissions,
            'pendingCommissions'     => $pendingCommissions,
            'paidPayments'           => $paidPayments,
            'pendingPayments'        => $pendingPayments,
            'totalSold'              => $sales->sum('total'),
            'totalReceived'          => $sales->where('payment_received', true)->sum('total'),
            'totalPending'           => $sales->where('payment_received', false)->sum('total'),
            'totalCommissionPaid'    => $sales->where('commission_paid', true)->sum('commission_total'),
            'totalCommissionPending' => $sales->where('commission_paid', false)->whereNotNull('commission_total')->where('commission_total', '>', 0)->sum('commission_total'),
        ])->setPaper('a4', 'portrait');

        $filename = 'relatorio-' . \Illuminate\Support\Str::slug($seller->name) . '-' . now()->format('Y-m-d') . '.pdf';

        return $pdf->download($filename);
    }
}