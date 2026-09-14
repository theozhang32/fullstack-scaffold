<script setup lang="ts">
/**
 * 登录页：账号密码登录。会话与令牌由 session store 管理，本组件只收集输入与转发。
 */
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { feedback } from '@/composables/feedback'
import { BizError } from '@/models/biz-error'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const form = reactive({ username: '', password: '' })
const loading = ref(false)

async function login() {
  if (loading.value)
    return
  if (!form.username.trim() || !form.password) {
    feedback.warning('请输入账号与密码')
    return
  }
  loading.value = true
  try {
    await session.login({ username: form.username.trim(), password: form.password })
    feedback.success(`欢迎，${session.displayName}`)
    router.push(String(route.query.redirect ?? '/'))
  }
  catch (e) {
    feedback.error(BizError.from(e).message)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-6">
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-lg font-bold mb-3">
          S
        </div>
        <h1 class="text-xl font-semibold">
          Fullstack Scaffold
        </h1>
        <p class="text-gray-400 text-sm mt-1">
          Vue 3 · NestJS · SQLite 最小全栈脚手架
        </p>
      </div>
      <a-form :model="form" layout="vertical" @submit.prevent="login">
        <a-form-item label="登录账号" name="username">
          <a-input v-model:value="form.username" size="large" placeholder="登录账号" />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="form.password" size="large" placeholder="密码" @press-enter="login" />
        </a-form-item>
        <a-button type="primary" size="large" block :loading="loading" @click="login">
          登录
        </a-button>
      </a-form>
      <p class="text-xs text-gray-400 mt-4 leading-5">
        默认账号 admin / admin123456（由 <code>pnpm db:seed</code> 创建）。
      </p>
    </div>
  </div>
</template>
