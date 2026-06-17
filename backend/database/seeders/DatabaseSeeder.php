<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $organization = Organization::factory()->create();

        Review::factory(120)->create([
            'business_id' => $organization->business_id,
        ]);
    }
}