import { defaultServerConfig } from '@fullstack-scaffold/config'
import {
  createListUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
} from '@fullstack-scaffold/shared'
import { createZodDto } from 'nestjs-zod'

export const listUsersQuerySchema = createListUsersQuerySchema(defaultServerConfig.pagination)

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
