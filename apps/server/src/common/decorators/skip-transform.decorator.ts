import { SetMetadata } from '@nestjs/common'

export const SKIP_TRANSFORM_KEY = 'skipTransform'
/** 跳过统一响应包装（CSV 导出等直接返回文件流的接口） */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true)
