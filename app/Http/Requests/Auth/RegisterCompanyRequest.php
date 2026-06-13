<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:150'],
            'fantasy_name' => ['required', 'string', 'max:150'],
            'cnpj'         => ['required', 'string', 'size:18', 'unique:companies,cnpj'],
            'email'        => ['required', 'email', 'max:150', 'unique:companies,email'],
            'password'     => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'company_name.required' => 'A razão social é obrigatória.',
            'fantasy_name.required' => 'O nome fantasia é obrigatório.',
            'cnpj.required'         => 'O CNPJ é obrigatório.',
            'cnpj.size'             => 'O CNPJ deve estar no formato 00.000.000/0000-00.',
            'cnpj.unique'           => 'Este CNPJ já está cadastrado.',
            'email.required'        => 'O e-mail é obrigatório.',
            'email.unique'          => 'Este e-mail já está cadastrado.',
            'password.required'     => 'A senha é obrigatória.',
            'password.confirmed'    => 'As senhas não conferem.',
        ];
    }
}