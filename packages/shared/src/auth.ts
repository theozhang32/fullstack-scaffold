import { z } from 'zod'
import { userViewSchema } from './user'

export const loginSchema = z.object({
  username: z.string().trim().min(1, '账号不能为空').max(64),
  password: z.string().min(1, '密码不能为空').max(64),
})
export type LoginInput = z.input<typeof loginSchema>

export const loginResultSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  user: userViewSchema,
})
export type LoginResult = z.output<typeof loginResultSchema>
