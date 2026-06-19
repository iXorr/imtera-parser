import { scrapeOrganization } from "../../src/scraper.ts";

test("уже существующая организация без aggregateRating должна находиться", async () => {
  const result = await scrapeOrganization("https://yandex.ru/maps/org/-/116931511666/reviews/");
  console.log("name:", result.name);
  console.log("summary:", result.summary);
  console.log("reviews collected:", result.reviews.length);
  expect(result.reviews.length).toBeGreaterThan(0);
}, 120000);
