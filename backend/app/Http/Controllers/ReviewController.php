<?php

namespace App\Http\Controllers;

use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

use App\Http\Resources\ReviewResource;
use App\Models\Organization;

class ReviewController extends Controller
{
    public function index(Organization $organization): AnonymousResourceCollection
    {
        $reviews = $organization->reviews()
            ->orderByDesc('updated_time')
            ->paginate(50);

        return ReviewResource::collection($reviews);
    }
}
