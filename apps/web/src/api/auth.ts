import type { LoginInput, LoginResult, UserView } from '@fullstack-scaffold/shared'
/** 认证与会话端口（auth 模块） */
import { http } from './http'

export const authApi = {
  login: (input: LoginInput) => http.post<LoginResult>('/auth/login', input),
  logout: () => http.post<{ success: boolean, username: string | null }>('/auth/logout'),
  me: () => http.get<UserView>('/auth/me'),
}
