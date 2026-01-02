<template>
  <div class="create-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">🚀 发起评审</h1>
      <p class="page-desc">配置需求与用例范围，启动覆盖度评审任务</p>
    </div>

    <!-- 配置表单 -->
    <div class="form-layout">
      <!-- 左侧：范围配置 -->
      <div class="form-column">
        <!-- 需求范围 -->
        <el-card class="scope-card">
          <div class="card-header">
            <span class="card-icon">📝</span>
            <span class="card-title">需求范围</span>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">页面 ID</label>
              <el-input v-model="form.req_page_ids" placeholder="留空表示全部，或输入多个 ID 用逗号分隔" size="large" />
              <span class="form-hint">来自导入的需求页面</span>
            </div>
            <div class="form-group">
              <label class="form-label">路径前缀过滤</label>
              <el-input v-model="form.req_path_prefix" placeholder="例如：/产品/模块" size="large" />
            </div>
          </div>
        </el-card>

        <!-- 用例范围 -->
        <el-card class="scope-card">
          <div class="card-header">
            <span class="card-icon">🧪</span>
            <span class="card-title">用例范围</span>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">来源 ID</label>
              <el-input v-model="form.test_source_ids" placeholder="留空表示全部，或输入多个 ID 用逗号分隔" size="large" />
              <span class="form-hint">来自导入的 XMind 文件</span>
            </div>
            <div class="form-group">
              <label class="form-label">路径前缀过滤</label>
              <el-input v-model="form.test_path_prefix" placeholder="例如：根节点/子模块" size="large" />
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：评审配置 -->
      <div class="form-column">
        <el-card class="config-card">
          <div class="card-header">
            <span class="card-icon">⚙️</span>
            <span class="card-title">评审配置</span>
          </div>
          <div class="card-body">
            <div class="config-grid">
              <div class="form-group">
                <label class="form-label">Top K</label>
                <el-input-number v-model="form.top_k" :min="1" :max="200" size="large" style="width: 100%" />
                <span class="form-hint">每个需求匹配的最大用例数</span>
              </div>
              <div class="form-group">
                <label class="form-label">覆盖阈值</label>
                <el-input-number v-model="form.threshold_cover" :min="0" :max="1" :step="0.01" size="large" style="width: 100%" />
                <span class="form-hint">相似度 ≥ 此值则认为覆盖</span>
              </div>
              <div class="form-group">
                <label class="form-label">疑似阈值</label>
                <el-input-number v-model="form.threshold_maybe" :min="0" :max="1" :step="0.01" size="large" style="width: 100%" />
                <span class="form-hint">相似度 ≥ 此值则标记疑似</span>
              </div>
            </div>

            <div class="llm-toggle">
              <div class="toggle-info">
                <span class="toggle-icon">🤖</span>
                <div class="toggle-text">
                  <strong>LLM 智能校验</strong>
                  <p>使用大语言模型对覆盖结果进行二次确认</p>
                </div>
              </div>
              <el-switch v-model="form.enable_llm_verifier" size="large" />
            </div>
          </div>
        </el-card>

        <!-- 提交按钮 -->
        <el-card class="submit-card">
          <el-button type="primary" size="large" :loading="submitting" @click="onSubmit" class="submit-btn">
            🚀 开始评审
          </el-button>
          <p class="submit-hint">评审任务将在后台执行，您可以在任务中心查看进度</p>
        </el-card>
      </div>
    </div>

    <!-- 任务进度 -->
    <el-card v-if="job" class="progress-card slide-up">
      <div class="progress-header">
        <div class="progress-title">
          <span class="progress-icon">⚡</span>
          <span>评审进度</span>
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
        <el-button v-if="job.status === 'succeeded' && job.result?.run_id" type="primary" size="small" @click="$router.push(`/reviews/${job.result.run_id}`)">
          📊 查看评审结果
        </el-button>
      </div>

      <el-alert v-if="job.error" type="error" :title="job.error.message" show-icon style="margin-top: 16px" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { createReviewRun } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const form = reactive({
  req_page_ids: '',
  req_path_prefix: '',
  test_source_ids: '',
  test_path_prefix: '',
  top_k: 50,
  threshold_cover: 0.82,
  threshold_maybe: 0.75,
  enable_llm_verifier: false,
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

function splitCsv(v: string): string[] | undefined {
  const xs = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return xs.length ? xs : undefined
}

async function onSubmit() {
  submitting.value = true
  try {
    const payload = {
      requirements_scope: {
        page_ids: splitCsv(form.req_page_ids),
        path_prefix: form.req_path_prefix || undefined,
        only_latest: true,
      },
      tests_scope: {
        source_ids: splitCsv(form.test_source_ids),
        path_prefix: form.test_path_prefix || undefined,
      },
      coverage: {
        top_k: form.top_k,
        threshold_cover: form.threshold_cover,
        threshold_maybe: form.threshold_maybe,
        enable_llm_verifier: form.enable_llm_verifier,
      },
      quality: {
        enable_quality_review: true,
        enable_llm_quality_review: false,
      },
    }

    const { job_id } = await createReviewRun(payload)
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const draft = app.consumeReviewDraft()
  if (!draft) return

  if (draft.requirements_scope) {
    if (Array.isArray(draft.requirements_scope.page_ids)) {
      form.req_page_ids = draft.requirements_scope.page_ids.join(',')
    }
    if (typeof draft.requirements_scope.path_prefix === 'string') {
      form.req_path_prefix = draft.requirements_scope.path_prefix
    }
  }

  if (draft.tests_scope) {
    if (Array.isArray(draft.tests_scope.source_ids)) {
      form.test_source_ids = draft.tests_scope.source_ids.join(',')
    }
    if (typeof draft.tests_scope.path_prefix === 'string') {
      form.test_path_prefix = draft.tests_scope.path_prefix
    }
  }
})
</script>

<style scoped>
.create-page {
  max-width: 1100px;
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

.form-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.scope-card,
.config-card,
.submit-card {
  overflow: visible;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.card-icon {
  font-size: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.card-body {
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
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.form-hint {
  font-size: 12px;
  color: #94a3b8;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 600px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

.llm-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  margin-top: 8px;
}

.toggle-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.toggle-icon {
  font-size: 24px;
}

.toggle-text strong {
  display: block;
  font-size: 14px;
  color: #92400e;
  margin-bottom: 2px;
}

.toggle-text p {
  margin: 0;
  font-size: 12px;
  color: #a16207;
}

.submit-card {
  text-align: center;
  padding: 24px 20px;
}

.submit-btn {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 700;
}

.submit-hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.progress-card {
  margin-top: 24px;
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
</style>
