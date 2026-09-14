import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { z } from 'zod'

type JsonSchema = Record<string, unknown>

/** createZodDto 生成的 DTO 类（静态持有 zod schema，是接口文档的单一数据源） */
interface ZodDtoClass {
  schema: z.ZodType
}

/**
 * zod schema → OpenAPI 3.1 可用的 JSON Schema：
 * - io: 'input' 描述请求侧（default / transform 之前），'output' 描述响应侧
 * - reused: 'inline' 避免生成 $defs/$ref，Swagger UI 内联渲染更直观
 * - unrepresentable: 'any' 让 z.date() 等无法映射的类型退化为 any 而不是抛错
 */
export function zodToSchema(schema: z.ZodType, io: 'input' | 'output' = 'input'): JsonSchema {
  const json = z.toJSONSchema(schema, { io, reused: 'inline', unrepresentable: 'any' }) as JsonSchema
  delete json.$schema
  return json
}

/** 将 DTO 对象 schema 的每个字段展开为独立的 query 参数 */
export function ZodQuery(dto: ZodDtoClass) {
  const { properties, required } = zodToSchema(dto.schema) as {
    properties?: Record<string, JsonSchema>
    required?: string[]
  }
  const requiredSet = new Set(required ?? [])
  return applyDecorators(
    ...Object.entries(properties ?? {}).map(([name, schema]) =>
      ApiQuery({ name, required: requiredSet.has(name), schema }),
    ),
  )
}

/** 将 DTO 对象 schema 的每个字段展开为独立的 path 参数（路径参数恒为必填） */
export function ZodParams(dto: ZodDtoClass) {
  const { properties } = zodToSchema(dto.schema) as { properties?: Record<string, JsonSchema> }
  return applyDecorators(
    ...Object.entries(properties ?? {}).map(([name, schema]) =>
      ApiParam({ name, required: true, schema }),
    ),
  )
}

/** 请求体文档：直接从 DTO 的 zod schema 生成 */
export function ZodBody(dto: ZodDtoClass, description?: string) {
  return ApiBody({ description, schema: zodToSchema(dto.schema) })
}

/** 实体对象占位（字段以各实体为准，暂未逐一细化） */
export const entityObject: JsonSchema = { type: 'object', additionalProperties: true }

/** 操作型响应的 data：恒为 null */
export const nullData: JsonSchema = { type: 'null', description: '无返回数据' }

/** 统一响应包 { code, message, data } 中的 data 部分：分页结构 */
export function paginatedData(items: JsonSchema = entityObject): JsonSchema {
  return {
    type: 'object',
    properties: {
      items: { type: 'array', items },
      total: { type: 'integer' },
      page: { type: 'integer' },
      pageSize: { type: 'integer' },
    },
  }
}

/** ok 响应文档：统一响应包 { code: 0, message: 'ok', data } */
export function ApiOkData(data: JsonSchema, description = '成功') {
  return ApiOkResponse({
    description,
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 0 },
        message: { type: 'string', example: 'ok' },
        data,
      },
      required: ['code', 'message', 'data'],
    },
  })
}
