import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Global, Module } from '@nestjs/common'
import { UsersController } from './user.controller'
import { UserEntity } from './user.entity'
import { UsersService } from './user.service'

/** 全局模块：JWT 守卫需要按 id 加载用户 */
@Global()
@Module({
  imports: [MikroOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
