<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>导入 Confluence 需求页面</template>

      <el-form label-width="140px" :model="form" style="max-width: 900px">
        <el-form-item label="页面链接 pageUrl">
          <el-input v-model="form.page_url" placeholder="https://xxx/pages/viewpage.action?pageId=123" />
        </el-form-item>

        <el-form-item label="递归导入">
          <el-switch v-model="form.recursive" />
        </el-form-item>

        <el-form-item label="最大深度 maxDepth">
          <el-input-number v-model="form.max_depth" :min="0" :max="10" />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary)">0 表示只导入当前页</span>
        </el-form-item>

        <el-form-item label="拉取附件">
          <el-switch v-model="form.include_attachments" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">提交导入</el-button>
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
      <div style="font-weight: 600; margin-bottom: 8px">结果</div>
      <pre style="white-space: pre-wrap">{{ job.result }}</pre>

      <div v-if="job.error" style="margin-top: 8px; color: var(--el-color-danger)">
        错误：{{ job.error.message }}
      </div>
    </el-card>

    <el-alert v-if="pollError" type="error" :title="pollError" show-icon />
  </el-space>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

import { importConfluence } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const form = reactive({
  page_url: '',
  recursive: false,
  max_depth: 0,
  include_attachments: true,
})

const submitting = ref(false)
const { job, error: pollError, poll } = useJobPoller()
const app = useAppStore()

async function onSubmit() {
  submitting.value = true
  try {
    const { job_id } = await importConfluence(form)
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}
</script>
