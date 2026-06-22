<?php

namespace App\Http\Controllers\RawMaterial;

use App\Http\Controllers\Controller;
use App\Http\Requests\RawMaterial\StoreRawMaterialRequest;
use App\Http\Requests\RawMaterial\UpdateRawMaterialRequest;
use App\Models\RawMaterial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RawMaterialController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', RawMaterial::class);

        $materials = RawMaterial::fromCompany(Auth::id())
            ->withCount('movements')
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

        // Quantos itens (no total) estão abaixo do mínimo
        $restockCount = RawMaterial::fromCompany(Auth::id())
            ->where('active', true)
            ->whereColumn('current_stock', '<=', 'min_quantity')
            ->count();

        return Inertia::render('RawMaterials/Index', [
            'materials'    => $materials,
            'filters'      => $request->only('search', 'status'),
            'restockCount' => $restockCount,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', RawMaterial::class);

        return Inertia::render('RawMaterials/Create', [
            'units' => RawMaterial::UNITS,
        ]);
    }

    public function store(StoreRawMaterialRequest $request): RedirectResponse
    {
        $this->authorize('create', RawMaterial::class);

        $data = $request->validated();
        $data['company_id']    = Auth::id();
        $data['current_stock'] = 0;

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('raw-materials/photos', 'public');
        }

        $material = RawMaterial::create($data);

        // Primeiro registro no histórico de preços (preço de cadastro)
        $material->priceHistories()->create([
            'old_price'          => null,
            'new_price'          => $material->current_price,
            'difference'         => $material->current_price,
            'difference_percent' => null,
            'reason'             => 'Cadastro inicial',
            'actor_name'         => $this->actorName(),
        ]);

        return redirect()
            ->route('raw-materials.index')
            ->with('success', 'Matéria-prima cadastrada com sucesso!');
    }

    public function edit(RawMaterial $rawMaterial): Response
    {
        $this->authorize('update', $rawMaterial);

        return Inertia::render('RawMaterials/Edit', [
            'material' => $rawMaterial,
            'units'    => RawMaterial::UNITS,
        ]);
    }

    public function update(UpdateRawMaterialRequest $request, RawMaterial $rawMaterial): RedirectResponse
    {
        $this->authorize('update', $rawMaterial);

        $data = $request->validated();
        unset($data['photo']);

        if ($request->hasFile('photo')) {
            if ($rawMaterial->photo) {
                Storage::disk('public')->delete($rawMaterial->photo);
            }
            $data['photo'] = $request->file('photo')->store('raw-materials/photos', 'public');
        }

        $rawMaterial->update($data);

        return redirect()
            ->route('raw-materials.index')
            ->with('success', 'Matéria-prima atualizada com sucesso!');
    }

    public function destroy(RawMaterial $rawMaterial): RedirectResponse
    {
        $this->authorize('delete', $rawMaterial);

        // Se já foi usada em movimentações, apenas inativa
        if ($rawMaterial->movements()->exists()) {
            $rawMaterial->update(['active' => false]);

            return redirect()
                ->route('raw-materials.index')
                ->with('success', "\"{$rawMaterial->name}\" possui movimentações e foi inativada.");
        }

        if ($rawMaterial->photo) {
            Storage::disk('public')->delete($rawMaterial->photo);
        }

        $rawMaterial->delete();

        return redirect()
            ->route('raw-materials.index')
            ->with('success', 'Matéria-prima removida com sucesso!');
    }

    public function toggleStatus(RawMaterial $rawMaterial): RedirectResponse
    {
        $this->authorize('update', $rawMaterial);

        $rawMaterial->update(['active' => ! $rawMaterial->active]);

        $status = $rawMaterial->active ? 'ativada' : 'inativada';

        return back()->with('success', "Matéria-prima {$status} com sucesso!");
    }

    public function updatePrice(Request $request, RawMaterial $rawMaterial): RedirectResponse
    {
        $this->authorize('update', $rawMaterial);

        $data = $request->validate([
            'new_price' => ['required', 'numeric', 'min:0'],
            'reason'    => ['nullable', 'string', 'max:255'],
        ], [
            'new_price.required' => 'O novo preço é obrigatório.',
            'new_price.numeric'  => 'O preço deve ser um número.',
            'new_price.min'      => 'O preço não pode ser negativo.',
        ]);

        $old = (float) $rawMaterial->current_price;
        $new = (float) $data['new_price'];
        $diff = round($new - $old, 2);
        $pct  = $old > 0 ? round(($diff / $old) * 100, 2) : null;

        $rawMaterial->priceHistories()->create([
            'old_price'          => $old,
            'new_price'          => $new,
            'difference'         => $diff,
            'difference_percent' => $pct,
            'reason'             => $data['reason'] ?? null,
            'actor_name'         => $this->actorName(),
        ]);

        $rawMaterial->update(['current_price' => $new]);

        return back()->with('success', 'Preço atualizado com sucesso!');
    }

    public function priceHistory(RawMaterial $rawMaterial): Response
    {
        $this->authorize('view', $rawMaterial);

        $histories = $rawMaterial->priceHistories()
            ->orderByDesc('id')
            ->get();

        return Inertia::render('RawMaterials/PriceHistory', [
            'material'  => $rawMaterial,
            'histories' => $histories,
        ]);
    }

    private function actorName(): ?string
    {
        $company = Auth::user();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
