<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreSellerRequest;
use App\Http\Requests\Seller\UpdateSellerRequest;
use App\Models\Seller;
use App\Services\AuditService;
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
            ->withCount('sales')
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

        $payments = $sales
            ->where('payment_received', true)
            ->values();

        return Inertia::render('Sellers/Show', [
            'seller'  => $seller,
            'summary' => [
                'total_sold'       => $sales->sum('total'),
                'total_received'   => $sales->where('payment_received', true)->sum('total'),
                'total_pending'    => $sales->where('payment_received', false)->sum('total'),
                'total_commission' => $sales->sum('commission_total'),
            ],
            'sales'       => $sales,
            'commissions' => $commissions,
            'payments'    => $payments,
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
}