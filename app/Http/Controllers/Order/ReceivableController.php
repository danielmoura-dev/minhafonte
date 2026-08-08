<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StorePaymentRequest;
use App\Models\BankAccount;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Services\AuditService;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReceivableController extends Controller
{
    public function index(Request $request): Response
    {
        // A permissão vem do módulo `receivables` na rota — Recebimentos é um
        // módulo próprio, então não pode exigir acesso a Vendas.
        $status = $request->get('payment_status', 'open'); // open = pending + partial
        $today  = now()->toDateString();

        $orders = Order::fromCompany(Tenant::id())
            ->with('customer:id,name')
            ->when($request->customer_id, fn ($q, $v) => $q->where('customer_id', $v))
            ->when($request->search, fn ($q, $v) =>
                $q->whereHas('customer', fn ($sq) => $sq->where('name', 'like', "%{$v}%"))
            )
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('issue_date', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('issue_date', '<=', $v))
            ->when($status === 'open', fn ($q) => $q->whereIn('payment_status', ['pending', 'partial']))
            ->when(\in_array($status, ['pending', 'partial', 'paid']), fn ($q) => $q->where('payment_status', $status))
            // Abas de vencimento: só cobranças ainda não atendidas
            // (com pagamento parcial a venda sai da cobrança)
            ->when($status === 'due_today', fn ($q) => $q
                ->where('payment_status', 'pending')
                ->whereDate('due_date', $today)
            )
            ->when($status === 'overdue', fn ($q) => $q
                ->where('payment_status', 'pending')
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

        $customers = Customer::fromCompany(Tenant::id())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Receivables/Index', [
            'orders'    => $orders,
            'customers' => $customers,
            'alert'     => [
                'due_today' => Order::fromCompany(Tenant::id())->dueAlert()->whereDate('due_date', $today)->count(),
                'overdue'   => Order::fromCompany(Tenant::id())->dueAlert()->whereDate('due_date', '<', $today)->count(),
            ],
            'filters'   => array_merge(
                $request->only('customer_id', 'search', 'date_from', 'date_to'),
                ['payment_status' => $status],
            ),
        ]);
    }

    public function show(Order $order): Response
    {
        // Só a checagem de empresa: o binding de {order} é global, então sem
        // isto daria para abrir a venda de outra empresa pela URL.
        abort_unless($order->company_id === Tenant::id(), 403);

        $order->load(['customer:id,name', 'payments.bankAccount:id,name,bank']);

        $bankAccounts = BankAccount::fromCompany(Tenant::id())
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'bank']);

        return Inertia::render('Receivables/Show', [
            'order'        => $order,
            'bankAccounts' => $bankAccounts,
            // Venda quitada só corrige depois de liberar por senha
            'canEditPayments' => $this->canEditPayments($order),
        ]);
    }

    public function storePayment(StorePaymentRequest $request, Order $order): RedirectResponse
    {
        abort_unless($order->company_id === Tenant::id(), 403);

        $data = $request->validated();

        $amount    = round((float) $data['amount'], 2);
        $remaining = (float) $order->remaining;

        if ($remaining <= 0) {
            return back()->with('error', 'Esta venda já está totalmente paga.');
        }

        // Não permite lançar mais do que falta (evita quitar a venda por engano
        // de digitação, o que travaria a correção do valor depois).
        if ($amount > $remaining + 0.001) {
            return back()
                ->withErrors(['amount' => 'O valor não pode ser maior que o saldo de ' . $this->money($remaining) . '.'])
                ->withInput();
        }

        $order->payments()->create([
            'company_id'      => Tenant::id(),
            'bank_account_id' => $data['bank_account_id'] ?? null,
            'amount'          => $amount,
            'method'          => $data['method'],
            'paid_at'         => $data['paid_at'],
            'notes'           => $data['notes'] ?? null,
            'actor_name'      => Tenant::actorName(),
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
     * Libera a correção dos pagamentos de uma venda já quitada.
     *
     * Sem isso, um lançamento na conta bancária errada ficaria travado para
     * sempre — e é justamente o que quebra a conferência do caixa.
     */
    public function unlockEdit(Request $request, Order $order): RedirectResponse
    {
        abort_unless($order->company_id === Tenant::id(), 403);

        $request->validate(['admin_password' => ['required', 'string']], [
            'admin_password.required' => 'Informe a senha de administrador.',
        ]);

        if (! Tenant::company()->checkAdminPassword($request->input('admin_password'))) {
            return back()->withErrors(['admin_password' => 'Senha incorreta.']);
        }

        session()->put("receivable_edit_unlocked.{$order->id}", true);

        AuditService::log(
            event:       'order.payments_unlocked',
            auditable:   $order,
            description: "Correção dos pagamentos da Venda #{$order->order_number} liberada por senha de administrador.",
        );

        return back()->with('success', 'Correção liberada. Clique no valor do pagamento para ajustar.');
    }

    /**
     * Venda em aberto corrige livre; venda quitada exige desbloqueio por senha.
     */
    private function canEditPayments(Order $order): bool
    {
        return $order->payment_status !== 'paid'
            || (bool) session("receivable_edit_unlocked.{$order->id}");
    }

    /**
     * Corrige um pagamento já lançado (valor, forma, conta de destino, data).
     * Numa venda quitada, exige o desbloqueio por senha de administrador.
     */
    public function updatePayment(Request $request, OrderPayment $payment): RedirectResponse
    {
        abort_unless($payment->company_id === Tenant::id(), 403);

        $order = $payment->order;   // null se a venda foi excluída
        abort_unless($order, 404);

        if (! $this->canEditPayments($order)) {
            return back()->with('error', 'Venda quitada: informe a senha de administrador para corrigir os pagamentos.');
        }

        $data = $request->validate([
            'amount'          => ['required', 'numeric', 'gt:0'],
            'method'          => ['required', Rule::in(['deposit', 'cash', 'cheque'])],
            'bank_account_id' => ['nullable', Rule::exists('bank_accounts', 'id')->where('company_id', Tenant::id())],
            'paid_at'         => ['required', 'date'],
            'notes'           => ['nullable', 'string', 'max:1000'],
        ], [
            'amount.required' => 'Informe o valor do pagamento.',
            'amount.gt'       => 'O valor deve ser maior que zero.',
            'method.required' => 'Selecione a forma de pagamento.',
        ]);

        $oldValues = [
            'amount'          => (float) $payment->amount,
            'method'          => $payment->method,
            'bank_account_id' => $payment->bank_account_id,
            'paid_at'         => (string) $payment->paid_at,
        ];

        $oldAmount = (float) $payment->amount;
        $newAmount = round((float) $data['amount'], 2);

        // Teto: total da venda menos o que os OUTROS pagamentos já cobrem
        $otherPaid = (float) $order->payments()->where('id', '!=', $payment->id)->sum('amount');
        $maxAmount = round((float) $order->total - $otherPaid, 2);

        if ($newAmount > $maxAmount + 0.001) {
            return back()->withErrors([
                'amount' => 'O valor não pode ser maior que ' . $this->money($maxAmount) . ' (o restante da venda).',
            ]);
        }

        $payment->update([
            'amount'          => $newAmount,
            'method'          => $data['method'],
            'bank_account_id' => $data['bank_account_id'] ?? null,
            'paid_at'         => $data['paid_at'],
            'notes'           => $data['notes'] ?? null,
        ]);

        // Reflete o novo valor no saldo e no status da venda
        $order->recalculatePayment();

        // Descreve o que realmente mudou — a troca de conta é o caso mais
        // comum e o que quebra a conferência do caixa quando passa batido.
        $mudancas = [];

        if (abs($oldAmount - (float) $payment->amount) > 0.001) {
            $mudancas[] = "valor de {$this->money($oldAmount)} para {$this->money((float) $payment->amount)}";
        }

        if ($oldValues['bank_account_id'] !== $payment->bank_account_id) {
            $de   = BankAccount::find($oldValues['bank_account_id'])?->name ?? 'sem conta';
            $para = BankAccount::find($payment->bank_account_id)?->name ?? 'sem conta';
            $mudancas[] = "conta de '{$de}' para '{$para}'";
        }

        if ($oldValues['method'] !== $payment->method) {
            $mudancas[] = "forma de pagamento";
        }

        AuditService::log(
            event:       'order.payment_updated',
            auditable:   $order->refresh(),
            oldValues:   $oldValues,
            newValues:   [
                'amount'          => (float) $payment->amount,
                'method'          => $payment->method,
                'bank_account_id' => $payment->bank_account_id,
                'paid_at'         => (string) $payment->paid_at,
                'payment_status'  => $order->payment_status,
            ],
            description: "Pagamento da Venda #{$order->order_number} corrigido"
                . ($mudancas ? ': ' . implode('; ', $mudancas) . '.' : '.'),
        );

        return back()->with('success', 'Pagamento corrigido com sucesso!');
    }

    /**
     * Anexa (ou substitui) o comprovante de um pagamento já registrado.
     */
    public function storeReceipt(Request $request, OrderPayment $payment): RedirectResponse
    {
        abort_unless($payment->company_id === Tenant::id(), 403);

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
        abort_unless($payment->company_id === Tenant::id(), 403);

        if ($payment->receipt_path) {
            Storage::disk('public')->delete($payment->receipt_path);
            $payment->update(['receipt_path' => null]);
        }

        return back()->with('success', 'Comprovante removido.');
    }

    private function money(float $value): string
    {
        return 'R$ ' . number_format($value, 2, ',', '.');
    }
}
