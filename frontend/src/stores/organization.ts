import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchOrganizations, fetchReviews } from "../api/organizations";
import type { Organization, Review } from "../api/types";

export type { Organization, Review };

export const useOrganizationStore = defineStore("organization", () => {
  const organizations = ref<Organization[]>([]);
  const organization = ref<Organization | null>(null);
  const reviews = ref<Review[]>([]);
  const currentPage = ref(1);
  const totalReviews = ref(0);
  const loading = ref(false);
  const savedUrl = ref("");

  async function loadOrganizations() {
    loading.value = true;

    try {
      const response = await fetchOrganizations();
      organizations.value = response.data;
    } finally {
      loading.value = false;
    }
  }

  async function loadReviews(page: number) {
    if (!organization.value) {
      return;
    }

    const response = await fetchReviews(organization.value.id, page);
    reviews.value = response.data;
    currentPage.value = response.meta.current_page;
    totalReviews.value = response.meta.total;
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
    savedUrl,
    loadOrganizations,
    selectOrganization,
    connect,
    setPage,
  };
});
