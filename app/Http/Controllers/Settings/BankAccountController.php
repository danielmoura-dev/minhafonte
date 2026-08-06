<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\BankAccount\StoreBankAccountRequest;
use App\Http\Requests\BankAccount\UpdateBankAccountRequest;
use App\Models\BankAccount;
use App\Models\OrderPayment;
use App\Services\AuditService;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', BankAccount::class);

        $accounts = BankAccount::fromCompany(Tenant::id())
            // Soma só o que entrou de vendas ativas (venda excluída não conta)
            ->withSum(['payments as received_total' => fn ($q) => $q->whereHas('order')], 'amount')
            ->withCount(['payments as received_count' => fn ($q) => $q->whereHas('order')])
            ->orderBy('name')
            ->get();

        // Pagamentos lançados sem conta vinculada (ex.: dinheiro em espécie)
        $unlinked = OrderPayment::where('company_id', Tenant::id())
            ->whereNull('bank_account_id')
            ->whereHas('order')
            ->sum('amount');

        return Inertia::render('Settings/BankAccounts', [
            'accounts' => $accounts,
            'unlinkedTotal' => round((float) $unlinked, 2),
        ]);
    }

    /**
     * Extrato da conta: totais, evolução mensal e histórico de entradas.
     */
    public function show(BankAccount $bankAccount): Response
    {
        abort_unless($bankAccount->company_id === Tenant::id(), 403);

        // Base: só pagamentos de vendas que ainda existem
        $base = fn () => OrderPayment::where('bank_account_id', $bankAccount->id)->whereHas('order');

        $today = $base()->whereDate('paid_at', now()->toDateString())->sum('amount');
        $month = $base()
            ->whereYear('paid_at', now()->year)
            ->whereMonth('paid_at', now()->month)
            ->sum('amount');
        $total = $base()->sum('amount');

        // Últimos 12 meses — agrupado em PHP para funcionar em MySQL e SQLite
        $monthly = $base()
            ->where('paid_at', '>=', now()->startOfMonth()->subMonths(11))
            ->orderBy('paid_at')
            ->get(['paid_at', 'amount'])
            ->groupBy(fn ($p) => $p->paid_at->format('Y-m'))
            ->map(fn ($group, $key) => [
                'month' => $key,
                'total' => round((float) $group->sum('amount'), 2),
            ])
            ->values();

        $payments = $base()
            ->with(['order:id,order_number,customer_id', 'order.customer:id,name'])
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Settings/BankAccountShow', [
            'account'  => $bankAccount,
            'totals'   => [
                'today' => round((float) $today, 2),
                'month' => round((float) $month, 2),
                'total' => round((float) $total, 2),
            ],
            'monthly'  => $monthly,
            'payments' => $payments,
        ]);
    }

    public function store(StoreBankAccountRequest $request): RedirectResponse
    {
        $this->authorize('create', BankAccount::class);

        $data = $request->validated();
        $data['company_id'] = Tenant::id();

        $account = BankAccount::create($data);

        AuditService::log(
            event:       'bank_account.created',
            auditable:   $account,
            description: "Conta bancária '{$account->name}' cadastrada.",
        );

        return back()->with('success', 'Conta cadastrada com sucesso!');
    }

    public function update(UpdateBankAccountRequest $request, BankAccount $bankAccount): RedirectResponse
    {
        $this->authorize('update', $bankAccount);

        $bankAccount->update($request->validated());

        AuditService::log(
            event:       'bank_account.updated',
            auditable:   $bankAccount,
            description: "Conta bancária '{$bankAccount->name}' atualizada.",
        );

        return back()->with('success', 'Conta atualizada com sucesso!');
    }

    public function destroy(BankAccount $bankAccount): RedirectResponse
    {
        $this->authorize('delete', $bankAccount);

        AuditService::log(
            event:       'bank_account.deleted',
            auditable:   $bankAccount,
            description: "Conta bancária '{$bankAccount->name}' removida.",
        );

        $bankAccount->delete();

        return back()->with('success', 'Conta removida com sucesso!');
    }

    public function toggleStatus(BankAccount $bankAccount): RedirectResponse
    {
        $this->authorize('update', $bankAccount);

        $bankAccount->update(['is_active' => ! $bankAccount->is_active]);

        return back()->with('success', 'Status atualizado com sucesso!');
    }
}
