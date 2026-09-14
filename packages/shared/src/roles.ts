/**
 * 用户角色：服务端为鉴权权威，客户端复用同一枚举做展示与按钮级隐藏。
 * 独立入口、无 zod 依赖，避免前端展示层打进整包 schema。
 */
export const USER_ROLES = ['ADMIN', 'USER'] as const
export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)
}
