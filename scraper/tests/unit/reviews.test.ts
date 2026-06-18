import { mapReview, findReviewsArray } from "../../src/reviews.ts";

describe("mapReview", () => {
  test("маппит все поля из полного объекта отзыва", () => {
    const review = {
      reviewId: "r1",
      businessId: "b1",
      author: { name: "Иван", avatarUrl: "https://example.com/a.png" },
      rating: 5,
      text: "Отлично",
      businessComment: { text: "Спасибо!" },
      updatedTime: "2026-01-01T00:00:00Z",
    };

    expect(mapReview(review)).toEqual({
      reviewId: "r1",
      businessId: "b1",
      authorName: "Иван",
      authorAvatarUrl: "https://example.com/a.png",
      rating: 5,
      text: "Отлично",
      businessComment: "Спасибо!",
      updatedTime: "2026-01-01T00:00:00Z",
    });
  });

  test("отсутствующие опциональные поля становятся null", () => {
    const review = { reviewId: "r1", businessId: "b1" };

    expect(mapReview(review)).toEqual({
      reviewId: "r1",
      businessId: "b1",
      authorName: null,
      authorAvatarUrl: null,
      rating: null,
      text: null,
      businessComment: null,
      updatedTime: null,
    });
  });
});

describe("findReviewsArray", () => {
  test("находит массив отзывов на верхнем уровне", () => {
    const reviews = [{ reviewId: "r1" }];
    expect(findReviewsArray({ reviews })).toBe(reviews);
  });

  test("находит массив отзывов, вложенный на произвольную глубину", () => {
    const reviews = [{ reviewId: "r1" }];
    const state = { a: { b: { c: { reviews } } } };
    expect(findReviewsArray(state)).toBe(reviews);
  });

  test("игнорирует массив reviews, если у первого элемента нет reviewId", () => {
    const state = { reviews: [{ notAReview: true }] };
    expect(findReviewsArray(state)).toBeNull();
  });

  test("возвращает null, если массив отзывов не найден", () => {
    expect(findReviewsArray({ a: { b: 1 } })).toBeNull();
  });

  test("возвращает null для не-объекта", () => {
    expect(findReviewsArray(null)).toBeNull();
    expect(findReviewsArray("string")).toBeNull();
  });
});
