import { fileURLToPath, URL } from 'node:url'
import { AntdvNextResolver } from '@antdv-next/auto-import-resolver'
import { defaultServerConfig, defaultWebConfig } from '@fullstack-scaffold/config'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// 后端代理目标：端口与路由前缀统一取自 @fullstack-scaffold/config 的 server 默认值，
// 避免与 server 端配置脱节（改一处即可）
const nestTarget = `http://127.0.0.1:${defaultServerConfig.port}`
// 代理拦截路径取 apiPrefix 的首段（api/v1 → /api），整段转发至后端
const proxyKey = `/${defaultServerConfig.apiPrefix.split('/')[0]}`

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      dts: 'src/auto-imports.d.ts',
      // 仅处理 SFC：.ts 代码一律显式 import，也避免把 class 的 constructor 误判为待导入标识符
      include: [/\.vue$/, /\.vue\?vue/],
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [AntdvNextResolver()],
    }),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [
        AntdvNextResolver({ resolveIcons: true }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: defaultWebConfig.devPort,
    strictPort: true,
    proxy: {
      [proxyKey]: {
        target: nestTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: defaultWebConfig.devPort,
    strictPort: true,
    proxy: {
      [proxyKey]: {
        target: nestTarget,
        changeOrigin: true,
      },
    },
  },
})
