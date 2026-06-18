<?php

namespace App\DTO;

final readonly class ScrapedSummary
{
    public function __construct(
        public ?float $rating,
        public ?int $ratingsCount,
        public ?int $reviewsCount,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            rating: $data['rating'] ?? null,
            ratingsCount: $data['ratingsCount'] ?? null,
            reviewsCount: $data['reviewsCount'] ?? null,
        );
    }
}
