import type { PageQueryOptions } from './pagination'
import { z } from 'zod'
import { createPageQuerySchema } from './pagination'
import { USER_ROLES } from './roles'

/** JSON 视图（日期为 ISO 字符串），前后端响应体同源 */
export const userViewSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  displayName: z.string(),
  role: z.enum(USER_ROLES),
  enabled: z.boolean(),
  remark: z.string().nullable(),
  hasPassword: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type UserView = z.output<typeof userViewSchema>

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, '账号至少 2 个字符')
    .max(64)
    .regex(/^[\w.-]+$/, '账号仅支持字母、数字、下划线、点、横线'),
  password: z.string().min(8, '初始密码至少 8 位').max(64),
  displayName: z.string().trim().min(1, '姓名不能为空').max(64),
  role: z.enum(USER_ROLES).default('USER'),
  remark: z.string().trim().max(2000).nullish(),
})
export type CreateUserInput = z.input<typeof createUserSchema>
export type ParsedCreateUser = z.output<typeof createUserSchema>

export const updateUserSchema = z
  .object({
    displayName: z.string().trim().min(1).max(64),
    role: z.enum(USER_ROLES),
    enabled: z.boolean(),
    remark: z.string().trim().max(2000).nullish(),
  })
  .partial()
export type UpdateUserInput = z.input<typeof updateUserSchema>
export type ParsedUpdateUser = z.output<typeof updateUserSchema>

// eslint-disable-next-line ts/explicit-function-return-type -- zod 推断无法稳定手写
export function createListUsersQuerySchema(options: PageQueryOptions = {}) {
  return createPageQuerySchema(options).extend({
    keyword: z.string().trim().max(64).optional(),
  })
}

export const listUsersQuerySchema = createListUsersQuerySchema()
export type ListUsersQuery = z.output<typeof listUsersQuerySchema>
/** 请求侧：z.input 因 coerce 变成 unknown，客户端用 number 收窄 */
export interface ListUsersQueryInput {
  page?: number
  pageSize?: number
  keyword?: string
}
