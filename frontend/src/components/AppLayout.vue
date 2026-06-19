<script setup lang="ts">
import { useRouter } from "vue-router";
import Button from "primevue/button";

import ThemeToggle from "./ThemeToggle.vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const logout = async () => {
  await auth.logout();
  router.push("/login");
};
</script>

<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-950">
    <header class="sticky top-0 z-10 border-b border-surface-200 bg-surface-0/80 backdrop-blur dark:border-surface-800 dark:bg-surface-900/80">
      <div class="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <RouterLink
          to="/settings"
          class="text-lg font-bold text-primary-600 dark:text-primary-400"
        >
          Imtera
        </RouterLink>

        <div class="flex-1" />

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
