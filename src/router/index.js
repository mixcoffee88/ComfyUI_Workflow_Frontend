import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register', 
    name: 'Register',
    component: () => import('../pages/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/workflows',
    name: 'Workflows',
    component: () => import('../pages/Workflows.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/executions',
    name: 'Executions', 
    component: () => import('../pages/Executions.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../pages/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']
  const currentUser = store.state.auth.user

  // 토큰이 있지만 사용자 정보가 없는 경우 사용자 정보 가져오기
  if (localStorage.getItem('token') && !currentUser) {
    try {
      await store.dispatch('auth/fetchCurrentUser')
    } catch (error) {
      // 토큰이 유효하지 않은 경우
      localStorage.removeItem('token')
      store.commit('auth/CLEAR_AUTH')
    }
  }

  // 인증이 필요한 페이지 체크
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // 관리자 권한이 필요한 페이지 체크
  if (to.meta.requiresAdmin && store.state.auth.user?.role !== 'admin') {
    next('/dashboard')
    return
  }

  // 로그인된 사용자가 게스트 페이지 접근 시
  if (to.meta.guest && isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router 