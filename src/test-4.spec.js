// scraper.spec-4.js
// Источник: https://yandex.ru/maps/56/chelyabinsk/?...&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D1127582424&...

import { scrapeOrganization } from "./scraper.js";

const URL = "https://yandex.ru/maps/org/-/1127582424/reviews/";

// Прогресс-бар через process.stdout.write с \r конфликтует визуально с
// console.log внутри scraper.js (оба пишут в один stdout без координации:
// "\rПрогресс идёт: 3 сек." без \n на конце + следующий console.log() из
// scraper.js слипаются в одну строку). Решение: не печатать прогресс поверх
// той же строки, а просто логировать секунды через console.log с префиксом —
// тогда вывод scraper.js и прогресс идут как отдельные строки в общем потоке,
// без перезаписи курсора.
const URL_LIST = [URL];

async function scrapeWithProgressLog(url) {
  let seconds = 0;
  const interval = setInterval(() => {
    seconds++;
    console.log(`... прогресс: ${seconds * 5} сек.`);
  }, 5000); // раз в 5 сек, а не каждую секунду — чтобы не захламлять лог скроллов

  const tStart = Date.now();
  try {
    return await scrapeOrganization(url);
  } finally {
    clearInterval(interval);
    console.log(`Готово за ${((Date.now() - tStart) / 1000).toFixed(1)} сек.`);
  }
}

async function main() {
  for (const url of URL_LIST) {
    console.log(`\n=== ${url} ===`);

    const result = await scrapeWithProgressLog(url);

    console.log("summary:", result.summary);
    console.log("reviews:", result.reviews.length);
    console.log("c текстом:", result.reviews.filter((r) => r.text !== null).length);
    console.log("с ответом организации:", result.reviews.filter((r) => r.businessComment !== null).length);
  }
}

main();
