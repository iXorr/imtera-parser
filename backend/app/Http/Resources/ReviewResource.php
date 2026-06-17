<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'reviewId' => $this->reviewId,
            'reviewer_name' => $this->reviewer_name,
            'reviewer_avatar_url' => $this->reviewer_avatar_url,
            'reviewer_rating' => $this->reviewer_rating,
            'reviewer_comment' => $this->reviewer_comment,
            'business_comment' => $this->business_comment,
            'updated_time' => $this->updated_time?->locale('ru')->isoFormat('D MMMM YYYY'),
        ];
    }
}
