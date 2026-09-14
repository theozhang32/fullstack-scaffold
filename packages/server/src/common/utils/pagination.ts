import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** 通用分页查询参数（各模块用 extend 追加自有筛选字段） */
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type PageQuery = z.infer<typeof pageQuerySchema>

export class IdParamDto extends createZodDto(idParamSchema) {}
