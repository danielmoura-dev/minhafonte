<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Edição NÃO altera preço (feito pela tela "Alterar Preço").
     */
    public function rules(): array
    {
        return [
            'code'           => ['nullable', 'string', 'max:50'],
            'name'           => ['required', 'string', 'max:150'],
            'controls_stock' => ['required', 'boolean'],
            'min_quantity'   => [Rule::requiredIf(fn () => $this->boolean('controls_stock')), 'nullable', 'numeric', 'min:0'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'photo'          => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'         => 'O nome do produto é obrigatório.',
            'min_quantity.required' => 'A quantidade mínima é obrigatória.',
            'min_quantity.numeric'  => 'A quantidade mínima deve ser um número.',
            'min_quantity.min'      => 'A quantidade mínima não pode ser negativa.',
            'photo.image'           => 'O arquivo deve ser uma imagem.',
            'photo.max'             => 'A imagem deve ter no máximo 2MB.',
        ];
    }
}
