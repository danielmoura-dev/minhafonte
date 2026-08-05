<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StorePaymentRequest;
use App\Models\BankAccount;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ReceivableController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);

        $status = $request->get('payment_status', 'open'); // open = pending + partial
        $today  = now()->toDateString();

        $orders = Order::fromCompany(Auth::id())
            ->with('customer:id,name')
            ->when($request->customer_id, fn ($q, $v) => $q->where('customer_id', $v))
            ->when($request->search, fn ($q, $v) =>
                $q->whereHas('customer', fn ($sq) => $sq->where('name', 'like', "%{$v}%"))
            )
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('issue_date', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('issue_date', '<=', $v))
            ->when($status === 'open', fn ($q) => $q->whereIn('payment_status', ['pending', 'partial']))
            ->when(\in_array($status, ['pending', 'partial', 'paid']), fn ($q) => $q->where('payment_status', $status))
            // Abas de vencimento (sempre sobre cobranças em aberto)
            ->when($status === 'due_today', fn ($q) => $q
                ->whereIn('payment_status', ['pending', 'partial'])
                ->whereDate('due_date', $today)
            )
            ->when($status === 'overdue', fn ($q) => $q
                ->whereIn('payment_status', ['pending', 'partial'])
                ->whereDate('due_date', '<', $today)
            )
            // Em aberto: mais urgente primeiro (sem vencimento vai para o fim)
            ->when(\in_array($status, ['open', 'due_today', 'overdue']),
                fn ($q) => $q->orderByRaw('due_date IS NULL, due_date ASC'),
            )
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
            'alert'     => [
                'due_today' => Order::fromCompany(Auth::id())->dueAlert()->whereDate('due_date', $today)->count(),
                'overdue'   => Order::fromCompany(Auth::id())->dueAlert()->whereDate('due_date', '<', $today)->count(),
            ],
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
            'receipt_path'    => $request->hasFile('receipt')
                ? $request->file('receipt')->store('receipts', 'public')
                : null,
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

    /**
     * Anexa (ou substitui) o comprovante de um pagamento já registrado.
     */
    public function storeReceipt(Request $request, OrderPayment $payment): RedirectResponse
    {
        abort_unless($payment->company_id === Auth::id(), 403);

        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'],
        ], [
            'receipt.required' => 'Selecione o comprovante.',
            'receipt.mimes'    => 'Envie uma imagem (JPG, PNG, WEBP) ou PDF.',
            'receipt.max'      => 'O arquivo deve ter no máximo 8 MB.',
        ]);

        if ($payment->receipt_path) {
            Storage::disk('public')->delete($payment->receipt_path);
        }

        $payment->update([
            'receipt_path' => $request->file('receipt')->store('receipts', 'public'),
        ]);

        return back()->with('success', 'Comprovante anexado com sucesso!');
    }

    public function destroyReceipt(OrderPayment $payment): RedirectResponse
    {
        abort_unless($payment->company_id === Auth::id(), 403);

        if ($payment->receipt_path) {
            Storage::disk('public')->delete($payment->receipt_path);
            $payment->update(['receipt_path' => null]);
        }

        return back()->with('success', 'Comprovante removido.');
    }

    private function actorName(): ?string
    {
        $company = Auth::user();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
