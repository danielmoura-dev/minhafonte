<?php

namespace App\Http\Requests\Order;

use App\Support\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'          => ['required', 'numeric', 'gt:0'],
            'method'          => ['required', Rule::in(['deposit', 'cash', 'cheque'])],
            'bank_account_id' => ['nullable', Rule::exists('bank_accounts', 'id')->where('company_id', Tenant::id())],
            'paid_at'         => ['required', 'date'],
            'notes'           => ['nullable', 'string', 'max:1000'],
            'receipt'         => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Informe o valor do pagamento.',
            'amount.gt'       => 'O valor deve ser maior que zero.',
            'method.required' => 'Selecione a forma de pagamento.',
            'paid_at.required'=> 'Informe a data do pagamento.',
        ];
    }
}
