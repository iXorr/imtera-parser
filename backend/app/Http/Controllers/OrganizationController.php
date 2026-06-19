<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Models\Review;

class OrganizationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $organizations = Organization::query()
            ->latest()
            ->paginate(5);

        return OrganizationResource::collection($organizations);
    }

    public function store(StoreOrganizationRequest $request): OrganizationResource
    {
        $organization = DB::transaction(function () use ($request) {
            $organization = Organization::create($request->safe()->except('reviews'));

            foreach ($request->input('reviews', []) as $review) {
                Review::create([
                    ...$review,
                    'business_id' => $organization->business_id,
                ]);
            }

            return $organization;
        });

        return new OrganizationResource($organization);
    }
}
