<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\FirstAccessRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Primeiro acesso do funcionário: o dono cadastra a conta sem senha, e o
 * próprio funcionário define a dele ao entrar pela primeira vez.
 *
 * `users.email` tem índice único global, então "e-mail -> conta" é
 * inequívoco — não há como reivindicar o cadastro de outra empresa.
 */
class FirstAccessController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/FirstAccess', [
            'email' => (string) $request->session()->get('first_access_email', ''),
        ]);
    }

    public function store(FirstAccessRequest $request): RedirectResponse
    {
        $email = mb_strtolower(trim((string) $request->input('email')));
        $user  = User::where('email', $email)->first();

        // Mensagem única para todos os casos (não existe, já tem senha, está
        // desativado, prazo vencido): não revela o estado da conta.
        if (! $user || ! $user->is_active || ! $user->isPendingFirstAccess() || $user->firstAccessExpired()) {
            AuditService::log(
                event:       'user.first_access_failed',
                description: "Primeiro acesso recusado para: {$email}",
            );

            throw ValidationException::withMessages([
                'email' => 'Não foi possível concluir o primeiro acesso. Fale com o administrador da conta.',
            ]);
        }

        $user->forceFill([
            'password'                => $request->input('password'),   // o cast 'hashed' aplica o hash
            'first_access_at'         => now(),
            'first_access_expires_at' => null,
            'remember_token'          => Str::random(60),
        ])->save();

        Auth::login($user, true);
        $request->session()->regenerate();

        AuditService::log(
            event:       'user.first_access',
            auditable:   $user,
            description: 'Primeiro acesso concluído — senha definida.',
            actor:       $user,
        );

        return redirect()->intended($user->homeRoute());
    }
}
