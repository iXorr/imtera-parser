import "dotenv/config";
import { chromium, type Page, type Response } from "playwright";
import type { Logger } from "pino";
import { logger as defaultLogger } from "./logger.ts";
import { mapReview, findReviewsArray, type MappedReview } from "./reviews.ts";
import { parseSummary, type Summary } from "./summary.ts";

const TARGET_REVIEWS_COUNT = parseInt(process.env.TARGET_REVIEWS_COUNT ?? "", 10) || 500;
const MAX_IDLE_SCROLLS = parseInt(process.env.MAX_IDLE_SCROLLS ?? "", 10) || 5;
const FETCH_RESPONSE_TIMEOUT_MS = parseInt(process.env.FETCH_RESPONSE_TIMEOUT_MS ?? "", 10) || 8000;

// itemprop-атрибуты стабильны между локалями (.ru/.com), CSS-классы шапки рейтинга — нет
const AGGREGATE_RATING_SELECTOR = "[itemprop=\"aggregateRating\"]";
const REVIEWS_LIST_SELECTOR = ".business-reviews-card-view__reviews-container";
const FETCH_REVIEWS_PATH = "/maps/api/business/fetchReviews";

export class OrganizationNotFoundError extends Error {
  constructor(organizationUrl: string) {
    super(`Карточка организации не найдена по ссылке: ${organizationUrl}`);
    this.name = "OrganizationNotFoundError";
  }
}

interface IncompleteScrapeErrorOptions {
  organizationUrl: string;
  collected: number;
  targetReviewsCount: number;
  reviewsCount: number | null;
}

export class IncompleteScrapeError extends Error {
  constructor({ organizationUrl, collected, targetReviewsCount, reviewsCount }: IncompleteScrapeErrorOptions) {
    super(
      `Скрейп прерван раньше времени: собрано ${collected} отзывов из ${targetReviewsCount} запрошенных: (всего отзывов по данным Яндекса: ${reviewsCount ?? "неизвестно"}) для ${organizationUrl}`,
    );

    this.name = "IncompleteScrapeError";
  }
}

interface ReviewCollector {
  reviews: MappedReview[];
  addReviews(newReviews: MappedReview[]): void;
  addFromResponse(response: Response): Promise<void>;
}

// Общий Set для SSR-партии и каждого ответа fetchReviews — дедуп reviewId в одном месте
function createReviewCollector(): ReviewCollector {
  const reviews: MappedReview[] = [];
  const seenReviewIds = new Set<string>();

  function addReviews(newReviews: MappedReview[]): void {
    for (const review of newReviews) {
      if (review.reviewId && !seenReviewIds.has(review.reviewId)) {
        seenReviewIds.add(review.reviewId);
        reviews.push(review);
      }
    }
  }

  async function addFromResponse(response: Response): Promise<void> {
    const body = await response.json().catch(() => null);
    addReviews((body?.data?.reviews ?? []).map(mapReview));
  }

  return { reviews, addReviews, addFromResponse };
}

// domcontentloaded: networkidle не наступает из-за фоновой телеметрии SPA.
// attached, не visible: разметка для роботов визуально скрыта.
async function loadOrganizationPage(page: Page, organizationUrl: string, log: Logger): Promise<void> {
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

// Первая партия (50 отзывов) приходит в SSR-HTML, дальше только через fetchReviews
async function loadSsrReviews(page: Page, log: Logger): Promise<MappedReview[]> {
  const start = Date.now();

  const scripts = await page.evaluate(() => Array.from(document.scripts).map((s) => s.textContent));
  const candidate = scripts.find((text): text is string => !!text && text.includes("reviewResults"));
  const reviews = candidate ? (findReviewsArray(JSON.parse(candidate)) ?? []).map(mapReview) : [];

  log.info({ ms: Date.now() - start, reviewsCount: reviews.length }, "ssr");
  return reviews;
}

// rating/ratingsCount/reviewsCount нет в ответе fetchReviews — берём из schema.org-разметки
async function loadSummary(page: Page, log: Logger): Promise<Summary> {
  const start = Date.now();
  const scope = page.locator(AGGREGATE_RATING_SELECTOR).first();

  const readMeta = (itemprop: string): Promise<string | null> =>
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

// scrollTop = scrollHeight долетает до низа за один шаг. Список сам может быть
// не прокручиваемым (overflow часто на родителе) — поднимаемся по дереву до него.
async function scrollReviewsToBottom(page: Page): Promise<boolean> {
  return page.evaluate((selector) => {
    function findScrollable(start: Element): Element | null {
      for (let node: Element | null = start; node; node = node.parentElement) {
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

interface ScrollForMoreReviewsOptions {
  page: Page;
  log: Logger;
  collector: ReviewCollector;
  targetReviewsCount: number;
}

// Ждём реальный ответ fetchReviews, а не фиксированную паузу. Останов —
// по targetReviewsCount или по MAX_IDLE_SCROLLS подряд без новых отзывов.
async function scrollForMoreReviews({ page, log, collector, targetReviewsCount }: ScrollForMoreReviewsOptions): Promise<void> {
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

interface AssertScrapeCompleteOptions {
  organizationUrl: string;
  log: Logger;
  collected: number;
  targetReviewsCount: number;
  reviewsCount: number | null;
}

// Не совпало ни с target, ни с реальным reviewsCount — обрыв раньше времени
// (обычно нестабильная сеть), а не органический конец отзывов.
function assertScrapeComplete({
  organizationUrl,
  log,
  collected,
  targetReviewsCount,
  reviewsCount,
}: AssertScrapeCompleteOptions): void {
  const reachedTarget = collected === targetReviewsCount;
  const reachedActualTotal = reviewsCount != null && collected === reviewsCount;
  if (reachedTarget || reachedActualTotal) {
    return;
  }

  log.warn({ collected, targetReviewsCount, reviewsCount }, "incomplete scrape");
  throw new IncompleteScrapeError({ organizationUrl, collected, targetReviewsCount, reviewsCount });
}

export interface ScrapeOrganizationOptions {
  logger?: Logger;
}

export interface ScrapeResult {
  summary: Summary;
  reviews: MappedReview[];
}

// logger по умолчанию — синглтон из logger.ts; server.ts передаёт req.log,
// чтобы привязать весь таймлайн скрейпа к конкретному HTTP-запросу.
export async function scrapeOrganization(
  organizationUrl: string,
  { logger = defaultLogger }: ScrapeOrganizationOptions = {},
): Promise<ScrapeResult> {
  const log = logger.child({ organizationUrl });
  const browser = await chromium.launch({
    headless: true,
    // --disable-dev-shm-usage: Docker даёт по умолчанию только 64MB /dev/shm,
    // Chromium активно использует shared memory для рендеринга — без этого
    // флага под нагрузкой (сотни отзывов в DOM) браузер лагает/падает.
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage();

  // Картинки/шрифты/медиа нам не нужны — данные берём из JSON fetchReviews
  // и SSR-блоба, а не из рендера страницы. Это ощутимо снижает нагрузку на
  // CPU/память при сотнях отзывов с аватарками в DOM.
  await page.route("**/*", (route) => {
    const resourceType = route.request().resourceType();
    if (resourceType === "image" || resourceType === "media" || resourceType === "font") {
      return route.abort();
    }

    return route.continue();
  });

  const collector = createReviewCollector();
  let summary: Summary;

  page.on("response", async (response) => {
    if (response.url().includes(FETCH_REVIEWS_PATH)) {
      await collector.addFromResponse(response);
    }
  });

  try {
    await loadOrganizationPage(page, organizationUrl, log);

    collector.addReviews(await loadSsrReviews(page, log));
    summary = await loadSummary(page, log);

    // Капаем по summary.reviewsCount — иначе при малом числе
    // отзывов скролл впустую жжёт все MAX_IDLE_SCROLLS таймаутов
    const targetReviewsCount = (summary.reviewsCount != null)
      ? Math.min(TARGET_REVIEWS_COUNT, summary.reviewsCount)
      : TARGET_REVIEWS_COUNT;

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
