<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\BankAccount\StoreBankAccountRequest;
use App\Http\Requests\BankAccount\UpdateBankAccountRequest;
use App\Models\BankAccount;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', BankAccount::class);

        $accounts = BankAccount::fromCompany(Auth::id())
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/BankAccounts', [
            'accounts' => $accounts,
        ]);
    }

    public function store(StoreBankAccountRequest $request): RedirectResponse
    {
        $this->authorize('create', BankAccount::class);

        $data = $request->validated();
        $data['company_id'] = Auth::id();

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
