<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Dashboard
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Index', [
        'totalSellers'  => 0,
        'birthdayToday' => [],
    ]);
})->name('dashboard');

// Placeholders para não quebrar links da Sidebar
Route::get('/vendedores', fn () => Inertia::render('Dashboard/Index'))->name('sellers.index');
Route::get('/vendedores/criar', fn () => Inertia::render('Dashboard/Index'))->name('sellers.create');
Route::get('/produtos', fn () => Inertia::render('Dashboard/Index'))->name('products.index');
Route::get('/vendas', fn () => Inertia::render('Dashboard/Index'))->name('sales.index');

Route::post('/logout', fn () => redirect('/dashboard'))->name('logout');

Route::get('/', fn () => redirect()->route('dashboard'));