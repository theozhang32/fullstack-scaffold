/** 统一响应包 { code, message, data }，code=0 表示成功；类型定义见共享包，与客户端解包逻辑共用 */
import type { ApiResponse } from '@fullstack-scaffold/shared'

export type { ApiResponse, Paginated } from '@fullstack-scaffold/shared'

export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data }
}
