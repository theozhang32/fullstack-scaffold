<script setup lang="ts">
import { HomeOutlined, LogoutOutlined, MenuOutlined, TeamOutlined, UserOutlined } from '@antdv-next/icons'
/**
 * 应用布局壳：侧边菜单（桌面可收起 / 窄屏抽屉）、顶栏、内容区。
 * 菜单显隐按角色过滤；业务数据一概不进本组件。
 */
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

interface MenuItem {
  key: string
  label: string
  icon: () => ReturnType<typeof h>
  visible: boolean
}

const allMenus: MenuItem[] = [
  { key: 'home', label: '首页', icon: () => h(HomeOutlined), visible: true },
  { key: 'users', label: '用户管理', icon: () => h(TeamOutlined), visible: session.isAdmin },
]

const menuItems = computed(() =>
  allMenus
    .filter(m => m.visible)
    .map(m => ({ key: m.key, label: m.label, icon: m.icon })),
)

const selectedKeys = computed(() => [String(route.name ?? 'home')])

// ---------- 响应式侧边栏：>=1024px 内联可收起，窄屏改抽屉 ----------
const isMobile = ref(false)
const siderCollapsed = ref(false)
const drawerOpen = ref(false)
let mediaQuery: MediaQueryList | null = null

function onMenuClick({ key }: { key: string | number }) {
  const map: Record<string, string> = {
    home: '/',
    users: '/users',
  }
  router.push(map[String(key)] ?? '/')
  if (isMobile.value)
    drawerOpen.value = false
}

function onMediaChange(e: MediaQueryList | MediaQueryListEvent) {
  isMobile.value = e.matches
}
onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 1023px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
})
onUnmounted(() => mediaQuery?.removeEventListener('change', onMediaChange))
watch(isMobile, () => {
  drawerOpen.value = false
})

function onToggleSider() {
  if (isMobile.value)
    drawerOpen.value = true
  else siderCollapsed.value = !siderCollapsed.value
}

async function onLogout() {
  await session.logout()
  router.push('/login')
}
</script>

<template>
  <a-layout class="h-full">
    <!-- 桌面端侧边栏 -->
    <a-layout-sider
      v-if="!isMobile"
      v-model:collapsed="siderCollapsed"
      theme="dark"
      :width="220"
      :collapsed-width="64"
      collapsible
      :trigger="null"
    >
      <div class="h-full flex flex-col">
        <div class="flex-none h-14 flex items-center gap-2 px-4 text-white font-semibold text-[15px] whitespace-nowrap overflow-hidden">
          <span class="w-[26px] h-[26px] rounded-lg flex-none flex items-center justify-center text-[13px] bg-blue-600">S</span>
          <span v-if="!siderCollapsed">Fullstack Scaffold</span>
        </div>
        <a-menu
          theme="dark"
          mode="inline"
          :selected-keys="selectedKeys"
          :items="menuItems"
          class="flex-1 min-h-0 overflow-y-auto !border-0"
          @click="onMenuClick"
        />
        <div v-if="!siderCollapsed" class="flex-none px-4 pb-4">
          <div class="flex items-center gap-2">
            <a-avatar :size="28" style="background-color: #1677ff">
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
            <span class="flex-1 min-w-0 truncate text-sm text-white/90">{{ session.displayName }}</span>
            <a-tooltip title="退出登录">
              <a-button type="text" size="small" class="!text-gray-400 hover:!text-white" @click="onLogout">
                <template #icon>
                  <LogoutOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </div>
        </div>
        <div v-else class="flex-none pb-4 flex justify-center">
          <a-tooltip title="展开菜单" placement="right">
            <a-avatar :size="28" style="background-color: #1677ff" class="cursor-pointer" @click="siderCollapsed = false">
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
          </a-tooltip>
        </div>
      </div>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="!bg-white !px-4 flex items-center gap-3 shadow-sm !h-14 !leading-normal">
        <a-tooltip :title="isMobile ? '打开菜单' : siderCollapsed ? '展开菜单' : '收起菜单'">
          <a-button type="text" class="!flex !items-center !justify-center !h-9 !w-9 !p-0" @click="onToggleSider">
            <template #icon>
              <MenuOutlined />
            </template>
          </a-button>
        </a-tooltip>
        <div class="flex-1" />
        <span class="text-sm text-gray-500">{{ session.displayName }}</span>
        <a-button type="text" @click="onLogout">
          <template #icon>
            <LogoutOutlined />
          </template>
          退出
        </a-button>
      </a-layout-header>

      <a-layout-content class="p-4 overflow-auto flex flex-col">
        <RouterView />
      </a-layout-content>
    </a-layout>

    <!-- 窄屏抽屉承载侧边栏 -->
    <a-drawer v-if="isMobile" v-model:open="drawerOpen" placement="left" :width="264" :closable="false" :styles="{ body: { padding: 0 } }">
      <div class="h-full bg-[#001529]">
        <div class="h-full flex flex-col">
          <div class="flex-none h-14 flex items-center gap-2 px-4 text-white font-semibold text-[15px]">
            <span class="w-[26px] h-[26px] rounded-lg flex-none flex items-center justify-center text-[13px] bg-blue-600">S</span>
            <span>Fullstack Scaffold</span>
          </div>
          <a-menu
            theme="dark"
            mode="inline"
            :selected-keys="selectedKeys"
            :items="menuItems"
            class="flex-1 min-h-0 overflow-y-auto !border-0"
            @click="onMenuClick"
          />
          <div class="flex-none px-4 pb-4">
            <div class="flex items-center gap-2">
              <a-avatar :size="28" style="background-color: #1677ff">
                <template #icon>
                  <UserOutlined />
                </template>
              </a-avatar>
              <span class="flex-1 min-w-0 truncate text-sm text-white/90">{{ session.displayName }}</span>
              <a-button type="text" size="small" class="!text-gray-400 hover:!text-white" @click="onLogout">
                <template #icon>
                  <LogoutOutlined />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </a-drawer>
  </a-layout>
</template>
