<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Company\UpdateCompanySettingsRequest;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingsController extends Controller
{
    public function edit(): Response
    {
        $company = Auth::user();

        return Inertia::render('Settings/Company', [
            'company' => $company->only([
                'company_name', 'fantasy_name', 'cnpj', 'email',
                'logo', 'logo_url', 'phone', 'address', 'city', 'state',
            ]),
            'hasCustomAdminPassword' => filled($company->admin_password),
        ]);
    }

    public function update(UpdateCompanySettingsRequest $request): RedirectResponse
    {
        $company = Auth::user();

        $data = $request->validated();
        unset($data['logo']);

        // Senha de administrador: só atualiza se foi informada (em branco mantém a atual).
        if (blank($data['admin_password'] ?? null)) {
            unset($data['admin_password']);
        }

        if ($request->hasFile('logo')) {
            if ($company->logo) {
                Storage::disk('public')->delete($company->logo);
            }
            $data['logo'] = $request->file('logo')->store('company', 'public');
        }

        $company->update($data);

        AuditService::log(
            event:       'company.settings_updated',
            auditable:   $company,
            description: 'Dados da empresa atualizados.',
        );

        return redirect()
            ->route('company.settings.edit')
            ->with('success', 'Dados da empresa atualizados com sucesso!');
    }
}
