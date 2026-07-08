<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductMovement;
use App\Models\RawMaterial;
use App\Models\RawMaterialMovement;
use Illuminate\Support\Facades\Auth;

class OrderStockService
{
    /**
     * Verifica antecipadamente quais produtos/matérias-primas ficariam negativos.
     *
     * @param  array<int,array{product_id:int,quantity:float}>  $items
     * @return array{products:array<int,array>,materials:array<int,array>}
     */
    public function previewShortages(array $items, string $action): array
    {
        $products  = [];
        $materials = [];

        if ($action === 'none') {
            return ['products' => [], 'materials' => []];
        }

        $companyId = Auth::id();

        // Agrega quantidades por produto
        $qtyByProduct = [];
        foreach ($items as $item) {
            $pid = (int) $item['product_id'];
            $qtyByProduct[$pid] = ($qtyByProduct[$pid] ?? 0) + (float) $item['quantity'];
        }

        $loaded = Product::fromCompany($companyId)
            ->with('recipeItems.rawMaterial:id,name,unit,controls_stock,current_stock')
            ->whereIn('id', array_keys($qtyByProduct))
            ->get();

        if ($action === 'deduct') {
            foreach ($loaded as $product) {
                if (! $product->controls_stock) {
                    continue;
                }
                $qty       = $qtyByProduct[$product->id];
                $available = (float) $product->current_stock;

                if ($available < $qty) {
                    $products[] = [
                        'name'    => $product->name,
                        'lacking' => round($qty - $available, 3),
                    ];
                }
            }
        }

        if ($action === 'produce') {
            // Consumo agregado de matéria-prima entre todos os itens
            $consumptionByMaterial = [];
            $materialMeta = [];

            foreach ($loaded as $product) {
                if (! $product->controls_stock) {
                    continue;
                }
                $qty = $qtyByProduct[$product->id];

                foreach ($product->recipeItems as $recipe) {
                    $mat = $recipe->rawMaterial;
                    if (! $mat || ! $mat->controls_stock) {
                        continue;
                    }
                    $consumptionByMaterial[$mat->id] =
                        ($consumptionByMaterial[$mat->id] ?? 0) + ((float) $recipe->quantity * $qty);
                    $materialMeta[$mat->id] = $mat;
                }
            }

            foreach ($consumptionByMaterial as $matId => $consumption) {
                $mat       = $materialMeta[$matId];
                $available = (float) $mat->current_stock;

                if ($available < $consumption) {
                    $materials[] = [
                        'name'    => $mat->name,
                        'unit'    => $mat->unit,
                        'lacking' => round($consumption - $available, 3),
                    ];
                }
            }
        }

        return ['products' => $products, 'materials' => $materials];
    }

    /**
     * Aplica a movimentação de estoque vinculada à venda (dentro de uma transação já aberta).
     *
     * @param  array<int,array{product_id:int,quantity:float}>  $items
     */
    public function apply(Order $order, string $action, array $items, bool $force = false): void
    {
        if ($action === 'none') {
            return;
        }

        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $qty       = (float) $item['quantity'];

            $product = Product::where('company_id', $order->company_id)
                ->lockForUpdate()
                ->find($productId);

            if (! $product || ! $product->controls_stock || $qty <= 0) {
                continue;
            }

            if ($action === 'produce') {
                $this->produce($order, $product, $qty, $force);
            }

            $this->deduct($order, $product, $qty, $force);
        }
    }

    /**
     * Entrada de produção + baixa das matérias-primas conforme receita.
     */
    private function produce(Order $order, Product $product, float $qty, bool $force): void
    {
        $product->load('recipeItems.rawMaterial');

        $before = (float) $product->current_stock;
        $after  = $before + $qty;

        $movement = ProductMovement::create([
            'company_id'   => $order->company_id,
            'product_id'   => $product->id,
            'order_id'     => $order->id,
            'type'         => 'entrada',
            'reason'       => 'producao',
            'quantity'     => $qty,
            'stock_before' => $before,
            'stock_after'  => $after,
            'actor_name'   => $this->actorName(),
            'notes'        => "Produção automática — Venda #{$order->order_number}",
        ]);

        foreach ($product->recipeItems as $recipe) {
            $mat = RawMaterial::lockForUpdate()->find($recipe->raw_material_id);
            if (! $mat) {
                continue;
            }

            $consumption = round((float) $recipe->quantity * $qty, 3);
            $matBefore   = (float) $mat->current_stock;
            $matAfter    = $mat->controls_stock ? $matBefore - $consumption : $matBefore;

            if ($mat->controls_stock && $matAfter < 0 && ! $force) {
                throw new \RuntimeException("Estoque insuficiente de {$mat->name}.");
            }

            RawMaterialMovement::create([
                'company_id'          => $order->company_id,
                'raw_material_id'     => $mat->id,
                'product_movement_id' => $movement->id,
                'type'                => 'saida',
                'reason'              => 'producao',
                'quantity'            => $consumption,
                'stock_before'        => $matBefore,
                'stock_after'         => $matAfter,
                'actor_name'          => $this->actorName(),
                'notes'               => "Produção de {$qty} un de {$product->name} — Venda #{$order->order_number}",
            ]);

            if ($mat->controls_stock) {
                $mat->update(['current_stock' => $matAfter]);
            }
        }

        $product->update(['current_stock' => $after]);
    }

    /**
     * Baixa da quantidade vendida do estoque do produto.
     */
    private function deduct(Order $order, Product $product, float $qty, bool $force): void
    {
        $before = (float) $product->current_stock;
        $after  = $before - $qty;

        if ($after < 0 && ! $force) {
            throw new \RuntimeException("Estoque insuficiente de {$product->name}.");
        }

        ProductMovement::create([
            'company_id'   => $order->company_id,
            'product_id'   => $product->id,
            'order_id'     => $order->id,
            'type'         => 'saida',
            'reason'       => 'venda',
            'quantity'     => $qty,
            'stock_before' => $before,
            'stock_after'  => $after,
            'actor_name'   => $this->actorName(),
            'notes'        => "Venda #{$order->order_number}",
        ]);

        $product->update(['current_stock' => $after]);
    }

    private function actorName(): ?string
    {
        $company = Auth::user();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
