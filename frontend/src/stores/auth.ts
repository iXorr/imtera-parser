import { defineStore } from "pinia";
import { ref } from "vue";
import { login as apiLogin } from "../api/auth";
import { ApiError } from "../api/client";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(!!localStorage.getItem("token"));

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const { token } = await apiLogin(email, password);
      localStorage.setItem("token", token);
      isAuthenticated.value = true;

      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        return false;
      }

      throw error;
    }
  }

  function logout() {
    isAuthenticated.value = false;
    localStorage.removeItem("token");
  }

  return { isAuthenticated, login, logout };
});
