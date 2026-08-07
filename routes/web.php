<?php

use App\Http\Controllers\Auth\AuthenticatedCompanyController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\FirstAccessController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredCompanyController;
use App\Http\Controllers\CeoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Customer\CustomerController;
use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Order\ReceivableController;
use App\Http\Controllers\Product\ProductController;
use App\Http\Controllers\RawMaterial\RawMaterialController;
use App\Http\Controllers\Sale\SaleController;
use App\Http\Controllers\Settings\BankAccountController;
use App\Http\Controllers\Settings\CompanySettingsController;
use App\Http\Controllers\Settings\UserController;
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

    // Primeiro acesso: conta criada pelo dono, senha definida pelo funcionário
    Route::get('/primeiro-acesso', [FirstAccessController::class, 'create'])->name('first-access');
    Route::post('/primeiro-acesso', [FirstAccessController::class, 'store'])
        ->middleware('throttle:first-access')
        ->name('first-access.store');

    Route::get('/esqueci-senha', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/esqueci-senha', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.email');

    Route::get('/redefinir-senha/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/redefinir-senha', [NewPasswordController::class, 'store'])->name('password.update');
});

// `user.active` derruba na hora quem for desativado, sem esperar o próximo
// login. Cada rota abaixo declara também o módulo/ação que exige.
Route::middleware(['auth', 'user.active'])->group(function () {

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
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('module:dashboard,view')->name('dashboard');

    // Usuário sem nenhum módulo liberado (o dono precisa ajustar as permissões)
    Route::get('/sem-acesso', fn () => Inertia::render('NoAccess'))->name('sem-acesso');

    // Painel do Dono — só consulta, nenhuma ação altera dados
    Route::middleware('module:ceo,view')->group(function () {
        Route::get('painel', [CeoController::class, 'index'])->name('ceo.index');
        Route::get('painel/contas', [CeoController::class, 'bankAccounts'])->name('ceo.bank-accounts');
        Route::get('painel/vendas', [CeoController::class, 'sales'])->name('ceo.sales');
        Route::get('painel/ranks', [CeoController::class, 'ranks'])->name('ceo.ranks');
    });

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
    ])
        ->middlewareFor(['index', 'show'],   'module:sellers,view')
        ->middlewareFor(['create', 'store'], 'module:sellers,create')
        ->middlewareFor(['edit', 'update'],  'module:sellers,edit')
        ->middlewareFor(['destroy'],         'module:sellers,delete');
    Route::patch('vendedores/{seller}/toggle-status', [SellerController::class, 'toggleStatus'])
        ->middleware('module:sellers,edit')->name('sellers.toggle-status');
    Route::get('vendedores/{seller}/relatorio', [SellerController::class, 'report'])
        ->middleware('module:sellers,view')->name('sellers.report');

    // Produtos — movimentação de estoque (rotas estáticas antes do resource)
    Route::get('produtos/movimentacao/nova', [\App\Http\Controllers\Product\ProductMovementController::class, 'create'])
        ->middleware('module:products,create')->name('products.movements.create');
    Route::post('produtos/movimentacao', [\App\Http\Controllers\Product\ProductMovementController::class, 'store'])
        ->middleware('module:products,create')->name('products.movements.store');
    Route::get('produtos/movimentacao/historico', [\App\Http\Controllers\Product\ProductMovementController::class, 'history'])
        ->middleware('module:products,view')->name('products.movements.history');

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
    // O controller não tem show(): sem isto, GET /produtos/5 estoura.
    ])->except('show')
        ->middlewareFor(['index'],           'module:products,view')
        ->middlewareFor(['create', 'store'], 'module:products,create')
        ->middlewareFor(['edit', 'update'],  'module:products,edit')
        ->middlewareFor(['destroy'],         'module:products,delete');
    Route::patch('produtos/{product}/toggle-status', [ProductController::class, 'toggleStatus'])
        ->middleware('module:products,edit')->name('products.toggle-status');
    Route::patch('produtos/{product}/preco', [ProductController::class, 'updatePrice'])
        ->middleware('module:products,edit')->name('products.update-price');
    Route::get('produtos/{product}/historico-precos', [ProductController::class, 'priceHistory'])
        ->middleware('module:products,view')->name('products.price-history');
    Route::get('produtos/{product}/receita', [\App\Http\Controllers\Product\ProductRecipeController::class, 'edit'])
        ->middleware('module:products,edit')->name('products.recipe.edit');
    Route::put('produtos/{product}/receita', [\App\Http\Controllers\Product\ProductRecipeController::class, 'update'])
        ->middleware('module:products,edit')->name('products.recipe.update');

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
    ])->except('show')
        ->middlewareFor(['index'],           'module:suppliers,view')
        ->middlewareFor(['create', 'store'], 'module:suppliers,create')
        ->middlewareFor(['edit', 'update'],  'module:suppliers,edit')
        ->middlewareFor(['destroy'],         'module:suppliers,delete');
    Route::patch('fornecedores/{supplier}/toggle-status', [SupplierController::class, 'toggleStatus'])
        ->middleware('module:suppliers,edit')->name('suppliers.toggle-status');

    // Vendas (Comissão)
    Route::resource('vendas', SaleController::class)->parameters([
        'vendas' => 'sale',
    ])->names([
        'index'   => 'sales.index',
        'create'  => 'sales.create',
        'store'   => 'sales.store',
        'edit'    => 'sales.edit',
        'update'  => 'sales.update',
        'destroy' => 'sales.destroy',
    // O controller não tem show(): sem isto, GET /vendas/5 estoura.
    ])->except('show')
        ->middlewareFor(['index'],           'module:commission_sales,view')
        ->middlewareFor(['create', 'store'], 'module:commission_sales,create')
        ->middlewareFor(['edit', 'update'],  'module:commission_sales,edit')
        ->middlewareFor(['destroy'],         'module:commission_sales,delete');
    Route::patch('vendas/{sale}/toggle', [SaleController::class, 'toggle'])
        ->middleware('module:commission_sales,edit')->name('sales.toggle');

    // Clientes (rotas estáticas antes do resource)
    Route::get('clientes/resumo', [CustomerController::class, 'reportAll'])
        ->middleware('module:customers,view')->name('customers.report-all');
    Route::get('clientes/{customer}/extrato', [CustomerController::class, 'report'])
        ->middleware('module:customers,view')->name('customers.report');

    Route::resource('clientes', CustomerController::class)->parameters([
        'clientes' => 'customer',
    ])->names([
        'index'   => 'customers.index',
        'create'  => 'customers.create',
        'store'   => 'customers.store',
        'show'    => 'customers.show',
        'edit'    => 'customers.edit',
        'update'  => 'customers.update',
        'destroy' => 'customers.destroy',
    ])
        ->middlewareFor(['index', 'show'],   'module:customers,view')
        ->middlewareFor(['create', 'store'], 'module:customers,create')
        ->middlewareFor(['edit', 'update'],  'module:customers,edit')
        ->middlewareFor(['destroy'],         'module:customers,delete');
    Route::patch('clientes/{customer}/toggle-status', [CustomerController::class, 'toggleStatus'])
        ->middleware('module:customers,edit')->name('customers.toggle-status');

    // Vendas (novo módulo de pedidos — rotas estáticas antes do resource)
    Route::get('pedidos/historico-exclusao', [OrderController::class, 'trashed'])
        ->middleware('module:orders,view')->name('orders.trashed');
    Route::get('pedidos/{order}/romaneio', [OrderController::class, 'romaneio'])
        ->middleware('module:orders,view')->name('orders.romaneio');
    Route::post('pedidos/{order}/desbloquear-edicao', [OrderController::class, 'unlockEdit'])
        ->middleware('module:orders,edit')->name('orders.unlock-edit');
    Route::resource('pedidos', OrderController::class)->parameters([
        'pedidos' => 'order',
    ])->names([
        'index'   => 'orders.index',
        'create'  => 'orders.create',
        'store'   => 'orders.store',
        'show'    => 'orders.show',
        'edit'    => 'orders.edit',
        'update'  => 'orders.update',
        'destroy' => 'orders.destroy',
    ])
        ->middlewareFor(['index', 'show'],   'module:orders,view')
        ->middlewareFor(['create', 'store'], 'module:orders,create')
        ->middlewareFor(['edit', 'update'],  'module:orders,edit')
        ->middlewareFor(['destroy'],         'module:orders,delete');

    // Recebimentos (módulo próprio: mexe com dinheiro, separado de Vendas)
    Route::get('recebimentos', [ReceivableController::class, 'index'])
        ->middleware('module:receivables,view')->name('receivables.index');
    Route::get('recebimentos/{order}', [ReceivableController::class, 'show'])
        ->middleware('module:receivables,view')->name('receivables.show');
    Route::post('recebimentos/{order}/pagamento', [ReceivableController::class, 'storePayment'])
        ->middleware('module:receivables,create')->name('receivables.payments.store');
    Route::put('recebimentos/pagamentos/{payment}', [ReceivableController::class, 'updatePayment'])
        ->middleware('module:receivables,edit')->name('receivables.payments.update');
    Route::post('recebimentos/pagamentos/{payment}/comprovante', [ReceivableController::class, 'storeReceipt'])
        ->middleware('module:receivables,edit')->name('receivables.receipt.store');
    Route::delete('recebimentos/pagamentos/{payment}/comprovante', [ReceivableController::class, 'destroyReceipt'])
        ->middleware('module:receivables,edit')->name('receivables.receipt.destroy');

    // Configurações — Dados da Empresa
    Route::get('configuracoes/empresa', [CompanySettingsController::class, 'edit'])
        ->middleware('module:company_settings,view')->name('company.settings.edit');
    Route::put('configuracoes/empresa', [CompanySettingsController::class, 'update'])
        ->middleware('module:company_settings,edit')->name('company.settings.update');

    // Configurações — Usuários
    Route::get('configuracoes/usuarios', [UserController::class, 'index'])
        ->middleware('module:users,view')->name('users.index');
    Route::post('configuracoes/usuarios', [UserController::class, 'store'])
        ->middleware('module:users,create')->name('users.store');
    Route::put('configuracoes/usuarios/{user}', [UserController::class, 'update'])
        ->middleware('module:users,edit')->name('users.update');
    Route::delete('configuracoes/usuarios/{user}', [UserController::class, 'destroy'])
        ->middleware('module:users,delete')->name('users.destroy');
    Route::patch('configuracoes/usuarios/{user}/status', [UserController::class, 'toggleStatus'])
        ->middleware('module:users,edit')->name('users.toggle-status');
    Route::post('configuracoes/usuarios/{user}/senha', [UserController::class, 'resetPassword'])
        ->middleware('module:users,edit')->name('users.reset-password');

    // Configurações — Conectar Bot (WhatsApp)
    Route::get('configuracoes/bot', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'edit'])
        ->middleware('module:bot,view')->name('bot.edit');
    Route::post('configuracoes/bot/conectar', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'connect'])
        ->middleware('module:bot,edit')->name('bot.connect');
    Route::get('configuracoes/bot/status', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'status'])
        ->middleware('module:bot,view')->name('bot.status');
    Route::post('configuracoes/bot/desconectar', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'disconnect'])
        ->middleware('module:bot,edit')->name('bot.disconnect');
    Route::post('configuracoes/bot/numeros', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'storeNumber'])
        ->middleware('module:bot,edit')->name('bot.numbers.store');
    Route::delete('configuracoes/bot/numeros/{number}', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'destroyNumber'])
        ->middleware('module:bot,edit')->name('bot.numbers.destroy');
    Route::patch('configuracoes/bot/numeros/{number}/notificacoes', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'toggleNumberNotifications'])
        ->middleware('module:bot,edit')->name('bot.numbers.toggle-notifications');
    Route::put('configuracoes/bot/notificacao', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'saveNotification'])
        ->middleware('module:bot,edit')->name('bot.notification.save');
    Route::post('configuracoes/bot/notificacao/testar', [\App\Http\Controllers\Settings\WhatsAppBotController::class, 'sendTestNotification'])
        ->middleware('module:bot,edit')->name('bot.notification.test');

    // Configurações — Contas Bancárias
    Route::resource('configuracoes/contas', BankAccountController::class)->parameters([
        'contas' => 'bankAccount',
    ])->names([
        'index'   => 'bank-accounts.index',
        'store'   => 'bank-accounts.store',
        'show'    => 'bank-accounts.show',
        'update'  => 'bank-accounts.update',
        'destroy' => 'bank-accounts.destroy',
    ])->only(['index', 'store', 'show', 'update', 'destroy'])
        ->middlewareFor(['index', 'show'], 'module:bank_accounts,view')
        ->middlewareFor(['store'],         'module:bank_accounts,create')
        ->middlewareFor(['update'],        'module:bank_accounts,edit')
        ->middlewareFor(['destroy'],       'module:bank_accounts,delete');
    Route::patch('configuracoes/contas/{bankAccount}/toggle-status', [BankAccountController::class, 'toggleStatus'])
        ->middleware('module:bank_accounts,edit')->name('bank-accounts.toggle-status');

    // Matéria-Prima — movimentação de estoque (rotas estáticas antes do resource)
    Route::get('materia-prima/movimentacao/nova', [\App\Http\Controllers\RawMaterial\RawMaterialMovementController::class, 'create'])
        ->middleware('module:raw_materials,create')->name('raw-materials.movements.create');
    Route::post('materia-prima/movimentacao', [\App\Http\Controllers\RawMaterial\RawMaterialMovementController::class, 'store'])
        ->middleware('module:raw_materials,create')->name('raw-materials.movements.store');
    Route::get('materia-prima/movimentacao/historico', [\App\Http\Controllers\RawMaterial\RawMaterialMovementController::class, 'history'])
        ->middleware('module:raw_materials,view')->name('raw-materials.movements.history');

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
    ])->except('show')
        ->middlewareFor(['index'],           'module:raw_materials,view')
        ->middlewareFor(['create', 'store'], 'module:raw_materials,create')
        ->middlewareFor(['edit', 'update'],  'module:raw_materials,edit')
        ->middlewareFor(['destroy'],         'module:raw_materials,delete');
    Route::patch('materia-prima/{rawMaterial}/toggle-status', [RawMaterialController::class, 'toggleStatus'])
        ->middleware('module:raw_materials,edit')->name('raw-materials.toggle-status');
    Route::patch('materia-prima/{rawMaterial}/preco', [RawMaterialController::class, 'updatePrice'])
        ->middleware('module:raw_materials,edit')->name('raw-materials.update-price');
    Route::get('materia-prima/{rawMaterial}/historico-precos', [RawMaterialController::class, 'priceHistory'])
        ->middleware('module:raw_materials,view')->name('raw-materials.price-history');
});

// -----------------------------------------------
// Webhooks (sem sessão; autenticados por token)
// -----------------------------------------------
Route::post('/webhooks/evolution', [\App\Http\Controllers\Webhook\EvolutionWebhookController::class, 'handle'])
    ->name('webhooks.evolution');

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