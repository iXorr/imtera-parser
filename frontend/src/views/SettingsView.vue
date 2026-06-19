<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import type { PageState } from "primevue/paginator";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";
import Paginator from "primevue/paginator";
import ProgressSpinner from "primevue/progressspinner";
import { useOrganizationStore } from "../stores/organization";
import { errorMessage } from "../api/client";
import AppLayout from "../components/AppLayout.vue";

const org = useOrganizationStore();
const router = useRouter();
const toast = useToast();

const url = ref(org.savedUrl);

const first = computed(() => (org.organizationsPage - 1) * org.organizationsPerPage);

function onPage(event: PageState) {
  org.loadOrganizations(event.page + 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const elapsedLabel = computed(() => {
  const seconds = org.elapsedSeconds;
  if (seconds < 60) {
    return `Процесс идёт ${seconds} сек.`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `Процесс идёт ${minutes} мин ${rest} сек.`;
});

async function handleConnect() {
  await org.connect(url.value.trim());

  if (org.error) {
    toast.add({ severity: "error", summary: "Ошибка", detail: errorMessage(org.error), life: 5000 });
  } else {
    toast.add({ severity: "success", summary: "Успешно", life: 3000 });
  }
}

onMounted(() => {
  org.loadOrganizations();
});
</script>

<template>
  <AppLayout>
    <div class="flex flex-col gap-6">
      <!-- URL card -->
      <Card>
        <template #title>
          Подключение организации
        </template>

        <template #subtitle>
          Вставьте ссылку на карточку организации в Яндекс.Картах
        </template>

        <template #content>
          <div class="flex flex-col gap-3 sm:flex-row">
            <InputText
              v-model="url"
              placeholder="https://yandex.ru/maps/org/название/123456/"
              class="flex-1"
              :invalid="!!org.error"
              :disabled="org.connecting"
            />
            <Button
              label="Подключить"
              :loading="org.connecting"
              :disabled="org.connecting"
              @click="handleConnect"
            />
          </div>
          <Message
            v-if="org.connecting"
            severity="info"
            :closable="false"
            class="mt-3"
          >
            {{ elapsedLabel }} — сбор отзывов с Яндекс.Карт может занять 1-2 минуты.
          </Message>
          <Message
            v-else-if="org.error"
            severity="error"
            :closable="false"
            class="mt-3"
          >
            {{ errorMessage(org.error) }}
          </Message>
        </template>
      </Card>

      <!-- Organizations list -->
      <div class="flex flex-col gap-4">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
          Подключённые организации
        </h2>

        <div
          v-if="org.loading && !org.organizations.length"
          class="flex justify-center py-8"
        >
          <ProgressSpinner style="width: 40px; height: 40px" />
        </div>

        <Message
          v-else-if="!org.organizations.length"
          severity="info"
          :closable="false"
        >
          Пока нет подключённых организаций.
        </Message>

        <Card
          v-for="o in org.organizations"
          :key="o.id"
        >
          <template #content>
            <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div class="min-w-0 flex-1">
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                  {{ o.name ?? `Организация ${o.business_id}` }}
                </h3>
                <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  ID организации: {{ o.business_id }}
                </p>
              </div>
              <Button
                label="Смотреть отзывы"
                icon="pi pi-arrow-right"
                icon-pos="right"
                class="shrink-0 whitespace-nowrap"
                @click="router.push(`/reviews/${o.id}`)"
              />
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-6 border-t border-surface-200 pt-6 dark:border-surface-700">
              <div class="flex flex-col items-center gap-1">
                <Tag
                  :value="o.rating ?? 0"
                  severity="success"
                  class="text-base"
                />
                <span class="text-xs text-surface-500 dark:text-surface-400">средний рейтинг</span>
              </div>
              <div class="h-10 w-px bg-surface-200 dark:bg-surface-700" />
              <div class="flex flex-col items-center gap-1">
                <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                  {{ o.ratings_count ?? 0 }}
                </span>
                <span class="text-xs text-surface-500 dark:text-surface-400">оценок</span>
              </div>
              <div class="h-10 w-px bg-surface-200 dark:bg-surface-700" />
              <div class="flex flex-col items-center gap-1">
                <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                  {{ o.reviews_count ?? 0 }}
                </span>
                <span class="text-xs text-surface-500 dark:text-surface-400">отзывов с текстом</span>
              </div>
            </div>
          </template>
        </Card>

        <Paginator
          v-if="org.organizationsTotal > org.organizationsPerPage"
          :first="first"
          :rows="org.organizationsPerPage"
          :total-records="org.organizationsTotal"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          @page="onPage"
        />
      </div>
    </div>
  </AppLayout>
</template>
