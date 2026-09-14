import type { ServerConfig } from './config'
import { resolve } from 'node:path'
import process from 'node:process'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'
import { AppController } from './app.controller'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { RolesGuard } from './common/guards/roles.guard'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { envSchema, loadConfig, validateEnv } from './config'
import { createMikroOrmOptions } from './mikro-orm.config'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard'
import { RedisModule } from './modules/redis/redis.module'
import { UsersModule } from './modules/users/users.module'

function pinoRedactPaths(log: ServerConfig['log']): string[] {
  const fromFields = log.redactFields.flatMap(field => [
    field,
    `req.body.${field}`,
    `req.query.${field}`,
  ])
  const fromPaths = log.redactPaths.map(path => path.startsWith('/') ? path.slice(1) : path)
  return [...new Set([...fromFields, ...fromPaths, 'req.headers.authorization'])]
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // 仅开发环境读本地 .env；生产由容器/编排注入环境变量
      ...(process.env.NODE_ENV !== 'production'
        ? { envFilePath: [resolve(__dirname, '../.env')] }
        : {}),
      validate: validateEnv,
      // load 执行时 ConfigService 尚未组装；validate 已把 .env 读入 process.env，
      // 此处重新 parse 取得带默认值的 env，派生运行时配置，避免中间可变变量
      load: [() => loadConfig(envSchema.parse(process.env))],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const server = config.getOrThrow<ServerConfig>('server')
        return {
          pinoHttp: {
            transport:
              process.env.NODE_ENV !== 'production'
                ? { target: 'pino-pretty', options: { singleLine: true } }
                : undefined,
            redact: pinoRedactPaths(server.log),
            autoLogging: { ignore: (req: { url?: string }) => String(req.url ?? '').includes('/health') },
          },
        }
      },
    }),
    MikroOrmModule.forRootAsync({
      // driver 由 createMikroOrmOptions 按 DB_DRIVER 注入；此处 as never 收口 Nest 泛型
      driver: undefined as never,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createMikroOrmOptions(
        config.getOrThrow<string>('DB_URL'),
        config.getOrThrow<'sqlite' | 'mysql'>('DB_DRIVER'),
      ),
    }),
    ThrottlerModule.forRoot({
      errorMessage: '请求过于频繁，请稍后再试',
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
    }),
    RedisModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
