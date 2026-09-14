import type { AuthUser } from '../../common/decorators/current-user.decorator'
import type { ServerConfig } from '../../config'
import type { User } from '../users/user.entity'
import type { UserDto } from '../users/user.service'
import type { LoginInput } from './auth.dto'
import type { JwtPayload } from './jwt-auth.guard'
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'
import { toUserDto, UsersService } from '../users/user.service'

export interface LoginResult {
  token: string
  expiresAt: Date
  user: UserDto
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.usersService.findByUsername(input.username)
    const invalid = new UnauthorizedException('账号或密码不正确')
    if (!user || !user.passwordHash) {
      throw invalid
    }
    if (!(await bcrypt.compare(input.password, user.passwordHash))) {
      throw invalid
    }
    if (!user.enabled) {
      throw new ForbiddenException('账号已被禁用，请联系管理员')
    }
    return this.issueSession(user)
  }

  async getMe(operator: AuthUser): Promise<UserDto> {
    return toUserDto(await this.usersService.mustFind(operator.id))
  }

  /** 无状态 JWT：注销由客户端丢弃令牌完成 */
  async logout(operator: AuthUser | undefined) {
    return { success: true, username: operator?.username ?? null }
  }

  private async issueSession(user: User): Promise<LoginResult> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    }
    const token = await this.jwtService.signAsync(payload)
    const server = this.config.getOrThrow<ServerConfig>('server')
    const ms = parseDurationToMs(server.jwt.expiresIn)
    return {
      token,
      expiresAt: new Date(Date.now() + ms),
      user: toUserDto(user),
    }
  }
}

/** 解析 '12h' / '30m' / '7d' / 秒数字符串为毫秒；格式非法时抛错（格式已在 env 校验，此处兜底） */
export function parseDurationToMs(input: string): number {
  const match = /^(\d+)\s*(ms|[smhd])?$/.exec(input.trim())
  if (!match) {
    throw new Error(`时长格式无法解析：${input}（应形如 30m / 12h / 7d）`)
  }
  const value = Number(match[1])
  const unit = match[2] ?? 's'
  const factor = ({ ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as Record<string, number>)[unit]
  return value * factor
}
