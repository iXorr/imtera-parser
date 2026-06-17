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

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = "Заполните все поля";
    return;
  }

  error.value = "";
  loading.value = true;

  const ok = await auth.login(email.value, password.value);
  loading.value = false;

  if (ok) {
    toast.add({ severity: "success", summary: "Добро пожаловать!", life: 2000 });
    router.push("/settings");
  } else {
    error.value = "Неверный email или пароль";
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
            {{ error }}
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
