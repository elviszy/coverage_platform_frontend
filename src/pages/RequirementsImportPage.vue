<template>
  <div class="import-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">📥 导入需求</h1>
      <p class="page-desc">支持从 Confluence、纯文本或 Word 文档导入需求</p>
    </div>

    <!-- 导入表单 -->
    <el-card class="import-card">
      <el-tabs v-model="activeTab" class="import-tabs">
        <el-tab-pane name="confluence">
          <template #label>
            <span class="tab-label">🌐 Confluence</span>
          </template>
          <div class="tab-content">
            <div class="form-section">
              <div class="form-group">
                <label class="form-label">页面链接</label>
                <el-input
                  v-model="confluenceForm.page_url"
                  placeholder="https://confluence.example.com/pages/viewpage.action?pageId=123"
                  size="large"
                />
                <span class="form-hint">支持标准 Confluence 页面链接</span>
              </div>

              <div class="form-row">
                <div class="form-group form-group--half">
                  <label class="form-label">递归导入</label>
                  <div class="switch-with-desc">
                    <el-switch v-model="confluenceForm.recursive" />
                    <span class="switch-desc">导入子页面</span>
                  </div>
                </div>
                <div class="form-group form-group--half">
                  <label class="form-label">最大深度</label>
                  <el-input-number v-model="confluenceForm.max_depth" :min="0" :max="10" size="large" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">拉取附件</label>
                <div class="switch-with-desc">
                  <el-switch v-model="confluenceForm.include_attachments" />
                  <span class="switch-desc">同时下载页面附件</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <el-button type="primary" size="large" :loading="submitting" @click="onSubmitConfluence">
                🚀 开始导入
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="text">
          <template #label>
            <span class="tab-label">📝 纯文本</span>
          </template>
          <div class="tab-content">
            <div class="form-section">
              <div class="form-row">
                <div class="form-group form-group--half">
                  <label class="form-label">需求标题 <span class="required">*</span></label>
                  <el-input v-model="textForm.title" placeholder="例如：用户登录模块需求" size="large" />
                </div>
                <div class="form-group form-group--half">
                  <label class="form-label">分类路径</label>
                  <el-input v-model="textForm.path" placeholder="例如：项目A/模块B" size="large" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">需求内容 <span class="required">*</span></label>
                <el-input
                  v-model="textForm.text"
                  type="textarea"
                  :rows="12"
                  placeholder="粘贴或输入需求文本内容..."
                />
              </div>
            </div>

            <div class="form-actions">
              <el-button type="primary" size="large" :loading="submitting" :disabled="!textForm.title || !textForm.text" @click="onSubmitText">
                🚀 开始导入
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="docx">
          <template #label>
            <span class="tab-label">📄 Word 文档</span>
          </template>
          <div class="tab-content">
            <div class="form-section">
              <div class="form-row">
                <div class="form-group form-group--half">
                  <label class="form-label">需求标题</label>
                  <el-input v-model="docxForm.title" placeholder="留空则使用文件名" size="large" />
                </div>
                <div class="form-group form-group--half">
                  <label class="form-label">分类路径</label>
                  <el-input v-model="docxForm.path" placeholder="例如：项目A/模块B" size="large" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">选择文件 <span class="required">*</span></label>
                <div class="upload-area">
                  <el-upload
                    class="upload-dragger"
                    drag
                    :auto-upload="false"
                    :limit="1"
                    accept=".docx"
                    :on-change="onDocxChange"
                    :show-file-list="false"
                  >
                    <div class="upload-content">
                      <div class="upload-icon">📁</div>
                      <div class="upload-text">
                        <span v-if="!docxFileName">拖放 .docx 文件到此处，或 <em>点击上传</em></span>
                        <span v-else class="file-selected">已选择: {{ docxFileName }}</span>
                      </div>
                    </div>
                  </el-upload>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <el-button type="primary" size="large" :loading="submitting" :disabled="!docxFile" @click="onSubmitDocx">
                🚀 开始导入
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
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
        <el-button v-if="job.status === 'succeeded'" type="primary" size="small" @click="$router.push('/requirements/index')">
          → 继续索引需求
        </el-button>
      </div>

      <div v-if="job.result && Object.keys(job.result).length" class="result-section">
        <div class="result-title">执行结果</div>
        <pre class="result-content">{{ JSON.stringify(job.result, null, 2) }}</pre>
      </div>

      <el-alert v-if="job.error" type="error" :title="job.error.message" show-icon style="margin-top: 16px" />
    </el-card>

    <el-alert v-if="pollError" type="error" :title="pollError" show-icon style="margin-top: 16px" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { importConfluence, importRequirementsDocx, importRequirementsText } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const activeTab = ref<'confluence' | 'text' | 'docx'>('confluence')

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '运行中',
    succeeded: '已完成',
    failed: '已失败',
  }
  return map[job.value?.status || ''] || job.value?.status || ''
})

const confluenceForm = reactive({
  page_url: '',
  recursive: false,
  max_depth: 0,
  include_attachments: true,
})

const textForm = reactive({
  title: '',
  path: '',
  text: '',
})

const docxForm = reactive({
  title: '',
  path: '',
})

const docxFile = ref<File | null>(null)
const docxFileName = ref('')

const submitting = ref(false)
const { job, error: pollError, poll } = useJobPoller()
const app = useAppStore()

function onDocxChange(file: any) {
  const raw = file?.raw as File | undefined
  docxFile.value = raw || null
  docxFileName.value = raw?.name || ''
}

async function onSubmitConfluence() {
  submitting.value = true
  try {
    const { job_id } = await importConfluence(confluenceForm)
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}

async function onSubmitText() {
  submitting.value = true
  try {
    const { job_id } = await importRequirementsText({
      title: textForm.title,
      text: textForm.text,
      path: textForm.path || undefined,
    })
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}

async function onSubmitDocx() {
  if (!docxFile.value) return

  submitting.value = true
  try {
    const form = new FormData()
    form.append('file', docxFile.value)
    if (docxForm.title) form.append('title', docxForm.title)
    if (docxForm.path) form.append('path', docxForm.path)

    const { job_id } = await importRequirementsDocx(form)
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.import-page {
  max-width: 900px;
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

.import-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.import-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tab-label {
  font-size: 14px;
  font-weight: 600;
}

.tab-content {
  padding: 24px 0 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group--half {
  flex: 1;
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

.switch-with-desc {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-desc {
  font-size: 13px;
  color: #64748b;
}

.form-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.upload-area {
  width: 100%;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-content {
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
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
