<?php

namespace App\Http\Controllers;

use App\DTO\ScrapeResult;
use App\Exceptions\ScraperRequestException;
use App\Http\Requests\StoreSettingsRequest;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use App\Models\Review;
use App\Services\YandexMapsParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Синхронно: ждём scraper прямо в этом запросе (1-2 минуты — нормально
     * для внутреннего инструмента на одного пользователя), без очереди и
     * без polling на фронте.
     */
    public function store(StoreSettingsRequest $request, YandexMapsParser $parser): JsonResponse
    {
        $url = $request->validated('url');

        // Кэш по точному совпадению ссылки — не дёргать Яндекс повторно, если
        // уже парсили эту же ссылку меньше 6 часов назад. Не нормализуем URL,
        // так что разные формы ссылки на одну организацию кэш не разделяют —
        // осознанный компромис ради того, чтобы не дублировать в Laravel
        // парсинг ссылки, который и так делает scraper.
        $organization = Organization::where('url', $url)->first();

        $cacheFresh = $organization?->last_parsed_at !== null
            && $organization->last_parsed_at->gt(now()->subHours(6));

        if ($cacheFresh) {
            return (new OrganizationResource($organization))->response();
        }

        try {
            $result = $parser->parse($url);
        } catch (ScraperRequestException $e) {
            if ($organization) {
                $organization->update(['status' => 'failed']);
            }

            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        $organization = $this->persistScrapeResult($url, $result);

        return (new OrganizationResource($organization))->response();
    }

    private function persistScrapeResult(string $url, ScrapeResult $result): Organization
    {
        return DB::transaction(function () use ($url, $result) {
            $organization = Organization::updateOrCreate(
                ['business_id' => $result->businessId],
                [
                    'url' => $url,
                    'rating' => $result->summary->rating,
                    'ratings_count' => $result->summary->ratingsCount,
                    'reviews_count' => count($result->reviews),
                    'status' => 'done',
                    'last_parsed_at' => now(),
                ],
            );

            foreach ($result->reviews as $review) {
                Review::updateOrCreate(
                    ['reviewId' => $review->reviewId],
                    [
                        'business_id' => $organization->business_id,
                        'reviewer_name' => $review->authorName,
                        'reviewer_avatar_url' => $review->authorAvatarUrl,
                        'reviewer_rating' => $review->rating,
                        'reviewer_comment' => $review->text,
                        'business_comment' => $review->businessComment,
                        'updated_time' => $review->updatedTime,
                    ],
                );
            }

            return $organization;
        });
    }
}
