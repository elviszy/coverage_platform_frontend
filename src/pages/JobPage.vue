<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>任务查询（Job）</template>

      <el-form inline>
        <el-form-item label="job_id">
          <el-input v-model="jobId" placeholder="粘贴 job_id" style="width: 420px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!jobId" @click="onQuery">查询</el-button>
          <el-button :disabled="!jobId" @click="onPoll">轮询</el-button>
          <el-button @click="stop">停止轮询</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="pollError" type="error" :title="pollError" show-icon />
    </el-card>

    <el-card v-if="job" style="width: 100%">
      <template #header>任务状态</template>

      <div style="margin-bottom: 8px">job_id：<code>{{ job.job_id }}</code></div>
      <div style="margin-bottom: 8px">type：{{ job.type }}</div>
      <div style="margin-bottom: 8px">status：{{ job.status }}</div>
      <div style="margin-bottom: 8px">created_at：{{ job.created_at }}</div>
      <div style="margin-bottom: 8px">updated_at：{{ job.updated_at }}</div>

      <el-progress :percentage="Math.round((job.progress || 0) * 100)" />

      <el-divider />
      <div style="font-weight: 600; margin-bottom: 8px">result</div>
      <pre style="white-space: pre-wrap">{{ job.result }}</pre>

      <div v-if="job.error" style="margin-top: 8px; color: var(--el-color-danger)">
        error：{{ job.error.message }}
      </div>
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getJob } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'

const jobId = ref('')

const route = useRoute()
const router = useRouter()

const { job, error: pollError, poll, stop } = useJobPoller()

async function onQuery() {
  if (!jobId.value) return
  job.value = await getJob(jobId.value)
}

async function onPoll() {
  if (!jobId.value) return
  await poll(jobId.value)
}

watch(
  () => jobId.value,
  (v) => {
    const q = { ...(route.query || {}) }
    if (v) {
      q.job_id = v
    } else {
      delete (q as any).job_id
    }
    router.replace({ query: q })
  },
)

onMounted(() => {
  const qid = route.query?.job_id
  if (typeof qid === 'string' && qid) {
    jobId.value = qid
    void onPoll()
  }
})
</script>
