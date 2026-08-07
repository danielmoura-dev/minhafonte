<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\Seller\AuthenticateSeller;
use App\Http\Middleware\Seller\RedirectIfSellerAuthenticated;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'auth.seller'  => AuthenticateSeller::class,
            'guest.seller' => RedirectIfSellerAuthenticated::class,

            // Permissões por módulo (ver App\Support\Permissions)
            'module'       => \App\Http\Middleware\EnsureModulePermission::class,
            'owner'        => \App\Http\Middleware\EnsureIsOwner::class,
            'user.active'  => \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        // Webhook da Evolution API é autenticado por token, não por sessão
        $middleware->validateCsrfTokens(except: [
            'webhooks/evolution',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Sem isso, um 403/404 devolve a página de erro crua do Laravel — sem
        // menu e sem caminho de volta. Vale tanto para navegação do Inertia
        // quanto para quem digitou a URL direto (aí não vem o X-Inertia).
        $exceptions->respond(function ($response, Throwable $e, Request $request) {
            if (! in_array($response->getStatusCode(), [403, 404, 419, 500, 503], true)) {
                return $response;
            }

            $isInertia = (bool) $request->header('X-Inertia');

            // Webhooks e chamadas JSON continuam recebendo a resposta padrão.
            if (! $isInertia && (! $request->acceptsHtml() || $request->expectsJson())) {
                return $response;
            }

            $user = $request->user();

            return Inertia::render('Error', [
                'status' => $response->getStatusCode(),
                // Link de volta que o usuário consegue abrir de fato — mandar
                // para o dashboard daria outro 403 em quem não tem o módulo.
                'home'   => $user?->homeRoute() ?? route('login'),
            ])
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        });
    })
    ->booted(function () {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(
                $request->input('email') . '|' . $request->ip()
            );
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('first-access', function (Request $request) {
            return Limit::perMinute(5)->by(
                $request->input('email') . '|' . $request->ip()
            );
        });

        RateLimiter::for('seller-login', function (Request $request) {
            return Limit::perMinute(5)->by(
                $request->input('email') . '|' . $request->ip()
            );
        });
    })
    ->create();