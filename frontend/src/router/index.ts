import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/settings" },

    {
      path: "/login",
      component: () => import("../views/LoginView.vue"),
    },

    {
      path: "/settings",
      component: () => import("../views/SettingsView.vue"),
      meta: { requiresAuth: true },
    },

    {
      path: "/reviews/:id",
      component: () => import("../views/ReviewsView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !localStorage.getItem("token")) {
    return "/login";
  }
});

export default router;
