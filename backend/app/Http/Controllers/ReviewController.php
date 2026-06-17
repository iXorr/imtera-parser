<?php

namespace App\Http\Controllers;

use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

use App\Http\Resources\ReviewResource;
use App\Models\Organization;
use App\Models\Review;

class ReviewController extends Controller
{
    public function index(Organization $organization): AnonymousResourceCollection
    {
        $reviews = Review::query()
            ->where('business_id', $organization->business_id)
            ->orderByDesc('updated_time')
            ->paginate(50);

        return ReviewResource::collection($reviews);
    }
}
