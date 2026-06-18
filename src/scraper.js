// scraper.js

import { chromium } from "playwright";
import { logger as defaultLogger } from "./logger.js";
import { mapReview, findReviewsArray } from "./reviews.js";
import { parseSummary } from "./summary.js";

const TARGET_REVIEWS_COUNT = parseInt(process.env.TARGET_REVIEWS_COUNT, 10) || 500;
const MAX_IDLE_SCROLLS = parseInt(process.env.MAX_IDLE_SCROLLS, 10) || 5;
const FETCH_RESPONSE_TIMEOUT_MS = parseInt(process.env.FETCH_RESPONSE_TIMEOUT_MS, 10) || 8000;

// itemprop-атрибуты стабильны между локалями (yandex.ru/yandex.com/en), в
// отличие от CSS-классов шапки рейтинга
const AGGREGATE_RATING_SELECTOR = '[itemprop="aggregateRating"]';
const REVIEWS_LIST_SELECTOR = ".business-reviews-card-view__reviews-container";
const FETCH_REVIEWS_PATH = "/maps/api/business/fetchReviews";

// Отличает "организация не найдена" от прочих сбоев (сеть, краш браузера)
export class OrganizationNotFoundError extends Error {
  constructor(organizationUrl) {
    super(`Карточка организации не найдена по ссылке: ${organizationUrl}`);
    this.name = "OrganizationNotFoundError";
    this.organizationUrl = organizationUrl;
  }
}

// Цикл скролла завершился по MAX_IDLE_SCROLLS, не дойдя ни до запрошенного
// лимита, ни до реального числа отзывов организации — типичный симптом
// нестабильной сети (см. VPN-кейс), а не "органически закончились отзывы".
export class IncompleteScrapeError extends Error {
  constructor({ organizationUrl, collected, targetReviewsCount, reviewsCount }) {
    super(
      `Скрейп прерван раньше времени: собрано ${collected} отзывов из ${targetReviewsCount} запрошенных ` +
        `(всего отзывов по данным Яндекса: ${reviewsCount ?? "неизвестно"}) для ${organizationUrl}`
    );
    this.name = "IncompleteScrapeError";
    this.organizationUrl = organizationUrl;
    this.collected = collected;
    this.targetReviewsCount = targetReviewsCount;
    this.reviewsCount = reviewsCount;
  }
}

// Дедуп по reviewId в одном месте — и SSR-партия, и каждый ответ fetchReviews
// проходят через один и тот же Set, иначе один и тот же отзыв может прийти
// дважды (повторный fetchReviews после неудачного скролла и т.п.).
function createReviewCollector() {
  const reviews = [];
  const seenReviewIds = new Set();

  function addReviews(newReviews) {
    for (const review of newReviews) {
      if (review.reviewId && !seenReviewIds.has(review.reviewId)) {
        seenReviewIds.add(review.reviewId);
        reviews.push(review);
      }
    }
  }

  async function addFromResponse(response) {
    const body = await response.json().catch(() => null);
    addReviews((body?.data?.reviews ?? []).map(mapReview));
  }

  return { reviews, addReviews, addFromResponse };
}

// domcontentloaded, не networkidle — фоновая телеметрия SPA не даёт сети
// затихнуть. state: "attached", не "visible" — разметка для роботов
// визуально скрыта. Если за 15с не появилась — невалидная/несуществующая
// организация.
async function loadOrganizationPage(page, organizationUrl, log) {
  const start = Date.now();
  await page.goto(organizationUrl, { waitUntil: "domcontentloaded" });

  try {
    await page.locator(AGGREGATE_RATING_SELECTOR).first().waitFor({ state: "attached", timeout: 15000 });
  } catch {
    log.warn("organization not found");
    throw new OrganizationNotFoundError(organizationUrl);
  }

  log.info({ ms: Date.now() - start }, "goto");
}

// Первая партия (~50) приходит в SSR-HTML, fetchReviews отдаёт только следующие страницы
async function loadSsrReviews(page, log) {
  const start = Date.now();

  const scripts = await page.evaluate(() => Array.from(document.scripts).map((s) => s.textContent));
  const candidate = scripts.find((text) => text.includes("reviewResults"));
  const reviews = candidate ? (findReviewsArray(JSON.parse(candidate)) ?? []).map(mapReview) : [];

  log.info({ ms: Date.now() - start, reviewsCount: reviews.length }, "ssr");
  return reviews;
}

// rating/ratingsCount/reviewsCount не приходят в fetchReviews — читаем из schema.org-разметки
async function loadSummary(page, log) {
  const start = Date.now();
  const scope = page.locator(AGGREGATE_RATING_SELECTOR).first();

  const readMeta = (itemprop) =>
    scope
      .locator(`meta[itemprop="${itemprop}"]`)
      .first()
      .getAttribute("content", { timeout: 12000 })
      .catch(() => null);

  const [ratingValue, ratingCount, reviewCount] = await Promise.all([
    readMeta("ratingValue"),
    readMeta("ratingCount"),
    readMeta("reviewCount"),
  ]);

  const summary = parseSummary({ ratingValue, ratingCount, reviewCount });
  log.info({ ms: Date.now() - start, ...summary }, "summary");
  return summary;
}

// scrollTop = scrollHeight вместо wheel-дельты — долетает до низа за один шаг
// независимо от высоты списка. REVIEWS_LIST_SELECTOR сам может быть не
// прокручиваемым (overflow часто на родителе) — поднимаемся по дереву до него.
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

// Ждём реальный ответ fetchReviews вместо фиксированной паузы. Останов по
// targetReviewsCount (достигли лимита/реального числа отзывов) или по
// MAX_IDLE_SCROLLS подряд без новых отзывов (страховка от бесконечного
// цикла).
async function scrollForMoreReviews({ page, log, collector, targetReviewsCount }) {
  let idleScrolls = 0;
  let iteration = 0;

  while (collector.reviews.length < targetReviewsCount && idleScrolls < MAX_IDLE_SCROLLS) {
    iteration++;
    const before = collector.reviews.length;
    const tScrollStart = Date.now();

    await scrollReviewsToBottom(page);

    const response = await page
      .waitForResponse((r) => r.url().includes(FETCH_REVIEWS_PATH), { timeout: FETCH_RESPONSE_TIMEOUT_MS })
      .catch(() => null);

    if (response) {
      await collector.addFromResponse(response);
    }

    const elapsed = Date.now() - tScrollStart;
    const gained = collector.reviews.length - before;
    const status = response ? "ok" : "timeout";
    log.info({ iteration, ms: elapsed, status, gained, total: collector.reviews.length }, "scroll");

    idleScrolls = collector.reviews.length === before ? idleScrolls + 1 : 0;
  }
}

// Цикл скролла мог выйти либо по достижению targetReviewsCount, либо по
// MAX_IDLE_SCROLLS. Первое — ожидаемо (упёрлись в лимит или у организации
// физически меньше отзывов). Если не совпало ни с одним числом — значит
// выдохлись раньше времени, обычно потому, что fetchReviews перестал
// отвечать (нестабильная сеть), а не потому, что отзывы закончились.
function assertScrapeComplete({ organizationUrl, log, collected, targetReviewsCount, reviewsCount }) {
  const reachedTarget = collected === targetReviewsCount;
  const reachedActualTotal = reviewsCount != null && collected === reviewsCount;
  if (reachedTarget || reachedActualTotal) {
    return;
  }

  log.warn({ collected, targetReviewsCount, reviewsCount }, "incomplete scrape");
  throw new IncompleteScrapeError({ organizationUrl, collected, targetReviewsCount, reviewsCount });
}

// logger принимается снаружи (по умолчанию — общий синглтон из logger.js),
// чтобы server.js мог передать request-scoped логгер (pino-http child с
// req.id) и привязать все логи скрейпа к конкретному HTTP-запросу.
export async function scrapeOrganization(organizationUrl, { logger = defaultLogger } = {}) {
  const log = logger.child({ organizationUrl });
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  const collector = createReviewCollector();
  let summary = { rating: null, ratingsCount: null, reviewsCount: null };

  page.on("response", async (response) => {
    if (response.url().includes(FETCH_REVIEWS_PATH)) {
      await collector.addFromResponse(response);
    }
  });

  try {
    await loadOrganizationPage(page, organizationUrl, log);

    collector.addReviews(await loadSsrReviews(page, log));
    summary = await loadSummary(page, log);

    // Ограничиваем summary.reviewsCount — иначе при малом числе отзывов (всё уже
    // отдано через SSR) цикл впустую тратит MAX_IDLE_SCROLLS таймаутов на скролл
    const targetReviewsCount =
      summary.reviewsCount != null ? Math.min(TARGET_REVIEWS_COUNT, summary.reviewsCount) : TARGET_REVIEWS_COUNT;

    await scrollForMoreReviews({ page, log, collector, targetReviewsCount });

    assertScrapeComplete({
      organizationUrl,
      log,
      collected: collector.reviews.length,
      targetReviewsCount,
      reviewsCount: summary.reviewsCount,
    });
  } finally {
    await browser.close();
  }

  return { summary, reviews: collector.reviews };
}
