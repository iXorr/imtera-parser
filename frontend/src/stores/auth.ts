import { defineStore } from "pinia";
import { ref } from "vue";
import { logout as logoutRequest } from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(!!localStorage.getItem("token"));

  function setToken(token: string) {
    localStorage.setItem("token", token);
    isAuthenticated.value = true;
  }

  async function logout() {
    // Токен нужен в заголовке запроса — отзываем на бэке до того, как
    // выкинем его из localStorage. apiFetch не бросает исключений, поэтому
    // сетевой сбой здесь не помешает разлогиниться локально.
    await logoutRequest();

    isAuthenticated.value = false;
    localStorage.removeItem("token");
  }

  return { isAuthenticated, setToken, logout };
});
