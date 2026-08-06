<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetUserPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;   // a rota já exige o dono (middleware `owner` + policy)
    }

    public function rules(): array
    {
        return [
            // 'first_access' zera a senha e o funcionário define outra sozinho;
            // 'manual' é o dono digitando a senha nova.
            'mode'     => ['required', 'in:first_access,manual'],
            'password' => [
                'required_if:mode,manual',
                'nullable',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'mode.required'        => 'Escolha como redefinir a senha.',
            'password.required_if' => 'Informe a nova senha.',
            'password.confirmed'   => 'As senhas não conferem.',
        ];
    }
}
