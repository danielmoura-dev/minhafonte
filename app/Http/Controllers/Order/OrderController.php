<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Services\AuditService;
use App\Services\OrderStockService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::fromCompany(Auth::id())
            ->with('customer:id,name')
            ->when($request->customer_id, fn ($q, $v) => $q->where('customer_id', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('issue_date', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('issue_date', '<=', $v))
            ->when($request->payment_status, fn ($q, $v) => $q->where('payment_status', $v))
            ->orderByDesc('issue_date')
            ->orderByDesc('order_number')
            ->paginate(20)
            ->withQueryString();

        $customers = Customer::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Orders/Index', [
            'orders'    => $orders,
            'customers' => $customers,
            'filters'   => $request->only('customer_id', 'date_from', 'date_to', 'payment_status'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Order::class);

        return Inertia::render('Orders/Create', [
            'customers' => $this->customersForForm(),
            'products'  => $this->productsForForm(),
        ]);
    }

    public function store(StoreOrderRequest $request, OrderStockService $service): RedirectResponse
    {
        $this->authorize('create', Order::class);

        $data   = $request->validated();
        $action = $data['stock_action'];
        $force  = (bool) ($data['force'] ?? false);

        $stockItems = collect($data['items'])
            ->map(fn ($i) => ['product_id' => (int) $i['product_id'], 'quantity' => (float) $i['quantity']])
            ->all();

        // Verifica estoque negativo antes de salvar. Se houver falta e o usuário
        // ainda não confirmou "continuar mesmo assim", devolve a lista como erro
        // de validação (mantém o formulário preenchido no front).
        if ($action !== 'none' && ! $force) {
            $shortages = $service->previewShortages($stockItems, $action);
            if (! empty($shortages['products']) || ! empty($shortages['materials'])) {
                throw ValidationException::withMessages([
                    'stock_shortage' => json_encode($shortages),
                ]);
            }
        }

        $products = Product::fromCompany(Auth::id())
            ->whereIn('id', collect($data['items'])->pluck('product_id'))
            ->get()
            ->keyBy('id');

        try {
            $order = DB::transaction(function () use ($data, $action, $force, $products, $service) {
                $nextNumber = (Order::fromCompany(Auth::id())->lockForUpdate()->max('order_number') ?? 0) + 1;

                $items = collect($data['items'])->map(function ($item) use ($products) {
                    $product  = $products[$item['product_id']];
                    $qty      = (float) $item['quantity'];
                    $price    = (float) $item['unit_price'];

                    return [
                        'product_id'    => $product->id,
                        'product_name'  => $product->name,
                        'product_code'  => $product->code,
                        'product_photo' => $product->photo,
                        'unit_price'    => $price,
                        'quantity'      => $qty,
                        'subtotal'      => round($price * $qty, 2),
                    ];
                });

                $order = Order::create([
                    'company_id'            => Auth::id(),
                    'customer_id'           => $data['customer_id'],
                    'order_number'          => $nextNumber,
                    'issue_date'            => $data['issue_date'],
                    'delivery_street'       => $data['delivery_street'] ?? null,
                    'delivery_number'       => $data['delivery_number'] ?? null,
                    'delivery_complement'   => $data['delivery_complement'] ?? null,
                    'delivery_neighborhood' => $data['delivery_neighborhood'] ?? null,
                    'delivery_city'         => $data['delivery_city'] ?? null,
                    'delivery_state'        => $data['delivery_state'] ?? null,
                    'delivery_zip_code'     => $data['delivery_zip_code'] ?? null,
                    'items_count'           => $items->count(),
                    'total'                 => round($items->sum('subtotal'), 2),
                    'stock_action'          => $action,
                    'payment_status'        => 'pending',
                    'paid_total'            => 0,
                    'actor_name'            => $this->actorName(),
                    'notes'                 => $data['notes'] ?? null,
                ]);

                $order->items()->createMany($items->all());

                $service->apply(
                    $order,
                    $action,
                    $items->map(fn ($i) => ['product_id' => $i['product_id'], 'quantity' => $i['quantity']])->all(),
                    $force,
                );

                return $order;
            });
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage() . ' Ative a opção de continuar mesmo com estoque negativo.');
        }

        AuditService::log(
            event:       'order.created',
            auditable:   $order,
            newValues:   ['order_number' => $order->order_number, 'total' => $order->total],
            description: "Venda #{$order->order_number} registrada. Total: R$ {$order->total}",
        );

        return redirect()
            ->route('orders.index')
            ->with('success', "Venda #{$order->order_number} registrada com sucesso!");
    }

    public function show(Order $order): Response
    {
        $this->authorize('view', $order);

        $order->load([
            'customer',
            'items',
            'payments.bankAccount:id,name,bank',
            'movements' => fn ($q) => $q->orderBy('id'),
            'movements.product:id,name,code',
        ]);

        return Inertia::render('Orders/Show', [
            'order' => $order,
        ]);
    }

    /**
     * Verifica a senha de administrador e libera a edição de uma venda com pagamento.
     */
    public function unlockEdit(Request $request, Order $order): RedirectResponse
    {
        $this->authorize('update', $order);

        $request->validate(['admin_password' => ['required', 'string']]);

        if (! Auth::user()->checkAdminPassword($request->input('admin_password'))) {
            return back()->withErrors(['admin_password' => 'Senha incorreta.']);
        }

        session()->put("order_edit_unlocked.{$order->id}", true);

        return redirect()->route('orders.edit', $order);
    }

    /**
     * Venda pendente edita livre; venda com pagamento exige desbloqueio por senha.
     */
    private function canEdit(Order $order): bool
    {
        return $order->payment_status === 'pending'
            || (bool) session("order_edit_unlocked.{$order->id}");
    }

    public function edit(Order $order): Response|RedirectResponse
    {
        $this->authorize('update', $order);

        if (! $this->canEdit($order)) {
            return redirect()
                ->route('orders.index')
                ->with('error', 'Esta venda tem pagamento. Informe a senha de administrador para editar.');
        }

        $order->load('items');

        return Inertia::render('Orders/Edit', [
            'order'     => $order,
            'customers' => $this->customersForForm(),
            'products'  => $this->productsForForm(),
        ]);
    }

    public function update(UpdateOrderRequest $request, Order $order, OrderStockService $service): RedirectResponse
    {
        $this->authorize('update', $order);

        if (! $this->canEdit($order)) {
            return redirect()
                ->route('orders.index')
                ->with('error', 'Esta venda tem pagamento. Informe a senha de administrador para editar.');
        }

        $data  = $request->validated();
        $force = (bool) ($data['force'] ?? false);

        $products = Product::fromCompany(Auth::id())
            ->whereIn('id', collect($data['items'])->pluck('product_id'))
            ->get()
            ->keyBy('id');

        try {
            DB::transaction(function () use ($order, $data, $products, $service, $force) {
                $items = collect($data['items'])->map(function ($item) use ($products) {
                    $product = $products[$item['product_id']];
                    $qty     = (float) $item['quantity'];
                    $price   = (float) $item['unit_price'];

                    return [
                        'product_id'    => $product->id,
                        'product_name'  => $product->name,
                        'product_code'  => $product->code,
                        'product_photo' => $product->photo,
                        'unit_price'    => $price,
                        'quantity'      => $qty,
                        'subtotal'      => round($price * $qty, 2),
                    ];
                });

                $order->update([
                    'customer_id'           => $data['customer_id'],
                    'issue_date'            => $data['issue_date'],
                    'delivery_street'       => $data['delivery_street'] ?? null,
                    'delivery_number'       => $data['delivery_number'] ?? null,
                    'delivery_complement'   => $data['delivery_complement'] ?? null,
                    'delivery_neighborhood' => $data['delivery_neighborhood'] ?? null,
                    'delivery_city'         => $data['delivery_city'] ?? null,
                    'delivery_state'        => $data['delivery_state'] ?? null,
                    'delivery_zip_code'     => $data['delivery_zip_code'] ?? null,
                    'items_count'           => $items->count(),
                    'total'                 => round($items->sum('subtotal'), 2),
                    'notes'                 => $data['notes'] ?? null,
                ]);

                $order->items()->delete();
                $order->items()->createMany($items->all());

                // Reprocessa o estoque: estorna o que a venda tinha movimentado e
                // refaz com os novos itens, mantendo a mesma opção (baixa/produção).
                if ($order->stock_action !== 'none') {
                    $stockItems = $items->map(fn ($i) => [
                        'product_id' => $i['product_id'],
                        'quantity'   => $i['quantity'],
                    ])->all();

                    $service->reverse($order);

                    if (! $force) {
                        $shortages = $service->previewShortages($stockItems, $order->stock_action);
                        if (! empty($shortages['products']) || ! empty($shortages['materials'])) {
                            // Rola a transação de volta e devolve a lista para o modal de aviso.
                            throw ValidationException::withMessages([
                                'stock_shortage' => json_encode($shortages),
                            ]);
                        }
                    }

                    $service->apply($order, $order->stock_action, $stockItems, $force);
                }
            });
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage() . ' Ative a opção de continuar mesmo com estoque negativo.');
        }

        // Recalcula status/saldo em cascata (ex.: total baixou p/ valor já pago -> "pago").
        $order->recalculatePayment();

        // Consome o desbloqueio: nova edição exige a senha de novo.
        session()->forget("order_edit_unlocked.{$order->id}");

        AuditService::log(
            event:       'order.updated',
            auditable:   $order,
            description: "Venda #{$order->order_number} atualizada.",
        );

        return redirect()
            ->route('orders.index')
            ->with('success', "Venda #{$order->order_number} atualizada com sucesso!");
    }

    public function destroy(Order $order): RedirectResponse
    {
        $this->authorize('delete', $order);

        if ($order->payment_status !== 'pending') {
            return redirect()
                ->route('orders.index')
                ->with('error', 'Somente vendas pendentes podem ser excluídas.');
        }

        AuditService::log(
            event:       'order.deleted',
            auditable:   $order,
            description: "Venda #{$order->order_number} removida.",
        );

        $order->delete();

        return redirect()
            ->route('orders.index')
            ->with('success', "Venda #{$order->order_number} removida com sucesso!");
    }

    public function romaneio(Order $order)
    {
        $this->authorize('view', $order);

        $order->load(['customer', 'items']);

        $pdf = Pdf::loadView('pdf.order-romaneio', [
            'order'   => $order,
            'company' => Auth::user(),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream("romaneio-venda-{$order->order_number}.pdf");
    }

    private function customersForForm()
    {
        return Customer::fromCompany(Auth::id())
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id', 'name', 'phone', 'street', 'number', 'complement',
                'neighborhood', 'city', 'state', 'zip_code',
            ]);
    }

    private function productsForForm()
    {
        return Product::fromCompany(Auth::id())
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'default_price', 'current_stock', 'controls_stock', 'photo'])
            ->map(fn ($p) => [
                'id'             => $p->id,
                'code'           => $p->code,
                'name'           => $p->name,
                'default_price'  => (float) $p->default_price,
                'current_stock'  => (float) $p->current_stock,
                'controls_stock' => (bool) $p->controls_stock,
                'photo'          => $p->photo,
            ])
            ->values();
    }

    private function actorName(): ?string
    {
        $company = Auth::user();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
