<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>导入用例（XMind）</template>

      <el-form label-width="140px" :model="form" style="max-width: 900px">
        <el-form-item label="XMind 文件">
          <input type="file" accept=".xmind" @change="onFileChange" />
        </el-form-item>

        <el-form-item label="解析模式">
          <el-select v-model="form.parse_mode" style="width: 240px">
            <el-option label="leaf_only（叶子节点）" value="leaf_only" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" :disabled="!file" @click="onSubmit">提交导入</el-button>
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

import { importXmind } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const form = reactive({
  parse_mode: 'leaf_only',
})

const file = ref<File | null>(null)
const submitting = ref(false)
const { job, poll } = useJobPoller()
const app = useAppStore()

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  file.value = f || null
}

async function onSubmit() {
  if (!file.value) return
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    fd.append('parse_mode', form.parse_mode)

    const { job_id } = await importXmind(fd)
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}
</script>
