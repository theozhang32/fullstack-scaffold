/*
 * @Date: 2026-09-14 19:57:52
 * @LastEditors: Theo Zhang
 * @LastEditTime: 2026-09-14 20:22:13
 * @FilePath: /fullstack-scaffold/packages/config/src/web.ts
 */
import { z } from 'zod'

/**
 * web 命名空间运行时配置：前端构建/运行时使用的「代码资产」。
 * 前端通常无 .env 注入需求，这里集中纳管前端常量，便于与 server 共享类型与默认值。
 */
export const webConfigSchema = z.object({
  /** 应用标题 */
  title: z.string().default('全栈脚手架'),

  /** 后端 API 基础路径（与 server.apiPrefix 对齐） */
  apiBaseUrl: z.string().default('/api/v1'),

  /** 前端 dev/preview 服务固定端口（避免 vite 端口漂移） */
  devPort: z.number().int().min(1).max(65535).default(5173),

  /** 默认语言 */
  locale: z.string().default('zh-CN'),

  /** 主题默认模式 */
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),

  /** 会话令牌在 localStorage 的存储键 */
  sessionTokenKey: z.string().default('X-Token'),

  /** 会话过期兜底（ms），用于前端主动判定过期 */
  sessionTtlMs: z.number().int().positive().default(12 * 60 * 60 * 1000),
})

export type WebConfig = z.infer<typeof webConfigSchema>
