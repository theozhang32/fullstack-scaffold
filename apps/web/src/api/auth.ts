import type { UserView } from '@/models/domain'
/** 认证与会话端口（auth 模块） */
import { http } from './http'

export interface LoginResult {
  token: string
  expiresAt: string
  user: UserView
}

export const authApi = {
  login: (input: { username: string, password: string }) => http.post<LoginResult>('/auth/login', input),
  logout: () => http.post<{ success: boolean, username: string | null }>('/auth/logout'),
  me: () => http.get<UserView>('/auth/me'),
}
