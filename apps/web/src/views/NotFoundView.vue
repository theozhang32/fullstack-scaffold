<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex-1 flex items-center justify-center bg-white rounded-lg">
    <a-result status="404" title="404" sub-title="抱歉，您访问的页面不存在">
      <template #extra>
        <a-button type="primary" @click="router.push('/')">
          返回首页
        </a-button>
      </template>
    </a-result>
  </div>
</template>
