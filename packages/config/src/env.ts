/*
 * @Date: 2026-09-14 19:57:44
 * @LastEditors: Theo Zhang
 * @LastEditTime: 2026-09-14 21:30:00
 * @FilePath: /fullstack-scaffold/packages/config/src/env.ts
 */
import { z } from 'zod'

/**
 * 环境变量 schema：仅保留「必须按部署环境注入」的敏感/部署参数。
 * 其余配置一律归入运行时配置（见 server.ts / web.ts），由 @nestjs/config 统一纳管。
 *
 * - NODE_ENV：运行模式
 * - JWT_SECRET：JWT 签名密钥（敏感，必须注入）
 * - DB_DRIVER：数据库驱动（mysql | sqlite），默认 mysql
 * - DB_URL：MySQL 为 mysql:// 连接串；SQLite 为文件路径
 * - CORS_ORIGINS：生产 CORS 白名单（逗号分隔 Origin）；开发环境由 loader 按 web.devPort 派生
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET 至少 32 个字符'),
    /** 数据库驱动；决定 MikroORM driver 与 DB_URL 语义 */
    DB_DRIVER: z.enum(['sqlite', 'mysql']).default('mysql'),
    /**
     * - mysql：连接串，形如 mysql://user:pass@host:3306/dbname
     * - sqlite：数据库文件路径（相对 server 包目录或绝对路径）
     */
    DB_URL: z.string().min(1, 'DB_URL 不能为空'),
    /** 生产 CORS 白名单，逗号分隔 Origin；开发环境忽略，由 web.devPort 派生 */
    CORS_ORIGINS: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.DB_DRIVER === 'mysql' && !/^mysql2?:\/\//i.test(data.DB_URL)) {
      ctx.addIssue({
        code: 'custom',
        path: ['DB_URL'],
        message: 'DB_DRIVER=mysql 时，DB_URL 应为 mysql://user:pass@host:3306/dbname',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

/** 供 ConfigModule.forRoot({ validate }) 使用；校验失败直接抛出并终止启动 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(i => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`环境变量校验失败：\n${detail}`)
  }
  return parsed.data
}
