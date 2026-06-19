export interface Fixture {
  id: string;
  url: string;
  note: string;
}

export const fixtures: Fixture[] = [
  {
    id: "invalid-url",
    url: "https://yandex.ru/maps/org/-/invalid/reviews/",
    note: "Несуществующий oid — проверка OrganizationNotFoundError",
  },
  {
    id: "chelyabinsk-1",
    url: "https://yandex.com/maps/org/-/1102942936/reviews/",
    note: "yandex.ru/maps/56/chelyabinsk, oid=1102942936",
  },
  {
    id: "chelyabinsk-2",
    url: "https://yandex.ru/maps/org/-/1361898564/reviews/",
    note: "yandex.ru/maps/56/chelyabinsk, oid=1361898564",
  },
  {
    id: "chelyabinsk-3",
    url: "https://yandex.com/maps/org/-/1127582424/reviews/",
    note: "yandex.ru/maps/56/chelyabinsk, oid=1127582424",
  },
  {
    id: "chelyabinsk-4",
    url: "https://yandex.ru/maps/org/-/164309262908/reviews/",
    note: "yandex.ru/maps/56/chelyabinsk, oid=164309262908",
  },
  {
    id: "chelyabinsk-5",
    url: "https://yandex.com/maps/org/-/1208664530/reviews/",
    note: "yandex.ru/maps/56/chelyabinsk, oid=1208664530",
  },
  {
    id: "hermitage",
    url: "https://yandex.ru/maps/org/-/1057721048/reviews/",
    note: "Государственный Эрмитаж — крупнейший по числу отзывов кейс (44k+)",
  },
  {
    id: "spb-1",
    url: "https://yandex.com/maps/org/-/155902380365/reviews/",
    note: "yandex.ru/maps/2/saint-petersburg, oid=155902380365",
  },
  {
    id: "no-aggregate-rating-1",
    url: "https://yandex.ru/maps/org/-/116931511666/reviews/",
    note: "Организация без блока aggregateRating (есть отзывы, нет общего рейтинга) — раньше ложно считалась несуществующей",
  },
  {
    id: "no-aggregate-rating-2",
    url: "https://yandex.ru/maps/org/-/89990335980/reviews/",
    note: "То же самое: «Ржевский лесопарк», нет aggregateRating",
  },
  {
    id: "no-aggregate-rating-3",
    url: "https://yandex.ru/maps/org/-/1759473096/reviews/",
    note: "То же самое: «Финляндский вокзал», нет aggregateRating",
  },
];
