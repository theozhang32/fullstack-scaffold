import type { ListUsersQuery, ParsedCreateUser, ParsedUpdateUser, UserView } from '@fullstack-scaffold/shared'
import type { Paginated } from '../../common/api-response'
import type { AuthUser } from '../../common/decorators/current-user.decorator'
import type { User } from './user.entity'
import { InjectRepository } from '@mikro-orm/nestjs'
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import bcrypt from 'bcryptjs'
import { UserEntity } from './user.entity'
import { UserRepository } from './user.repository'

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    enabled: user.enabled,
    remark: user.remark ?? null,
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

const BCRYPT_ROUNDS = 10

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: UserRepository,
  ) {}

  async list(query: ListUsersQuery): Promise<Paginated<UserView>> {
    const [items, total] = await this.usersRepo.findPage(query)
    return { items: items.map(toUserView), total, page: query.page, pageSize: query.pageSize }
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ id })
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findByUsername(username)
  }

  async mustFind(id: number): Promise<User> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException('用户不存在')
    }
    return user
  }

  async create(input: ParsedCreateUser, operator: AuthUser): Promise<UserView> {
    const exists = await this.usersRepo.findByUsername(input.username)
    if (exists) {
      throw new ConflictException(`账号「${input.username}」已存在`)
    }

    const now = new Date()
    const user = await this.usersRepo.add({
      username: input.username,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      displayName: input.displayName,
      role: input.role,
      enabled: true,
      remark: input.remark ?? null,
      createdAt: now,
      updatedAt: now,
      createdBy: operator.username,
    })
    return toUserView(user)
  }

  async updateProfile(id: number, input: ParsedUpdateUser): Promise<UserView> {
    const user = await this.mustFind(id)
    this.usersRepo.assign(user, {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.remark !== undefined ? { remark: input.remark } : {}),
      updatedAt: new Date(),
    })
    await this.usersRepo.flush()
    return toUserView(user)
  }

  async remove(id: number, operator: AuthUser): Promise<void> {
    if (id === operator.id) {
      throw new BadRequestException('不能删除当前登录账号')
    }
    const user = await this.mustFind(id)
    await this.usersRepo.delete(user)
  }
}
