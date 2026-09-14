import type { LoginInput, UserView } from '@fullstack-scaffold/shared'
import { defineStore } from 'pinia'
/**
 * 会话 Store（Pinia 单例）：持有 JWT 与当前用户，负责登录 / 登出 / 启动时恢复会话。
 * 本 store 不写业务规则，只做会话状态的存取。
 */
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import { getToken, setToken } from '@/api/http'
import { BizError } from '@/models/biz-error'

export const useSessionStore = defineStore('session', () => {
  const token = ref(getToken())
  const user = ref<UserView | null>(null)
  /** 启动时是否已完成 /auth/me 恢复 */
  const booted = ref(false)

  const isLoggedIn = computed(() => token.value !== '')
  const displayName = computed(() => user.value?.displayName ?? user.value?.username ?? '')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  function adoptSession(data: { token: string, user: UserView }) {
    token.value = data.token
    user.value = data.user
    setToken(data.token)
  }

  function clearSession() {
    token.value = ''
    user.value = null
    setToken('')
  }

  async function login(input: LoginInput) {
    try {
      adoptSession(await authApi.login(input))
    }
    catch (e) {
      clearSession()
      throw BizError.from(e)
    }
  }

  /** 路由守卫启动恢复：token 存在时拉取当前用户；失败即清除会话 */
  async function bootstrap(): Promise<void> {
    if (booted.value)
      return
    if (!token.value) {
      booted.value = true
      return
    }
    try {
      user.value = await authApi.me()
    }
    catch {
      clearSession()
    }
    finally {
      booted.value = true
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    }
    catch {
      /* 无状态 JWT：登出失败也照常丢弃令牌 */
    }
    clearSession()
  }

  return { token, user, booted, isLoggedIn, displayName, isAdmin, login, bootstrap, logout }
})
