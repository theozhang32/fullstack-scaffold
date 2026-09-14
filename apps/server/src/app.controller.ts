import type { Cache } from 'cache-manager'
import { MikroORM } from '@mikro-orm/core'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { Public } from './common/decorators/public.decorator'

const REDIS_HEALTH_KEY = 'health:ping'
const REDIS_HEALTH_TTL_MS = 5_000

@ApiTags('health')
@Controller()
export class AppController {
  constructor(
    private readonly orm: MikroORM,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  @Get('health')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: '健康检查（公开）：进程存活 + 数据库 / Redis 连通' })
  @ApiOkResponse({
    description: '服务存活与数据库、Redis 连通性（公开接口，响应为统一包格式）',
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
            redis: { type: 'string', example: 'up' },
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
        details: { status: 'error', service: 'fullstack-scaffold', db: 'down', redis: 'unknown', reason: db.reason },
      })
    }

    try {
      await this.cache.set(REDIS_HEALTH_KEY, 'pong', REDIS_HEALTH_TTL_MS)
      const value = await this.cache.get(REDIS_HEALTH_KEY)
      if (value !== 'pong') {
        throw new Error(`unexpected cache value: ${String(value)}`)
      }
    }
    catch (err) {
      throw new ServiceUnavailableException({
        message: 'Redis 不可用',
        details: {
          status: 'error',
          service: 'fullstack-scaffold',
          db: 'up',
          redis: 'down',
          reason: err instanceof Error ? err.message : String(err),
        },
      })
    }

    return { status: 'ok', service: 'fullstack-scaffold', db: 'up', redis: 'up' }
  }
}
