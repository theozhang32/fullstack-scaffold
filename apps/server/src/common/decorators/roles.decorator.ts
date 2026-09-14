import type { UserRole } from '@fullstack-scaffold/shared'
import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
/** 标记接口所需角色（任一满足即可），配合全局 RolesGuard 使用；不标记则登录即可访问 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
