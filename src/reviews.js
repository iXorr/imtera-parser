// reviews.js
// Чистая логика парсинга/маппинга отзывов — без браузера, легко тестируется.

export function mapReview(review) {
  return {
    reviewId: review.reviewId,
    businessId: review.businessId,
    authorName: review.author?.name ?? null,
    authorAvatarUrl: review.author?.avatarUrl ?? null,
    rating: review.rating ?? null,
    text: review.text ?? null,
    businessComment: review.businessComment?.text ?? null,
    updatedTime: review.updatedTime ?? null,
  };
}

// Путь к массиву отзывов внутри hydration-state нестабилен между организациями
export function findReviewsArray(obj) {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  if (Array.isArray(obj.reviews) && obj.reviews[0]?.reviewId) {
    return obj.reviews;
  }

  for (const value of Object.values(obj)) {
    const found = findReviewsArray(value);
    if (found) {
      return found;
    }
  }

  return null;
}
