<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'               => ['required', Rule::in(['pf', 'pj'])],
            'name'               => ['required', 'string', 'max:255'],
            'phone'              => ['nullable', 'string', 'max:20'],
            'email'              => ['nullable', 'email', 'max:255'],
            'document'           => ['nullable', 'string', 'max:20'],
            'state_registration' => ['nullable', 'string', 'max:30'],
            'zip_code'           => ['nullable', 'string', 'max:9'],
            'street'             => ['nullable', 'string', 'max:255'],
            'number'             => ['nullable', 'string', 'max:20'],
            'complement'         => ['nullable', 'string', 'max:100'],
            'neighborhood'       => ['nullable', 'string', 'max:100'],
            'city'               => ['nullable', 'string', 'max:100'],
            'state'              => ['nullable', 'string', 'max:2'],
            'notes'              => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do cliente é obrigatório.',
        ];
    }
}
