<template>
  <div class="index-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">🔍 索引需求</h1>
      <p class="page-desc">解析需求页面表格，生成向量索引用于检索</p>
    </div>

    <!-- 索引表单 -->
    <el-card class="index-card">
      <div class="card-content">
        <div class="info-banner">
          <div class="info-icon">💡</div>
          <div class="info-text">
            <strong>索引流程说明</strong>
            <p>系统会解析已导入的需求页面，提取表格行作为验收标准，并生成向量嵌入存入数据库。</p>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="form-label">限定页面 ID（可选）</label>
            <el-input
              v-model="form.pageIdsRaw"
              placeholder="留空则索引全部页面，或输入多个 ID 用逗号分隔"
              size="large"
            />
            <span class="form-hint">留空表示索引所有已导入的需求页面</span>
          </div>
        </div>

        <div class="form-actions">
          <el-button type="primary" size="large" :loading="submitting" @click="onSubmit">
            🚀 开始索引
          </el-button>
          <el-button size="large" @click="$router.push('/requirements/search')">
            🎯 前往检索页面
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 任务进度 -->
    <el-card v-if="job" class="progress-card slide-up">
      <div class="progress-header">
        <div class="progress-title">
          <span class="progress-icon">⚡</span>
          <span>索引进度</span>
        </div>
        <span :class="['status-badge', `status-badge--${job.status}`]">
          {{ statusText }}
        </span>
      </div>

      <div class="progress-bar-section">
        <div class="progress-info">
          <span>Job ID: <code>{{ job.job_id }}</code></span>
          <span class="progress-percent">{{ Math.round((job.progress || 0) * 100) }}%</span>
        </div>
        <el-progress :percentage="Math.round((job.progress || 0) * 100)" :stroke-width="10" :show-text="false" />
      </div>

      <div class="progress-actions">
        <el-button size="small" @click="$router.push({ path: '/jobs', query: { job_id: job.job_id } })">
          🔍 在任务中心查看
        </el-button>
        <el-button v-if="job.status === 'succeeded'" type="primary" size="small" @click="$router.push('/requirements/search')">
          → 开始检索
        </el-button>
      </div>

      <div v-if="job.result && Object.keys(job.result).length" class="result-section">
        <div class="result-title">执行结果</div>
        <pre class="result-content">{{ JSON.stringify(job.result, null, 2) }}</pre>
      </div>

      <el-alert v-if="job.error" type="error" :title="job.error.message" show-icon style="margin-top: 16px" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { indexRequirements } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const form = reactive({
  pageIdsRaw: '',
})

const submitting = ref(false)
const { job, poll } = useJobPoller()
const app = useAppStore()

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    succeeded: '已完成',
    failed: '已失败',
  }
  return map[job.value?.status || ''] || job.value?.status || ''
})

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

<style scoped>
.index-page {
  max-width: 800px;
}

.page-header {
  margin-bottom: 24px;
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

.index-card {
  overflow: visible;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-banner {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 12px;
}

.info-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.info-text strong {
  display: block;
  font-size: 14px;
  color: #3730a3;
  margin-bottom: 4px;
}

.info-text p {
  margin: 0;
  font-size: 13px;
  color: #4338ca;
  line-height: 1.5;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.form-hint {
  font-size: 12px;
  color: #94a3b8;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.progress-card {
  margin-top: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.progress-icon {
  font-size: 20px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge--pending {
  background: #f1f5f9;
  color: #475569;
}

.status-badge--running {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge--succeeded {
  background: #dcfce7;
  color: #15803d;
}

.status-badge--failed {
  background: #fee2e2;
  color: #b91c1c;
}

.progress-bar-section {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #64748b;
}

.progress-percent {
  font-weight: 700;
  color: #6366f1;
}

.progress-actions {
  display: flex;
  gap: 8px;
}

.result-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
}

.result-content {
  margin: 0;
  max-height: 200px;
  overflow: auto;
}
</style>
