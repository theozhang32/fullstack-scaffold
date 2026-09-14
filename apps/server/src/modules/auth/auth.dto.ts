import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, '账号不能为空').max(64),
  password: z.string().min(1, '密码不能为空').max(64),
})
export type LoginInput = z.infer<typeof loginSchema>

export class LoginDto extends createZodDto(loginSchema) {}
