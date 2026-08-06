<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;   // a rota já exige o dono (middleware `owner` + policy)
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name'  => ['required', 'string', 'max:150'],
            'email' => [
                'required', 'email', 'max:150',
                Rule::unique('users', 'email')->whereNull('deleted_at')->ignore($userId),
            ],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['array'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'Informe o nome do usuário.',
            'email.required' => 'Informe o e-mail.',
            'email.email'    => 'E-mail inválido.',
            'email.unique'   => 'Este e-mail já está em uso.',
        ];
    }
}
