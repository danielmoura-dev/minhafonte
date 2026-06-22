<?php

use App\Http\Controllers\Auth\AuthenticatedCompanyController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredCompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\RawMaterial\RawMaterialController;
use App\Http\Controllers\Sale\SaleController;
use App\Http\Controllers\Supplier\SupplierController;
use App\Http\Controllers\Seller\SellerAuthController;
use App\Http\Controllers\Seller\SellerController;
use App\Http\Controllers\Seller\SellerDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Raiz
Route::get('/', fn () => redirect()->route('login'));

// Páginas legais (públicas)
Route::get('/termos', fn () => Inertia::render('Legal/Terms'))->name('terms');
Route::get('/privacidade', fn () => Inertia::render('Legal/Privacy'))->name('privacy');

// -----------------------------------------------
// Área da Empresa
// -----------------------------------------------
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedCompanyController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedCompanyController::class, 'store'])
        ->middleware('throttle:login')
        ->name('login.store');

    Route::get('/cadastro', [RegisteredCompanyController::class, 'create'])->name('register');
    Route::post('/cadastro', [RegisteredCompanyController::class, 'store'])
        ->middleware('throttle:register')
        ->name('register.store');

    Route::get('/esqueci-senha', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/esqueci-senha', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.email');

    Route::get('/redefinir-senha/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/redefinir-senha', [NewPasswordController::class, 'store'])->name('password.update');
});

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
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

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
    Route::patch('vendedores/{seller}/toggle-status', [SellerController::class, 'toggleStatus'])
        ->name('sellers.toggle-status');
    Route::get('vendedores/{seller}/relatorio', [SellerController::class, 'report'])
        ->name('sellers.report');

    // Produtos
    Route::resource('produtos', ProductController::class)->parameters([
        'produtos' => 'product',
    ])->names([
        'index'   => 'products.index',
        'create'  => 'products.create',
        'store'   => 'products.store',
        'edit'    => 'products.edit',
        'update'  => 'products.update',
        'destroy' => 'products.destroy',
    ]);
    Route::patch('produtos/{product}/toggle-status', [ProductController::class, 'toggleStatus'])
        ->name('products.toggle-status');

    // Fornecedores
    Route::resource('fornecedores', SupplierController::class)->parameters([
        'fornecedores' => 'supplier',
    ])->names([
        'index'   => 'suppliers.index',
        'create'  => 'suppliers.create',
        'store'   => 'suppliers.store',
        'edit'    => 'suppliers.edit',
        'update'  => 'suppliers.update',
        'destroy' => 'suppliers.destroy',
    ])->except('show');
    Route::patch('fornecedores/{supplier}/toggle-status', [SupplierController::class, 'toggleStatus'])
        ->name('suppliers.toggle-status');

    // Vendas
    Route::resource('vendas', SaleController::class)->parameters([
        'vendas' => 'sale',
    ])->names([
        'index'   => 'sales.index',
        'create'  => 'sales.create',
        'store'   => 'sales.store',
        'edit'    => 'sales.edit',
        'update'  => 'sales.update',
        'destroy' => 'sales.destroy',
    ]);
    Route::patch('vendas/{sale}/toggle', [SaleController::class, 'toggle'])->name('sales.toggle');

    // Matéria-Prima — movimentação de estoque (rotas estáticas antes do resource)
    Route::get('materia-prima/movimentacao/nova', [\App\Http\Controllers\RawMaterial\RawMaterialMovementController::class, 'create'])
        ->name('raw-materials.movements.create');
    Route::post('materia-prima/movimentacao', [\App\Http\Controllers\RawMaterial\RawMaterialMovementController::class, 'store'])
        ->name('raw-materials.movements.store');
    Route::get('materia-prima/movimentacao/historico', [\App\Http\Controllers\RawMaterial\RawMaterialMovementController::class, 'history'])
        ->name('raw-materials.movements.history');

    // Matéria-Prima
    Route::resource('materia-prima', RawMaterialController::class)->parameters([
        'materia-prima' => 'rawMaterial',
    ])->names([
        'index'   => 'raw-materials.index',
        'create'  => 'raw-materials.create',
        'store'   => 'raw-materials.store',
        'edit'    => 'raw-materials.edit',
        'update'  => 'raw-materials.update',
        'destroy' => 'raw-materials.destroy',
    ])->except('show');
    Route::patch('materia-prima/{rawMaterial}/toggle-status', [RawMaterialController::class, 'toggleStatus'])
        ->name('raw-materials.toggle-status');
    Route::patch('materia-prima/{rawMaterial}/preco', [RawMaterialController::class, 'updatePrice'])
        ->name('raw-materials.update-price');
    Route::get('materia-prima/{rawMaterial}/historico-precos', [RawMaterialController::class, 'priceHistory'])
        ->name('raw-materials.price-history');
});

// -----------------------------------------------
// Área do Vendedor
// -----------------------------------------------
Route::prefix('vendedor')->name('seller.')->group(function () {

    Route::middleware('guest.seller')->group(function () {
        Route::get('/login', [SellerAuthController::class, 'showLogin'])->name('login');
        Route::post('/login', [SellerAuthController::class, 'login'])
            ->middleware('throttle:seller-login')
            ->name('login.store');

        Route::get('/primeiro-acesso', [SellerAuthController::class, 'showFirstAccess'])->name('first-access');
        Route::post('/primeiro-acesso', [SellerAuthController::class, 'firstAccess'])
            ->middleware('throttle:3,1')
            ->name('first-access.store');
    });

    Route::middleware('auth.seller')->group(function () {
        Route::post('/logout', [SellerAuthController::class, 'logout'])->name('logout');
        Route::get('/dashboard', [SellerDashboardController::class, 'index'])->name('dashboard');
        Route::get('/fabrica', [\App\Http\Controllers\Seller\SellerFabricaController::class, 'index'])->name('fabrica');

        // Clientes do vendedor
        Route::get('/clientes', [\App\Http\Controllers\Seller\SellerClientController::class, 'index'])->name('clientes');
        Route::post('/clientes', [\App\Http\Controllers\Seller\SellerClientController::class, 'store'])->name('clientes.store');
        Route::get('/clientes/{client}', [\App\Http\Controllers\Seller\SellerClientController::class, 'show'])->name('clientes.show');
        Route::post('/clientes/{client}', [\App\Http\Controllers\Seller\SellerClientController::class, 'update'])->name('clientes.update');
        Route::delete('/clientes/{client}', [\App\Http\Controllers\Seller\SellerClientController::class, 'destroy'])->name('clientes.destroy');
        Route::patch('/clientes/{client}/toggle-status', [\App\Http\Controllers\Seller\SellerClientController::class, 'toggleStatus'])->name('clientes.toggle-status');

        // Vendas do vendedor para seus clientes
        Route::get('/vendas', [\App\Http\Controllers\Seller\SellerClientSaleController::class, 'index'])->name('vendas');
        Route::post('/vendas', [\App\Http\Controllers\Seller\SellerClientSaleController::class, 'store'])->name('vendas.store');
        Route::delete('/vendas/{sale}', [\App\Http\Controllers\Seller\SellerClientSaleController::class, 'destroy'])->name('vendas.destroy');
        Route::patch('/vendas/{sale}/toggle', [\App\Http\Controllers\Seller\SellerClientSaleController::class, 'toggle'])->name('vendas.toggle');

        // Push notifications
        Route::post('/push/subscribe', [\App\Http\Controllers\Seller\PushSubscriptionController::class, 'store'])->name('push.subscribe');
        Route::delete('/push/unsubscribe', [\App\Http\Controllers\Seller\PushSubscriptionController::class, 'destroy'])->name('push.unsubscribe');
    });
});