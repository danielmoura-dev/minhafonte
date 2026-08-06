<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\OrderItem;
use App\Models\Product;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::fromCompany(Tenant::id())
            ->withCount('sales', 'movements', 'recipeItems')
            ->when($request->search, fn ($q, $s) =>
                $q->where(fn ($w) =>
                    $w->where('name', 'like', "%{$s}%")
                      ->orWhere('code', 'like', "%{$s}%")
                )
            )
            ->when($request->filled('status'), fn ($q) =>
                $q->where('active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Quantos produtos (no total) estão abaixo do mínimo
        $restockCount = Product::fromCompany(Tenant::id())
            ->where('active', true)
            ->where('controls_stock', true)
            ->whereColumn('current_stock', '<=', 'min_quantity')
            ->count();

        // Indicadores vêm das vendas a clientes (módulo Vendas), não mais das
        // vendas de comissão. whereHas('order') respeita o escopo por empresa
        // e exclui automaticamente itens de vendas excluídas (soft delete).
        $orderItemsByProduct = OrderItem::query()
            ->whereNotNull('product_id')
            ->whereHas('order', fn ($q) => $q->where('company_id', Tenant::id()))
            ->get(['product_id', 'quantity', 'subtotal'])
            ->groupBy('product_id');

        $allProducts = Product::fromCompany(Tenant::id())
            ->get(['id', 'name', 'code', 'active']);

        $grandTotal = (float) $orderItemsByProduct->flatten()->sum('subtotal');

        $productIndicators = $allProducts
            ->map(function ($p) use ($orderItemsByProduct, $grandTotal) {
                $items = $orderItemsByProduct->get($p->id, collect());
                $total = (float) $items->sum('subtotal');

                return [
                    'id'          => $p->id,
                    'name'        => $p->name,
                    'code'        => $p->code,
                    'active'      => $p->active,
                    'sales_count' => $items->count(),
                    'quantity'    => round((float) $items->sum('quantity'), 3),
                    'total'       => round($total, 2),
                    'percentage'  => $grandTotal > 0 ? round($total / $grandTotal * 100, 1) : 0,
                ];
            })
            ->sortByDesc('total')
            ->values();

        return Inertia::render('Products/Index', [
            'products'          => $products,
            'filters'           => $request->only('search', 'status'),
            'restockCount'      => $restockCount,
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
        $data['company_id']    = Tenant::id();
        $data['current_stock'] = 0;

        // Sem controle de estoque: quantidade mínima não se aplica
        if (! $request->boolean('controls_stock')) {
            $data['min_quantity'] = 0;
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('products/photos', 'public');
        }

        $product = Product::create($data);

        // Primeiro registro no histórico de preços (preço de cadastro)
        $product->priceHistories()->create([
            'old_price'          => null,
            'new_price'          => $product->default_price,
            'difference'         => $product->default_price,
            'difference_percent' => null,
            'reason'             => 'Cadastro inicial',
            'actor_name'         => Tenant::actorName(),
        ]);

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

        if (! $request->boolean('controls_stock')) {
            $data['min_quantity'] = 0;
        }

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

        // Se possui vendas ou movimentações, apenas inativa
        if ($product->sales()->exists() || $product->movements()->exists()) {
            $product->update(['active' => false]);

            return redirect()
                ->route('products.index')
                ->with('success', "\"{$product->name}\" possui histórico e foi inativado.");
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

    public function updatePrice(Request $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $data = $request->validate([
            'new_price' => ['required', 'numeric', 'min:0'],
            'reason'    => ['nullable', 'string', 'max:255'],
        ], [
            'new_price.required' => 'O novo preço é obrigatório.',
            'new_price.numeric'  => 'O preço deve ser um número.',
            'new_price.min'      => 'O preço não pode ser negativo.',
        ]);

        $old  = (float) $product->default_price;
        $new  = (float) $data['new_price'];
        $diff = round($new - $old, 2);
        $pct  = $old > 0 ? round(($diff / $old) * 100, 2) : null;

        $product->priceHistories()->create([
            'old_price'          => $old,
            'new_price'          => $new,
            'difference'         => $diff,
            'difference_percent' => $pct,
            'reason'             => $data['reason'] ?? null,
            'actor_name'         => Tenant::actorName(),
        ]);

        $product->update(['default_price' => $new]);

        return back()->with('success', 'Preço atualizado com sucesso!');
    }

    public function priceHistory(Product $product): Response
    {
        $this->authorize('view', $product);

        $histories = $product->priceHistories()
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Products/PriceHistory', [
            'product'   => $product,
            'histories' => $histories,
        ]);
    }
}
