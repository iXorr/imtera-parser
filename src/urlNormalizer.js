// urlNormalizer.js
// Порт src/Services/YandexMapsUrlNormalizer.php (Laravel-бэкенд). Приводит
// произвольную ссылку на организацию в Яндекс.Картах (попап на карте,
// поисковая выдача, разные локали .ru/.com и т.д.) к каноническому виду, на
// котором реально работает scraper: https://yandex.ru/maps/org/-/<id>/reviews/.
//
// Извлекается только businessId (только цифры), итоговый URL строится сами —
// исходный хост нигде не используется. Это не только нормализация формата,
// но и защита от SSRF: чем бы ни был organizationUrl на входе (внутренний
// адрес, localhost и т.п.), реальная навигация headless-браузера всегда идёт
// на свежепостроенный https://yandex.ru/..., а не на хост из чужого ввода.

export class InvalidOrganizationUrlError extends Error {
  constructor(url) {
    super(`Не удалось распознать ссылку на организацию Яндекс.Карт: ${url}`);
    this.name = "InvalidOrganizationUrlError";
    this.url = url;
  }
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function extractBusinessId(url) {
  // Слаг (название организации в адресе) необязателен — Яндекс сам
  // редиректит голый /maps/org/<id> на каноническую форму со слагом, т.е.
  // оба варианта — валидный вход.
  const orgMatch = url.match(/\/maps\/org\/(?:[^/]+\/)?(\d+)/);
  if (orgMatch) {
    return orgMatch[1];
  }

  // Ссылка-попап на карте кодирует businessId как oid в query-параметре
  // poi[uri]=ymapsbm1://org?oid=<id>, urlencoded.
  const oidMatch = safeDecodeURIComponent(url).match(/oid=(\d+)/);
  if (oidMatch) {
    return oidMatch[1];
  }

  throw new InvalidOrganizationUrlError(url);
}

export function toReviewsUrl(url) {
  return `https://yandex.ru/maps/org/-/${extractBusinessId(url)}/reviews/`;
}
