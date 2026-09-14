import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3100),
  CORS_ORIGIN: z.string().default(''),

  /** SQLite 数据库文件路径（相对 server 包目录） */
  DB_STORAGE: z.string().default('./data/scaffold.db'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET 至少 32 个字符'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^(\d+)\s*(ms|[smhd])?$/, 'JWT_EXPIRES_IN 应形如 30m / 12h / 7d / 3600')
    .default('12h'),

  /** Swagger 文档开关，默认开发/测试环境开启、生产关闭 */
  SWAGGER_ENABLED: z.enum(['true', 'false']).optional(),
})

export type Env = z.infer<typeof envSchema>

/** 供 ConfigModule.forRoot({ validate }) 使用；校验失败直接抛出并终止启动 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config)
  if (!parsed.success) {
    const detail = parsed.error.issues.map(i => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n')
    throw new Error(`环境变量校验失败：\n${detail}`)
  }
  return parsed.data
}
