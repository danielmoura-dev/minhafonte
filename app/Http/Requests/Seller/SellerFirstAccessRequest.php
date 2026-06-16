<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class SellerFirstAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'email', 'exists:sellers,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'    => 'O e-mail é obrigatório.',
            'email.exists'      => 'E-mail não encontrado no sistema.',
            'password.required' => 'A senha é obrigatória.',
            'password.confirmed'=> 'As senhas não conferem.',
        ];
    }
}