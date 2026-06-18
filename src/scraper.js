// scraper.js

import { chromium } from "playwright";

const FETCH_REVIEWS_PATH = "/maps/api/business/fetchReviews";

// должно быть кратно пятидесяти (тип, сколько страниц)
const TARGET_REVIEWS_COUNT = 500;
const MAX_IDLE_SCROLLS = 5;
// schema.org-микроразметка вместо CSS-классов (.business-rating-badge-view__rating-text
// и т.п.) — подтверждено, что разметка/классы рейтинга в шапке зависят от локали
// рендера (yandex.ru vs yandex.com/en даёт только SVG-звёзды без текстового узла),
// а itemprop-атрибуты остаются стабильными.
const AGGREGATE_RATING_SELECTOR = '[itemprop="aggregateRating"]';
// Подтверждено через DevTools (см. scraper/src/outer-element.txt — снят outerHTML
// именно этого элемента): список отзывов рендерится внутри
// .business-reviews-card-view__reviews-container.
const REVIEWS_LIST_SELECTOR = ".business-reviews-card-view__reviews-container";
const FETCH_RESPONSE_TIMEOUT_MS = 8000;

function mapReview(review) {
  return {
    reviewId: review.reviewId,
    businessId: review.businessId,
    authorName: review.author?.name ?? null,
    authorAvatarUrl: review.author?.avatarUrl ?? null,
    rating: review.rating ?? null,
    text: review.text ?? null,
    businessComment: review.businessComment?.text ?? null,
    updatedTime: review.updatedTime ?? null,
  };
}

// Рекурсивно ищем массив отзывов внутри hydration-state — точный путь внутри
// объекта нестабилен между организациями/прогонами, поэтому не хардкодим его.
function findReviewsArray(obj) {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  if (Array.isArray(obj.reviews) && obj.reviews[0]?.reviewId) {
    return obj.reviews;
  }

  for (const value of Object.values(obj)) {
    const found = findReviewsArray(value);
    if (found) {
      return found;
    }
  }

  return null;
}

// Первая партия отзывов (~50) рендерится сервером прямо в HTML (сырой JSON в
// одном из <script>-тегов) — без отдельного запроса. fetchReviews срабатывает
// только на скролле и отдаёт ТОЛЬКО следующие страницы; без этого шага первая
// страница тихо терялась бы при каждом скрейпе.
async function getSsrReviews(page) {
  const scripts = await page.evaluate(() => Array.from(document.scripts).map((s) => s.textContent));

  const candidate = scripts.find((text) => text.includes("reviewResults"));
  if (!candidate) {
    return [];
  }

  const data = JSON.parse(candidate);
  return (findReviewsArray(data) ?? []).map(mapReview);
}

// rating/ratingsCount/reviewsCount организации не приходят в ответе fetchReviews
// (подтверждено на живом трафике, см. yandex.ru.har) — все три читаются из
// schema.org AggregateRating-разметки в шапке карточки организации вместо
// отдельного API-эндпоинта. reviewsCount также используется для детекта
// софт-бана (см. ScrapeOrganizationJob).
async function getSummary(page) {
  const scope = page.locator(AGGREGATE_RATING_SELECTOR).first();

  const readMeta = (itemprop) =>
    scope
      .locator(`meta[itemprop="${itemprop}"]`)
      .first()
      .getAttribute("content", { timeout: 12000 })
      .catch(() => null);

  const [rating, ratingsCount, reviewsCount] = await Promise.all([
    readMeta("ratingValue").then((value) => (value === null ? null : parseFloat(value))),
    readMeta("ratingCount").then((value) => (value === null ? null : parseInt(value, 10))),
    readMeta("reviewCount").then((value) => (value === null ? null : parseInt(value, 10))),
  ]);

  return { rating, ratingsCount, reviewsCount };
}

// mouse.wheel(0, 3000) двигает скролл на фиксированную дельту независимо от
// текущей высоты списка — после нескольких десятков подгруженных отзывов
// список растёт быстрее этой дельты, и реальный низ контейнера уезжает дальше
// одной wheel-прокрутки (см. output.txt: серии из 4 TIMEOUT перед каждым +50,
// пока несколько wheel-шагов подряд не дотягивались до настоящего конца).
// Вместо этого выставляем scrollTop = scrollHeight напрямую на прокручиваемом
// контейнере — это не зависит от высоты списка и долетает до низа за один шаг.
// Сам REVIEWS_LIST_SELECTOR может не быть прокручиваемым элементом (overflow
// часто вешают на родителя), поэтому поднимаемся по дереву до первого предка
// с overflow-y: auto/scroll и реальным переполнением.
async function scrollReviewsToBottom(page) {
  return page.evaluate((selector) => {
    function findScrollable(start) {
      for (let node = start; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        const isScrollableY = style.overflowY === "auto" || style.overflowY === "scroll";
        if (isScrollableY && node.scrollHeight > node.clientHeight) {
          return node;
        }
      }
      return document.scrollingElement;
    }

    const list = document.querySelector(selector);
    if (!list) {
      return false;
    }

    const scrollable = findScrollable(list);
    if (!scrollable) {
      return false;
    }

    const before = scrollable.scrollTop;
    scrollable.scrollTop = scrollable.scrollHeight;
    return scrollable.scrollTop !== before;
  }, REVIEWS_LIST_SELECTOR);
}

export async function scrapeOrganization(organizationUrl) {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  const reviews = [];
  const seenReviewIds = new Set();
  let summary = { rating: null, ratingsCount: null, reviewsCount: null };

  function addReviews(newReviews) {
    for (const review of newReviews) {
      if (review.reviewId && !seenReviewIds.has(review.reviewId)) {
        seenReviewIds.add(review.reviewId);
        reviews.push(review);
      }
    }
  }

  async function extractReviewsFromResponse(response) {
    const body = await response.json().catch(() => null);
    return (body?.data?.reviews ?? []).map(mapReview);
  }

  page.on("response", async (response) => {
    if (!response.url().includes(FETCH_REVIEWS_PATH)) {
      return;
    }

    addReviews(await extractReviewsFromResponse(response));
  });

  try {
    const tGotoStart = Date.now();
    // ЗАМЕНЕНО: networkidle -> domcontentloaded + явный wait на нужный селектор.
    // networkidle ждёт паузу 500мс без сетевых запросов, что на SPA с фоновой
    // телеметрией/аналитикой может никогда не наступить раньше собственного
    // таймаута Playwright — это лишние секунды/десятки секунд впустую.
    await page.goto(organizationUrl, { waitUntil: "domcontentloaded" });
    // state: "attached", не "visible" (дефолт) — itemprop="aggregateRating"
    // это schema.org-микроразметка для поисковых роботов, она присутствует в DOM,
    // но визуально скрыта (display:none/нулевые размеры), поэтому ждать
    // видимости здесь бессмысленно и приводит к ложному таймауту.
    await page.locator(AGGREGATE_RATING_SELECTOR).first().waitFor({ state: "attached", timeout: 15000 });
    console.log(`[goto] ${Date.now() - tGotoStart}мс`);

    const tSsrStart = Date.now();
    addReviews(await getSsrReviews(page));
    console.log(`[ssr] ${Date.now() - tSsrStart}мс, отзывов после SSR: ${reviews.length}`);

    const tSummaryStart = Date.now();
    summary = await getSummary(page);
    console.log(`[summary] ${Date.now() - tSummaryStart}мс`);

    // Ждём реальный ответ fetchReviews вместо фиксированной паузы — пауза по
    // часам (800мс) на медленной сети ложно засчитывала "пусто" и обрывала
    // ленту раньше времени, хотя данные ещё шли (см. живой прогон scraper.spec.js
    // 2026-06-18: 100 вместо ожидаемых сотен отзывов).
    //
    // targetReviewsCount ограничен summary.reviewsCount: у организаций с малым
    // числом отзывов (всё уже отдано через SSR) цикл иначе впустую тратит
    // MAX_IDLE_SCROLLS * FETCH_RESPONSE_TIMEOUT_MS на TIMEOUT-ы, т.к. скроллить
    // больше нечего. MAX_IDLE_SCROLLS всё равно остаётся страховкой — reviewsCount
    // может быть занижен/завышен относительно реально доступных в DOM отзывов.
    const targetReviewsCount =
      summary.reviewsCount != null ? Math.min(TARGET_REVIEWS_COUNT, summary.reviewsCount) : TARGET_REVIEWS_COUNT;
    let idleScrolls = 0;
    let iteration = 0;
    while (reviews.length < targetReviewsCount && idleScrolls < MAX_IDLE_SCROLLS) {
      iteration++;
      const before = reviews.length;
      const tScrollStart = Date.now();

      await scrollReviewsToBottom(page);

      const response = await page
        .waitForResponse((r) => r.url().includes(FETCH_REVIEWS_PATH), { timeout: FETCH_RESPONSE_TIMEOUT_MS })
        .catch(() => null);

      if (response) {
        addReviews(await extractReviewsFromResponse(response));
      }

      const elapsed = Date.now() - tScrollStart;
      const gained = reviews.length - before;
      const status = response ? "ok" : "TIMEOUT";
      console.log(
        `[scroll ${iteration}] ${elapsed}мс, статус=${status}, +${gained} отзывов, итого ${reviews.length}`
      );

      idleScrolls = reviews.length === before ? idleScrolls + 1 : 0;
    }
  } finally {
    await browser.close();
  }

  return { summary, reviews };
}
