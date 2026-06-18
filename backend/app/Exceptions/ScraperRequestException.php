<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Несёт HTTP-статус и сообщение от scraper-микросервиса как есть — Laravel
 * не интерпретирует, что именно пошло не так (битая ссылка, организация не
 * найдена, упёрлись в лимит Яндекса), просто прозрачно прокидывает на фронт.
 */
final class ScraperRequestException extends RuntimeException
{
    public function __construct(
        private readonly int $statusCode,
        string $message,
    ) {
        parent::__construct($message);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
