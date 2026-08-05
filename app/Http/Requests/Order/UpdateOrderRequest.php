<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id'           => ['required', Rule::exists('customers', 'id')->where('company_id', Auth::id())],
            'issue_date'            => ['required', 'date'],
            'due_date'              => ['nullable', 'date'],

            'delivery_street'       => ['nullable', 'string', 'max:255'],
            'delivery_number'       => ['nullable', 'string', 'max:20'],
            'delivery_complement'   => ['nullable', 'string', 'max:100'],
            'delivery_neighborhood' => ['nullable', 'string', 'max:100'],
            'delivery_city'         => ['nullable', 'string', 'max:100'],
            'delivery_state'        => ['nullable', 'string', 'max:2'],
            'delivery_zip_code'     => ['nullable', 'string', 'max:9'],

            'items'                 => ['required', 'array', 'min:1'],
            'items.*.product_id'    => ['required', Rule::exists('products', 'id')->where('company_id', Auth::id())],
            'items.*.quantity'      => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price'    => ['required', 'numeric', 'min:0'],

            'force'                 => ['boolean'],
            'notes'                 => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required'    => 'Selecione um cliente.',
            'customer_id.exists'      => 'Cliente inválido. Selecione um cliente da lista.',
            'issue_date.required'     => 'A data de emissão é obrigatória.',
            'items.required'          => 'Adicione ao menos um produto à venda.',
            'items.min'               => 'Adicione ao menos um produto à venda.',
            'items.*.product_id.required' => 'Selecione o produto em todos os itens.',
            'items.*.product_id.exists'   => 'Um dos produtos selecionados é inválido.',
            'items.*.quantity.required'   => 'Informe a quantidade em todos os itens.',
            'items.*.quantity.gt'         => 'A quantidade deve ser maior que zero.',
            'items.*.unit_price.required' => 'Informe o valor unitário em todos os itens.',
        ];
    }
}
