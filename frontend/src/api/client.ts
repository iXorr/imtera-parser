const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResult<T> {
  isOk: boolean;
  status: number;
  data: T | null;
  error: ApiErrorBody | null;
}

export function errorMessage(error: ApiErrorBody | null): string {
  if (!error) {
    return "";
  }

  const firstFieldError = error.errors ? Object.values(error.errors)[0]?.[0] : undefined;
  return firstFieldError ?? error.message;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const body = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      return { isOk: false, status: response.status, data: null, error: body ?? { message: response.statusText } };
    }

    return { isOk: true, status: response.status, data: body as T, error: null };
  } catch {
    return { isOk: false, status: 0, data: null, error: { message: "Сервер недоступен" } };
  }
}
