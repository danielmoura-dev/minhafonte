<?php

use App\Http\Controllers\Auth\AuthenticatedCompanyController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredCompanyController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirecionar raiz
Route::get('/', fn () => redirect()->route('login'));

// Rotas públicas (guest)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedCompanyController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedCompanyController::class, 'store'])->name('login.store');

    Route::get('/cadastro', [RegisteredCompanyController::class, 'create'])->name('register');
    Route::post('/cadastro', [RegisteredCompanyController::class, 'store'])->name('register.store');

    Route::get('/esqueci-senha', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/esqueci-senha', [PasswordResetLinkController::class, 'store'])->name('password.email');

    Route::get('/redefinir-senha/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/redefinir-senha', [NewPasswordController::class, 'store'])->name('password.update');
});

// Rotas autenticadas
Route::middleware('auth')->group(function () {

    // Logout
    Route::post('/logout', [AuthenticatedCompanyController::class, 'destroy'])->name('logout');

    // Verificação de e-mail
    Route::get('/verificar-email', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/verificar-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/verificar-email/reenviar', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Rotas protegidas (requer e-mail verificado ou acesso com modal de aviso)
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard/Index', [
            'totalSellers'  => 0,
            'birthdayToday' => [],
        ]);
    })->name('dashboard');

    // Placeholders
    Route::get('/vendedores', fn () => Inertia::render('Dashboard/Index'))->name('sellers.index');
    Route::get('/vendedores/criar', fn () => Inertia::render('Dashboard/Index'))->name('sellers.create');
    Route::get('/produtos', fn () => Inertia::render('Dashboard/Index'))->name('products.index');
    Route::get('/vendas', fn () => Inertia::render('Dashboard/Index'))->name('sales.index');
});