<script setup lang="ts">
import { ROLE_LABELS, ROLE_TAG_COLORS } from '@/models/domain'
/**
 * 首页（示例页）：展示当前会话信息与技术栈导航，
 * 同时演示 antdv-next 组件 + tailwindcss 工具类混排的基础范式。
 */
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()

const stack = [
  { name: 'Vue 3', desc: 'vue-router + pinia' },
  { name: 'antdv-next', desc: 'UI 组件库（自动按需引入）' },
  { name: 'tailwindcss', desc: '原子化样式（v4，@tailwindcss/vite）' },
  { name: 'NestJS v11', desc: 'controller → service → repository → entity' },
  { name: 'MikroORM', desc: 'SQLite + migrations' },
  { name: 'nestjs-zod', desc: 'zod 校验 + Swagger 文档' },
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <a-card :bordered="false">
      <template #title>
        欢迎回来，{{ session.displayName }}
      </template>
      <a-descriptions v-if="session.user" :column="{ xs: 1, sm: 2, md: 3 }" size="small">
        <a-descriptions-item label="账号">
          {{ session.user.username }}
        </a-descriptions-item>
        <a-descriptions-item label="角色">
          <a-tag :color="ROLE_TAG_COLORS[session.user.role]">
            {{ ROLE_LABELS[session.user.role] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="session.user.enabled ? 'green' : 'default'">
            {{ session.user.enabled ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card :bordered="false" title="技术栈">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="item in stack"
          :key="item.name"
          class="rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3"
        >
          <div class="font-medium text-[15px]">
            {{ item.name }}
          </div>
          <div class="text-sm text-gray-500 mt-0.5">
            {{ item.desc }}
          </div>
        </div>
      </div>
      <template #extra>
        <a-button type="link" href="/api/docs" target="_blank">
          打开 Swagger 文档
        </a-button>
      </template>
    </a-card>
  </div>
</template>
