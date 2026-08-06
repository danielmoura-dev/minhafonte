<?php

namespace App\Http\Middleware;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                // Só o necessário: antes ia o model inteiro da empresa, o que
                // levava CNPJ, endereço e telefone para toda página.
                'user' => $user ? [
                    'id'       => $user->id,
                    'name'     => $user->name,
                    'email'    => $user->email,
                    'is_owner' => (bool) $user->is_owner,
                ] : null,

                'company' => $user?->company?->only([
                    'id', 'fantasy_name', 'company_name', 'logo_url',
                ]),

                // '*' = dono (ignora permissões); objeto = mapa módulo -> ações
                'permissions' => $user
                    ? ($user->is_owner ? '*' : ((object) ($user->permissions ?? [])))
                    : null,

                'emailVerified' => $user?->hasVerifiedEmail(),
                'seller'        => auth('seller')->user(),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'status'  => fn () => $request->session()->get('status'),
            ],
            'vapidPublicKey' => config('services.vapid.public_key'),

            // Contador de cobranças vencidas/vencendo hoje (bolinha na sidebar).
            // Só para quem tem acesso a Recebimentos — senão o número vazaria
            // um dado de módulo que o usuário nem consegue abrir.
            'receivablesAlert' => function () use ($user) {
                if (! $user || ! $user->hasPermission('receivables')) {
                    return null;
                }

                $today = now()->toDateString();
                $base  = fn () => Order::fromCompany($user->company_id)->dueAlert();

                return [
                    'due_today' => (clone $base())->whereDate('due_date', $today)->count(),
                    'overdue'   => (clone $base())->whereDate('due_date', '<', $today)->count(),
                ];
            },
        ]);
    }
}