
// ROUTES

const routes = [
  {path: "/", redirect: "/login" },
  {path: "/login", component: Login },
  {path: "/register", component: Register },
  {path: "/admin/dashboard", component: AdminDashboard, meta: { role: "admin" }},
  {path: "/staff/dashboard", component: StaffDashboard, meta: { role: "staff" }},
  {path: "/user/dashboard", component: UserDashboard, meta: { role: "trekker" }}
];

// ─────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

// ─────────────────────────────────────────────
// ROUTE GUARD
// ─────────────────────────────────────────────


router.beforeEach((to, from, next) => {
  const publicPages = ["/login", "/register"];
  const isPublic = publicPages.includes(to.path);

  const token = getToken();
  const role = getRole();

    // User not logged in

  if (!isPublic && !token)
    return next("/login");

 // Logged in user tries to access login/register

  if (isPublic && token) {
    if (role === "admin") {
      return next("/admin/dashboard");
    }

    if (role === "staff") {
      return next("/staff/dashboard");
    }
    return next("/user/dashboard");
  }

   // Wrong role trying to access another dashboard

  if (to.meta.role && to.meta.role !== role) {
    if (role === "admin")
      return next("/admin/dashboard");

    if (role === "staff")
      return next("/staff/dashboard");

    return next("/user/dashboard");
  }

  next();
});

// ─────────────────────────────────────────────
// MOUNT
// ─────────────────────────────────────────────


const app = Vue.createApp({
  template: `<router-view></router-view>`
});

app.use(router);

app.mount("#app");
