import { resolve } from 'node:path'
import process from 'node:process'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { SqliteDriver } from '@mikro-orm/sqlite'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'
import { AppController } from './app.controller'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { RolesGuard } from './common/guards/roles.guard'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { validateEnv } from './config/env'
import { createMikroOrmOptions } from './mikro-orm.config'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // 仅开发环境读本地 .env；生产由容器/编排注入环境变量
      ...(process.env.NODE_ENV !== 'production'
        ? { envFilePath: [resolve(__dirname, '../.env')] }
        : {}),
      validate: validateEnv as unknown as (config: Record<string, unknown>) => Record<string, unknown>,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: { ignore: req => String(req.url ?? '').includes('/health') },
      },
    }),
    MikroOrmModule.forRootAsync({
      driver: SqliteDriver as never,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createMikroOrmOptions(config.getOrThrow<string>('DB_STORAGE')),
    }),
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
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
