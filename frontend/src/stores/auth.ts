import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(!!localStorage.getItem("token"));

  function setToken(token: string) {
    localStorage.setItem("token", token);
    isAuthenticated.value = true;
  }

  function logout() {
    isAuthenticated.value = false;
    localStorage.removeItem("token");
  }

  return { isAuthenticated, setToken, logout };
});
