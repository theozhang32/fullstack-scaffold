import type { UserRole } from '@fullstack-scaffold/shared'
import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'

declare module 'vue-router' {
  interface RouteMeta {
    /** 公开页（登录），免会话校验 */
    public?: boolean
    /** 进入所需角色（任一满足即可；不标记则登录即可访问） */
    roles?: UserRole[]
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/views/AppLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { roles: ['ADMIN'] } },
        { path: ':pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
      ],
    },
  ],
})

/** 全局守卫：会话门禁 + 角色校验 */
router.beforeEach(async (to) => {
  const session = useSessionStore()

  if (to.meta.public) {
    return session.isLoggedIn ? { path: '/' } : true
  }
  if (!session.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (!session.booted) {
    await session.bootstrap()
  }
  if (!session.user) {
    return { path: '/login' }
  }
  if (to.meta.roles && !to.meta.roles.includes(session.user.role)) {
    return { path: '/' }
  }
  return true
})
