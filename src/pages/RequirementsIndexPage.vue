<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>索引需求（解析表格行 → 向量库）</template>

      <el-form label-width="140px" :model="form" style="max-width: 900px">
        <el-form-item label="page_ids（可选）">
          <el-input v-model="form.pageIdsRaw" placeholder="多个用逗号分隔，例如 123,456" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">开始索引</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="job" style="width: 100%">
      <template #header>任务进度</template>
      <div style="margin-bottom: 8px">job_id：<code>{{ job.job_id }}</code></div>
      <el-button @click="$router.push({ path: '/jobs', query: { job_id: job.job_id } })">在任务查询页打开</el-button>
      <el-progress :percentage="Math.round((job.progress || 0) * 100)" />
      <div style="margin-top: 8px">状态：{{ job.status }}</div>
      <el-divider />
      <pre style="white-space: pre-wrap">{{ job.result }}</pre>
      <div v-if="job.error" style="margin-top: 8px; color: var(--el-color-danger)">错误：{{ job.error.message }}</div>
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

import { indexRequirements } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const form = reactive({
  pageIdsRaw: '',
})

const submitting = ref(false)
const { job, poll } = useJobPoller()
const app = useAppStore()

async function onSubmit() {
  submitting.value = true
  try {
    const page_ids = form.pageIdsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const { job_id } = await indexRequirements({ scope: { page_ids: page_ids.length ? page_ids : undefined } })
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}
</script>
