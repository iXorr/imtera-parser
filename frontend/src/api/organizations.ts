import { apiFetch } from "./client";
import type { ApiResult } from "./client";
import type { Organization, PaginatedResponse, Review } from "./types";

export function fetchOrganizations(page = 1): Promise<ApiResult<PaginatedResponse<Organization>>> {
  return apiFetch(`/organizations?page=${page}`);
}

export function fetchReviews(organizationId: number, page = 1): Promise<ApiResult<PaginatedResponse<Review>>> {
  return apiFetch(`/organizations/${organizationId}/reviews?page=${page}`);
}

export interface CreateOrganizationReviewPayload {
  reviewId: string;
  reviewer_name?: string;
  reviewer_avatar_url?: string;
  reviewer_rating: number;
  reviewer_comment?: string;
  business_comment?: string;
  updated_time?: string;
}

export interface CreateOrganizationPayload {
  business_id: string;
  rating?: number;
  ratings_count?: number;
  reviews_count?: number;
  reviews?: CreateOrganizationReviewPayload[];
}

export function createOrganization(payload: CreateOrganizationPayload): Promise<ApiResult<{ data: Organization }>> {
  return apiFetch("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
