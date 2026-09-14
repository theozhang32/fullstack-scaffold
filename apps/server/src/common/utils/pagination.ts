import { defaultServerConfig } from '@fullstack-scaffold/config'
import { createPageQuerySchema, idParamSchema } from '@fullstack-scaffold/shared'
import { createZodDto } from 'nestjs-zod'

/** 分页 query：上限/默认值取自 packages/config server.pagination */
export const pageQuerySchema = createPageQuerySchema(defaultServerConfig.pagination)

export class IdParamDto extends createZodDto(idParamSchema) {}
