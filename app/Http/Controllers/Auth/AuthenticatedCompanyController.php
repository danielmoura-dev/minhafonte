<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginCompanyRequest;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedCompanyController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(LoginCompanyRequest $request): RedirectResponse
    {
        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            AuditService::log(
                event:       'company.login_failed',
                description: "Tentativa de login falhou para: {$request->email}",
            );

            throw ValidationException::withMessages([
                'email' => 'E-mail ou senha incorretos.',
            ]);
        }

        $request->session()->regenerate();

        AuditService::log(
            event:       'company.login',
            auditable:   Auth::user(),
            description: 'Empresa autenticada com sucesso.',
            actor:       Auth::user(),
        );

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        AuditService::log(
            event:       'company.logout',
            auditable:   Auth::user(),
            description: 'Empresa encerrou a sessão.',
            actor:       Auth::user(),
        );

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}