import type { InferEntity } from '@mikro-orm/core'
import { USER_ROLES } from '@fullstack-scaffold/shared'
import { defineEntity } from '@mikro-orm/core'
import { UserRepository } from './user.repository'

/** 本系统用户主数据 */
export const UserEntity = defineEntity({
  name: 'User',
  tableName: 'user',
  repository: () => UserRepository,
  properties: t => ({
    id: t.bigint('number').primary().autoincrement(),
    /** 登录账号，唯一 */
    username: t.string().length(64).unique(),
    /** bcrypt 哈希 */
    passwordHash: t.string().length(255).nullable(),
    displayName: t.string().length(64),
    role: t.enum(USER_ROLES),
    enabled: t.boolean().default(true),
    remark: t.text().nullable(),
    createdAt: t.datetime(),
    updatedAt: t.datetime(),
    createdBy: t.string().length(64),
  }),
})

export type User = InferEntity<typeof UserEntity>
