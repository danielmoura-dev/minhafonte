<?php

use App\Http\Controllers\Auth\AuthenticatedCompanyController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredCompanyController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\Sale\SaleController;
use App\Http\Controllers\Seller\SellerController;
use Illuminate\Support\Facades\Auth;
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
    Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
        $companyId = Auth::id();
        $period    = $request->get('period', 'month');
        $month     = $request->get('month', now()->format('Y-m'));

        $salesQuery = \App\Models\Sale::fromCompany($companyId)->with(['seller', 'product']);

        if ($period === 'month' && preg_match('/^\d{4}-\d{2}$/', $month)) {
            [$year, $mon] = explode('-', $month);
            $salesQuery->whereYear('sale_date', $year)->whereMonth('sale_date', $mon);
        }

        $sales = $salesQuery->get();

        $topProducts = $sales->groupBy('product_id')->map(fn ($g) => [
            'name'     => $g->first()->product?->name ?? 'Produto removido',
            'quantity' => $g->sum('quantity'),
            'total'    => $g->sum('total'),
        ])->sortByDesc('total')->values()->take(8);

        $topSellers = $sales->groupBy('seller_id')->map(fn ($g) => [
            'name'        => $g->first()->seller?->name ?? 'Vendedor removido',
            'sales_count' => $g->count(),
            'total'       => $g->sum('total'),
            'commission'  => $g->sum('commission_total'),
        ])->sortByDesc('total')->values()->take(8);

        $byCity = $sales->groupBy(fn ($s) => $s->seller?->city ?? 'Não informada')
            ->map(fn ($g, $city) => [
                'city'  => $city,
                'count' => $g->count(),
                'total' => $g->sum('total'),
            ])->sortByDesc('total')->values()->take(8);

        $sellers = \App\Models\Seller::fromCompany($companyId)->get();

        return Inertia::render('Dashboard/Index', [
            'period' => $period,
            'month'  => $month,
            'kpis'   => [
                'total_sold'           => $sales->sum('total'),
                'total_received'       => $sales->where('payment_received', true)->sum('total'),
                'total_pending'        => $sales->where('payment_received', false)->sum('total'),
                'sales_count'          => $sales->count(),
                'commission_total'     => $sales->sum('commission_total'),
                'commission_paid'      => $sales->where('commission_paid', true)->sum('commission_total'),
                'commission_pending'   => $sales->where('commission_paid', false)->filter(fn ($s) => $s->commission_total > 0)->sum('commission_total'),
            ],
            'topProducts'   => $topProducts,
            'topSellers'    => $topSellers,
            'byCity'        => $byCity,
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

    Route::patch('/vendas/{sale}/toggle', [SaleController::class, 'toggle'])->name('sales.toggle');
});