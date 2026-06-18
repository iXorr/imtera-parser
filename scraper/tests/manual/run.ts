// Ручной прогон, не CI-тест: реальный сетевой доступ к yandex.ru

import { scrapeOrganization } from "../../src/scraper.ts";
import { fixtures, type Fixture } from "./fixtures.ts";

function resolveCases(selector: string | undefined): Fixture[] {
  if (!selector) {
    return fixtures;
  }

  const found = fixtures.find((fixture) => fixture.id === selector);
  if (!found) {
    const availableIds = fixtures.map((fixture) => fixture.id).join(", ");
    throw new Error(`Неизвестный кейс "${selector}". Доступные: ${availableIds}`);
  }

  return [found];
}

// \r-прогресс-бар конфликтует визуально с pino в том же stdout — логируем отдельными строками
async function scrapeWithProgressLog(url: string) {
  const tStart = Date.now();

  try {
    return await scrapeOrganization(url);
  } finally {
    console.log(`Готово за ${((Date.now() - tStart) / 1000).toFixed(1)} сек.`);
  }
}

async function main() {
  let cases: Fixture[];

  try {
    cases = resolveCases(process.argv[2]);
  } catch (error) {
    console.error(`Ошибка: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  for (const { id, url } of cases) {
    console.log(`\n=== ${id}: ${url} ===`);

    try {
      const result = await scrapeWithProgressLog(url);

      console.log("summary:", result.summary);
      console.log("reviews:", result.reviews.length);
      console.log("c текстом:", result.reviews.filter((r) => r.text !== null).length);
      console.log("с ответом организации:", result.reviews.filter((r) => r.businessComment !== null).length);
    } catch (error) {
      console.error(`Ошибка: ${(error as Error).message}`);
    }
  }
}

main();
