/*
 * @Date: 2026-09-14 19:57:56
 * @LastEditors: Theo Zhang
 * @LastEditTime: 2026-09-14 21:13:13
 * @FilePath: /fullstack-scaffold/packages/config/src/loader.ts
 */
import type { Env } from './env'
import type { ServerConfig } from './server'
import type { WebConfig } from './web'
import { serverConfigSchema } from './server'
import { webConfigSchema } from './web'

/**
 * 顶层配置对象：web / server 两个命名空间。
 * - env 仍以顶层键形式挂载（NODE_ENV / JWT_SECRET / DB_DRIVER / DB_URL / REDIS_URL），由 ConfigModule.validate 注入
 * - web / server 为运行时配置，由 ConfigModule.load 注入
 */
export interface AppConfig {
  web: WebConfig
  server: ServerConfig
}

function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

/**
 * 运行时配置加载器：供 ConfigModule.forRoot({ load }) 使用。
 *
 * 设计要点：
 * - 纯函数：接收已校验的 env，派生出运行时配置；CLI/非 Nest 上下文也可直接调用
 * - 不做异步 IO：保持配置初始化同步，避免下游 forRootAsync 时序复杂化
 * - env 覆盖可选：若某运行时配置项确需按环境调整，可在此处读取已校验的 env 作为覆盖源
 */
export function loadConfig(env: Env): AppConfig {
  const web = webConfigSchema.parse({})

  const server = serverConfigSchema.parse({
    // 开发环境：CORS 默认源由 web.devPort 派生，避免与前端 dev 端口硬编码脱节
    // 生产环境：必须显式白名单（env.CORS_ORIGINS）
    cors: env.NODE_ENV === 'development'
      ? { enabled: true, allowedOrigins: [`http://localhost:${web.devPort}`] }
      : { allowedOrigins: parseCorsOrigins(env.CORS_ORIGINS) },
  })

  if (env.NODE_ENV === 'production' && server.cors.enabled && server.cors.allowedOrigins.length === 0) {
    throw new Error('生产环境 CORS.allowedOrigins 不能为空：请设置 CORS_ORIGINS（逗号分隔 Origin）')
  }

  return { web, server }
}

/**
 * 已解析的默认运行时配置：schema 全部取默认值的快照。
 * - vite.config.ts 等构建期脚本（Node 上下文）直接取 server 默认值，无需 env
 * - 前端运行时若不需按 env 派生，也可直接消费 web 默认值
 * 注意：若某项后续改为受 env 覆盖，构建期/运行时应改走 loadConfig(env) 而非此处
 */
export const defaultServerConfig: ServerConfig = serverConfigSchema.parse({})
export const defaultWebConfig: WebConfig = webConfigSchema.parse({})
