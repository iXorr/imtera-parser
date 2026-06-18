<?php

namespace App\DTO;

final readonly class ScrapeResult
{
    /** @param array<int, ScrapedReview> $reviews */
    public function __construct(
        public string $businessId,
        public ScrapedSummary $summary,
        public array $reviews,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            businessId: $data['businessId'],
            summary: ScrapedSummary::fromArray($data['summary'] ?? []),
            reviews: array_map(
                fn (array $review) => ScrapedReview::fromArray($review),
                $data['reviews'] ?? [],
            ),
        );
    }
}
