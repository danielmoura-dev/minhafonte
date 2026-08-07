<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductMovement;
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

class ProductMovementController extends Controller
{
    private const ENTRADA_REASONS = ['producao', 'compra', 'ajuste'];
    private const SAIDA_REASONS   = ['perda', 'vencimento', 'ajuste'];

    public function create(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $productsWithRecipes = Product::fromCompany(Tenant::id())
            ->where('active', true)
            ->where('controls_stock', true)
            ->with(['recipeItems.rawMaterial:id,name,unit,controls_stock,current_stock,photo'])
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'default_price', 'current_stock', 'min_quantity', 'photo', 'active']);

        // Products list sem relações para o select
        $products = $productsWithRecipes->map(fn ($p) => [
            'id'            => $p->id,
            'code'          => $p->code,
            'name'          => $p->name,
            'default_price' => (float) $p->default_price,
            'current_stock' => (float) $p->current_stock,
            'min_quantity'  => (float) $p->min_quantity,
            'photo'         => $p->photo,
            'active'        => (bool) $p->active,
        ])->values();

        // Mapa de receitas indexado por product_id (string key para JSON)
        $recipes = $productsWithRecipes->mapWithKeys(fn ($p) => [
            (string) $p->id => $p->recipeItems->map(fn ($item) => [
                'raw_material_id'   => $item->raw_material_id,
                'quantity_per_unit' => (float) $item->quantity,
                'raw_material'      => [
                    'id'             => $item->rawMaterial->id,
                    'name'           => $item->rawMaterial->name,
                    'unit'           => $item->rawMaterial->unit,
                    'controls_stock' => (bool) $item->rawMaterial->controls_stock,
                    'current_stock'  => (float) $item->rawMaterial->current_stock,
                    'photo'          => $item->rawMaterial->photo,
                ],
            ])->values()->all(),
        ])->all();

        $suppliers = Supplier::fromCompany(Tenant::id())
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Products/Movement', [
            'products'      => $products,
            'suppliers'     => $suppliers,
            'recipes'       => $recipes,
            'preselectedId' => $request->integer('product') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Product::class);

        $type       = $request->input('type');
        $reason     = $request->input('reason');
        $isCompra   = $type === 'entrada' && $reason === 'compra';
        $isProducao = $type === 'entrada' && $reason === 'producao';

        $allowedReasons = $type === 'entrada'
            ? self::ENTRADA_REASONS
            : ($type === 'saida' ? self::SAIDA_REASONS : []);

        $data = $request->validate([
            'product_id'  => ['required', Rule::exists('products', 'id')->where('company_id', Tenant::id())],
            'type'        => ['required', Rule::in(['entrada', 'saida'])],
            'reason'      => ['required', Rule::in($allowedReasons)],
            'quantity'    => ['required', 'numeric', 'gt:0'],
            'supplier_id' => [Rule::requiredIf($isCompra), 'nullable', Rule::exists('suppliers', 'id')->where('company_id', Tenant::id())],
            'unit_price'  => [Rule::requiredIf($isCompra), 'nullable', 'numeric', 'min:0'],
            'invoice'     => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'],
            'notes'       => ['nullable', 'string', 'max:1000'],
        ], [
            'product_id.required'  => 'Selecione o produto.',
            'reason.required'      => 'Selecione o motivo.',
            'reason.in'            => 'Motivo inválido para o tipo de movimentação.',
            'quantity.required'    => 'Informe a quantidade.',
            'quantity.gt'          => 'A quantidade deve ser maior que zero.',
            'supplier_id.required' => 'Selecione o fornecedor.',
            'unit_price.required'  => 'Informe o valor unitário pago.',
            'invoice.mimes'        => 'Envie uma imagem (JPG, PNG, WEBP) ou PDF.',
            'invoice.max'          => 'O arquivo deve ter no máximo 8 MB.',
        ]);

        $product = Product::fromCompany(Tenant::id())->findOrFail($data['product_id']);

        if (! $product->active) {
            return back()->with('error', 'Produto inativo não pode ser movimentado.');
        }

        if (! $product->controls_stock) {
            return back()->with('error', 'Este produto não controla estoque.');
        }

        $qty    = (float) $data['quantity'];
        $before = (float) $product->current_stock;
        $after  = $type === 'entrada' ? $before + $qty : $before - $qty;

        if ($after < 0) {
            return back()
                ->withErrors(['quantity' => 'Estoque insuficiente. Disponível: ' . rtrim(rtrim(number_format($before, 3, ',', '.'), '0'), ',')])
                ->withInput();
        }

        // Para produção: validar estoque de cada matéria-prima antes de abrir transação
        if ($isProducao) {
            $product->load('recipeItems.rawMaterial');

            foreach ($product->recipeItems as $item) {
                $rawMat = $item->rawMaterial;

                if (! $rawMat->controls_stock) {
                    continue;
                }

                $consumption = round((float) $item->quantity * $qty, 3);
                $available   = (float) $rawMat->current_stock;

                if ($available < $consumption) {
                    $lacking    = round($consumption - $available, 3);
                    $lackingStr = rtrim(rtrim(number_format($lacking, 3, ',', '.'), '0'), ',');

                    return back()
                        ->with('error', "Estoque insuficiente de {$rawMat->name}. Faltam {$lackingStr} {$rawMat->unit}(s) para concluir esta produção.")
                        ->withInput();
                }
            }
        }

        $unitPrice = $isCompra ? (float) $data['unit_price'] : null;
        $total     = $unitPrice !== null ? round($unitPrice * $qty, 2) : null;

        // Nota fiscal só faz sentido numa compra — em qualquer outro motivo,
        // o arquivo enviado (se algum) é ignorado.
        $invoicePath = $isCompra && $request->hasFile('invoice')
            ? $request->file('invoice')->store('invoices', 'public')
            : null;

        DB::transaction(function () use ($product, $type, $reason, $qty, $before, $after, $isCompra, $isProducao, $data, $unitPrice, $total, $invoicePath) {
            $productMovement = ProductMovement::create([
                'company_id'   => Tenant::id(),
                'product_id'   => $product->id,
                'supplier_id'  => $isCompra ? $data['supplier_id'] : null,
                'type'         => $type,
                'reason'       => $reason,
                'quantity'     => $qty,
                'unit_price'   => $unitPrice,
                'invoice_path' => $invoicePath,
                'total_price'  => $total,
                'stock_before' => $before,
                'stock_after'  => $after,
                'actor_name'   => Tenant::actorName(),
                'notes'        => $data['notes'] ?? null,
            ]);

            $product->update(['current_stock' => $after]);

            // Baixa automática de matérias-primas ao registrar produção
            if ($isProducao && $product->recipeItems->isNotEmpty()) {
                foreach ($product->recipeItems as $item) {
                    $rawMat      = RawMaterial::lockForUpdate()->find($item->raw_material_id);
                    $consumption = round((float) $item->quantity * $qty, 3);
                    $matBefore   = (float) $rawMat->current_stock;
                    $matAfter    = $rawMat->controls_stock ? $matBefore - $consumption : $matBefore;

                    if ($rawMat->controls_stock && $matAfter < 0) {
                        throw new \RuntimeException("Estoque insuficiente de {$rawMat->name}.");
                    }

                    RawMaterialMovement::create([
                        'company_id'          => Tenant::id(),
                        'raw_material_id'     => $rawMat->id,
                        'product_movement_id' => $productMovement->id,
                        'type'                => 'saida',
                        'reason'              => 'producao',
                        'quantity'            => $consumption,
                        'stock_before'        => $matBefore,
                        'stock_after'         => $matAfter,
                        'actor_name'          => Tenant::actorName(),
                        'notes'               => "Produção de {$qty} un de {$product->name}",
                    ]);

                    if ($rawMat->controls_stock) {
                        $rawMat->update(['current_stock' => $matAfter]);
                    }
                }
            }
        });

        return redirect()
            ->route('products.index')
            ->with('success', 'Movimentação registrada com sucesso!');
    }

    public function history(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $movements = ProductMovement::fromCompany(Tenant::id())
            ->with(['product:id,name,code', 'supplier:id,name'])
            ->when($request->product_id, fn ($q, $v) => $q->where('product_id', $v))
            ->when($request->type, fn ($q, $v) => $q->where('type', $v))
            ->when($request->reason, fn ($q, $v) => $q->where('reason', $v))
            ->when($request->supplier_id, fn ($q, $v) => $q->where('supplier_id', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $products  = Product::fromCompany(Tenant::id())->orderBy('name')->get(['id', 'name']);
        $suppliers = Supplier::fromCompany(Tenant::id())->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Products/MovementHistory', [
            'movements' => $movements,
            'products'  => $products,
            'suppliers' => $suppliers,
            'filters'   => $request->only('product_id', 'type', 'reason', 'supplier_id', 'date_from', 'date_to'),
        ]);
    }
}
