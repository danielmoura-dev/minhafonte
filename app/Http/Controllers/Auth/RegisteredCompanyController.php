<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterCompanyRequest;
use App\Models\Company;
use App\Services\AuditService;
use App\Services\ConsentService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredCompanyController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(RegisterCompanyRequest $request): RedirectResponse
    {
        $company = Company::create($request->validated());

        event(new Registered($company));

        ConsentService::record($company);

        AuditService::log(
            event:       'company.registered',
            auditable:   $company,
            newValues:   ['email' => $company->email, 'cnpj' => $company->cnpj],
            description: 'Nova empresa cadastrada.',
            actor:       $company,
        );

        Auth::login($company);

        return redirect()->route('verification.notice');
    }
}