<?php

namespace App\Http\Requests\RawMaterial;

use App\Models\RawMaterial;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRawMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Edição NÃO altera preço (feito pela tela "Alterar Preço")
     * nem código.
     */
    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:150'],
            'unit'           => ['required', Rule::in(RawMaterial::UNITS)],
            'controls_stock' => ['required', 'boolean'],
            'min_quantity'   => [Rule::requiredIf(fn () => $this->boolean('controls_stock')), 'nullable', 'numeric', 'min:0'],
            'photo'          => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'         => 'O nome da matéria-prima é obrigatório.',
            'unit.required'         => 'A unidade de medida é obrigatória.',
            'unit.in'               => 'Unidade de medida inválida.',
            'min_quantity.required' => 'A quantidade mínima é obrigatória.',
            'min_quantity.numeric'  => 'A quantidade mínima deve ser um número.',
            'min_quantity.min'      => 'A quantidade mínima não pode ser negativa.',
            'photo.image'           => 'O arquivo deve ser uma imagem.',
            'photo.max'             => 'A imagem deve ter no máximo 2MB.',
        ];
    }
}
