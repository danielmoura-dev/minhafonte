<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Supplier::class);

        $suppliers = Supplier::fromCompany(Tenant::id())
            ->withCount('rawMaterialMovements')
            ->when($request->search, fn ($q, $s) =>
                $q->where(fn ($w) =>
                    $w->where('name', 'like', "%{$s}%")
                      ->orWhere('fantasy_name', 'like', "%{$s}%")
                      ->orWhere('document', 'like', "%{$s}%")
                )
            )
            ->when($request->filled('status'), fn ($q) =>
                $q->where('active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters'   => $request->only('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Supplier::class);

        return Inertia::render('Suppliers/Create');
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $this->authorize('create', Supplier::class);

        $data = $request->validated();
        $data['company_id'] = Tenant::id();

        Supplier::create($data);

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Fornecedor cadastrado com sucesso!');
    }

    public function edit(Supplier $supplier): Response
    {
        $this->authorize('update', $supplier);

        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $this->authorize('update', $supplier);

        $supplier->update($request->validated());

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Fornecedor atualizado com sucesso!');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $this->authorize('delete', $supplier);

        // Se já foi usado em movimentações, apenas inativa
        if ($supplier->rawMaterialMovements()->exists()) {
            $supplier->update(['active' => false]);

            return redirect()
                ->route('suppliers.index')
                ->with('success', "O fornecedor \"{$supplier->name}\" possui movimentações e foi inativado.");
        }

        $supplier->delete();

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Fornecedor removido com sucesso!');
    }

    public function toggleStatus(Supplier $supplier): RedirectResponse
    {
        $this->authorize('update', $supplier);

        $supplier->update(['active' => ! $supplier->active]);

        $status = $supplier->active ? 'ativado' : 'inativado';

        return back()->with('success', "Fornecedor {$status} com sucesso!");
    }
}
