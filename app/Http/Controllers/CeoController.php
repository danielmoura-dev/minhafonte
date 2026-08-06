<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Support\Tenant;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Painel do Dono: visão de leitura, pensada para consultar rápido sem
 * precisar navegar pelo sistema operacional.
 *
 * Nada aqui altera dados — são as mesmas informações que já existem em
 * Vendas, Recebimentos e Contas, reorganizadas de forma direta.
 */
class CeoController extends Controller
{
    /** Períodos aceitos nos filtros. */
    private const PERIODS = ['day', 'month', 'total'];

    public function index(): Response
    {
        $companyId = Tenant::id();

        // Números de destaque nos quadrados, para o dono já ver o essencial
        // sem precisar abrir nada.
        $month = $this->scoped(Order::fromCompany($companyId), 'month');

        $received = (float) BankAccount::fromCompany($companyId)
            ->withSum(['payments as received' => fn ($q) => $q->whereHas('order')], 'amount')
            ->get()
            ->sum('received');

        return Inertia::render('Ceo/Index', [
            'highlights' => [
                'accounts_total' => round($received, 2),
                'accounts_count' => BankAccount::fromCompany($companyId)->where('is_active', true)->count(),
                'month_sold'     => round((float) $month->sum('total'), 2),
                'month_count'    => $month->count(),
                // Somado no banco: carregar todas as vendas só para subtrair
                // seria desnecessário.
                'open_total'     => round((float) Order::fromCompany($companyId)
                    ->selectRaw('COALESCE(SUM(total - paid_total), 0) as aberto')
                    ->value('aberto'), 2),
            ],
        ]);
    }

    /**
     * Quanto já entrou em cada conta bancária.
     */
    public function bankAccounts(): Response
    {
        $companyId = Tenant::id();

        $accounts = BankAccount::fromCompany($companyId)
            // Venda excluída não entra em nenhuma soma.
            ->withSum(['payments as received_total' => fn ($q) => $q->whereHas('order')], 'amount')
            ->withCount(['payments as received_count' => fn ($q) => $q->whereHas('order')])
            ->withMax(['payments as last_payment_at' => fn ($q) => $q->whereHas('order')], 'paid_at')
            ->orderByDesc('received_total')
            ->get()
            ->map(fn (BankAccount $account) => [
                'id'              => $account->id,
                'name'            => $account->name,
                'bank'            => $account->bank,
                'is_active'       => $account->is_active,
                'received_total'  => round((float) $account->received_total, 2),
                'received_count'  => (int) $account->received_count,
                'month_total'     => round((float) $this->paymentsOf($account->id, 'month')->sum('amount'), 2),
                'last_payment_at' => $account->last_payment_at,
            ]);

        // Recebimentos sem conta vinculada (dinheiro em espécie, por exemplo)
        $unlinked = (float) OrderPayment::where('company_id', $companyId)
            ->whereNull('bank_account_id')
            ->whereHas('order')
            ->sum('amount');

        $total = $accounts->sum('received_total') + $unlinked;

        return Inertia::render('Ceo/BankAccounts', [
            'accounts' => $accounts,
            'unlinked' => round($unlinked, 2),
            'total'    => round($total, 2),
        ]);
    }

    /**
     * Vendido, recebido e a receber — por dia, mês ou desde o início.
     */
    public function sales(Request $request): Response
    {
        $period = $this->period($request);

        $orders = $this->scoped(Order::fromCompany(Tenant::id()), $period)
            ->with('items:id,order_id,quantity')
            ->get();

        $sold     = (float) $orders->sum('total');
        $received = (float) $orders->sum('paid_total');

        return Inertia::render('Ceo/Sales', [
            'period'  => $period,
            'summary' => [
                'sales_count' => $orders->count(),
                'items_count' => round((float) $orders->flatMap->items->sum('quantity'), 3),
                'sold'        => round($sold, 2),
                'received'    => round($received, 2),
                'pending'     => round($sold - $received, 2),
                // Quantas vendas ainda têm saldo em aberto
                'open_count'  => $orders->filter(fn ($o) => (float) $o->total > (float) $o->paid_total)->count(),
                'paid_count'  => $orders->filter(fn ($o) => (float) $o->total <= (float) $o->paid_total)->count(),
                'average'     => $orders->count() ? round($sold / $orders->count(), 2) : 0.0,
            ],
        ]);
    }

    /**
     * Rankings: produtos, clientes e cidades.
     */
    public function ranks(Request $request): Response
    {
        $period = $this->period($request, 'total');

        $orders = $this->scoped(Order::fromCompany(Tenant::id()), $period)
            ->with(['customer:id,name,city', 'items'])
            ->get();

        $products = $orders->flatMap->items
            ->groupBy('product_name')
            ->map(fn ($group, $name) => [
                'name'     => $name,
                'quantity' => round((float) $group->sum('quantity'), 3),
                'total'    => round((float) $group->sum('subtotal'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(10);

        $customers = $orders->groupBy('customer_id')
            ->map(fn ($group) => [
                'name'         => $group->first()->customer?->name ?? 'Cliente removido',
                'orders_count' => $group->count(),
                'total'        => round((float) $group->sum('total'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(10);

        // A cidade da entrega manda; sem ela, usa a do cadastro do cliente.
        $cities = $orders
            ->groupBy(fn (Order $o) => $o->delivery_city ?: ($o->customer?->city ?: 'Não informada'))
            ->map(fn ($group, $city) => [
                'city'         => $city,
                'orders_count' => $group->count(),
                'total'        => round((float) $group->sum('total'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(10);

        return Inertia::render('Ceo/Ranks', [
            'period'    => $period,
            'products'  => $products,
            'customers' => $customers,
            'cities'    => $cities,
        ]);
    }

    private function period(Request $request, string $default = 'month'): string
    {
        $period = (string) $request->get('period', $default);

        return in_array($period, self::PERIODS, true) ? $period : $default;
    }

    /**
     * Aplica o período sobre a data de emissão da venda.
     */
    private function scoped(Builder $query, string $period): Builder
    {
        return match ($period) {
            'day'   => $query->whereDate('issue_date', now()->toDateString()),
            'month' => $query->whereYear('issue_date', now()->year)
                             ->whereMonth('issue_date', now()->month),
            default => $query,
        };
    }

    /**
     * Pagamentos de uma conta no período (só de vendas que ainda existem).
     */
    private function paymentsOf(int $accountId, string $period)
    {
        $query = OrderPayment::where('bank_account_id', $accountId)->whereHas('order');

        return match ($period) {
            'day'   => $query->whereDate('paid_at', now()->toDateString()),
            'month' => $query->whereYear('paid_at', now()->year)
                             ->whereMonth('paid_at', now()->month),
            default => $query,
        };
    }
}
