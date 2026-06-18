<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import Button from "primevue/button";

import ThemeToggle from "./ThemeToggle.vue";
import { useAuthStore } from "../stores/auth";
import { useOrganizationStore } from "../stores/organization";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const org = useOrganizationStore();

const hasOrg = computed(() => !!org.organization);
const reviewsLink = computed(() => `/reviews/${org.organization?.id}`);

const logout = async () => {
  await auth.logout();
  router.push("/login");
};
</script>

<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
    <header class="sticky top-0 z-10 border-b border-surface-200 bg-surface-0/80 backdrop-blur dark:border-surface-800 dark:bg-surface-900/80">
      <div class="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <span class="text-lg font-bold text-primary-600 dark:text-primary-400">Imtera</span>

        <nav class="flex flex-1 gap-1">
          <RouterLink
            to="/settings"
            class="rounded-md px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-0"
            :class="{ '!text-primary-600 dark:!text-primary-400': route.path === '/settings' }"
          >
            Настройки
          </RouterLink>

          <RouterLink
            v-if="hasOrg"
            :to="reviewsLink"
            class="rounded-md px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-0"
            :class="{ '!text-primary-600 dark:!text-primary-400': route.path.startsWith('/reviews') }"
          >
            Отзывы
          </RouterLink>
        </nav>

        <ThemeToggle />

        <Button
          label="Выйти"
          size="small"
          text
          severity="secondary"
          @click="logout"
        />
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
