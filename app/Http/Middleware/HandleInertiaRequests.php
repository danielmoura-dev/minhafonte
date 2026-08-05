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
        return array_merge(parent::share($request), [
            'auth' => [
                'user'          => $request->user(),
                'emailVerified' => $request->user()?->hasVerifiedEmail(),
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

            // Contador de cobranças vencidas/vencendo hoje (bolinha na sidebar)
            'receivablesAlert' => function () use ($request) {
                $company = $request->user();

                if (! $company) {
                    return null;
                }

                $today = now()->toDateString();
                $base  = fn () => Order::fromCompany($company->id)->dueAlert();

                return [
                    'due_today' => (clone $base())->whereDate('due_date', $today)->count(),
                    'overdue'   => (clone $base())->whereDate('due_date', '<', $today)->count(),
                ];
            },
        ]);
    }
}