// summary.js
// Чистый парсинг summary-метрик из сырых строк schema.org-разметки.

export function parseSummary({ ratingValue, ratingCount, reviewCount }) {
  return {
    rating: ratingValue == null ? null : parseFloat(ratingValue),
    ratingsCount: ratingCount == null ? null : parseInt(ratingCount, 10),
    reviewsCount: reviewCount == null ? null : parseInt(reviewCount, 10),
  };
}
