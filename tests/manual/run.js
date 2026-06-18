// run.js
// Ручной прогон scrapeOrganization по одному или всем кейсам из fixtures.js.
// Не CI-тест: реальный сетевой доступ к yandex.ru, печатает таймлайн в консоль.

import { scrapeOrganization } from "../../src/scraper.js";
import { fixtures } from "./fixtures.js";

function resolveCases(selector) {
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

// Прогресс-бар через process.stdout.write с \r конфликтует визуально с pino:
// оба пишут в один stdout без координации. Решение: логировать секунды через
// console.log с префиксом — отдельные строки, без перезаписи курсора.
async function scrapeWithProgressLog(url) {
  const tStart = Date.now();
  try {
    return await scrapeOrganization(url);
  } finally {
    console.log(`Готово за ${((Date.now() - tStart) / 1000).toFixed(1)} сек.`);
  }
}

async function main() {
  let cases;
  try {
    cases = resolveCases(process.argv[2]);
  } catch (error) {
    console.error(`Ошибка: ${error.message}`);
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
      console.error(`Ошибка: ${error.message}`);
    }
  }
}

main();
