<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe a rota ao dono da conta.
 *
 * Usado no gerenciamento de usuários: se fosse uma permissão comum, quem a
 * recebesse poderia liberar qualquer acesso para si mesmo.
 */
class EnsureIsOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user && $user->is_owner && $user->is_active, 403);

        return $next($request);
    }
}
