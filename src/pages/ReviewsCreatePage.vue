<template>
  <div class="create-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">发起评审</h1>
      <p class="page-desc">选择需求与用例范围，启动覆盖度评审任务</p>
    </div>

    <!-- 主要配置区域 -->
    <div class="main-form">
      <div class="scope-grid">
        <!-- 需求范围 -->
        <div class="scope-card">
          <div class="card-header">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span class="card-title">需求范围</span>
          </div>
          <div class="card-body">
            <el-select
              v-model="form.req_page_ids"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="留空表示全部"
              size="large"
              style="width: 100%"
              :loading="loadingReqs"
              popper-class="dark-select-popper"
            >
              <el-option
                v-for="page in reqPages"
                :key="page.page_id"
                :label="page.title"
                :value="page.page_id"
              >
                <div class="option-item">
                  <span class="option-title">{{ page.title }}</span>
                  <span class="option-path">{{ page.path || '/' }}</span>
                </div>
              </el-option>
            </el-select>
            <span class="form-hint">已导入 {{ reqPages.length }} 个需求页面</span>
          </div>
        </div>

        <!-- 用例范围 -->
        <div class="scope-card">
          <div class="card-header">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="2"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
            <span class="card-title">用例范围</span>
          </div>
          <div class="card-body">
            <el-select
              v-model="form.test_source_ids"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="留空表示全部"
              size="large"
              style="width: 100%"
              :loading="loadingTests"
              popper-class="dark-select-popper"
            >
              <el-option
                v-for="source in testSources"
                :key="source.source_id"
                :label="source.file_name"
                :value="source.source_id"
              >
                <div class="option-item">
                  <span class="option-title">{{ source.file_name }}</span>
                  <span class="option-path">{{ formatDate(source.imported_at) }}</span>
                </div>
              </el-option>
            </el-select>
            <span class="form-hint">已导入 {{ testSources.length }} 个 XMind 文件</span>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <button class="submit-btn" :disabled="submitting" @click="onSubmit">
        <svg v-if="!submitting" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
        <span v-if="submitting" class="btn-loading"></span>
        <span>{{ submitting ? '评审中...' : '开始评审' }}</span>
      </button>

      <!-- 高级选项 -->
      <div class="advanced-section">
        <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
          <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>高级选项</span>
          <svg class="chevron" :class="{ 'chevron-open': showAdvanced }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <transition name="fade-slide">
          <div v-if="showAdvanced" class="advanced-content">
            <div class="advanced-grid">
              <div class="form-group">
                <label class="form-label">Top K</label>
                <el-input-number v-model="form.top_k" :min="1" :max="200" size="default" style="width: 100%" />
                <span class="form-hint">每个需求匹配的最大用例数</span>
              </div>
              <div class="form-group">
                <label class="form-label">覆盖阈值</label>
                <el-input-number v-model="form.threshold_cover" :min="0" :max="1" :step="0.01" size="default" style="width: 100%" />
                <span class="form-hint">≥ 此值认为已覆盖</span>
              </div>
              <div class="form-group">
                <label class="form-label">疑似阈值</label>
                <el-input-number v-model="form.threshold_maybe" :min="0" :max="1" :step="0.01" size="default" style="width: 100%" />
                <span class="form-hint">≥ 此值标记待确认</span>
              </div>
              <div class="form-group">
                <label class="form-label">LLM 校验</label>
                <el-switch v-model="form.enable_llm_verifier" size="default" style="margin-top: 8px" />
                <span class="form-hint">使用 AI 二次确认</span>
              </div>
            </div>
            <div class="path-filters">
              <div class="form-group">
                <label class="form-label">需求路径前缀过滤</label>
                <el-input v-model="form.req_path_prefix" placeholder="例如：/产品/模块" size="default" />
              </div>
              <div class="form-group">
                <label class="form-label">用例路径前缀过滤</label>
                <el-input v-model="form.test_path_prefix" placeholder="例如：根节点/子模块" size="default" />
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 任务进度 -->
    <div v-if="job" class="progress-card">
      <div class="progress-header">
        <div class="progress-title">
          <svg class="progress-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
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
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${Math.round((job.progress || 0) * 100)}%` }"></div>
        </div>
      </div>

      <div class="progress-actions">
        <button class="action-btn" @click="$router.push({ path: '/jobs', query: { job_id: job.job_id } })">
          <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          在任务中心查看
        </button>
        <button v-if="job.status === 'succeeded' && job.result?.run_id" class="action-btn action-btn--primary" @click="$router.push(`/reviews/${job.result.run_id}`)">
          <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          查看评审结果
        </button>
      </div>

      <div v-if="job.error" class="error-alert">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ job.error.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { createReviewRun, listRequirementsPages, listTestsSources } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const showAdvanced = ref(false)

const reqPages = ref<Array<{ page_id: string; page_url: string; title: string; version: number; path: string; fetched_at: string }>>([])
const loadingReqs = ref(false)

const testSources = ref<Array<{ source_id: string; source_type: string; file_name: string; file_hash: string; imported_at: string }>>([])
const loadingTests = ref(false)

const form = reactive({
  req_page_ids: [] as string[],
  req_path_prefix: '',
  test_source_ids: [] as string[],
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN')
}

async function loadData() {
  loadingReqs.value = true
  loadingTests.value = true
  
  try {
    const [reqData, testData] = await Promise.all([
      listRequirementsPages(),
      listTestsSources(),
    ])
    reqPages.value = reqData.items
    testSources.value = testData.items
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loadingReqs.value = false
    loadingTests.value = false
  }
}

async function onSubmit() {
  submitting.value = true
  try {
    const payload = {
      requirements_scope: {
        page_ids: form.req_page_ids.length > 0 ? form.req_page_ids : undefined,
        path_prefix: form.req_path_prefix || undefined,
        only_latest: true,
      },
      tests_scope: {
        source_ids: form.test_source_ids.length > 0 ? form.test_source_ids : undefined,
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
  loadData()
  
  const draft = app.consumeReviewDraft()
  if (!draft) return

  if (draft.requirements_scope) {
    if (Array.isArray(draft.requirements_scope.page_ids)) {
      form.req_page_ids = draft.requirements_scope.page_ids
    }
    if (typeof draft.requirements_scope.path_prefix === 'string') {
      form.req_path_prefix = draft.requirements_scope.path_prefix
    }
  }

  if (draft.tests_scope) {
    if (Array.isArray(draft.tests_scope.source_ids)) {
      form.test_source_ids = draft.tests_scope.source_ids
    }
    if (typeof draft.tests_scope.path_prefix === 'string') {
      form.test_path_prefix = draft.tests_scope.path_prefix
    }
  }
})
</script>

<style scoped>
.create-page {
  max-width: 800px;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.page-desc {
  font-size: 14px;
  color: #94A3B8;
  margin: 0;
}

.main-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.scope-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .scope-grid {
    grid-template-columns: 1fr;
  }
}

.scope-card {
  background: #1E293B;
  border: 1px solid rgba(248, 250, 252, 0.08);
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.2s ease;
}

.scope-card:hover {
  border-color: rgba(34, 197, 94, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.card-icon {
  width: 20px;
  height: 20px;
  color: #22C55E;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #F8FAFC;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #94A3B8;
}

.form-hint {
  font-size: 11px;
  color: #64748B;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.option-title {
  font-size: 13px;
  color: #F8FAFC;
}

.option-path {
  font-size: 11px;
  color: #64748B;
}

/* 提交按钮 */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.btn-loading {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 高级选项 */
.advanced-section {
  background: #1E293B;
  border: 1px solid rgba(248, 250, 252, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  color: #94A3B8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
}

.advanced-toggle:hover {
  color: #F8FAFC;
}

.toggle-icon {
  width: 16px;
  height: 16px;
  color: #64748B;
}

.chevron {
  width: 16px;
  height: 16px;
  margin-left: auto;
  transition: transform 0.2s ease;
}

.chevron-open {
  transform: rotate(180deg);
}

.advanced-content {
  padding: 0 16px 16px;
}

.advanced-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .advanced-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.path-filters {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .path-filters {
    grid-template-columns: 1fr;
  }
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 进度卡片 */
.progress-card {
  background: #1E293B;
  border: 1px solid rgba(248, 250, 252, 0.08);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #F8FAFC;
}

.progress-icon {
  width: 18px;
  height: 18px;
  color: #FBBF24;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge--pending {
  background: rgba(148, 163, 184, 0.2);
  color: #94A3B8;
}

.status-badge--running {
  background: rgba(59, 130, 246, 0.2);
  color: #3B82F6;
}

.status-badge--succeeded {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
}

.status-badge--failed {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.progress-bar-section {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #64748B;
}

.progress-info code {
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  color: #94A3B8;
}

.progress-percent {
  font-weight: 600;
  color: #22C55E;
}

.progress-track {
  height: 6px;
  background: rgba(248, 250, 252, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22C55E 0%, #16A34A 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.05);
  border: 1px solid rgba(248, 250, 252, 0.1);
  border-radius: 8px;
  color: #94A3B8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(248, 250, 252, 0.1);
  color: #F8FAFC;
}

.action-btn--primary {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22C55E;
}

.action-btn--primary:hover {
  background: rgba(34, 197, 94, 0.2);
}

.action-icon {
  width: 14px;
  height: 14px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #EF4444;
  font-size: 13px;
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
