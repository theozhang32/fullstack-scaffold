/** 统一响应包 { code, message, data }，code=0 表示成功（服务端 TransformInterceptor 包装） */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 分页结构（列表接口统一返回） */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
