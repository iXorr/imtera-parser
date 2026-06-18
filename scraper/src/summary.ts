export interface SummaryInput {
  ratingValue: string | null;
  ratingCount: string | null;
  reviewCount: string | null;
}

export interface Summary {
  rating: number | null;
  ratingsCount: number | null;
  reviewsCount: number | null;
}

export function parseSummary({ ratingValue, ratingCount, reviewCount }: SummaryInput): Summary {
  return {
    rating: ratingValue == null ? null : parseFloat(ratingValue),
    ratingsCount: ratingCount == null ? null : parseInt(ratingCount, 10),
    reviewsCount: reviewCount == null ? null : parseInt(reviewCount, 10),
  };
}
