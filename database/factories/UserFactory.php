<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id'        => Company::factory(),
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password'          => 'Senha@12345',   // o cast 'hashed' cuida do hash
            'permissions'       => [],
            'is_owner'          => false,
            'is_active'         => true,
        ];
    }

    /** Dono da conta: ignora permissões e gerencia os demais usuários. */
    public function owner(): static
    {
        return $this->state(fn () => [
            'is_owner'    => true,
            'permissions' => null,
        ]);
    }

    /** Criado pelo dono e ainda sem senha definida. */
    public function pendingFirstAccess(): static
    {
        return $this->state(fn () => [
            'password'                => null,
            'first_access_at'         => null,
            'first_access_expires_at' => now()->addDays(7),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }
}
