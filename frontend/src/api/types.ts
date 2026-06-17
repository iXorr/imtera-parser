export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface Organization {
  id: number;
  business_id: string;
  rating: number | null;
  ratings_count: number | null;
  reviews_count: number | null;
  created_at: string;
}

export interface Review {
  id: number;
  business_id: string;
  reviewId: string;
  reviewer_name: string | null;
  reviewer_avatar_url: string | null;
  reviewer_rating: number;
  reviewer_comment: string | null;
  business_comment: string | null;
  updated_time: string | null;
}
