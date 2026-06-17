<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Organization>
 */
class OrganizationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => (string) fake()->unique()->numberBetween(10000000000, 99999999999),
            'rating' => fake()->randomFloat(1, 3.5, 5.0),
            'ratings_count' => fake()->numberBetween(50, 700),
            'reviews_count' => fake()->numberBetween(20, 600),
        ];
    }
}