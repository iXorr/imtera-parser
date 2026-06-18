import "dotenv/config";
import express, { type Request, type Response } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.ts";
import { scrapeOrganization, OrganizationNotFoundError, IncompleteScrapeError } from "./scraper.ts";
import { toReviewsUrl, InvalidOrganizationUrlError } from "./urlNormalizer.ts";

const PORT = process.env.SCRAPER_PORT || 1234;

const app = express();
app.use(express.json());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

app.post("/scrape", async (req: Request, res: Response) => {
  const { organizationUrl } = (req.body ?? {}) as { organizationUrl?: unknown };

  if (typeof organizationUrl !== "string" || organizationUrl.length === 0) {
    return res.status(400).json({ error: "organizationUrl обязателен" });
  }

  // Нормализация до запуска браузера: URL строится сама вне зависимости от
  // входного хоста (SSRF-защита), мусорные ссылки отсекаются 400 раньше Playwright.
  let reviewsUrl: string;
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

    if (error instanceof IncompleteScrapeError) {
      req.log.warn({ err: error }, "incomplete scrape");
      return res.status(502).json({ error: error.message });
    }

    req.log.error({ err: error }, "scrape failed");
    res.status(500).json({ error: "scrape's internal error" });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Scraping server is running..." });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "server started");
});
