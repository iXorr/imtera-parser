<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // Формат ссылки не валидируем здесь — это делает сам scraper
            // (urlNormalizer.ts), Laravel лишь проверяет базовую вменяемость
            // входа и передаёт строку дальше как есть.
            'url' => ['required', 'string', 'max:2048'],
        ];
    }
}
