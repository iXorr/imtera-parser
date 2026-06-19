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

        // /api/settings — это «подключить новую организацию», не «обновить
        // существующую»: если ссылка уже подключена, это не повод молча
        // вернуть закэшированные данные, а повод вернуть ошибку.
        if (Organization::where('url', $url)->exists()) {
            return response()->json([
                'message' => 'Эта организация уже подключена.',
            ], 409);
        }

        try {
            $result = $parser->parse($url);
        } catch (ScraperRequestException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        // Та же организация может быть подключена под другой ссылкой —
        // businessId узнаём только после скрейпа, проверяем дубликат и тут.
        if (Organization::where('business_id', $result->businessId)->exists()) {
            return response()->json([
                'message' => 'Эта организация уже подключена.',
            ], 409);
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
                    'name' => $result->name,
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
