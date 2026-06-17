<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'business_id' => ['required', 'string', 'max:255', 'unique:organizations,business_id'],
            'rating' => ['nullable', 'numeric', 'between:0,5'],
            'ratings_count' => ['nullable', 'integer', 'min:0'],
            'reviews_count' => ['nullable', 'integer', 'min:0'],

            'reviews' => ['nullable', 'array'],
            'reviews.*.reviewId' => ['required_with:reviews', 'string', 'max:255'],
            'reviews.*.business_comment' => ['nullable', 'string'],
            'reviews.*.reviewer_name' => ['nullable', 'string', 'max:255'],
            'reviews.*.reviewer_avatar_url' => ['nullable', 'string', 'max:2048'],
            'reviews.*.reviewer_rating' => ['required_with:reviews', 'integer', 'between:1,5'],
            'reviews.*.reviewer_comment' => ['nullable', 'string'],
            'reviews.*.updated_time' => ['nullable', 'date'],
        ];
    }
}
