import { parseSummary } from "../../src/summary.js";

describe("parseSummary", () => {
  test("парсит строки из schema.org-разметки в числа", () => {
    expect(parseSummary({ ratingValue: "4.5", ratingCount: "204", reviewCount: "48" })).toEqual({
      rating: 4.5,
      ratingsCount: 204,
      reviewsCount: 48,
    });
  });

  test("null остаётся null, если разметка не найдена", () => {
    expect(parseSummary({ ratingValue: null, ratingCount: null, reviewCount: null })).toEqual({
      rating: null,
      ratingsCount: null,
      reviewsCount: null,
    });
  });

  test("частично отсутствующая разметка не валит остальные поля", () => {
    expect(parseSummary({ ratingValue: "5", ratingCount: null, reviewCount: "10" })).toEqual({
      rating: 5,
      ratingsCount: null,
      reviewsCount: 10,
    });
  });
});
