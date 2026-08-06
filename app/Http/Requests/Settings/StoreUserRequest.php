<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
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
        return [
            'name'  => ['required', 'string', 'max:150'],
            // Único globalmente: é o que torna "e-mail -> conta" inequívoco no
            // primeiro acesso. Ignora os excluídos, cujo e-mail é liberado.
            'email' => [
                'required', 'email', 'max:150',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            // O conteúdo passa por Permissions::sanitize() antes de salvar.
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
