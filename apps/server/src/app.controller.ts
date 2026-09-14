import { MikroORM } from '@mikro-orm/core'
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { Public } from './common/decorators/public.decorator'

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly orm: MikroORM) {}

  @Get('health')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: '健康检查（公开）：进程存活 + 数据库连通' })
  @ApiOkResponse({
    description: '服务存活与数据库连通性（公开接口，响应为统一包格式）',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 0 },
        message: { type: 'string', example: 'ok' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'fullstack-scaffold' },
            db: { type: 'string', example: 'up' },
          },
        },
      },
    },
  })
  async getHealth() {
    const db = await this.orm.checkConnection()
    if (!db.ok) {
      throw new ServiceUnavailableException({
        message: '数据库不可用',
        details: { status: 'error', service: 'fullstack-scaffold', db: 'down', reason: db.reason },
      })
    }
    return { status: 'ok', service: 'fullstack-scaffold', db: 'up' }
  }
}
