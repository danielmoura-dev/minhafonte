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
    public function previewShortages(array $items): array
    {
        $products  = [];
        $materials = [];

        // Quantidades separadas por ação:
        // - "deduct" tira do produto;
        // - "produce" não afeta o saldo do produto (entra e sai), mas consome matéria-prima.
        $deductByProduct  = [];
        $produceByProduct = [];

        foreach ($items as $item) {
            $pid    = (int) $item['product_id'];
            $qty    = (float) $item['quantity'];
            $action = $item['stock_action'] ?? 'none';

            if ($action === 'deduct') {
                $deductByProduct[$pid] = ($deductByProduct[$pid] ?? 0) + $qty;
            } elseif ($action === 'produce') {
                $produceByProduct[$pid] = ($produceByProduct[$pid] ?? 0) + $qty;
            }
        }

        $productIds = array_unique(array_merge(array_keys($deductByProduct), array_keys($produceByProduct)));

        if (empty($productIds)) {
            return ['products' => [], 'materials' => []];
        }

        $loaded = Product::fromCompany(Auth::id())
            ->with('recipeItems.rawMaterial:id,name,unit,controls_stock,current_stock')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        // Produtos que ficariam negativos (somente pelas baixas)
        foreach ($deductByProduct as $pid => $qty) {
            $product = $loaded[$pid] ?? null;

            if (! $product || ! $product->controls_stock) {
                continue;
            }

            $available = (float) $product->current_stock;

            if ($available < $qty) {
                $products[] = [
                    'name'    => $product->name,
                    'lacking' => round($qty - $available, 3),
                ];
            }
        }

        // Matérias-primas consumidas pelas produções
        $consumptionByMaterial = [];
        $materialMeta          = [];

        foreach ($produceByProduct as $pid => $qty) {
            $product = $loaded[$pid] ?? null;

            if (! $product || ! $product->controls_stock) {
                continue;
            }

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

        return ['products' => $products, 'materials' => $materials];
    }

    /**
     * Aplica a movimentação de estoque vinculada à venda (dentro de uma transação já aberta).
     *
     * @param  array<int,array{product_id:int,quantity:float}>  $items
     */
    public function apply(Order $order, array $items, bool $force = false): void
    {
        foreach ($items as $item) {
            $action = $item['stock_action'] ?? 'none';

            if ($action === 'none') {
                continue;
            }

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
     * Resumo das ações para gravar em orders.stock_action:
     * none | deduct | produce | mixed.
     */
    public function summarize(array $items): string
    {
        $actions = array_unique(array_map(fn ($i) => $i['stock_action'] ?? 'none', $items));

        if (count($actions) === 1) {
            return reset($actions);
        }

        // Ignora "none" quando há outras ações: só é "mixed" se houver
        // mais de um tipo real de movimentação (ou movimentação + nenhuma).
        return 'mixed';
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

    /**
     * Estorna as movimentações de estoque geradas por esta venda, devolvendo ao
     * estoque exatamente o que cada movimento havia alterado (delta inverso) e
     * removendo os registros. Usado antes de reprocessar na edição.
     */
    public function reverse(Order $order): void
    {
        $movements = $order->movements()->get();

        foreach ($movements as $pm) {
            // Estorna as matérias-primas consumidas por este movimento (produção)
            $rawMovements = RawMaterialMovement::where('product_movement_id', $pm->id)->get();
            foreach ($rawMovements as $rmm) {
                $delta = (float) $rmm->stock_after - (float) $rmm->stock_before;
                if ($delta !== 0.0) {
                    $mat = RawMaterial::lockForUpdate()->find($rmm->raw_material_id);
                    if ($mat) {
                        $mat->update(['current_stock' => (float) $mat->current_stock - $delta]);
                    }
                }
                $rmm->delete();
            }

            // Estorna o produto
            $delta = (float) $pm->stock_after - (float) $pm->stock_before;
            if ($delta !== 0.0) {
                $product = Product::lockForUpdate()->find($pm->product_id);
                if ($product) {
                    $product->update(['current_stock' => (float) $product->current_stock - $delta]);
                }
            }
            $pm->delete();
        }
    }

    private function actorName(): ?string
    {
        $company = Auth::user();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
