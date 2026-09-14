/*
 * @Date: 2026-09-14 19:57:44
 * @LastEditors: Theo Zhang
 * @LastEditTime: 2026-09-14 20:20:48
 * @FilePath: /fullstack-scaffold/packages/config/src/env.ts
 */
import { z } from 'zod'

/**
 * 环境变量 schema：仅保留「必须按部署环境注入」的敏感/部署参数。
 * 其余配置一律归入运行时配置（见 server.ts / web.ts），由 @nestjs/config 统一纳管。
 *
 * - NODE_ENV：运行模式
 * - JWT_SECRET：JWT 签名密钥（敏感，必须注入）
 * - DB_URL：数据库连接/文件路径（部署相关）
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET 至少 32 个字符'),
  DB_URL: z.string(),
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
