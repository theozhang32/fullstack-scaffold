import type { INestApplication } from '@nestjs/common'
import type { ServerConfig } from './config'
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

async function createApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  return app
}

function configureCors(app: INestApplication, cors: ServerConfig['cors']) {
  if (!cors.enabled)
    return

  const { allowedOrigins, allowCredentials, maxAgeSeconds } = cors

  // 将白名单元素编译为通配符正则（`*` → `.*`，其余字符转义）
  const patterns = allowedOrigins.map(rule =>
    new RegExp(`^${rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`),
  )

  // origin 函数：按请求源动态决策
  // - allowedOrigins 为空 → 反射任意源（允许全部）
  // - 非空 → 精确 / 通配符匹配；命中则放行，否则拒绝
  // 如需更复杂的动态逻辑（查 DB / 租户路由 / 异步校验），在此处替换实现即可
  app.enableCors({
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
      if (patterns.length === 0)
        return callback(null, true)
      if (!requestOrigin)
        return callback(null, false)
      const allowed = patterns.some(re => re.test(requestOrigin))
      callback(allowed ? null : new Error(`CORS: ${requestOrigin} 不在允许列表`), allowed)
    },
    credentials: allowCredentials,
    maxAge: maxAgeSeconds,
  })
}

/** Schema 变更一律由 migrations 管理；启动时自动应用未执行的迁移 */
async function applyPendingMigrations(app: INestApplication) {
  const migrator = app.get(MikroORM).migrator
  const pending = await migrator.getPending()
  if (pending.length === 0)
    return
  await migrator.up()
  app.get(Logger).log(`已应用 ${pending.length} 个数据库迁移`)
}

/** 显式配置优先，否则按 NODE_ENV 推断（非生产开启） */
function setupSwagger(app: INestApplication, server: ServerConfig, config: ConfigService): boolean {
  const enabled = server.swagger.enabled ?? config.get<string>('NODE_ENV') !== 'production'
  if (!enabled)
    return false

  const document = SwaggerModule.createDocument(app, buildOpenApiConfig())
  SwaggerModule.setup(server.swagger.path, app, document, {
    jsonDocumentUrl: `${server.swagger.path}-json`,
    yamlDocumentUrl: `${server.swagger.path}-yaml`,
    swaggerOptions: { persistAuthorization: true },
  })
  return true
}

function logStartup(app: INestApplication, server: ServerConfig, swaggerEnabled: boolean) {
  const logger = app.get(Logger)
  logger.log(`服务已启动：/${server.apiPrefix}`)
  if (swaggerEnabled)
    logger.log(`Swagger 文档：/${server.swagger.path}`)
}

async function bootstrap() {
  const app = await createApp()
  const config = app.get(ConfigService)
  const server = config.getOrThrow<ServerConfig>('server')

  app.setGlobalPrefix(server.apiPrefix)
  app.enableShutdownHooks()

  configureCors(app, server.cors)
  await applyPendingMigrations(app)
  const swaggerEnabled = setupSwagger(app, server, config)

  await app.listen(server.port)
  logStartup(app, server, swaggerEnabled)
}

void bootstrap()
