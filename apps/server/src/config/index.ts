/**
 * server 端配置统一入口：按需从 @fullstack-scaffold/config 重新导出。
 * server 内部代码统一从 './config' 或 '../config' 相对路径导入，
 * 避免业务代码直接依赖外部包路径，便于后续按需裁剪或加薄封装。
 */
export { envSchema, validateEnv } from '@fullstack-scaffold/config'
export { loadConfig } from '@fullstack-scaffold/config'
export { serverConfigSchema } from '@fullstack-scaffold/config'
export { webConfigSchema } from '@fullstack-scaffold/config'
export type { AppConfig, Env, ServerConfig, WebConfig } from '@fullstack-scaffold/config'
