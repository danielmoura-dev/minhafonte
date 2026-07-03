<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RawMaterial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductRecipeController extends Controller
{
    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load(['recipeItems.rawMaterial']);

        // Matérias-primas disponíveis para compor a receita (com preço vigente)
        $materials = RawMaterial::fromCompany(Auth::id())
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'unit', 'current_price', 'photo']);

        $items = $product->recipeItems->map(fn ($item) => [
            'id'              => $item->id,
            'raw_material_id' => $item->raw_material_id,
            'quantity'        => (float) $item->quantity,
            'name'            => $item->rawMaterial?->name,
            'code'            => $item->rawMaterial?->code,
            'unit'            => $item->rawMaterial?->unit,
            'current_price'   => (float) ($item->rawMaterial?->current_price ?? 0),
            'photo'           => $item->rawMaterial?->photo,
        ])->values();

        return Inertia::render('Products/Recipe', [
            'product'   => $product->only(['id', 'name', 'code', 'default_price', 'photo']),
            'materials' => $materials,
            'items'     => $items,
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $data = $request->validate([
            'items'                   => ['present', 'array'],
            'items.*.raw_material_id' => ['required', Rule::exists('raw_materials', 'id')->where('company_id', Auth::id())],
            'items.*.quantity'        => ['required', 'numeric', 'gt:0'],
        ], [
            'items.*.raw_material_id.required' => 'Selecione a matéria-prima.',
            'items.*.quantity.required'        => 'Informe a quantidade utilizada.',
            'items.*.quantity.gt'              => 'A quantidade deve ser maior que zero.',
        ]);

        // Evita matérias-primas duplicadas na receita (mantém a última)
        $items = collect($data['items'])
            ->keyBy('raw_material_id')
            ->values();

        DB::transaction(function () use ($product, $items) {
            $product->recipeItems()->delete();

            foreach ($items as $item) {
                $product->recipeItems()->create([
                    'raw_material_id' => $item['raw_material_id'],
                    'quantity'        => $item['quantity'],
                ]);
            }
        });

        return redirect()
            ->route('products.index')
            ->with('success', 'Receita salva com sucesso!');
    }
}
