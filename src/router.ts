import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: 'Dashboard' } },
    { path: '/cameras', name: 'cameras', component: () => import('@/views/CamerasView.vue'), meta: { title: 'Cameras' } },
    { path: '/cameras/:id', name: 'camera', component: () => import('@/views/CameraDetailView.vue'), meta: { title: 'Camera' }, props: true },
    { path: '/alerts', name: 'alerts', component: () => import('@/views/AlertsView.vue'), meta: { title: 'Live Alerts' } },
    { path: '/history', name: 'history', component: () => import('@/views/HistoryView.vue'), meta: { title: 'Violation History' } },
    { path: '/zones', name: 'zones', component: () => import('@/views/ZonesView.vue'), meta: { title: 'Zones' } },
    { path: '/rules', name: 'rules', component: () => import('@/views/RulesView.vue'), meta: { title: 'PPE Rules' } },
    { path: '/analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue'), meta: { title: 'Analytics' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'SiteGuard AI')} · SiteGuard AI`
})

export default router
