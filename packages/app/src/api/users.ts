import type { Paginated } from '@fullstack-scaffold/shared'
import type { UserView } from '@/models/domain'
/** 用户管理端口（users 模块，示例 CRUD） */
import { http } from './http'

export interface ListUsersQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface CreateUserInput {
  username: string
  password: string
  displayName: string
  role?: 'ADMIN' | 'USER'
  remark?: string | null
}

export interface UpdateUserInput {
  displayName?: string
  role?: 'ADMIN' | 'USER'
  enabled?: boolean
  remark?: string | null
}

export const usersApi = {
  // 展开为字面量类型，使其满足 http 层 Record<string, unknown> 查询参数的索引签名
  list: (query: ListUsersQuery = {}) => http.get<Paginated<UserView>>('/users', { ...query }),
  get: (id: number) => http.get<UserView>(`/users/${id}`),
  create: (input: CreateUserInput) => http.post<UserView>('/users', input),
  update: (id: number, input: UpdateUserInput) => http.put<UserView>(`/users/${id}`, input),
  remove: (id: number) => http.del<null>(`/users/${id}`),
}
