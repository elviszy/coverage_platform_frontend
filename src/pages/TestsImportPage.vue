<template>
  <div class="import-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">📋 导入用例</h1>
      <p class="page-desc">从 XMind 文件导入测试用例，自动解析思维导图结构</p>
    </div>

    <!-- 导入表单 -->
    <el-card class="import-card">
      <div class="card-content">
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">选择 XMind 文件 <span class="required">*</span></label>
            <div class="upload-area">
              <el-upload
                class="upload-dragger"
                drag
                :auto-upload="false"
                :limit="1"
                accept=".xmind"
                :on-change="onFileChange"
                :show-file-list="false"
              >
                <div class="upload-content">
                  <div class="upload-icon">🧠</div>
                  <div class="upload-text">
                    <span v-if="!fileName">拖放 .xmind 文件到此处，或 <em>点击上传</em></span>
                    <span v-else class="file-selected">✅ 已选择: {{ fileName }}</span>
                  </div>
                </div>
              </el-upload>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">解析模式</label>
            <el-select v-model="form.parse_mode" size="large" style="width: 100%">
              <el-option label="叶子节点模式（推荐）" value="leaf_only" />
            </el-select>
            <span class="form-hint">只提取叶子节点作为测试场景</span>
          </div>
        </div>

        <div class="form-actions">
          <el-button type="primary" size="large" :loading="submitting" :disabled="!file" @click="onSubmit">
            🚀 开始导入
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 任务进度 -->
    <el-card v-if="job" class="progress-card slide-up">
      <div class="progress-header">
        <div class="progress-title">
          <span class="progress-icon">⚡</span>
          <span>导入进度</span>
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
        <el-button v-if="job.status === 'succeeded'" type="primary" size="small" @click="$router.push('/tests/search')">
          → 开始检索用例
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

import { importXmind } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const form = reactive({
  parse_mode: 'leaf_only',
})

const file = ref<File | null>(null)
const fileName = ref('')
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

function onFileChange(uploadFile: any) {
  const raw = uploadFile?.raw as File | undefined
  file.value = raw || null
  fileName.value = raw?.name || ''
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

<style scoped>
.import-page {
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

.import-card {
  overflow: visible;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.required {
  color: #ef4444;
}

.form-hint {
  font-size: 12px;
  color: #94a3b8;
}

.upload-area {
  width: 100%;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-content {
  text-align: center;
}

.upload-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 14px;
  color: #64748b;
}

.upload-text em {
  color: #6366f1;
  font-style: normal;
  font-weight: 600;
}

.file-selected {
  color: #22c55e;
  font-weight: 600;
}

.form-actions {
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
