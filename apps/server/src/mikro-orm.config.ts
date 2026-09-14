import type { Options } from '@mikro-orm/core'
import type { Env } from './config'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { Migrator } from '@mikro-orm/migrations'
import { MySqlDriver } from '@mikro-orm/mysql'
import { SqliteDriver } from '@mikro-orm/sqlite'
import { config as loadDotenv } from 'dotenv'
import { envSchema } from './config'
import { entities } from './entities'

// Nest 启动时本文件会被 app.module 同步 import；此时 ConfigModule 尚未加载 .env。
// CLI（migration:*）与 db:seed 同样依赖此处的默认导出。仅开发环境读本地 .env；生产由编排注入。
if (process.env.NODE_ENV !== 'production') {
  loadDotenv({ path: resolve(__dirname, '../.env') })
}

// DB_* 默认值统一由 @fullstack-scaffold/config 的 envSchema 提供，避免多处重复
const { DB_URL, DB_DRIVER } = envSchema.parse(process.env)

const migrationOptions = {
  path: 'dist/migrations',
  pathTs: 'src/migrations',
  glob: '!(*.d).{js,ts}',
  transactional: true,
  allOrNothing: true,
} as const

/**
 * MikroORM 配置：按 DB_DRIVER 分支。
 * - mysql（默认）：DB_URL 为 mysql:// 连接串
 * - sqlite：DB_URL 为本地文件路径
 * Schema 变更一律走 migrations；服务启动时自动应用未执行的迁移（见 main.ts）
 */
export function createMikroOrmOptions(
  dbUrl: string,
  driver: Env['DB_DRIVER'] = 'mysql',
): Partial<Options> {
  const common = {
    extensions: [Migrator],
    entities,
    verbose: false,
    migrations: { ...migrationOptions },
  }

  if (driver === 'sqlite') {
    const storagePath = resolve(dbUrl)
    mkdirSync(dirname(storagePath), { recursive: true })

    return {
      ...common,
      driver: SqliteDriver,
      dbName: storagePath,
    } as unknown as Partial<Options>
  }

  return {
    ...common,
    driver: MySqlDriver,
    clientUrl: dbUrl,
    charset: 'utf8mb4',
  } as unknown as Partial<Options>
}

/** MikroORM CLI 默认配置（migration:create 等；DB_* 默认值来自 envSchema） */
export default createMikroOrmOptions(DB_URL, DB_DRIVER)
