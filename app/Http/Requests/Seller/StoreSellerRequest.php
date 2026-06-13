<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class StoreSellerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isIndividual = $this->input('person_type') === 'individual';

        return [
            'person_type'            => ['required', 'in:individual,legal_entity'],
            'name'                   => ['required', 'string', 'max:150'],
            'email'                  => ['nullable', 'email', 'max:150'],
            'phone'                  => ['required', 'string', 'max:20'],
            'city'                   => ['required', 'string', 'max:100'],
            'state'                  => ['required', 'string', 'size:2'],
            'photo'                  => ['nullable', 'image', 'max:2048'],
            'seller_type'            => ['required', 'in:commissioned,reseller'],
            'default_commission'     => ['nullable', 'numeric', 'min:0', 'max:100'],

            // Pessoa Física
            'cpf'                    => $isIndividual ? ['nullable', 'string', 'size:14'] : ['nullable'],
            'birth_date'             => $isIndividual ? ['required', 'date'] : ['nullable', 'date'],

            // Pessoa Jurídica
            'cnpj'                   => !$isIndividual ? ['nullable', 'string', 'size:18'] : ['nullable'],
            'company_name'           => !$isIndividual ? ['required', 'string', 'max:150'] : ['nullable'],
            'responsible_birth_date' => !$isIndividual ? ['required', 'date'] : ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'                   => 'O nome é obrigatório.',
            'phone.required'                  => 'O telefone é obrigatório.',
            'city.required'                   => 'A cidade é obrigatória.',
            'state.required'                  => 'O estado é obrigatório.',
            'seller_type.required'            => 'O tipo de vendedor é obrigatório.',
            'birth_date.required'             => 'A data de nascimento é obrigatória.',
            'company_name.required'           => 'A razão social é obrigatória.',
            'responsible_birth_date.required' => 'A data de nascimento do responsável é obrigatória.',
        ];
    }
}