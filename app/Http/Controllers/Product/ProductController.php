<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::fromCompany(Auth::id())
            ->withCount('sales')
            ->when($request->search, fn ($q, $s) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%")
            )
            ->when($request->filled('status'), fn ($q) =>
                $q->where('active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $allProducts = Product::fromCompany(Auth::id())
            ->withCount('sales')
            ->withSum('sales', 'total')
            ->withSum('sales', 'quantity')
            ->withSum('sales', 'commission_total')
            ->get(['id', 'name', 'code', 'active']);

        $grandTotal = (float) $allProducts->sum('sales_sum_total');

        $productIndicators = $allProducts
            ->sortByDesc(fn ($p) => (float) ($p->sales_sum_total ?? 0))
            ->map(fn ($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'code'        => $p->code,
                'active'      => $p->active,
                'sales_count' => $p->sales_count,
                'quantity'    => (int) ($p->sales_sum_quantity ?? 0),
                'total'       => (float) ($p->sales_sum_total ?? 0),
                'commissions' => (float) ($p->sales_sum_commission_total ?? 0),
                'percentage'  => $grandTotal > 0
                    ? round((float) ($p->sales_sum_total ?? 0) / $grandTotal * 100, 1)
                    : 0,
            ])
            ->values();

        return Inertia::render('Products/Index', [
            'products'          => $products,
            'filters'           => $request->only('search', 'status'),
            'productIndicators' => $productIndicators,
            'grandTotal'        => $grandTotal,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('Products/Create');
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->authorize('create', Product::class);

        $data = $request->validated();
        $data['company_id'] = Auth::id();

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('products/photos', 'public');
        }

        Product::create($data);

        return redirect()
            ->route('products.index')
            ->with('success', 'Produto cadastrado com sucesso!');
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        return Inertia::render('Products/Edit', [
            'product' => $product,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $data = $request->validated();
        unset($data['photo']);

        if ($request->hasFile('photo')) {
            if ($product->photo) {
                Storage::disk('public')->delete($product->photo);
            }
            $data['photo'] = $request->file('photo')->store('products/photos', 'public');
        }

        $product->update($data);

        return redirect()
            ->route('products.index')
            ->with('success', 'Produto atualizado com sucesso!');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        if ($product->sales()->exists()) {
            return redirect()
                ->route('products.index')
                ->with('error', "O produto \"{$product->name}\" possui vendas registradas e não pode ser excluído. Use a opção de inativar.");
        }

        if ($product->photo) {
            Storage::disk('public')->delete($product->photo);
        }

        $product->delete();

        return redirect()
            ->route('products.index')
            ->with('success', 'Produto removido com sucesso!');
    }

    public function toggleStatus(Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $product->update(['active' => ! $product->active]);

        $status = $product->active ? 'ativado' : 'inativado';

        return back()->with('success', "Produto {$status} com sucesso!");
    }
}