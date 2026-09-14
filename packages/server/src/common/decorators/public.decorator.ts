import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
/** 标记公开接口（登录、健康检查等），跳过 JWT 认证与角色校验 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
