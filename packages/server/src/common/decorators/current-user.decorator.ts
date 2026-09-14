import type { UserRole } from '@fullstack-scaffold/shared'
import type { ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import { createParamDecorator } from '@nestjs/common'

/** 请求挂载的当前登录用户（由 JwtAuthGuard 写入，角色/可用性以数据库为准） */
export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: UserRole
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>()
  return request.user
})
