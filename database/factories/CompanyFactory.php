<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_name'      => fake()->company(),
            'fantasy_name'      => fake()->company(),
            'cnpj'              => fake()->unique()->numerify('##.###.###/####-##'),
            'email'             => fake()->unique()->safeEmail(),
            'password'          => 'Senha@12345',   // o cast 'hashed' cuida do hash
            'email_verified_at' => now(),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }
}
