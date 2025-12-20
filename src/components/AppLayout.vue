<template>
  <el-container class="app-shell">
    <el-aside width="260px" class="app-aside">
      <div class="app-brand">
        <span class="app-brand-badge">CP</span>
        <span>测试覆盖评审平台</span>
      </div>
      <el-menu class="app-menu" :default-active="active" router>
        <el-menu-item index="/">概览</el-menu-item>
        <el-menu-item index="/requirements/import">导入需求（Confluence）</el-menu-item>
        <el-menu-item index="/requirements/index">索引需求</el-menu-item>
        <el-menu-item index="/requirements/search">需求检索</el-menu-item>
        <el-menu-item index="/tests/import">导入用例（XMind）</el-menu-item>
        <el-menu-item index="/tests/search">用例检索</el-menu-item>
        <el-menu-item index="/reviews/create">发起评审</el-menu-item>
        <el-menu-item index="/reviews">评审列表</el-menu-item>
        <el-menu-item index="/jobs">任务查询</el-menu-item>
        <el-menu-item index="/settings">设置</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="app-body">
      <el-header class="app-header">
        <div class="app-title">{{ title }}</div>
        <el-space>
          <el-button v-if="lastJobId" size="small" @click="goLastJob">最近任务</el-button>
          <div style="font-size: 12px; color: var(--el-text-color-secondary)">API 前缀：/api/v1</div>
        </el-space>
      </el-header>
      <el-main class="app-main">
        <div class="app-main-inner">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const app = useAppStore()

const active = computed(() => route.path)
const title = computed(() => (typeof route.meta?.title === 'string' ? (route.meta.title as string) : ''))
const lastJobId = computed(() => app.lastJobId)

function goLastJob() {
  if (!lastJobId.value) return
  router.push({ path: '/jobs', query: { job_id: lastJobId.value } })
}
</script>
