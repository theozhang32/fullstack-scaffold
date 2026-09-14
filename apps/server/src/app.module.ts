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
import { envSchema, loadConfig, validateEnv } from './config'
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
      validate: validateEnv,
      // load 执行时 ConfigService 尚未组装；validate 已把 .env 读入 process.env，
      // 此处重新 parse 取得带默认值的 env，派生运行时配置，避免中间可变变量
      load: [() => loadConfig(envSchema.parse(process.env))],
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
      useFactory: (config: ConfigService) => createMikroOrmOptions(config.getOrThrow<string>('DB_URL')),
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
