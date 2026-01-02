<template>
  <div class="reviews-page">
    <!-- 页面头 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📝 评审列表</h1>
        <p class="page-desc">查看所有覆盖度评审记录</p>
      </div>
      <el-button type="primary" @click="$router.push('/reviews/create')">
        ✨ 发起新评审
      </el-button>
    </div>

    <!-- 评审列表 -->
    <el-card class="list-card">
      <el-table :data="items" style="width: 100%" v-loading="loading">
        <el-table-column label="评审 ID" min-width="280">
          <template #default="scope">
            <div class="run-id-cell">
              <code>{{ scope.row.run_id }}</code>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="scope">
            <span :class="['status-badge', `status-badge--${scope.row.status}`]">
              <span class="status-dot"></span>
              {{ getStatusText(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="200">
          <template #default="scope">
            <span class="time-cell">{{ formatTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="$router.push(`/reviews/${scope.row.run_id}`)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!loading && items.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p class="empty-text">暂无评审记录</p>
        <el-button type="primary" @click="$router.push('/reviews/create')">发起第一个评审</el-button>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination-wrapper">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :page-size="pageSize"
          :current-page="page"
          :total="total"
          @current-change="onPageChange"
        />
      </div>

      <el-alert v-if="error" type="error" :title="error" show-icon style="margin-top: 16px" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { listReviewRuns } from '@/api/endpoints'
import type { ReviewRunListItem } from '@/api/types'

const items = ref<ReviewRunListItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const page = ref(1)
const pageSize = 20
const total = ref(0)

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    succeeded: '已完成',
    failed: '已失败',
    canceled: '已取消',
  }
  return map[status] || status
}

function formatTime(t: string) {
  if (!t) return '-'
  try {
    return new Date(t).toLocaleString('zh-CN')
  } catch {
    return t
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await listReviewRuns(page.value, pageSize)
    items.value = data.items
    total.value = data.total
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function onPageChange(p: number) {
  page.value = p
  void load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.reviews-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.page-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.list-card {
  overflow: hidden;
}

.run-id-cell code {
  font-size: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge--pending {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
}

.status-badge--running {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
}

.status-badge--succeeded {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
}

.status-badge--failed {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #b91c1c;
}

.time-cell {
  font-size: 13px;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
</style>
