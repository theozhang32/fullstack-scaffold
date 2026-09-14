import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { defaultWebConfig } from '@fullstack-scaffold/config'
/**
 * HTTP 基础设施：基于 axios 的统一响应包 { code, message, data } 解包、JWT 注入、
 * 401 会话失效处理、文件下载与上传。API 端口层的唯一网络出入口。
 */
import axios from 'axios'

const { apiBaseUrl: BASE_URL, sessionTokenKey: TOKEN_KEY } = defaultWebConfig

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

interface Envelope<T> {
  code: number
  message: string
  data: T
}

function handleUnauthorized(): void {
  setToken('')
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.assign(`/login?redirect=${redirect}`)
}

/** 统一信封解包：成功直接返回 data，失败抛出 ApiError */
function unwrap<T>(resp: AxiosResponse<Envelope<T>>): T {
  const envelope = resp.data
  return envelope.data
}

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
})

// 请求拦截：注入 JWT；非 FormData 请求自动设置 JSON Content-Type
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token)
    config.headers.set('Authorization', `Bearer ${token}`)

  const isFormData = config.data instanceof FormData
  if (config.data !== undefined && !isFormData)
    config.headers.set('Content-Type', 'application/json')

  return config
})

// 响应拦截：401 失效处理 + 统一错误归一化为 ApiError
instance.interceptors.response.use(
  response => response,
  (error) => {
    if (axios.isCancel(error))
      throw error

    const resp = error.response as AxiosResponse | undefined
    if (!resp) {
      // 网络错误 / 超时 / 请求未发出
      throw new ApiError(error.message ?? '网络错误，请稍后重试', 0, error.code ?? 0)
    }

    if (resp.status === 401) {
      handleUnauthorized()
      throw new ApiError('登录已失效，请重新登录', 401, 401)
    }

    let message = `请求失败（HTTP ${resp.status}）`
    let code: number | string = resp.status
    let details: unknown
    const body = resp.data
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string')
        message = body.message
      if (body.code !== undefined)
        code = body.code
      details = body.details
    }
    throw new ApiError(message, resp.status, code, details)
  },
)

async function request<T>(method: string, path: string, options?: { query?: Query, body?: unknown }): Promise<T> {
  const resp = await instance.request<Envelope<T>, AxiosResponse<Envelope<T>>>({
    url: path,
    method,
    params: options?.query,
    data: options?.body,
  })
  return unwrap(resp)
}

/** GET 下载（服务端 @SkipTransform() 接口，直接返回文件流） */
async function download(path: string, query?: Query): Promise<void> {
  const resp = await instance.request<Blob, AxiosResponse<Blob>>({
    url: path,
    method: 'GET',
    params: query,
    responseType: 'blob',
  })

  const disposition = resp.headers['content-disposition'] ?? ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const name = decodeURIComponent(match?.[1] ?? `export-${Date.now()}`)
  const url = URL.createObjectURL(resp.data)
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
  const resp = await instance.request<Envelope<T>, AxiosResponse<Envelope<T>>>({
    url: path,
    method: 'POST',
    params: query,
    data: form,
  })
  return unwrap(resp)
}

/** 透出原始 axios 实例，便于高级场景（取消令牌、拦截器扩展等） */
export const httpInstance = instance

export const http = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>('POST', path, { query, body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
  download,
  upload,
}

export type { AxiosRequestConfig }
