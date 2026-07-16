<?php

namespace App\Services;

use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Sale;
use App\Models\Seller;

/**
 * Funções whitelisted que o bot de IA pode executar.
 *
 * ÚNICA porta de acesso da IA aos dados: consultas prontas, read-only,
 * SEMPRE escopadas por company_id. A IA nunca monta SQL nem vê o banco.
 * Escopo liberado: vendas de vendedores (módulo comissão) + estoque.
 */
class BotToolsService
{
    public function __construct(private int $companyId)
    {
    }

    /**
     * Definições das funções no formato do Gemini (function declarations).
     */
    public static function declarations(): array
    {
        return [
            [
                'name'        => 'search_sellers',
                'description' => 'Busca vendedores pelo nome (parcial). Use para resolver o nome citado pelo usuário antes de consultar vendas.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'name' => ['type' => 'string', 'description' => 'Nome ou parte do nome do vendedor'],
                    ],
                    'required' => ['name'],
                ],
            ],
            [
                'name'        => 'search_products',
                'description' => 'Busca produtos pelo nome ou código (parcial). Use para resolver o produto citado; se vier mais de um, pergunte ao usuário qual ele quer.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'name' => ['type' => 'string', 'description' => 'Nome, apelido ou código do produto'],
                    ],
                    'required' => ['name'],
                ],
            ],
            [
                'name'        => 'seller_sales_summary',
                'description' => 'Resumo das vendas de um vendedor (módulo de comissão): número de vendas, quantidade total, valor total, recebido e pendente. Pode filtrar por produto e período.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'seller_id'  => ['type' => 'integer', 'description' => 'ID do vendedor (obtido em search_sellers)'],
                        'product_id' => ['type' => 'integer', 'description' => 'Opcional: ID do produto (obtido em search_products)'],
                        'date_from'  => ['type' => 'string', 'description' => 'Opcional: data inicial YYYY-MM-DD'],
                        'date_to'    => ['type' => 'string', 'description' => 'Opcional: data final YYYY-MM-DD'],
                    ],
                    'required' => ['seller_id'],
                ],
            ],
            [
                'name'        => 'commissions_summary',
                'description' => 'Resumo de comissões: total, pagas e pendentes. Pode filtrar por vendedor e período.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'seller_id' => ['type' => 'integer', 'description' => 'Opcional: ID do vendedor'],
                        'date_from' => ['type' => 'string', 'description' => 'Opcional: data inicial YYYY-MM-DD'],
                        'date_to'   => ['type' => 'string', 'description' => 'Opcional: data final YYYY-MM-DD'],
                    ],
                ],
            ],
            [
                'name'        => 'product_stock',
                'description' => 'Estoque atual de um produto específico (ou de todos, se não informar product_id): quantidade atual, mínimo e se precisa repor.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'product_id' => ['type' => 'integer', 'description' => 'Opcional: ID do produto'],
                    ],
                ],
            ],
            [
                'name'        => 'raw_material_stock',
                'description' => 'Estoque atual das matérias-primas: quantidade, unidade, mínimo e se precisa repor.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => (object) [],
                ],
            ],
            [
                'name'        => 'low_stock_items',
                'description' => 'Lista produtos e matérias-primas com estoque abaixo do mínimo (precisando repor).',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => (object) [],
                ],
            ],
        ];
    }

    /**
     * Executa uma função pelo nome. Nome desconhecido → erro controlado.
     */
    public function execute(string $name, array $args): array
    {
        return match ($name) {
            'search_sellers'       => $this->searchSellers((string) ($args['name'] ?? '')),
            'search_products'      => $this->searchProducts((string) ($args['name'] ?? '')),
            'seller_sales_summary' => $this->sellerSalesSummary(
                (int) ($args['seller_id'] ?? 0),
                isset($args['product_id']) ? (int) $args['product_id'] : null,
                $args['date_from'] ?? null,
                $args['date_to'] ?? null,
            ),
            'commissions_summary'  => $this->commissionsSummary(
                isset($args['seller_id']) ? (int) $args['seller_id'] : null,
                $args['date_from'] ?? null,
                $args['date_to'] ?? null,
            ),
            'product_stock'        => $this->productStock(isset($args['product_id']) ? (int) $args['product_id'] : null),
            'raw_material_stock'   => $this->rawMaterialStock(),
            'low_stock_items'      => $this->lowStockItems(),
            default                => ['error' => 'Função desconhecida.'],
        };
    }

    /**
     * Normaliza para comparação: minúsculas e sem acentos ("Garrafão" -> "garrafao").
     */
    private function normalize(string $value): string
    {
        return \Illuminate\Support\Str::ascii(mb_strtolower(trim($value)));
    }

    /**
     * Busca tolerante a acentos/maiúsculas: primeiro exige todas as palavras
     * do termo; se nada bater, aceita qualquer palavra (ex: "garrafão de 20
     * litros" ainda encontra "Garrafao 20L" pela palavra "garrafao").
     *
     * @param  \Illuminate\Support\Collection  $items  itens com callable de texto pesquisável
     */
    private function fuzzyFilter($items, string $term, callable $haystack)
    {
        $tokens = array_values(array_filter(
            preg_split('/\s+/', $this->normalize($term)),
            fn ($t) => mb_strlen($t) >= 2,
        ));

        if (empty($tokens)) {
            return $items->take(10);
        }

        $normalized = $items->map(fn ($item) => [
            'item' => $item,
            'text' => $this->normalize($haystack($item)),
        ]);

        $all = $normalized->filter(fn ($row) =>
            collect($tokens)->every(fn ($t) => str_contains($row['text'], $t))
        );

        $matches = $all->isNotEmpty()
            ? $all
            : $normalized->filter(fn ($row) =>
                collect($tokens)->contains(fn ($t) => str_contains($row['text'], $t))
            );

        return $matches->pluck('item')->take(10)->values();
    }

    private function searchSellers(string $name): array
    {
        if (trim($name) === '') {
            return ['sellers' => []];
        }

        $sellers = Seller::fromCompany($this->companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'seller_type', 'is_active']);

        $matches = $this->fuzzyFilter($sellers, $name, fn ($s) => $s->name);

        return [
            'sellers' => $matches->map(fn ($s) => [
                'id'     => $s->id,
                'name'   => $s->name,
                'type'   => $s->seller_type === 'commissioned' ? 'comissionado' : 'revendedor',
                'active' => (bool) $s->is_active,
            ])->all(),
        ];
    }

    private function searchProducts(string $name): array
    {
        if (trim($name) === '') {
            return ['products' => []];
        }

        $products = Product::fromCompany($this->companyId)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'controls_stock', 'current_stock', 'active']);

        $matches = $this->fuzzyFilter($products, $name, fn ($p) => trim(($p->code ?? '') . ' ' . $p->name));

        return [
            'products' => $matches->map(fn ($p) => [
                'id'             => $p->id,
                'code'           => $p->code,
                'name'           => $p->name,
                'controls_stock' => (bool) $p->controls_stock,
                'current_stock'  => (float) $p->current_stock,
                'active'         => (bool) $p->active,
            ])->all(),
        ];
    }

    private function sellerSalesSummary(int $sellerId, ?int $productId, ?string $dateFrom, ?string $dateTo): array
    {
        $seller = Seller::fromCompany($this->companyId)->find($sellerId);
        if (! $seller) {
            return ['error' => 'Vendedor não encontrado.'];
        }

        $query = Sale::fromCompany($this->companyId)
            ->where('seller_id', $seller->id)
            ->when($productId, fn ($q) => $q->where('product_id', $productId))
            ->when($dateFrom, fn ($q, $v) => $q->whereDate('sale_date', '>=', $v))
            ->when($dateTo, fn ($q, $v) => $q->whereDate('sale_date', '<=', $v));

        $sales = $query->get(['quantity', 'total', 'payment_received']);

        $product = $productId ? Product::fromCompany($this->companyId)->find($productId) : null;

        return [
            'seller'          => $seller->name,
            'product'         => $product?->name,
            'period'          => ($dateFrom || $dateTo) ? trim(($dateFrom ?? 'início') . ' a ' . ($dateTo ?? 'hoje')) : 'todo o período',
            'sales_count'     => $sales->count(),
            'total_quantity'  => (float) $sales->sum('quantity'),
            'total_value'     => round((float) $sales->sum('total'), 2),
            'received_value'  => round((float) $sales->where('payment_received', true)->sum('total'), 2),
            'pending_value'   => round((float) $sales->where('payment_received', false)->sum('total'), 2),
        ];
    }

    private function commissionsSummary(?int $sellerId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = Sale::fromCompany($this->companyId)
            ->whereNotNull('commission_total')
            ->where('commission_total', '>', 0)
            ->when($sellerId, fn ($q) => $q->where('seller_id', $sellerId))
            ->when($dateFrom, fn ($q, $v) => $q->whereDate('sale_date', '>=', $v))
            ->when($dateTo, fn ($q, $v) => $q->whereDate('sale_date', '<=', $v));

        $sales = $query->get(['commission_total', 'commission_paid']);

        $seller = $sellerId ? Seller::fromCompany($this->companyId)->find($sellerId) : null;

        return [
            'seller'             => $seller?->name ?? 'todos os vendedores',
            'commission_total'   => round((float) $sales->sum('commission_total'), 2),
            'commission_paid'    => round((float) $sales->where('commission_paid', true)->sum('commission_total'), 2),
            'commission_pending' => round((float) $sales->where('commission_paid', false)->sum('commission_total'), 2),
        ];
    }

    private function productStock(?int $productId): array
    {
        $query = Product::fromCompany($this->companyId)
            ->where('active', true)
            ->when($productId, fn ($q) => $q->where('id', $productId))
            ->orderBy('name');

        $products = $query->get(['id', 'code', 'name', 'controls_stock', 'current_stock', 'min_quantity']);

        if ($productId && $products->isEmpty()) {
            return ['error' => 'Produto não encontrado.'];
        }

        return [
            'products' => $products->map(fn ($p) => [
                'name'           => $p->name,
                'code'           => $p->code,
                'controls_stock' => (bool) $p->controls_stock,
                'current_stock'  => (float) $p->current_stock,
                'min_quantity'   => (float) $p->min_quantity,
                'needs_restock'  => $p->needs_restock,
            ])->all(),
        ];
    }

    private function rawMaterialStock(): array
    {
        $materials = RawMaterial::fromCompany($this->companyId)
            ->where('active', true)
            ->orderBy('name')
            ->get(['name', 'unit', 'controls_stock', 'current_stock', 'min_quantity']);

        return [
            'raw_materials' => $materials->map(fn ($m) => [
                'name'           => $m->name,
                'unit'           => $m->unit,
                'controls_stock' => (bool) $m->controls_stock,
                'current_stock'  => (float) $m->current_stock,
                'min_quantity'   => (float) $m->min_quantity,
                'needs_restock'  => $m->needs_restock,
            ])->all(),
        ];
    }

    private function lowStockItems(): array
    {
        $products = Product::fromCompany($this->companyId)
            ->where('active', true)
            ->where('controls_stock', true)
            ->whereColumn('current_stock', '<=', 'min_quantity')
            ->orderBy('name')
            ->get(['name', 'current_stock', 'min_quantity']);

        $materials = RawMaterial::fromCompany($this->companyId)
            ->where('active', true)
            ->where('controls_stock', true)
            ->whereColumn('current_stock', '<=', 'min_quantity')
            ->orderBy('name')
            ->get(['name', 'unit', 'current_stock', 'min_quantity']);

        return [
            'products' => $products->map(fn ($p) => [
                'name'          => $p->name,
                'current_stock' => (float) $p->current_stock,
                'min_quantity'  => (float) $p->min_quantity,
            ])->all(),
            'raw_materials' => $materials->map(fn ($m) => [
                'name'          => $m->name,
                'unit'          => $m->unit,
                'current_stock' => (float) $m->current_stock,
                'min_quantity'  => (float) $m->min_quantity,
            ])->all(),
        ];
    }
}
