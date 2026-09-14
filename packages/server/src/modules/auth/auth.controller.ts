import type { AuthUser } from '../../common/decorators/current-user.decorator'
import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { ApiOkData, ZodBody } from '../../common/openapi'
import { LoginDto } from './auth.dto'
import { AuthService } from './auth.service'

const loginDataSchema = {
  type: 'object',
  properties: {
    token: { type: 'string', description: 'JWT 访问令牌，后续请求放在 Authorization: Bearer <token>' },
    expiresAt: { type: 'string', format: 'date-time', description: '令牌过期时间' },
    user: { type: 'object', description: '当前用户信息（id / username / displayName / role）' },
  },
  required: ['token', 'expiresAt', 'user'],
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: '账号密码登录（公开）' })
  @ZodBody(LoginDto)
  @ApiOkData(loginDataSchema, '登录成功，返回 token 与用户信息')
  login(@Body() body: LoginDto) {
    return this.authService.login(body)
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '登出', description: '无状态 JWT：登出由客户端丢弃令牌完成' })
  @ApiOkData(
    {
      type: 'object',
      properties: { success: { type: 'boolean', example: true }, username: { type: 'string', nullable: true } },
    },
  )
  logout(@CurrentUser() operator?: AuthUser) {
    return this.authService.logout(operator)
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '当前登录用户信息' })
  @ApiOkData({ type: 'object', description: '当前用户信息（id / username / displayName / role）' })
  me(@CurrentUser() operator: AuthUser) {
    return this.authService.getMe(operator)
  }
}
