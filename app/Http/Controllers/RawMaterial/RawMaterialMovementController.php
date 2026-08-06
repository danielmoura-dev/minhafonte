<?php

namespace App\Http\Controllers\RawMaterial;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use App\Models\RawMaterialMovement;
use App\Models\Supplier;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RawMaterialMovementController extends Controller
{
    private const ENTRADA_REASONS = ['compra', 'ajuste'];
    private const SAIDA_REASONS   = ['producao', 'perda', 'ajuste', 'vencimento', 'outro'];

    public function create(Request $request): Response
    {
        $this->authorize('viewAny', RawMaterial::class);

        $materials = RawMaterial::fromCompany(Tenant::id())
            ->where('active', true)
            ->where('controls_stock', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'unit', 'current_price', 'current_stock', 'min_quantity', 'photo']);

        $suppliers = Supplier::fromCompany(Tenant::id())
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('RawMaterials/Movement', [
            'materials'     => $materials,
            'suppliers'     => $suppliers,
            'preselectedId' => $request->integer('material') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', RawMaterial::class);

        $type     = $request->input('type');
        $reason   = $request->input('reason');
        $isCompra = $type === 'entrada' && $reason === 'compra';

        $allowedReasons = $type === 'entrada'
            ? self::ENTRADA_REASONS
            : ($type === 'saida' ? self::SAIDA_REASONS : []);

        $data = $request->validate([
            'raw_material_id' => ['required', Rule::exists('raw_materials', 'id')->where('company_id', Tenant::id())],
            'type'            => ['required', Rule::in(['entrada', 'saida'])],
            'reason'          => ['required', Rule::in($allowedReasons)],
            'quantity'        => ['required', 'numeric', 'gt:0'],
            'supplier_id'     => [Rule::requiredIf($isCompra), 'nullable', Rule::exists('suppliers', 'id')->where('company_id', Tenant::id())],
            'unit_price'      => [Rule::requiredIf($isCompra), 'nullable', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:1000'],
        ], [
            'raw_material_id.required' => 'Selecione a matéria-prima.',
            'reason.required'          => 'Selecione o motivo.',
            'reason.in'                => 'Motivo inválido para o tipo de movimentação.',
            'quantity.required'        => 'Informe a quantidade.',
            'quantity.gt'              => 'A quantidade deve ser maior que zero.',
            'supplier_id.required'     => 'Selecione o fornecedor.',
            'unit_price.required'      => 'Informe o valor unitário pago.',
        ]);

        $material = RawMaterial::fromCompany(Tenant::id())->findOrFail($data['raw_material_id']);

        // Matéria-prima inativa não pode ser movimentada
        if (! $material->active) {
            return back()->with('error', 'Matéria-prima inativa não pode ser movimentada.');
        }

        $qty    = (float) $data['quantity'];
        $before = (float) $material->current_stock;
        $after  = $type === 'entrada' ? $before + $qty : $before - $qty;

        // Nunca permitir estoque negativo
        if ($after < 0) {
            return back()
                ->withErrors(['quantity' => 'Estoque insuficiente. Disponível: ' . rtrim(rtrim(number_format($before, 3, ',', '.'), '0'), ',')])
                ->withInput();
        }

        $unitPrice = $isCompra ? (float) $data['unit_price'] : null;
        $total     = $unitPrice !== null ? round($unitPrice * $qty, 2) : null;

        DB::transaction(function () use ($material, $type, $reason, $qty, $before, $after, $isCompra, $data, $unitPrice, $total) {
            RawMaterialMovement::create([
                'company_id'      => Tenant::id(),
                'raw_material_id' => $material->id,
                'supplier_id'     => $isCompra ? $data['supplier_id'] : null,
                'type'            => $type,
                'reason'          => $reason,
                'quantity'        => $qty,
                'unit_price'      => $unitPrice,
                'total_price'     => $total,
                'stock_before'    => $before,
                'stock_after'     => $after,
                'actor_name'      => Tenant::actorName(),
                'notes'           => $data['notes'] ?? null,
            ]);

            $material->update(['current_stock' => $after]);
        });

        return redirect()
            ->route('raw-materials.index')
            ->with('success', 'Movimentação registrada com sucesso!');
    }

    public function history(Request $request): Response
    {
        $this->authorize('viewAny', RawMaterial::class);

        $movements = RawMaterialMovement::fromCompany(Tenant::id())
            ->with(['rawMaterial:id,name,code,unit', 'supplier:id,name'])
            ->when($request->raw_material_id, fn ($q, $v) => $q->where('raw_material_id', $v))
            ->when($request->type, fn ($q, $v) => $q->where('type', $v))
            ->when($request->reason, fn ($q, $v) => $q->where('reason', $v))
            ->when($request->supplier_id, fn ($q, $v) => $q->where('supplier_id', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $materials = RawMaterial::fromCompany(Tenant::id())->orderBy('name')->get(['id', 'name', 'unit']);
        $suppliers = Supplier::fromCompany(Tenant::id())->orderBy('name')->get(['id', 'name']);

        return Inertia::render('RawMaterials/MovementHistory', [
            'movements' => $movements,
            'materials' => $materials,
            'suppliers' => $suppliers,
            'filters'   => $request->only('raw_material_id', 'type', 'reason', 'supplier_id', 'date_from', 'date_to'),
        ]);
    }
}
