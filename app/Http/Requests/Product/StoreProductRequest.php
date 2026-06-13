<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code'          => ['nullable', 'string', 'max:50'],
            'name'          => ['required', 'string', 'max:150'],
            'default_price' => ['required', 'numeric', 'min:0'],
            'description'   => ['nullable', 'string', 'max:1000'],
            'photo'         => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'          => 'O nome do produto é obrigatório.',
            'default_price.required' => 'O valor padrão é obrigatório.',
            'default_price.numeric'  => 'O valor padrão deve ser um número.',
            'default_price.min'      => 'O valor padrão não pode ser negativo.',
            'photo.image'            => 'O arquivo deve ser uma imagem.',
            'photo.max'              => 'A imagem deve ter no máximo 2MB.',
        ];
    }
}