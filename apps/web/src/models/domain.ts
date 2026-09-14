/**
 * 领域类型入口：契约 schema 在 @fullstack-scaffold/shared；
 * 本文件只转出口客户端需要的类型/枚举，并保留展示元数据。
 * 不要 `export *` shared，以免把 zod schema 打进前端包。
 */

import type { UserRole } from '@fullstack-scaffold/shared/roles'

export type {
  CreateUserInput,
  ListUsersQueryInput,
  LoginInput,
  LoginResult,
  UpdateUserInput,
  UserRole,
  UserView,
} from '@fullstack-scaffold/shared'
export { isUserRole, USER_ROLES } from '@fullstack-scaffold/shared/roles'

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '管理员',
  USER: '普通用户',
}

export const ROLE_TAG_COLORS: Record<UserRole, string> = {
  ADMIN: 'red',
  USER: 'blue',
}
