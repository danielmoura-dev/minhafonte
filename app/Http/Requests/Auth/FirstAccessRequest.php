<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class FirstAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Sem `exists:users,email` de propósito: a mensagem específica de
            // "não existe" revelaria quais e-mails estão cadastrados. Quem
            // valida isso é o controller, com uma mensagem única.
            'email'    => ['required', 'email', 'max:150'],
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
            'email.required'     => 'Informe o e-mail.',
            'email.email'        => 'E-mail inválido.',
            'password.required'  => 'Crie uma senha.',
            'password.confirmed' => 'As senhas não conferem.',
        ];
    }
}
