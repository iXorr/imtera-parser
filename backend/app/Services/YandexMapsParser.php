<?php

namespace App\Services;

use App\DTO\ScrapeResult;
use App\Exceptions\ScraperRequestException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class YandexMapsParser
{
    /**
     * Запускает скрапинг карточки организации через scraper-микросервис и
     * ждёт результат синхронно — это внутренний инструмент на одного
     * пользователя, очередь/воркер ради этого не заводим. Один скрейп может
     * занимать 1-2 минуты (12+ итераций скролла с таймаутом на каждой).
     */
    public function parse(string $organizationUrl): ScrapeResult
    {
        try {
            $response = Http::baseUrl(config('services.scraper.url'))
                ->timeout(300)
                ->post('/scrape', ['organizationUrl' => $organizationUrl]);
        } catch (ConnectionException $e) {
            throw new ScraperRequestException(503, "Scraper недоступен: {$e->getMessage()}");
        }

        if ($response->failed()) {
            throw new ScraperRequestException(
                $response->status(),
                $response->json('error') ?? $response->body(),
            );
        }

        return ScrapeResult::fromArray($response->json());
    }
}
