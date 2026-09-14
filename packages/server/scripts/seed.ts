/**
 * 初始化脚本：应用未执行的迁移 + 确保存在初始管理员账号。
 * 用法：pnpm --filter @fullstack-scaffold/server db:seed
 */
import process from 'node:process'
import { MikroORM } from '@mikro-orm/core'
import bcrypt from 'bcryptjs'
import { createMikroOrmOptions } from '../src/mikro-orm.config'
import { UserEntity } from '../src/modules/users/user.entity'

const ADMIN_USERNAME = 'admin'
const ADMIN_DEFAULT_PASSWORD = 'admin123456'

async function main() {
  const orm = await MikroORM.init(createMikroOrmOptions(process.env.DB_STORAGE ?? './data/scaffold.db'))

  const pending = await orm.migrator.getPending()
  if (pending.length > 0) {
    await orm.migrator.up()
    console.log(`已应用 ${pending.length} 个数据库迁移`)
  }

  const em = orm.em.fork()
  const exists = await em.findOne(UserEntity, { username: ADMIN_USERNAME })
  if (exists) {
    console.log(`管理员 ${ADMIN_USERNAME} 已存在，跳过创建`)
  }
  else {
    const now = new Date()
    em.persist(em.create(UserEntity, {
      username: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10),
      displayName: '管理员',
      role: 'ADMIN',
      enabled: true,
      remark: 'db:seed 创建的初始管理员',
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed',
    }))
    await em.flush()
    console.log(`已创建初始管理员：${ADMIN_USERNAME} / ${ADMIN_DEFAULT_PASSWORD}（请登录后尽快修改密码）`)
  }

  await orm.close(true)
}

void main()
