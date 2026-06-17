import { apiFetch } from "./client";
import type { ApiResult } from "./client";

export interface LoginResponse {
  token: string;
}

export function login(email: string, password: string): Promise<ApiResult<LoginResponse>> {
  return apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
