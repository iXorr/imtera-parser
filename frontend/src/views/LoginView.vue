<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";
import { useAuthStore } from "../stores/auth";
import { useApiFetch } from "../composables/useApiFetch";
import { errorMessage } from "../api/client";
import { login } from "../api/auth";
import type { LoginResponse } from "../api/auth";

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const email = ref("");
const password = ref("");

const { loading, error, execute } = useApiFetch<LoginResponse>();

async function handleLogin() {
  const result = await execute(() => login(email.value, password.value));

  if (result.isOk && result.data) {
    auth.setToken(result.data.token);
    toast.add({ severity: "success", summary: "Добро пожаловать!", life: 2000 });
    router.push("/settings");
  }
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-surface-50 px-4 dark:bg-surface-950">
    <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
      Imtera | Парсер
    </div>

    <Card class="w-full max-w-sm shadow-lg">
      <template #content>
        <form
          class="flex flex-col gap-4"
          @submit.prevent="handleLogin"
        >
          <Message
            v-if="error"
            severity="error"
            :closable="false"
          >
            {{ errorMessage(error) }}
          </Message>

          <div class="flex flex-col gap-2">
            <label
              for="email"
              class="text-sm font-medium text-surface-700 dark:text-surface-200"
            >Email</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              autocomplete="email"
              fluid
            />
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="text-sm font-medium text-surface-700 dark:text-surface-200"
            >Пароль</label>
            <Password
              id="password"
              v-model="password"
              :feedback="false"
              placeholder="••••••••"
              autocomplete="current-password"
              toggle-mask
              fluid
            />
          </div>

          <Button
            type="submit"
            label="Войти"
            :loading="loading"
            fluid
          />
        </form>
      </template>

      <template #footer>
        <p class="text-center text-sm text-surface-500 dark:text-surface-400">
          Тестовый аккаунт: <code class="rounded bg-surface-100 px-1 py-0.5 dark:bg-surface-800">admin@example.com</code> / <code class="rounded bg-surface-100 px-1 py-0.5 dark:bg-surface-800">password</code>
        </p>
      </template>
    </Card>
  </div>
</template>
