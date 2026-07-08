<?php

namespace App\Http\Requests\BankAccount;

use Illuminate\Foundation\Http\FormRequest;

class StoreBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'bank'         => ['nullable', 'string', 'max:255'],
            'agency'       => ['nullable', 'string', 'max:20'],
            'account'      => ['nullable', 'string', 'max:30'],
            'account_type' => ['nullable', 'string', 'max:30'],
            'is_active'    => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome da conta é obrigatório.',
        ];
    }
}
