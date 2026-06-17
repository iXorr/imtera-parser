<?php

namespace Database\Factories;

use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => (string) fake()->numberBetween(10000000000, 99999999999),
            'business_comment' => fake()->boolean(35) ? fake('ru_RU')->realText(rand(60, 200)) : null,
            'reviewId' => fake()->unique()->uuid(),
            'reviewer_name' => fake('ru_RU')->name(),
            'reviewer_avatar_url' => null,
            'reviewer_rating' => fake()->numberBetween(1, 5),
            'reviewer_comment' => fake()->boolean(85) ? fake('ru_RU')->realText(rand(80, 400)) : null,
            'updated_time' => fake()->dateTimeBetween('-2 years', 'now'),
        ];
    }
}