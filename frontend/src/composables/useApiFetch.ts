import { ref } from "vue";
import type { ApiErrorBody, ApiResult } from "../api/client";

export function useApiFetch<T>() {
  const loading = ref(false);
  const isOk = ref(true);
  const data = ref<T | null>(null);
  const error = ref<ApiErrorBody | null>(null);

  async function execute(request: () => Promise<ApiResult<T>>) {
    loading.value = true;

    const result = await request();

    loading.value = false;
    isOk.value = result.isOk;
    data.value = result.data;
    error.value = result.error;

    return result;
  }

  return { loading, isOk, data, error, execute };
}
