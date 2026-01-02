<template>
  <div class="job-page">
    <!-- 查询输入 -->
    <el-card class="search-card">
      <div class="search-header">
        <div class="search-title">
          <span class="search-icon">⚡</span>
          <span>任务查询</span>
        </div>
      </div>
      <div class="search-form">
        <el-input
          v-model="jobId"
          placeholder="输入或粘贴 Job ID"
          size="large"
          class="job-input"
          clearable
        >
          <template #prefix>
            <span style="color: #94a3b8">#</span>
          </template>
        </el-input>
        <div class="search-actions">
          <el-button type="primary" size="large" :disabled="!jobId" @click="onQuery">
            🔍 查询
          </el-button>
          <el-button size="large" :disabled="!jobId" :loading="isPolling" @click="onPoll">
            {{ isPolling ? '轮询中...' : '⚙️ 自动轮询' }}
          </el-button>
          <el-button size="large" :disabled="!isPolling" @click="stop">
            ⏹ 停止
          </el-button>
        </div>
      </div>
      <el-alert v-if="pollError" type="error" :title="pollError" show-icon style="margin-top: 16px" />
    </el-card>

    <!-- 任务状态 -->
    <el-card v-if="job" class="status-card slide-up">
      <div class="status-header">
        <div class="status-title-row">
          <span class="status-title">任务状态</span>
          <span :class="['status-tag', `status-tag--${job.status}`]">
            <span class="status-dot"></span>
            {{ statusText }}
          </span>
        </div>
        <div class="job-id-display">
          <code>{{ job.job_id }}</code>
          <el-button link size="small" @click="copyJobId">复制</el-button>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-header">
          <span>执行进度</span>
          <span class="progress-value">{{ Math.round((job.progress || 0) * 100) }}%</span>
        </div>
        <el-progress
          :percentage="Math.round((job.progress || 0) * 100)"
          :stroke-width="12"
          :show-text="false"
        />
      </div>

      <!-- 任务信息 -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">任务类型</span>
          <span class="info-value">{{ job.type }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ formatTime(job.created_at) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">更新时间</span>
          <span class="info-value">{{ formatTime(job.updated_at) }}</span>
        </div>
      </div>

      <!-- 结果 -->
      <div class="result-section">
        <div class="result-header">
          <span>📝 执行结果</span>
        </div>
        <pre class="result-content">{{ JSON.stringify(job.result, null, 2) }}</pre>
      </div>

      <!-- 错误 -->
      <div v-if="job.error" class="error-section">
        <div class="error-header">❌ 错误信息</div>
        <div class="error-content">
          <div class="error-code">{{ job.error.code }}</div>
          <div class="error-message">{{ job.error.message }}</div>
        </div>
      </div>
    </el-card>

    <!-- 空状态 -->
    <div v-if="!job && !pollError" class="empty-state">
      <div class="empty-icon">📝</div>
      <p class="empty-text">输入 Job ID 开始查询任务状态</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getJob } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'

const jobId = ref('')

const route = useRoute()
const router = useRouter()

const { job, loading: isPolling, error: pollError, poll, stop } = useJobPoller()

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    succeeded: '已完成',
    failed: '已失败',
    canceled: '已取消',
  }
  return map[job.value?.status || ''] || job.value?.status || ''
})

function formatTime(t: string | undefined) {
  if (!t) return '-'
  try {
    return new Date(t).toLocaleString('zh-CN')
  } catch {
    return t
  }
}

async function copyJobId() {
  if (!job.value?.job_id) return
  try {
    await navigator.clipboard.writeText(job.value.job_id)
  } catch {
    // fallback
  }
}

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

<style scoped>
.job-page {
  max-width: 900px;
}

.search-card {
  margin-bottom: 20px;
}

.search-header {
  margin-bottom: 20px;
}

.search-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.search-icon {
  font-size: 24px;
}

.search-form {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.job-input {
  flex: 1;
  min-width: 300px;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.status-card {
  margin-bottom: 20px;
}

.status-header {
  margin-bottom: 24px;
}

.status-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.job-id-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #64748b;
}

.progress-value {
  font-weight: 700;
  color: #6366f1;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.result-section {
  margin-bottom: 16px;
}

.result-header {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
}

.result-content {
  margin: 0;
  max-height: 300px;
  overflow: auto;
}

.error-section {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 12px;
  padding: 16px;
}

.error-header {
  font-size: 14px;
  font-weight: 600;
  color: #b91c1c;
  margin-bottom: 8px;
}

.error-code {
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 4px;
}

.error-message {
  font-size: 14px;
  color: #7f1d1d;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}
</style>
