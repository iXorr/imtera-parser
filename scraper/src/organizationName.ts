// Яндекс.Карты добавляют к <title> страницы организации суффикс вида
// «— Яндекс Карты» (тире и точка между «Яндекс» и «Карты» — не проверены
// на живом трафике: нет исходящего интернета в этой среде разработки,
// нужно сверить на реальной странице и поправить при необходимости).
const YANDEX_MAPS_SUFFIX = /\s*[—–-]\s*Яндекс\.?\s*Карты\s*$/iu;

// На странице отзывов title начинается с «Отзывы о ...» — это не часть
// названия организации, отрезаем так же, как и суффикс выше.
const REVIEWS_PREFIX = /^\s*Отзывы\s+о\s+/iu;

export function parseOrganizationName(title: string): string | null {
  const name = title
    .replace(YANDEX_MAPS_SUFFIX, "")
    .replace(REVIEWS_PREFIX, "")
    .trim();

  return name.length > 0 ? name : null;
}
