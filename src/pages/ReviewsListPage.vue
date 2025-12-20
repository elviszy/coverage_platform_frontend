<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>评审列表</template>

      <el-table :data="items" style="width: 100%" v-loading="loading">
        <el-table-column prop="run_id" label="run_id" min-width="280" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="200" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button link type="primary" @click="$router.push(`/reviews/${scope.row.run_id}`)">打开</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 12px; display: flex; justify-content: flex-end">
        <el-pagination
          background
          layout="prev, pager, next"
          :page-size="pageSize"
          :current-page="page"
          :total="total"
          @current-change="onPageChange"
        />
      </div>

      <el-alert v-if="error" type="error" :title="error" show-icon style="margin-top: 12px" />
    </el-card>
  </el-space>
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
