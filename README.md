# Imtera parser

## Что бы я добавил

Интеграцию с ИИ. Это - ключевая фишка Laravel 13.

```php
/**
 * Простенький пример интеграции:
 * по собранным отзывам ИИ делает
 * единый вывод.
 */

namespace App\Http\Controllers;

use App\Ai\Agents\ReviewsCoach;
use App\Models\Review;

class UserController extends Controller
{
  public function getReport()
  {
    $summaries = [];
    
    Review::chunk(100, function ($reviews) use (&$summaries) {
      $summaries[] = ReviewsCoach::make()
        ->prompt(
          "Проанализируй эти отзывы... 
          <подробный промпт>... 
          и верни общую сводку по ним: {$reviews->toJson()}"
        )
        ->text();
    });
    
    $finalReport = ReviewsCoach::make()
      ->prompt("Объедини эти сводки в отчёт: " . implode("\n\n", $summaries));
  
    return view("pages.final-report", [
      "finalReport" => $finalReport
    ]);
  }
}
```
