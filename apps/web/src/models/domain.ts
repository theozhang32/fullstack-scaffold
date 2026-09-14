import type { UserRole } from '@fullstack-scaffold/shared'

/**
 * 领域类型入口：与服务端同源的枚举与通用结构（ApiResponse / Paginated / UserRole）
 * 收敛至共享包 @fullstack-scaffold/shared，经此处转出口。
 * 本文件仅保留客户端视角的类型（JSON 视图：日期为 ISO 字符串）与展示元数据。
 */

export * from '@fullstack-scaffold/shared'

/** 用户（线上 JSON 视图，与服务端 UserDto 对齐） */
export interface UserView {
  id: number
  username: string
  displayName: string
  role: UserRole
  enabled: boolean
  remark: string | null
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

// ---------------- 展示元数据 ----------------

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '管理员',
  USER: '普通用户',
}

export const ROLE_TAG_COLORS: Record<UserRole, string> = {
  ADMIN: 'red',
  USER: 'blue',
}
