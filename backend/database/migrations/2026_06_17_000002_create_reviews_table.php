<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('business_id')->index();
            $table->string('reviewId')->unique();
            $table->string('reviewer_name')->nullable();
            $table->string('reviewer_avatar_url')->nullable();
            $table->unsignedTinyInteger('reviewer_rating')->nullable();
            $table->text('reviewer_comment')->nullable();
            $table->text('business_comment')->nullable();
            $table->timestamp('updated_time')->nullable();
            $table->timestamps();

            $table->foreign('business_id')
                ->references('business_id')->on('organizations')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};