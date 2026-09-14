<script setup lang="ts">
import type { UserView } from '@/models/domain'
/**
 * 用户管理（示例页）：演示「列表查询 + 弹窗表单 + 删除确认」的完整 CRUD 范式。
 * 数据经 usersApi（api 端口层）进出，提示统一走 feedback。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { usersApi } from '@/api/users'
import { feedback } from '@/composables/feedback'
import { BizError } from '@/models/biz-error'
import { ROLE_LABELS, ROLE_TAG_COLORS } from '@/models/domain'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 72 },
  { title: '账号', dataIndex: 'username', key: 'username', width: 160 },
  { title: '姓名', dataIndex: 'displayName', key: 'displayName', width: 140 },
  { title: '角色', key: 'role', width: 110 },
  { title: '状态', key: 'enabled', width: 96 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
]

// ---------------- 列表 ----------------

const loading = ref(false)
const items = ref<UserView[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10, keyword: '' })

async function fetchList() {
  loading.value = true
  try {
    const data = await usersApi.list({ ...query })
    items.value = data.items
    total.value = data.total
  }
  catch (e) {
    feedback.error(BizError.from(e).message)
  }
  finally {
    loading.value = false
  }
}

function onSearch() {
  query.page = 1
  void fetchList()
}

const pagination = computed(() => ({
  current: query.page,
  pageSize: query.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
  onChange: (page: number, pageSize: number) => {
    query.page = page
    query.pageSize = pageSize
    void fetchList()
  },
}))

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

// ---------------- 新建 / 编辑弹窗 ----------------

const modalOpen = ref(false)
const saving = ref(false)
/** null=新建，非 null=编辑该用户 */
const editingId = ref<number | null>(null)
const form = reactive({ username: '', password: '', displayName: '', role: 'USER' as 'ADMIN' | 'USER', remark: '' })

function openCreate() {
  editingId.value = null
  Object.assign(form, { username: '', password: '', displayName: '', role: 'USER', remark: '' })
  modalOpen.value = true
}

function openEdit(user: UserView) {
  editingId.value = user.id
  Object.assign(form, {
    username: user.username,
    password: '',
    displayName: user.displayName,
    role: user.role,
    remark: user.remark ?? '',
  })
  modalOpen.value = true
}

async function submit() {
  if (saving.value)
    return
  if (!form.displayName.trim()) {
    feedback.warning('请填写姓名')
    return
  }
  if (editingId.value === null && (form.username.trim().length < 2 || form.password.length < 8)) {
    feedback.warning('账号至少 2 个字符，初始密码至少 8 位')
    return
  }
  saving.value = true
  try {
    if (editingId.value === null) {
      await usersApi.create({
        username: form.username.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        role: form.role,
        remark: form.remark || null,
      })
      feedback.success('创建成功')
    }
    else {
      await usersApi.update(editingId.value, {
        displayName: form.displayName.trim(),
        role: form.role,
        remark: form.remark || null,
      })
      feedback.success('已保存')
    }
    modalOpen.value = false
    await fetchList()
  }
  catch (e) {
    feedback.error(BizError.from(e).message)
  }
  finally {
    saving.value = false
  }
}

// ---------------- 启用/禁用 + 删除 ----------------

async function toggleEnabled(user: UserView) {
  try {
    await usersApi.update(user.id, { enabled: !user.enabled })
    await fetchList()
  }
  catch (e) {
    feedback.error(BizError.from(e).message)
  }
}

function confirmRemove(user: UserView) {
  feedback.confirm({
    title: `确认删除用户「${user.displayName}」？`,
    okDanger: true,
    okText: '删除',
    onOk: async () => {
      try {
        await usersApi.remove(user.id)
        feedback.success('已删除')
        await fetchList()
      }
      catch (e) {
        feedback.error(BizError.from(e).message)
      }
    },
  })
}

onMounted(() => {
  void fetchList()
})
</script>

<template>
  <a-card :bordered="false" title="用户管理" class="flex flex-col">
    <template #extra>
      <div class="flex items-center gap-2">
        <a-input-search
          v-model:value="query.keyword"
          placeholder="搜索账号 / 姓名"
          allow-clear
          class="!w-64"
          @search="onSearch"
        />
        <a-button type="primary" @click="openCreate">
          新建用户
        </a-button>
      </div>
    </template>

    <a-table
      :columns="columns"
      :data-source="items"
      row-key="id"
      size="middle"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="ROLE_TAG_COLORS[(record as UserView).role]">
            {{ ROLE_LABELS[(record as UserView).role] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'enabled'">
          <a-tag :color="(record as UserView).enabled ? 'green' : 'default'">
            {{ (record as UserView).enabled ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatTime((record as UserView).createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space :size="4">
            <a-button size="small" type="link" @click="openEdit(record as UserView)">
              编辑
            </a-button>
            <a-button
              v-if="(record as UserView).id !== session.user?.id"
              size="small"
              type="link"
              @click="toggleEnabled(record as UserView)"
            >
              {{ (record as UserView).enabled ? '禁用' : '启用' }}
            </a-button>
            <a-button
              v-if="(record as UserView).id !== session.user?.id"
              size="small"
              type="link"
              danger
              @click="confirmRemove(record as UserView)"
            >
              删除
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="editingId === null ? '新建用户' : `编辑：${form.username}`"
      :confirm-loading="saving"
      ok-text="保存"
      cancel-text="取消"
      @ok="submit"
    >
      <a-form :model="form" layout="vertical" class="!pt-2">
        <a-form-item v-if="editingId === null" label="账号" required>
          <a-input v-model:value="form.username" placeholder="字母、数字、下划线、点、横线" />
        </a-form-item>
        <a-form-item v-if="editingId === null" label="初始密码" required>
          <a-input-password v-model:value="form.password" placeholder="至少 8 位" />
        </a-form-item>
        <a-form-item label="姓名" required>
          <a-input v-model:value="form.displayName" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select
            v-model:value="form.role"
            :options="[{ label: '普通用户', value: 'USER' }, { label: '管理员', value: 'ADMIN' }]"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="2" placeholder="选填" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>
