<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { PageState } from "primevue/paginator";
import Card from "primevue/card";
import Rating from "primevue/rating";
import Tag from "primevue/tag";
import Avatar from "primevue/avatar";
import Paginator from "primevue/paginator";
import Button from "primevue/button";
import ProgressSpinner from "primevue/progressspinner";
import { useOrganizationStore } from "../stores/organization";
import AppLayout from "../components/AppLayout.vue";

const org = useOrganizationStore();
const route = useRoute();
const router = useRouter();

const organizationId = computed(() => Number(route.params.id));

const first = computed(() => (org.currentPage - 1) * 50);

watch(organizationId, (id) => {
  org.selectOrganization(id);
}, { immediate: true });

function onPage(event: PageState) {
  org.setPage(event.page + 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";

  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initials(name: string | null): string {
  if (!name) return "?";

  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function ratingSeverity(r: number): "success" | "info" | "warn" | "danger" {
  if (r >= 5) return "success";
  if (r >= 4) return "info";
  if (r >= 3) return "warn";
  return "danger";
}
</script>

<template>
  <AppLayout>
    <div class="flex flex-col gap-6">
      <Button
        label="Назад к списку"
        icon="pi pi-arrow-left"
        text
        class="self-start"
        @click="router.push('/settings')"
      />

      <div
        v-if="org.loading && !org.organization"
        class="flex justify-center py-8"
      >
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>

      <!-- Org stats header -->
      <Card v-if="org.organization">
        <template #content>
          <div>
            <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
              Организация #{{ org.organization.business_id }}
            </h1>
          </div>
          <div class="mt-6 flex flex-wrap items-center gap-6 border-t border-surface-200 pt-6 dark:border-surface-700">
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                {{ (org.organization.rating ?? 0).toFixed(1) }}
                <span class="text-sm font-normal text-surface-400">из 5</span>
              </span>
              <span class="text-xs text-surface-500 dark:text-surface-400">средний рейтинг</span>
            </div>
            <div class="h-10 w-px bg-surface-200 dark:bg-surface-700" />
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ (org.organization.ratings_count ?? 0).toLocaleString('ru') }}</span>
              <span class="text-xs text-surface-500 dark:text-surface-400">оценок</span>
            </div>
            <div class="h-10 w-px bg-surface-200 dark:bg-surface-700" />
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ (org.organization.reviews_count ?? 0).toLocaleString('ru') }}</span>
              <span class="text-xs text-surface-500 dark:text-surface-400">отзывов с текстом</span>
            </div>
            <div class="h-10 w-px bg-surface-200 dark:bg-surface-700" />
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ org.totalReviews }}</span>
              <span class="text-xs text-surface-500 dark:text-surface-400">загружено</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Reviews list -->
      <div class="flex flex-col gap-4">
        <Card
          v-for="review in org.reviews"
          :key="review.id"
        >
          <template #content>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <Avatar
                  :image="review.reviewer_avatar_url ?? '/default-avatar.jpg'"
                  :label="review.reviewer_avatar_url ? undefined : initials(review.reviewer_name)"
                  shape="circle"
                />

                <div>
                  <div class="font-medium text-surface-900 dark:text-surface-0">
                    {{ review.reviewer_name ?? "Без имени" }}
                  </div>
                  <div class="text-xs text-surface-500 dark:text-surface-400">
                    {{ formatDate(review.updated_time) }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Tag
                  :value="String(review.reviewer_rating)"
                  :severity="ratingSeverity(review.reviewer_rating)"
                />
                <Rating
                  :model-value="review.reviewer_rating"
                  readonly
                />
              </div>
            </div>
            <p
              v-if="review.reviewer_comment"
              class="mt-4 leading-relaxed text-surface-700 dark:text-surface-200"
            >
              {{ review.reviewer_comment }}
            </p>
            <p
              v-if="review.business_comment"
              class="mt-3 rounded-lg bg-surface-100 p-3 text-sm leading-relaxed text-surface-600 dark:bg-surface-800 dark:text-surface-300"
            >
              <span class="font-medium">Ответ организации: </span>{{ review.business_comment }}
            </p>
          </template>
        </Card>
      </div>

      <Paginator
        :first="first"
        :rows="50"
        :total-records="org.totalReviews"
        :rows-per-page-options="[]"
        @page="onPage"
      />
    </div>
  </AppLayout>
</template>
