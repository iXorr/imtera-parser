# Imtera parser

## Что бы я добавил

### Интеграция с ИИ (ключевая фишка Laravel 13)

```php
/**
 * Простенький пример интеграции:
 * по собранным отзывам ИИ генерирует
 * автоответы от лица компании.
 */

namespace App\Http\Controllers;

use App\Ai\Agents\ReviewsCoach;
use App\Models\Review;

class AutoReplyController extends Controller
{
  public function generateReplies()
  {
    Review::whereNull('business_comment')->chunk(100, function ($reviews) {
      foreach ($reviews as $review) {
        $reply = ReviewsCoach::make()
          ->prompt(
            "Напиши вежливый и краткий ответ от лица компании
            на этот отзыв (оценка {$review->rating}/5):
            {$review->text}"
          )
          ->text();

        $review->update(['business_comment' => $reply]);
      }
    });

    return response()->json(['status' => 'done']);
  }
}
```

### Хранение большего количества метаданных

В сущностях ``Organization`` и ``Review`` некоторые поля были "сплющены": в оригинальном API от Яндекса тот же комментарий от организации давался в виде объекта, а не строки. То же - с данными о пользователях, которые оставили отзывы.

### Кэширование

...
