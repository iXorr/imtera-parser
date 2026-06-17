<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import { useOrganizationStore } from "../stores/organization";
import { errorMessage } from "../api/client";
import AppLayout from "../components/AppLayout.vue";

const org = useOrganizationStore();
const router = useRouter();
const toast = useToast();

const url = ref(org.savedUrl);

async function handleConnect() {
  await org.connect(url.value.trim());

  if (!org.error) {
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
            />
            <Button
              label="Подключить"
              :loading="org.loading"
              @click="handleConnect"
            />
          </div>
          <Message
            v-if="org.error"
            severity="error"
            :closable="false"
            class="mt-3"
          >
            {{ errorMessage(org.error) }}
          </Message>
          <p class="mt-3 text-sm text-surface-500 dark:text-surface-400">
            Пример: <code class="rounded bg-surface-100 px-1 py-0.5 dark:bg-surface-800">https://yandex.ru/maps/org/mcdonalds/12345/reviews/</code>
          </p>
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
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                Организация {{ o.business_id }}
              </h3>
              <Button
                label="Смотреть отзывы"
                icon="pi pi-arrow-right"
                icon-pos="right"
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
      </div>
    </div>
  </AppLayout>
</template>
