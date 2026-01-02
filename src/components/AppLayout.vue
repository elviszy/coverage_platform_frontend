<template>
  <el-container class="app-shell">
    <el-aside width="260px" class="app-aside">
      <div class="app-brand">
        <span class="app-brand-badge">✓</span>
        <div class="app-brand-text">
          <span class="app-brand-name">Coverage Platform</span>
          <span class="app-brand-version">v1.0</span>
        </div>
      </div>
      <el-scrollbar class="app-menu-scroll">
        <el-menu class="app-menu" :default-active="active" router>
          <div class="menu-group-title">概览</div>
          <el-menu-item index="/">
            <span class="menu-icon">📊</span>
            <span>仪表盘</span>
          </el-menu-item>

          <div class="menu-group-title">需求管理</div>
          <el-menu-item index="/requirements/import">
            <span class="menu-icon">📥</span>
            <span>导入需求</span>
          </el-menu-item>
          <el-menu-item index="/requirements/index">
            <span class="menu-icon">🔍</span>
            <span>索引需求</span>
          </el-menu-item>
          <el-menu-item index="/requirements/search">
            <span class="menu-icon">🎯</span>
            <span>需求检索</span>
          </el-menu-item>

          <div class="menu-group-title">用例管理</div>
          <el-menu-item index="/tests/import">
            <span class="menu-icon">📋</span>
            <span>导入用例</span>
          </el-menu-item>
          <el-menu-item index="/tests/search">
            <span class="menu-icon">🔎</span>
            <span>用例检索</span>
          </el-menu-item>

          <div class="menu-group-title">评审中心</div>
          <el-menu-item index="/reviews/create">
            <span class="menu-icon">✨</span>
            <span>发起评审</span>
          </el-menu-item>
          <el-menu-item index="/reviews">
            <span class="menu-icon">📝</span>
            <span>评审列表</span>
          </el-menu-item>

          <div class="menu-group-title">系统</div>
          <el-menu-item index="/jobs">
            <span class="menu-icon">⚡</span>
            <span>任务中心</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <span class="menu-icon">⚙️</span>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container class="app-body">
      <el-header class="app-header">
        <div class="app-header-left">
          <div class="app-title">{{ title }}</div>
        </div>
        <div class="app-header-right">
          <el-button v-if="lastJobId" size="small" type="primary" plain @click="goLastJob">
            <span style="margin-right: 6px">⚡</span> 查看最近任务
          </el-button>
          <div class="app-api-badge">
            <span class="app-api-dot"></span>
            API 已连接
          </div>
        </div>
      </el-header>
      <el-main class="app-main">
        <div class="app-main-inner">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
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

<style scoped>
.app-brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.app-brand-version {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.app-menu-scroll {
  height: calc(100vh - 80px);
}

.menu-icon {
  margin-right: 10px;
  font-size: 16px;
}

.app-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-api-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #15803d;
}

.app-api-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
