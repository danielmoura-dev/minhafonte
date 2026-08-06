<?php

namespace App\Http\Middleware;

use App\Support\Permissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe a rota a quem tem a permissão do módulo.
 *
 * Uso: `->middleware('module:orders,create')`. Sem a ação, exige 'view'.
 *
 * É a primeira das três camadas (rota, policy, sidebar). A sidebar apenas
 * esconde; quem manda é aqui e nas policies.
 */
class EnsureModulePermission
{
    public function handle(Request $request, Closure $next, string $module, string $action = Permissions::VIEW): Response
    {
        $user = $request->user();

        // O middleware `auth` já rodou antes, mas não custa não confiar.
        if (! $user) {
            abort(403);
        }

        abort_unless($user->hasPermission($module, $action), 403);

        return $next($request);
    }
}
