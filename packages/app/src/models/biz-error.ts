/**
 * 业务错误语义：统一承接 API 层错误（HTTP 状态码 + 服务端 message）的包装，
 * View / Store 只需 BizError.from(e).message 即可拿到可展示文案。
 */
export class BizError extends Error {
  readonly code: string | number
  readonly details?: unknown

  constructor(message: string, code: string | number = 'BIZ_ERROR', details?: unknown) {
    super(message)
    this.name = 'BizError'
    this.code = code
    this.details = details
  }

  static from(e: unknown): BizError {
    if (e instanceof BizError)
      return e
    if (e instanceof Error)
      return new BizError(e.message, 'RUNTIME_ERROR')
    return new BizError('未知错误', 'UNKNOWN')
  }
}
