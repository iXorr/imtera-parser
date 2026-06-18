export interface RawReview {
  reviewId: string;
  businessId: string;
  author?: { name?: string | null; avatarUrl?: string | null } | null;
  rating?: number | null;
  text?: string | null;
  businessComment?: { text?: string | null } | null;
  updatedTime?: string | null;
}

export interface MappedReview {
  reviewId: string;
  businessId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  rating: number | null;
  text: string | null;
  businessComment: string | null;
  updatedTime: string | null;
}

export function mapReview(review: RawReview): MappedReview {
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
export function findReviewsArray(obj: unknown): RawReview[] | null {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  const record = obj as Record<string, unknown>;

  if (Array.isArray(record.reviews) && (record.reviews[0] as RawReview | undefined)?.reviewId) {
    return record.reviews as RawReview[];
  }

  for (const value of Object.values(record)) {
    const found = findReviewsArray(value);
    if (found) {
      return found;
    }
  }

  return null;
}
