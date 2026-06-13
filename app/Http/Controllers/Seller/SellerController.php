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

    public function show(Seller $seller): Response
    {
        $this->authorize('view', $seller);

        $seller->load([]);

        return Inertia::render('Sellers/Show', [
            'seller' => $seller,
            'summary' => [
                'total_sold'       => 0,
                'total_received'   => 0,
                'total_pending'    => 0,
                'total_commission' => 0,
            ],
            'sales'       => [],
            'commissions' => [],
            'payments'    => [],
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