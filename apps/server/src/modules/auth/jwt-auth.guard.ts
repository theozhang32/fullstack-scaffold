import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { AuthUser } from '../../common/decorators/current-user.decorator'
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator'
import { UsersService } from '../users/user.service'

export interface JwtPayload {
  sub: number
  username: string
  displayName: string
  role: AuthUser['role']
}

/** 全局 JWT 认证守卫：校验令牌后加载最新用户（角色/可用性以数据库为准） */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>()
    const token = this.extractToken(request)
    if (!token) {
      throw new UnauthorizedException('未登录或缺少访问令牌')
    }

    let payload: JwtPayload
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token)
    }
    catch {
      throw new UnauthorizedException('会话已过期或无效，请重新登录')
    }

    const user = await this.usersService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }
    if (!user.enabled) {
      throw new ForbiddenException('账号已被禁用')
    }

    request.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    }
    return true
  }

  private extractToken(request: Request): string | null {
    const [type, token] = (request.headers.authorization ?? '').split(' ')
    return type === 'Bearer' && token ? token : null
  }
}
