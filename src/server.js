// server.js
// Единственный эндпойнт: POST /scrape { organizationUrl } -> { summary, reviews }.
// POST, а не GET: organizationUrl — это полная ссылка на Яндекс.Карты, в
// которой часто уже есть свои "?"/"&" (см. ymapsbm1://org?oid=...&... в
// query) — если такую ссылку подставить как значение query-параметра без
// аккуратного urlencode, Express ломает её на отдельные параметры прямо
// посреди значения. В JSON-теле эта проблема не возникает — там просто
// строка, экранировать "&"/"?" не нужно.
// pino-http логирует каждый запрос (с уникальным req.id) и в консоль, и в
// logs/app.log (см. logger.js) — req.log передаётся в scrapeOrganization,
// поэтому весь таймлайн скрейпа привязан к конкретному запросу.

import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";
import { scrapeOrganization, OrganizationNotFoundError, IncompleteScrapeError } from "./scraper.js";
import { toReviewsUrl, InvalidOrganizationUrlError } from "./urlNormalizer.js";

const PORT = process.env.SCRAPER_PORT || 3555;

const app = express();
app.use(express.json());
// Дефолтные serializers pino-http пишут в каждую строку лога (включая все
// строки таймлайна скрейпа — req.log передаётся внутрь) весь объект req со
// всеми заголовками и res с его заголовками — сильно раздувает logs/app.log.
// Оставляем только то, что реально нужно для чтения лога.
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

app.post("/scrape", async (req, res) => {
  const { organizationUrl } = req.body ?? {};

  if (typeof organizationUrl !== "string" || organizationUrl.length === 0) {
    return res.status(400).json({ error: "organizationUrl обязателен" });
  }

  // Нормализация до запуска браузера: принимает любую форму ссылки на
  // организацию (попап, поисковая выдача, разные локали) и всегда строит
  // итоговый URL сама — реальная навигация никогда не идёт на хост из
  // чужого ввода (защита от SSRF), а мусорные ссылки отсекаются 400-м
  // раньше, чем дойдут до Playwright.
  let reviewsUrl;
  try {
    reviewsUrl = toReviewsUrl(organizationUrl);
  } catch (error) {
    if (error instanceof InvalidOrganizationUrlError) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }

  try {
    const result = await scrapeOrganization(reviewsUrl, { logger: req.log });
    res.json(result);
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    // 502: проблема не в запросе клиента и не в самом сервисе, а в том, что
    // апстрим (Яндекс/сеть до него) недоотдал данные — скрейп оборвался
    // раньше, чем дошёл до лимита или до реального числа отзывов.
    if (error instanceof IncompleteScrapeError) {
      req.log.warn({ err: error }, "incomplete scrape");
      return res.status(502).json({ error: error.message });
    }

    req.log.error({ err: error }, "scrape failed");
    res.status(500).json({ error: "Внутренняя ошибка скрейпера" });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Scraping server is running..." });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "server started");
});
