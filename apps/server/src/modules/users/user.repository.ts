import type { ListUsersQuery } from '@fullstack-scaffold/shared'
import type { FilterQuery, RequiredEntityData } from '@mikro-orm/core'
import type { User } from './user.entity'
import { EntityRepository } from '@mikro-orm/core'

/**
 * 数据访问层：查询条件组装与持久化都收敛在此，Service 只做业务编排。
 * （MikroORM v7 的仓库不再代理 persist/flush，统一经 getEntityManager() 收口）
 */
export class UserRepository extends EntityRepository<User> {
  findByUsername(username: string) {
    return this.findOne({ username })
  }

  /** 关键字 + 分页查询，id 倒序 */
  findPage(query: ListUsersQuery): Promise<[User[], number]> {
    const where: FilterQuery<User> = {}
    if (query.keyword) {
      where.$or = [
        { username: { $like: `%${query.keyword}%` } },
        { displayName: { $like: `%${query.keyword}%` } },
      ]
    }
    return this.findAndCount(where, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { id: 'desc' },
    })
  }

  /** 新建实体并立即落库（create 默认自动 persist） */
  async add(data: RequiredEntityData<User>): Promise<User> {
    const user = this.create(data)
    await this.getEntityManager().flush()
    return user
  }

  /** 落库当前工作单元的变更（配合 assign 使用） */
  async flush(): Promise<void> {
    await this.getEntityManager().flush()
  }

  /** 删除实体并落库 */
  async delete(user: User): Promise<void> {
    this.getEntityManager().remove(user)
    await this.getEntityManager().flush()
  }
}
