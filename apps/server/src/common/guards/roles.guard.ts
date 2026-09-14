import type { UserRole } from '@fullstack-scaffold/shared'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { AuthUser } from '../decorators/current-user.decorator'
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

/** 角色守卫：校验 @Roles() 标记的角色（任一满足即可），需在 JwtAuthGuard 之后执行 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>()
    const user = request.user
    if (!user) {
      throw new UnauthorizedException('未登录')
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException('当前角色无此操作权限')
    }
    return true
  }
}
