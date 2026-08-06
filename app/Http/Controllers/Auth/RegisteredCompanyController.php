<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterCompanyRequest;
use App\Models\Company;
use App\Models\User;
use App\Services\AuditService;
use App\Services\ConsentService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
        $data = $request->validated();

        // Empresa e seu usuário-dono nascem juntos: uma empresa sem dono
        // ficaria sem ninguém capaz de entrar nela.
        [$company, $owner] = DB::transaction(function () use ($data) {
            $company = Company::create($data);

            $owner = $company->users()->create([
                'name'      => $data['fantasy_name'],
                'email'     => mb_strtolower(trim($data['email'])),
                'password'  => $data['password'],
                'is_owner'  => true,
                'is_active' => true,
            ]);

            return [$company, $owner];
        });

        event(new Registered($owner));

        ConsentService::record($company);

        AuditService::log(
            event:       'company.registered',
            auditable:   $company,
            newValues:   ['email' => $company->email, 'cnpj' => $company->cnpj],
            description: 'Nova empresa cadastrada.',
            actor:       $owner,
        );

        Auth::login($owner);

        return redirect()->route('verification.notice');
    }
}
