import type { CreateUserInput, ListUsersQueryInput, Paginated, UpdateUserInput, UserView } from '@fullstack-scaffold/shared'
/** 用户管理端口（users 模块，示例 CRUD） */
import { http } from './http'

export const usersApi = {
  // 展开为字面量类型，使其满足 http 层 Record<string, unknown> 查询参数的索引签名
  list: (query: ListUsersQueryInput = {}) => http.get<Paginated<UserView>>('/users', {
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
  }),
  get: (id: number) => http.get<UserView>(`/users/${id}`),
  create: (input: CreateUserInput) => http.post<UserView>('/users', input),
  update: (id: number, input: UpdateUserInput) => http.put<UserView>(`/users/${id}`, input),
  remove: (id: number) => http.del<null>(`/users/${id}`),
}
