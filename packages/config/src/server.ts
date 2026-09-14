/*
 * @Date: 2026-09-14 19:57:49
 * @LastEditors: Theo Zhang
 * @LastEditTime: 2026-09-14 20:25:04
 * @FilePath: /fullstack-scaffold/packages/config/src/server.ts
 */
import { z } from 'zod'

/**
 * server 命名空间运行时配置：不随部署环境变化的「代码资产」。
 * 与 env 的区别：这些值变化时应该改代码/发版，而不是改 .env。
 *
 * 若某项确实需要按环境覆盖，可在 loader.ts 中读取对应环境变量作为默认值的覆盖源；
 * 但不应进入 envSchema 强制校验，避免 .env 清单膨胀。
 *
 * 嵌套对象均以命名 schema + .default(() => schema.parse({})) 形式定义，
 * 使 serverConfigSchema.parse({}) 能取到全默认值，便于 vite.config.ts 等
 * 构建期脚本与前端直接消费默认值；同时规避 Zod v4 中 .default({}) 要求
 * 完整输出类型而导致的类型错误。
 */

const corsSchema = z.object({
  /** 是否启用 CORS；false 时完全不挂载 cors 中间件 */
  enabled: z.boolean().default(true),
  /**
   * 允许的来源匹配规则：
   * - 空数组：反射任意 Origin（允许全部）
   * - 非空数组：静态白名单（精确匹配），元素支持 `*` 通配符（如 `https://*.example.com`）
   * 开发环境默认源由 loader.ts 根据 web.devPort 派生，不在此硬编码
   * 动态场景（查 DB / 租户路由等）请在 main.ts 中用 origin 函数覆盖此默认值
   */
  allowedOrigins: z.array(z.string()).default([]),
  allowCredentials: z.boolean().default(true),
  maxAgeSeconds: z.number().int().positive().default(86400),
})

const jwtSchema = z.object({
  algorithm: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),
  issuer: z.string().default(''),
  audience: z.string().default(''),
  /** 过期时长，形如 30m / 12h / 7d / 3600 */
  expiresIn: z
    .string()
    .regex(/^(\d+)\s*(ms|[smhd])?$/, 'JWT_EXPIRES_IN 应形如 30m / 12h / 7d / 3600')
    .default('12h'),
})

const swaggerSchema = z.object({
  /** enabled 为 undefined 表示按 NODE_ENV 推断（非生产开启） */
  enabled: z.boolean().optional(),
  path: z.string().default('api/docs'),
})

const logSchema = z.object({
  redactPaths: z.array(z.string()).default(['/password', '/token', '/secret']),
  redactFields: z
    .array(z.string())
    .default(['password', 'token', 'accessToken', 'refreshToken']),
})

const paginationSchema = z.object({
  defaultPage: z.number().int().nonnegative().default(1),
  defaultSize: z.number().int().positive().default(20),
  maxSize: z.number().int().positive().default(100),
})

export const serverConfigSchema = z.object({
  /** HTTP 监听端口 */
  port: z.coerce.number().int().positive().default(3000),

  /** 全局路由前缀 */
  apiPrefix: z.string().default('api/v1'),

  /** CORS 策略 */
  cors: corsSchema.default(() => corsSchema.parse({})),

  /** JWT 会话策略（私钥仍走 env.JWT_SECRET） */
  jwt: jwtSchema.default(() => jwtSchema.parse({})),

  /** Swagger 接口文档开关 */
  swagger: swaggerSchema.default(() => swaggerSchema.parse({})),

  /** 日志脱敏配置 */
  log: logSchema.default(() => logSchema.parse({})),

  /** 通用分页默认值 */
  pagination: paginationSchema.default(() => paginationSchema.parse({})),
})

export type ServerConfig = z.infer<typeof serverConfigSchema>
