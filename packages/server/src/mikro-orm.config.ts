import type { Options } from '@mikro-orm/core'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { Migrator } from '@mikro-orm/migrations'
import { SqliteDriver } from '@mikro-orm/sqlite'
import { config as loadDotenv } from 'dotenv'
import { entities } from './entities'

// Nest 启动时本文件会被 app.module 同步 import；此时 ConfigModule 尚未加载 .env。
// CLI（migration:*）与 db:seed 同样依赖此处的默认导出。仅开发环境读本地 .env；生产由编排注入。
if (process.env.NODE_ENV !== 'production') {
  loadDotenv({ path: resolve(__dirname, '../.env') })
}

/**
 * MikroORM 配置（SQLite，默认单文件数据库）。
 * - Schema 变更一律走 migrations；服务启动时自动应用未执行的迁移（见 main.ts）
 * - 切换 MySQL/PostgreSQL：替换 driver 包与驱动、按需补充连接参数即可
 */
export function createMikroOrmOptions(dbStorage: string): Partial<Options> {
  const storagePath = resolve(dbStorage)
  mkdirSync(dirname(storagePath), { recursive: true })

  return {
    driver: SqliteDriver,
    extensions: [Migrator],
    dbName: storagePath,
    entities,
    verbose: false,
    migrations: {
      path: 'dist/migrations',
      pathTs: 'src/migrations',
      glob: '!(*.d).{js,ts}',
      transactional: true,
      allOrNothing: true,
    },
    // core 与 sql 包在 IDatabaseDriver 泛型上存在协变噪音，返回处统一断言收口
  } as unknown as Partial<Options>
}

/** MikroORM CLI 默认配置（migration:create 等；读取环境变量 DB_STORAGE） */
export default createMikroOrmOptions(process.env.DB_STORAGE ?? './data/scaffold.db')
