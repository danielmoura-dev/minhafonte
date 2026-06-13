<?php

use App\Http\Controllers\Auth\AuthenticatedCompanyController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredCompanyController;
use App\Http\Controllers\Seller\SellerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect()->route('login'));

// Guest
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

// Autenticado
Route::middleware('auth')->group(function () {

    Route::post('/logout', [AuthenticatedCompanyController::class, 'destroy'])->name('logout');

    // Verificação de e-mail
    Route::get('/verificar-email', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/verificar-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/verificar-email/reenviar', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Dashboard
    Route::get('/dashboard', function () {
        $companyId = Auth::id();
        $sellers   = \App\Models\Seller::fromCompany($companyId)->get();

        return Inertia::render('Dashboard/Index', [
            'totalSellers'  => $sellers->count(),
            'birthdayToday' => $sellers->filter(fn ($s) => $s->isBirthdayToday())->values(),
        ]);
    })->name('dashboard');

    // Vendedores
    Route::resource('vendedores', SellerController::class)->parameters([
        'vendedores' => 'seller',
    ])->names([
        'index'   => 'sellers.index',
        'create'  => 'sellers.create',
        'store'   => 'sellers.store',
        'show'    => 'sellers.show',
        'edit'    => 'sellers.edit',
        'update'  => 'sellers.update',
        'destroy' => 'sellers.destroy',
    ]);

    // Placeholders
    Route::get('/produtos', fn () => Inertia::render('Dashboard/Index'))->name('products.index');
    Route::get('/vendas', fn () => Inertia::render('Dashboard/Index'))->name('sales.index');
});