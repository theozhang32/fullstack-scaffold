import { USER_ROLES } from '@fullstack-scaffold/shared'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { pageQuerySchema } from '../../common/utils/pagination'

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
export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z
  .object({
    displayName: z.string().trim().min(1).max(64),
    role: z.enum(USER_ROLES),
    enabled: z.boolean(),
    remark: z.string().trim().max(2000).nullish(),
  })
  .partial()
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const listUsersQuerySchema = pageQuerySchema.extend({
  keyword: z.string().trim().max(64).optional(),
})
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
