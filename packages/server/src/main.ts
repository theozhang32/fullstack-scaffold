import { MikroORM } from '@mikro-orm/core'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'

function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Fullstack Scaffold API')
    .setDescription([
      '脚手架接口文档。除标注「公开」的接口外，均需在请求头携带 `Authorization: Bearer <token>`（POST /api/v1/auth/login 获取）。',
      '',
      '统一响应包：`{ code, message, data }`，`code = 0` 表示成功；失败时 `code` 为非 0 错误码、`message` 为可读信息。',
      '权限说明：users 模块需要 ADMIN 角色，其余接口登录即可访问。',
    ].join('\n'))
    .setVersion('1.0')
    .setOpenAPIVersion('3.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('health', '健康检查')
    .addTag('auth', '认证与会话')
    .addTag('users', '用户管理（示例模块）')
    .build()
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  app.setGlobalPrefix('api/v1')
  app.enableShutdownHooks()

  const config = app.get(ConfigService)
  const corsOrigin = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  app.enableCors({
    origin: corsOrigin.length > 0 ? corsOrigin : true,
    credentials: true,
  })

  // Schema 变更一律由 migrations 管理；启动时自动应用未执行的迁移
  const orm = app.get(MikroORM)
  const migrator = orm.migrator
  const pending = await migrator.getPending()
  if (pending.length > 0) {
    await migrator.up()
    app.get(Logger).log(`已应用 ${pending.length} 个数据库迁移`)
  }

  const port = config.get<number>('PORT', 3100)

  // Swagger 文档：默认开发/测试开启、生产关闭，可用 SWAGGER_ENABLED 显式控制
  const swaggerEnabled
    = config.get<string>('SWAGGER_ENABLED')
      ?? (config.get<string>('NODE_ENV') !== 'production' ? 'true' : 'false')
  if (swaggerEnabled === 'true') {
    const document = SwaggerModule.createDocument(app, buildOpenApiConfig())
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      yamlDocumentUrl: 'api/docs-yaml',
      swaggerOptions: { persistAuthorization: true },
    })
  }

  await app.listen(port)
  app.get(Logger).log('服务已启动：/api/v1')
  if (swaggerEnabled === 'true') {
    app.get(Logger).log('Swagger 文档：/api/docs')
  }
}

void bootstrap()
