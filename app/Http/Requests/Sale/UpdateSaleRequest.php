<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'seller_id'             => ['required', 'integer', 'exists:sellers,id'],
            'product_id'            => ['required', 'integer', 'exists:products,id'],
            'sale_date'             => ['required', 'date'],
            'unit_price'            => ['required', 'numeric', 'min:0'],
            'quantity'              => ['required', 'integer', 'min:1'],
            'commission_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payment_received'      => ['boolean'],
            'commission_paid'       => ['boolean'],
            'notes'                 => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'seller_id.required'  => 'Selecione um vendedor.',
            'product_id.required' => 'Selecione um produto.',
            'sale_date.required'  => 'A data da venda é obrigatória.',
            'unit_price.required' => 'O valor unitário é obrigatório.',
            'quantity.required'   => 'A quantidade é obrigatória.',
            'quantity.min'        => 'A quantidade mínima é 1.',
        ];
    }
}