import { loginSchema } from '@fullstack-scaffold/shared'
import { createZodDto } from 'nestjs-zod'

export class LoginDto extends createZodDto(loginSchema) {}
