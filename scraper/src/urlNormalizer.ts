// Извлекает только businessId, итоговый URL строится сама
// — исходный хост нигде не используется, что заодно закрывает SSRF.

export class InvalidOrganizationUrlError extends Error {
  url: string;

  constructor(url: string) {
    super(`Не удалось распознать ссылку на организацию Яндекс.Карт: ${url}`);
    this.name = "InvalidOrganizationUrlError";
    this.url = url;
  }
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function extractBusinessId(url: string): string {
  // Слаг необязателен — Яндекс сам редиректит голый /maps/org/<id> на форму со слагом
  const orgMatch = url.match(/\/maps\/org\/(?:[^/]+\/)?(\d+)/);
  if (orgMatch) {
    return orgMatch[1];
  }

  // Попап-ссылка кодирует businessId как oid в poi[uri]=ymapsbm1://org?oid=<id>, urlencoded
  const oidMatch = safeDecodeURIComponent(url).match(/oid=(\d+)/);
  if (oidMatch) {
    return oidMatch[1];
  }

  throw new InvalidOrganizationUrlError(url);
}

export function toReviewsUrl(url: string): string {
  return `https://yandex.ru/maps/org/-/${extractBusinessId(url)}/reviews/`;
}
