import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchOrganizations, fetchReviews } from "../api/organizations";
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
    await loadOrganizations();
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
    loadOrganizations,
    selectOrganization,
    connect,
    setPage,
  };
});
