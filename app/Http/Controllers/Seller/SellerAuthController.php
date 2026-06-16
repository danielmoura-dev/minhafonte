<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\SellerFirstAccessRequest;
use App\Http\Requests\Seller\SellerLoginRequest;
use App\Models\Seller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SellerAuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Seller/Login');
    }

    public function login(SellerLoginRequest $request): RedirectResponse
    {
        $seller = Seller::where('email', $request->email)
            ->whereNotNull('password')
            ->first();

        if (! $seller || ! Hash::check($request->password, $seller->password)) {
            throw ValidationException::withMessages([
                'email' => 'E-mail ou senha incorretos.',
            ]);
        }

        auth('seller')->login($seller, $request->boolean('remember'));

        $request->session()->regenerate();

        return redirect()->route('seller.dashboard');
    }

    public function showFirstAccess(): Response
    {
        return Inertia::render('Seller/FirstAccess');
    }

    public function firstAccess(SellerFirstAccessRequest $request): RedirectResponse
    {
        $seller = Seller::where('email', $request->email)->first();

        if ($seller->password) {
            throw ValidationException::withMessages([
                'email' => 'Este e-mail já possui acesso configurado. Faça login normalmente.',
            ]);
        }

        $seller->update([
            'password'         => Hash::make($request->password),
            'first_access_at'  => now(),
        ]);

        auth('seller')->login($seller, true);

        $request->session()->regenerate();

        return redirect()->route('seller.dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        auth('seller')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('seller.login');
    }
}