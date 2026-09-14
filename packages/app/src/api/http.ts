/**
 * HTTP 基础设施：统一响应包 { code, message, data } 解包、JWT 注入、
 * 401 会话失效处理、文件下载与上传。API 端口层的唯一网络出入口。
 */

const BASE_URL = '/api/v1'
const TOKEN_KEY = 'scaffold:token'

export class ApiError extends Error {
  readonly status: number
  readonly code: number | string
  readonly details?: unknown

  constructor(message: string, status: number, code: number | string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  }
  catch {
    return ''
  }
}

export function setToken(token: string): void {
  try {
    if (token)
      localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }
  catch {
    /* 存储不可用时仅保留内存态 */
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '')
        continue
      url.searchParams.set(k, String(v))
    }
  }
  return url.pathname + url.search
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken()
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function handleUnauthorized(): void {
  setToken('')
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.assign(`/login?redirect=${redirect}`)
}

async function parseError(resp: Response): Promise<ApiError> {
  let message = `请求失败（HTTP ${resp.status}）`
  let code: number | string = resp.status
  let details: unknown
  try {
    const body = await resp.json()
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string')
        message = body.message
      if (body.code !== undefined)
        code = body.code
      details = body.details
    }
  }
  catch {
    /* 非 JSON 错误体 */
  }
  return new ApiError(message, resp.status, code, details)
}

async function request<T>(method: string, path: string, options?: { query?: Query, body?: unknown }): Promise<T> {
  const resp = await fetch(buildUrl(path, options?.query), {
    method,
    headers: authHeaders(options?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined),
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (resp.status === 401) {
    handleUnauthorized()
    throw new ApiError('登录已失效，请重新登录', 401, 401)
  }
  if (!resp.ok)
    throw await parseError(resp)
  const envelope = (await resp.json()) as { code: number, message: string, data: T }
  return envelope.data
}

/** GET 下载（服务端 @SkipTransform() 接口，直接返回文件流） */
async function download(path: string, query?: Query): Promise<void> {
  const resp = await fetch(buildUrl(path, query), { headers: authHeaders() })
  if (resp.status === 401) {
    handleUnauthorized()
    throw new ApiError('登录已失效，请重新登录', 401, 401)
  }
  if (!resp.ok)
    throw await parseError(resp)
  const blob = await resp.blob()
  const disposition = resp.headers.get('Content-Disposition') ?? ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const name = decodeURIComponent(match?.[1] ?? `export-${Date.now()}`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** multipart 文件上传 */
async function upload<T>(path: string, file: File, query?: Query): Promise<T> {
  const form = new FormData()
  form.append('file', file)
  const resp = await fetch(buildUrl(path, query), { method: 'POST', headers: authHeaders(), body: form })
  if (resp.status === 401) {
    handleUnauthorized()
    throw new ApiError('登录已失效，请重新登录', 401, 401)
  }
  if (!resp.ok)
    throw await parseError(resp)
  const envelope = (await resp.json()) as { code: number, message: string, data: T }
  return envelope.data
}

export const http = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>('POST', path, { query, body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
  download,
  upload,
}
