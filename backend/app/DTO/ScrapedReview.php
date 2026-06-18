<?php

namespace App\DTO;

final readonly class ScrapedReview
{
    public function __construct(
        public string $reviewId,
        public ?string $businessId,
        public ?string $authorName,
        public ?string $authorAvatarUrl,
        public ?int $rating,
        public ?string $text,
        public ?string $businessComment,
        public ?string $updatedTime,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            reviewId: $data['reviewId'],
            businessId: $data['businessId'] ?? null,
            authorName: $data['authorName'] ?? null,
            authorAvatarUrl: $data['authorAvatarUrl'] ?? null,
            rating: $data['rating'] ?? null,
            text: $data['text'] ?? null,
            businessComment: $data['businessComment'] ?? null,
            updatedTime: $data['updatedTime'] ?? null,
        );
    }
}
