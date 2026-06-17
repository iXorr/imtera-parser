import { defineStore } from "pinia";
import { ref } from "vue";

const STORAGE_KEY = "theme";

function getInitialIsDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(getInitialIsDark());
  document.documentElement.classList.toggle("dark", isDark.value);

  function toggle() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    localStorage.setItem(STORAGE_KEY, isDark.value ? "dark" : "light");
  }

  return { isDark, toggle };
});
