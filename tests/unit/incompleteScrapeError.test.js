import { IncompleteScrapeError } from "../../src/scraper.js";

describe("IncompleteScrapeError", () => {
  test("это Error с понятным сообщением и сохранёнными числами", () => {
    const url = "https://yandex.ru/maps/org/-/1057721048/reviews/";
    const error = new IncompleteScrapeError({
      organizationUrl: url,
      collected: 249,
      targetReviewsCount: 500,
      reviewsCount: 44191,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("IncompleteScrapeError");
    expect(error.organizationUrl).toBe(url);
    expect(error.collected).toBe(249);
    expect(error.targetReviewsCount).toBe(500);
    expect(error.reviewsCount).toBe(44191);
    expect(error.message).toContain("249");
    expect(error.message).toContain("500");
    expect(error.message).toContain("44191");
    expect(error.message).toContain(url);
  });

  test("reviewsCount может быть null, если summary не нашёлся", () => {
    const error = new IncompleteScrapeError({
      organizationUrl: "https://yandex.ru/maps/org/-/1/reviews/",
      collected: 10,
      targetReviewsCount: 500,
      reviewsCount: null,
    });

    expect(error.message).toContain("неизвестно");
  });
});
