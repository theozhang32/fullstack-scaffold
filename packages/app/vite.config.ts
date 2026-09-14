import { fileURLToPath, URL } from 'node:url'
import { AntdvNextResolver } from '@antdv-next/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

const nestTarget = 'http://127.0.0.1:3100'

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
    proxy: {
      '/api': {
        target: nestTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: nestTarget,
        changeOrigin: true,
      },
    },
  },
})
