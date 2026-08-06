<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Derruba na hora quem foi desativado.
 *
 * Sem isso, desativar um funcionário só teria efeito no próximo login — ele
 * continuaria trabalhando normalmente com a sessão que já estava aberta.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Seu acesso foi desativado. Fale com o administrador da conta.',
            ]);
        }

        return $next($request);
    }
}
