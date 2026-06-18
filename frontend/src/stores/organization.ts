import { defineStore } from "pinia";
import { ref } from "vue";
import { connectOrganization, fetchOrganizations, fetchReviews } from "../api/organizations";
import type { ApiErrorBody } from "../api/client";
import type { Organization, Review } from "../api/types";

export type { Organization, Review };

export const useOrganizationStore = defineStore("organization", () => {
  const organizations = ref<Organization[]>([]);
  const organization = ref<Organization | null>(null);
  const reviews = ref<Review[]>([]);
  const currentPage = ref(1);
  const totalReviews = ref(0);
  const loading = ref(false);
  const error = ref<ApiErrorBody | null>(null);
  const savedUrl = ref("");
  const connecting = ref(false);
  const elapsedSeconds = ref(0);
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;

  async function loadOrganizations() {
    loading.value = true;

    const result = await fetchOrganizations();
    if (result.isOk && result.data) {
      organizations.value = result.data.data;
    }

    error.value = result.error;
    loading.value = false;
  }

  async function loadReviews(page: number) {
    if (!organization.value) {
      return;
    }

    const result = await fetchReviews(organization.value.id, page);
    if (result.isOk && result.data) {
      reviews.value = result.data.data;
      currentPage.value = result.data.meta.current_page;
      totalReviews.value = result.data.meta.total;
    }

    error.value = result.error;
  }

  async function selectOrganization(id: number) {
    loading.value = true;

    try {
      organization.value = organizations.value.find(o => o.id === id) ?? null;

      if (!organization.value) {
        await loadOrganizations();
        organization.value = organizations.value.find(o => o.id === id) ?? null;
      }

      if (organization.value) {
        await loadReviews(1);
      }
    } finally {
      loading.value = false;
    }
  }

  async function connect(url: string) {
    savedUrl.value = url;
    connecting.value = true;
    elapsedSeconds.value = 0;
    elapsedTimer = setInterval(() => {
      elapsedSeconds.value++;
    }, 1000);

    // Скрейп идёт синхронно на бэке — этот await может занять 1-2 минуты,
    // отдельного polling-статуса не делаем, просто ждём ответ.
    const result = await connectOrganization(url);

    if (elapsedTimer) {
      clearInterval(elapsedTimer);
      elapsedTimer = null;
    }
    connecting.value = false;

    if (result.isOk) {
      error.value = null;
      await loadOrganizations();
    } else {
      error.value = result.error;
    }
  }

  function setPage(page: number) {
    loadReviews(page);
  }

  return {
    organizations,
    organization,
    reviews,
    totalReviews,
    currentPage,
    loading,
    error,
    savedUrl,
    connecting,
    elapsedSeconds,
    loadOrganizations,
    selectOrganization,
    connect,
    setPage,
  };
});
