import { z } from 'zod'

/** 与 packages/config server.pagination 默认值对齐；服务端用配置覆盖 max/default */
export interface PageQueryOptions {
  defaultPage?: number
  defaultSize?: number
  maxSize?: number
}

// eslint-disable-next-line ts/explicit-function-return-type -- zod 推断无法稳定手写
export function createPageQuerySchema(options: PageQueryOptions = {}) {
  const defaultPage = options.defaultPage ?? 1
  const defaultSize = options.defaultSize ?? 20
  const maxSize = options.maxSize ?? 100
  return z.object({
    page: z.coerce.number().int().min(1).default(defaultPage),
    pageSize: z.coerce.number().int().min(1).max(maxSize).default(defaultSize),
  })
}

export const pageQuerySchema = createPageQuerySchema()
export type PageQuery = z.output<typeof pageQuerySchema>
export type PageQueryInput = z.input<typeof pageQuerySchema>

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})
export type IdParam = z.output<typeof idParamSchema>
