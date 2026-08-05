<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Sale;
use App\Models\Seller;

/**
 * Funções whitelisted que o bot de IA pode executar.
 *
 * ÚNICA porta de acesso da IA aos dados: consultas prontas, read-only,
 * SEMPRE escopadas por company_id. A IA nunca monta SQL nem vê o banco.
 * Escopo liberado: vendas a clientes (pedidos), comissões de vendedores
 * (módulo comissão) e estoque.
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
                'name'        => 'sales_summary',
                'description' => 'VENDAS (pedidos a clientes): resumo do período — quantidade de vendas, valor total, recebido, em aberto, lista das vendas (cliente, valor, situação) e itens vendidos. Sem datas = hoje. Use esta função quando perguntarem sobre "vendas".',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'date_from' => ['type' => 'string', 'description' => 'Opcional: data inicial YYYY-MM-DD (padrão: hoje)'],
                        'date_to'   => ['type' => 'string', 'description' => 'Opcional: data final YYYY-MM-DD (padrão: hoje)'],
                    ],
                ],
            ],
            [
                'name'        => 'search_customers',
                'description' => 'Busca clientes pelo nome (parcial). Use para resolver o cliente citado antes de consultar as compras dele.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'name' => ['type' => 'string', 'description' => 'Nome ou parte do nome do cliente'],
                    ],
                    'required' => ['name'],
                ],
            ],
            [
                'name'        => 'customer_summary',
                'description' => 'Resumo financeiro de um cliente: total comprado, pago, em aberto, número de compras e as últimas vendas.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'customer_id' => ['type' => 'integer', 'description' => 'ID do cliente (obtido em search_customers)'],
                    ],
                    'required' => ['customer_id'],
                ],
            ],
            [
                'name'        => 'search_sellers',
                'description' => 'COMISSÃO: busca vendedores comissionados/revendedores pelo nome. Use apenas para o módulo de comissão, não para vendas a clientes.',
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
                'description' => 'COMISSÃO: resumo das vendas de um vendedor no módulo de comissão (não confundir com as vendas a clientes): número de vendas, quantidade, valor total, recebido e pendente. Pode filtrar por produto e período.',
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
                'description' => 'COMISSÃO: resumo de comissões dos vendedores — total, pagas e pendentes. Pode filtrar por vendedor e período.',
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
            'sales_summary'        => $this->salesSummary($args['date_from'] ?? null, $args['date_to'] ?? null),
            'search_customers'     => $this->searchCustomers((string) ($args['name'] ?? '')),
            'customer_summary'     => $this->customerSummary((int) ($args['customer_id'] ?? 0)),
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

    /**
     * Resumo das vendas a clientes (módulo de pedidos) no período.
     * Reutilizado também pelo BotNotificationService (resumo diário).
     */
    public function salesSummary(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $dateFrom = $dateFrom ?: now()->toDateString();
        $dateTo   = $dateTo ?: $dateFrom;

        $orders = Order::fromCompany($this->companyId)
            ->with(['customer:id,name', 'items:id,order_id,product_name,quantity,subtotal'])
            ->whereDate('issue_date', '>=', $dateFrom)
            ->whereDate('issue_date', '<=', $dateTo)
            ->orderBy('order_number')
            ->get();

        $statusLabel = ['paid' => 'pago', 'partial' => 'parcial', 'pending' => 'pendente'];

        $items = $orders->flatMap(fn ($o) => $o->items)
            ->groupBy('product_name')
            ->map(fn ($group, $productName) => [
                'product'  => $productName,
                'quantity' => round((float) $group->sum('quantity'), 3),
                'total'    => round((float) $group->sum('subtotal'), 2),
            ])
            ->sortByDesc('quantity')
            ->values();

        return [
            'period'         => $dateFrom === $dateTo ? $dateFrom : "{$dateFrom} a {$dateTo}",
            'sales_count'    => $orders->count(),
            'total_value'    => round((float) $orders->sum('total'), 2),
            'received_value' => round((float) $orders->sum('paid_total'), 2),
            'open_value'     => round((float) $orders->sum(fn ($o) => (float) $o->total - (float) $o->paid_total), 2),
            'sales'          => $orders->map(fn ($o) => [
                'order_number' => $o->order_number,
                'customer'     => $o->customer?->name ?? 'sem cliente',
                'total'        => (float) $o->total,
                'status'       => $statusLabel[$o->payment_status] ?? $o->payment_status,
            ])->all(),
            'items_sold'     => $items->all(),
        ];
    }

    private function searchCustomers(string $name): array
    {
        if (trim($name) === '') {
            return ['customers' => []];
        }

        $customers = Customer::fromCompany($this->companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'city', 'is_active']);

        $matches = $this->fuzzyFilter($customers, $name, fn ($c) => $c->name);

        return [
            'customers' => $matches->map(fn ($c) => [
                'id'     => $c->id,
                'name'   => $c->name,
                'phone'  => $c->phone,
                'city'   => $c->city,
                'active' => (bool) $c->is_active,
            ])->all(),
        ];
    }

    private function customerSummary(int $customerId): array
    {
        $customer = Customer::fromCompany($this->companyId)->find($customerId);
        if (! $customer) {
            return ['error' => 'Cliente não encontrado.'];
        }

        $orders = Order::fromCompany($this->companyId)
            ->where('customer_id', $customer->id)
            ->orderByDesc('issue_date')
            ->get();

        $totalBought = round((float) $orders->sum('total'), 2);
        $totalPaid   = round((float) $orders->sum('paid_total'), 2);
        $statusLabel = ['paid' => 'pago', 'partial' => 'parcial', 'pending' => 'pendente'];

        return [
            'customer'     => $customer->name,
            'orders_count' => $orders->count(),
            'total_bought' => $totalBought,
            'total_paid'   => $totalPaid,
            'total_open'   => round($totalBought - $totalPaid, 2),
            'last_sales'   => $orders->take(5)->map(fn ($o) => [
                'order_number' => $o->order_number,
                'date'         => $o->issue_date?->toDateString(),
                'total'        => (float) $o->total,
                'status'       => $statusLabel[$o->payment_status] ?? $o->payment_status,
            ])->values()->all(),
        ];
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
