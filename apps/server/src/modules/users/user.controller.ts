import type { AuthUser } from '../../common/decorators/current-user.decorator'
import { userViewSchema } from '@fullstack-scaffold/shared'
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { ApiOkData, nullData, paginatedData, ZodBody, ZodParams, ZodQuery, zodToSchema } from '../../common/openapi'
import { IdParamDto } from '../../common/utils/pagination'
import { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from './user.dto'
import { toUserView, UsersService } from './user.service'

const userViewJson = zodToSchema(userViewSchema, 'output')

@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '用户列表', description: '分页 + 关键字（账号/姓名）筛选' })
  @ZodQuery(ListUsersQueryDto)
  @ApiOkData(paginatedData(userViewJson))
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '用户详情' })
  @ZodParams(IdParamDto)
  @ApiOkData(userViewJson)
  get(@Param() params: IdParamDto) {
    return this.usersService.mustFind(params.id).then(toUserView)
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ZodBody(CreateUserDto)
  @ApiOkData(userViewJson, '创建后的用户')
  create(@Body() body: CreateUserDto, @CurrentUser() operator: AuthUser) {
    return this.usersService.create(body, operator)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户（姓名/角色/启用状态/备注）' })
  @ZodParams(IdParamDto)
  @ZodBody(UpdateUserDto)
  @ApiOkData(userViewJson, '更新后的用户')
  update(@Param() params: IdParamDto, @Body() body: UpdateUserDto) {
    return this.usersService.updateProfile(params.id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户', description: '不能删除当前登录账号自身' })
  @ZodParams(IdParamDto)
  @ApiOkData(nullData)
  remove(@Param() params: IdParamDto, @CurrentUser() operator: AuthUser) {
    return this.usersService.remove(params.id, operator)
  }
}
