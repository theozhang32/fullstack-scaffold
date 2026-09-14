/*
 * @Date: 2026-09-14 22:10:09
 * @LastEditors: Theo Zhang
 * @LastEditTime: 2026-09-14 22:49:57
 * @FilePath: /fullstack-scaffold/apps/server/src/modules/redis/redis.module.ts
 */
import type { Cache, CacheModuleOptions } from '@nestjs/cache-manager'
import { createKeyv } from '@keyv/redis'
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

const HEALTH_KEY = 'health:boot'
const HEALTH_TTL_MS = 5_000
const DEFAULT_TTL_MS = 60_000

/** 启动时用 cacheManager 做一次 round-trip，Redis 不可用则拒绝启动 */
@Injectable()
class RedisCacheProbe implements OnModuleInit {
  private readonly logger = new Logger(RedisCacheProbe.name)

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleInit() {
    await this.cache.set(HEALTH_KEY, 'ok', HEALTH_TTL_MS)
    const value = await this.cache.get(HEALTH_KEY)
    if (value !== 'ok') {
      throw new Error('Redis cache 连通性检查失败')
    }
    this.logger.log('Redis cache 已就绪')
  }
}

/**
 * Redis 作为 CacheModule 的唯一 store（`createKeyv`）。
 * `isGlobal: true` 后各模块直接 `@Inject(CACHE_MANAGER)` 即可，不必再 import 本模块。
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      /**
       * createKeyv 返回的 Keyv 和 @nestjs/cache-manager 从 keyv 引进来的 Keyv 不是同一份类型：
       * keyv 同时发了 ESM / CJS 两套声明，类上又有 private _ttl，TypeScript 按名义类型处理，两边不能互赋。
       * 运行时仍是同一份实现，所以对 factory 返回值做 as unknown as CacheModuleOptions。
       */
      useFactory: (config: ConfigService) => ({
        stores: [
          createKeyv(config.getOrThrow<string>('REDIS_URL'), {
            throwOnConnectError: true,
            throwOnErrors: true,
          }),
        ],
        ttl: DEFAULT_TTL_MS,
      } as unknown as CacheModuleOptions),
    }),
  ],
  providers: [RedisCacheProbe],
})
export class RedisModule {}
