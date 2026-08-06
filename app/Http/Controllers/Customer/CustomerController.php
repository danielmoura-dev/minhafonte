<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Models\Customer;
use App\Models\Order;
use App\Services\AuditService;
use App\Support\Tenant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::fromCompany(Tenant::id())
            ->withCount('orders')
            ->withSum('orders as total_bought', 'total')
            ->withSum('orders as total_paid', 'paid_total')
            ->when($request->search, fn ($q, $s) =>
                $q->where(fn ($sub) => $sub
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('city', 'like', "%{$s}%")
                )
            )
            ->when($request->filled('status'), fn ($q) =>
                $q->where('is_active', $request->status === 'active')
            )
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'stats'     => $this->companyStats(),
            'filters'   => $request->only('search', 'status'),
        ]);
    }

    /**
     * Indicadores da carteira de clientes (topo da listagem).
     */
    private function companyStats(): array
    {
        $companyId = Tenant::id();

        $orders = Order::fromCompany($companyId);

        return [
            'customers'        => Customer::fromCompany($companyId)->count(),
            'customers_active' => Customer::fromCompany($companyId)->where('is_active', true)->count(),
            'orders'           => (clone $orders)->count(),
            'total_sold'       => round((float) (clone $orders)->sum('total'), 2),
            'total_open'       => round((float) (clone $orders)
                ->whereIn('payment_status', ['pending', 'partial'])
                ->sum(DB::raw('total - paid_total')), 2),
            'customers_owing'  => Customer::fromCompany($companyId)
                ->whereHas('orders', fn ($q) => $q->whereIn('payment_status', ['pending', 'partial']))
                ->count(),
        ];
    }

    /**
     * Perfil do cliente: indicadores, histórico de compras e produtos.
     */
    public function show(Customer $customer): Response
    {
        $this->authorize('view', $customer);

        $orders = Order::fromCompany(Tenant::id())
            ->where('customer_id', $customer->id)
            ->with('items:id,order_id,product_name,quantity,subtotal')
            ->orderByDesc('issue_date')
            ->orderByDesc('order_number')
            ->get();

        $totalBought = round((float) $orders->sum('total'), 2);
        $totalPaid   = round((float) $orders->sum('paid_total'), 2);
        $openOrders  = $orders->whereIn('payment_status', ['pending', 'partial']);

        // Produtos mais comprados (por valor)
        $topProducts = $orders
            ->flatMap(fn ($o) => $o->items)
            ->groupBy('product_name')
            ->map(fn ($group, $name) => [
                'name'     => $name,
                'quantity' => round((float) $group->sum('quantity'), 3),
                'total'    => round((float) $group->sum('subtotal'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(8);

        return Inertia::render('Customers/Show', [
            'customer'   => $customer,
            'summary'    => [
                'total_bought'  => $totalBought,
                'total_paid'    => $totalPaid,
                'total_open'    => round($totalBought - $totalPaid, 2),
                'orders_count'  => $orders->count(),
                'open_count'    => $openOrders->count(),
                'overdue_count' => $openOrders->filter(fn ($o) => $o->due_status === 'overdue')->count(),
                'average_ticket'=> $orders->count() ? round($totalBought / $orders->count(), 2) : 0,
                'first_order'   => optional($orders->last())->issue_date?->toDateString(),
                'last_order'    => optional($orders->first())->issue_date?->toDateString(),
            ],
            'orders'     => $orders->values(),
            'topProducts'=> $topProducts,
        ]);
    }

    /**
     * Extrato do cliente em PDF (opcionalmente por período).
     */
    public function report(Request $request, Customer $customer)
    {
        $this->authorize('view', $customer);

        $dateFrom = $request->date_from;
        $dateTo   = $request->date_to;

        $orders = Order::fromCompany(Tenant::id())
            ->where('customer_id', $customer->id)
            ->when($dateFrom, fn ($q, $v) => $q->whereDate('issue_date', '>=', $v))
            ->when($dateTo, fn ($q, $v) => $q->whereDate('issue_date', '<=', $v))
            ->with('items:id,order_id,product_name,quantity,subtotal')
            ->orderBy('issue_date')
            ->orderBy('order_number')
            ->get();

        $totalBought = round((float) $orders->sum('total'), 2);
        $totalPaid   = round((float) $orders->sum('paid_total'), 2);

        $pdf = Pdf::loadView('pdf.customer-statement', [
            'company'     => Tenant::company(),
            'customer'    => $customer,
            'orders'      => $orders,
            'dateFrom'    => $dateFrom,
            'dateTo'      => $dateTo,
            'totalBought' => $totalBought,
            'totalPaid'   => $totalPaid,
            'totalOpen'   => round($totalBought - $totalPaid, 2),
            'topProducts' => $orders->flatMap(fn ($o) => $o->items)
                ->groupBy('product_name')
                ->map(fn ($g, $name) => [
                    'name'     => $name,
                    'quantity' => round((float) $g->sum('quantity'), 3),
                    'total'    => round((float) $g->sum('subtotal'), 2),
                ])
                ->sortByDesc('total')->values(),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('extrato-' . Str::slug($customer->name) . '.pdf');
    }

    /**
     * Resumo de todos os clientes em PDF (carteira e valores em aberto).
     */
    public function reportAll(Request $request)
    {
        $this->authorize('viewAny', Customer::class);

        $onlyOwing = $request->boolean('only_owing');

        $customers = Customer::fromCompany(Tenant::id())
            ->withCount('orders')
            ->withSum('orders as total_bought', 'total')
            ->withSum('orders as total_paid', 'paid_total')
            ->when($onlyOwing, fn ($q) => $q->whereHas('orders',
                fn ($sub) => $sub->whereIn('payment_status', ['pending', 'partial'])
            ))
            ->orderBy('name')
            ->get();

        $pdf = Pdf::loadView('pdf.customers-summary', [
            'company'   => Tenant::company(),
            'customers' => $customers,
            'onlyOwing' => $onlyOwing,
            'stats'     => $this->companyStats(),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('clientes-resumo.pdf');
    }

    public function create(): Response
    {
        $this->authorize('create', Customer::class);

        return Inertia::render('Customers/Create');
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $this->authorize('create', Customer::class);

        $data = $request->validated();
        $data['company_id'] = Tenant::id();

        $customer = Customer::create($data);

        AuditService::log(
            event:       'customer.created',
            auditable:   $customer,
            newValues:   ['name' => $customer->name],
            description: "Cliente '{$customer->name}' cadastrado.",
        );

        return redirect()
            ->route('customers.index')
            ->with('success', 'Cliente cadastrado com sucesso!');
    }

    public function edit(Customer $customer): Response
    {
        $this->authorize('update', $customer);

        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $this->authorize('update', $customer);

        $customer->update($request->validated());

        AuditService::log(
            event:       'customer.updated',
            auditable:   $customer,
            description: "Cliente '{$customer->name}' atualizado.",
        );

        return redirect()
            ->route('customers.index')
            ->with('success', 'Cliente atualizado com sucesso!');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $this->authorize('delete', $customer);

        if ($customer->orders()->exists()) {
            return redirect()
                ->route('customers.index')
                ->with('error', "O cliente \"{$customer->name}\" possui vendas registradas e não pode ser excluído. Use a opção de inativar.");
        }

        AuditService::log(
            event:       'customer.deleted',
            auditable:   $customer,
            description: "Cliente '{$customer->name}' removido.",
        );

        $customer->delete();

        return redirect()
            ->route('customers.index')
            ->with('success', 'Cliente removido com sucesso!');
    }

    public function toggleStatus(Customer $customer): RedirectResponse
    {
        $this->authorize('update', $customer);

        $customer->update(['is_active' => ! $customer->is_active]);

        $status = $customer->is_active ? 'ativado' : 'inativado';

        return back()->with('success', "Cliente {$status} com sucesso!");
    }
}
