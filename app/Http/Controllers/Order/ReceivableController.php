<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StorePaymentRequest;
use App\Models\BankAccount;
use App\Models\Customer;
use App\Models\Order;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReceivableController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);

        $status = $request->get('payment_status', 'open'); // open = pending + partial

        $orders = Order::fromCompany(Auth::id())
            ->with('customer:id,name')
            ->when($request->customer_id, fn ($q, $v) => $q->where('customer_id', $v))
            ->when($request->search, fn ($q, $v) =>
                $q->whereHas('customer', fn ($sq) => $sq->where('name', 'like', "%{$v}%"))
            )
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('issue_date', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('issue_date', '<=', $v))
            ->when($status === 'open', fn ($q) => $q->whereIn('payment_status', ['pending', 'partial']))
            ->when(in_array($status, ['pending', 'partial', 'paid']), fn ($q) => $q->where('payment_status', $status))
            ->orderByDesc('issue_date')
            ->orderByDesc('order_number')
            ->paginate(20)
            ->withQueryString();

        $customers = Customer::fromCompany(Auth::id())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Receivables/Index', [
            'orders'    => $orders,
            'customers' => $customers,
            'filters'   => array_merge(
                $request->only('customer_id', 'search', 'date_from', 'date_to'),
                ['payment_status' => $status],
            ),
        ]);
    }

    public function show(Order $order): Response
    {
        $this->authorize('view', $order);

        $order->load(['customer:id,name', 'payments.bankAccount:id,name,bank']);

        $bankAccounts = BankAccount::fromCompany(Auth::id())
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'bank']);

        return Inertia::render('Receivables/Show', [
            'order'        => $order,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    public function storePayment(StorePaymentRequest $request, Order $order): RedirectResponse
    {
        $this->authorize('update', $order);

        $data = $request->validated();

        $amount    = round((float) $data['amount'], 2);
        $remaining = (float) $order->remaining;

        if ($remaining <= 0) {
            return back()->with('error', 'Esta venda já está totalmente paga.');
        }

        $order->payments()->create([
            'company_id'      => Auth::id(),
            'bank_account_id' => $data['bank_account_id'] ?? null,
            'amount'          => $amount,
            'method'          => $data['method'],
            'paid_at'         => $data['paid_at'],
            'notes'           => $data['notes'] ?? null,
            'actor_name'      => $this->actorName(),
        ]);

        $order->recalculatePayment();

        AuditService::log(
            event:       'order.payment_received',
            auditable:   $order->refresh(),
            newValues:   ['amount' => $amount, 'payment_status' => $order->payment_status],
            description: "Pagamento de R$ {$amount} registrado na Venda #{$order->order_number}.",
        );

        return back()->with('success', 'Pagamento registrado com sucesso!');
    }

    private function actorName(): ?string
    {
        $company = Auth::user();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
