import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { Request, Response } from 'express'
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { ZodError } from 'zod'

/** 统一错误响应包 { code, message, details }，code 与 HTTP 状态码一致 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const body = exception.getResponse()
      let message = exception.message
      let details: unknown

      if (typeof body === 'object' && body !== null) {
        const b = body as { message?: unknown, details?: unknown, errors?: unknown }
        if (typeof b.message === 'string')
          message = b.message
        else if (Array.isArray(b.message))
          message = b.message.join('；')
        // nestjs-zod 的 ZodValidationException 携带 errors: ZodIssue[]，透出为字段级 details
        if (b.details !== undefined) {
          details = b.details
        }
        else if (Array.isArray(b.errors)) {
          details = b.errors.map((issue) => {
            const i = issue as { path?: PropertyKey[], message?: string }
            return { path: (i.path ?? []).join('.'), message: i.message ?? '' }
          })
        }
      }

      if (status >= 500) {
        this.logger.error(`[${request.method} ${request.url}] ${exception.stack ?? exception}`)
      }

      response.status(status).json({ code: status, message, details })
      return
    }

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        code: HttpStatus.BAD_REQUEST,
        message: '参数校验失败',
        details: exception.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      })
      return
    }

    const message = exception instanceof Error ? exception.message : '服务器内部错误'
    this.logger.error(`[${request.method} ${request.url}] ${exception instanceof Error ? exception.stack : exception}`)
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ code: HttpStatus.INTERNAL_SERVER_ERROR, message })
  }
}
