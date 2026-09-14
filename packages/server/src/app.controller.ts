import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from './common/decorators/public.decorator'

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @Public()
  @ApiOperation({ summary: '健康检查（公开）' })
  @ApiOkResponse({
    description: '服务存活探针（公开接口，响应为统一包格式）',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'integer', example: 0 },
        message: { type: 'string', example: 'ok' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'fullstack-scaffold' },
          },
        },
      },
    },
  })
  getHealth() {
    return { status: 'ok', service: 'fullstack-scaffold' }
  }
}
