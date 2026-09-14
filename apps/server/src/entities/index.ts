import { UserEntity } from '../modules/users/user.entity'

/** 全部实体注册表（供 MikroORM forRoot 使用；新增实体后在此登记） */
export const entities = [
  UserEntity,
]
