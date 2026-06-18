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

И нет данных о кол-во лайках на отзыве, например.

### Экран ожидания/polling на фронте

``POST /api/settings`` уже отдаёт 202 + статус (pending/processing/done/failed) + **last_parsed_at**, но ``SettingsView.vue`` пока просто перечитывает список организаций без поллинга

### Сервер простаивает в одном запросе при сборе отзывов

Потенциальный фикс: Laravel Job, статус организации = PENDING

### Прерванные скрейпы 

Например, ответ "собрано 99 из 500 запрошенных"; вопрос — добавить кнопку сброса/повтора?

### Преодоление лимита в 600 отзывов

Пока это невозможно:

<img src="./misc/yandex-limit.jpg" alt="screen">

### Добавить progress-bar в фронтенд

Получив количество отзывов и TARGET-значение, можно рассчитать примерное время, когда скрейп будет завершён: например, менее 50 отзывов собирается за 3-5 секунд в среднем, от 50 до 100 - около 6, и т.д.
