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
        // Sem isso, um 403/404 numa navegação do Inertia devolve a página de
        // erro crua do Laravel dentro do modal, em vez de uma tela do sistema.
        $exceptions->respond(function ($response, Throwable $e, Request $request) {
            if (! $request->header('X-Inertia')) {
                return $response;
            }

            if (! in_array($response->getStatusCode(), [403, 404, 419, 500, 503], true)) {
                return $response;
            }

            return Inertia::render('Error', ['status' => $response->getStatusCode()])
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