<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'rating' => $this->rating !== null ? (float) $this->rating : null,
            'ratings_count' => $this->ratings_count,
            'reviews_count' => $this->reviews_count,
            'created_at' => $this->created_at,
        ];
    }
}
