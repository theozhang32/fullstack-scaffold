import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'
import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { map } from 'rxjs'
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator'

/** 统一将返回值包装为 { code: 0, message: 'ok', data }；文件流等接口可用 @SkipTransform() 跳过 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skip) {
      return next.handle()
    }

    return next.handle().pipe(map(data => ({ code: 0, message: 'ok', data: data ?? null })))
  }
}
