<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginCompanyRequest;
use App\Models\User;
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
        $email = mb_strtolower(trim((string) $request->input('email')));
        $user  = User::where('email', $email)->first();

        // Conta criada pelo dono que ainda não definiu senha: em vez de dizer
        // "senha incorreta", leva para o primeiro acesso.
        if ($user && $user->is_active && $user->isPendingFirstAccess() && ! $user->firstAccessExpired()) {
            return redirect()->route('first-access')->with('first_access_email', $email);
        }

        // Sem senha definida e inativo caem na MESMA mensagem genérica de
        // credencial inválida — não revelamos o estado da conta.
        $authenticated = $user
            && $user->is_active
            && ! $user->isPendingFirstAccess()
            && Auth::attempt(
                ['email' => $email, 'password' => $request->input('password')],
                $request->boolean('remember'),
            );

        if (! $authenticated) {
            AuditService::log(
                event:       'user.login_failed',
                description: "Tentativa de login falhou para: {$email}",
            );

            throw ValidationException::withMessages([
                'email' => 'E-mail ou senha incorretos.',
            ]);
        }

        // A página que a pessoa tentou abrir antes de logar precisa ser lida
        // ANTES de regenerar a sessão.
        $intended = $request->session()->pull('url.intended');

        $request->session()->regenerate();

        $user = Auth::user();

        AuditService::log(
            event:       'user.login',
            auditable:   $user,
            description: 'Usuário autenticado com sucesso.',
            actor:       $user,
        );

        // Só volta para a página pretendida se ela for acessível — senão a
        // pessoa entraria direto num 403. Sem pretendida, vai para a primeira
        // tela que ela pode abrir.
        return redirect()->to($user->landingUrl($intended));
    }

    public function destroy(Request $request): RedirectResponse
    {
        AuditService::log(
            event:       'user.logout',
            auditable:   Auth::user(),
            description: 'Usuário encerrou a sessão.',
            actor:       Auth::user(),
        );

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
