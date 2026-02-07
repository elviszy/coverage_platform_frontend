<template>
  <div class="analyze-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">📊 公共测试覆盖度分析</h1>
      <p class="page-desc">选择测试用例来源，与公共测试标准进行覆盖度分析</p>
    </div>

    <!-- 分析配置 -->
    <el-card class="config-card">
      <div class="config-section">
        <h3 class="section-title">📁 选择测试用例来源</h3>
        <el-select
          v-model="form.xmind_source_id"
          placeholder="选择已导入的 XMind 文件"
          size="large"
          style="width: 100%"
          :loading="loadingXmindSources"
        >
          <el-option
            v-for="source in xmindSources"
            :key="source.source_id"
            :label="source.file_name"
            :value="source.source_id"
          >
            <span>{{ source.file_name }}</span>
            <span style="color: #999; font-size: 12px; margin-left: 8px">
              {{ formatDate(source.imported_at) }}
            </span>
          </el-option>
        </el-select>
      </div>

      <el-divider />

      <div class="config-section">
        <h3 class="section-title">📄 关联需求文档（可选）</h3>
        <p class="section-desc">关联需求文档可增强匹配准确度，提供更好的上下文</p>
        <el-select
          v-model="form.requirements_page_ids"
          multiple
          filterable
          placeholder="选择已导入的需求页面"
          size="large"
          style="width: 100%"
          :loading="loadingRequirements"
        >
          <el-option
            v-for="page in requirementsPages"
            :key="page.page_id"
            :label="page.title"
            :value="page.page_id"
          />
        </el-select>
      </div>

      <el-divider />

      <div class="config-section">
        <h3 class="section-title">⚙️ 分析配置</h3>
        <el-form :model="form.config" label-width="160px">
          <el-form-item label="覆盖阈值">
            <el-slider v-model="form.config.threshold_cover" :min="0.5" :max="1" :step="0.05" show-stops />
            <span class="slider-value">{{ form.config.threshold_cover }}</span>
          </el-form-item>
          <el-form-item label="部分覆盖阈值">
            <el-slider v-model="form.config.threshold_partial" :min="0.4" :max="0.9" :step="0.05" show-stops />
            <span class="slider-value">{{ form.config.threshold_partial }}</span>
          </el-form-item>
          <el-form-item label="动态阈值">
            <el-switch v-model="form.config.enable_dynamic_threshold" />
            <span class="form-hint">根据测试点文本长度自动调整阈值</span>
          </el-form-item>
          <el-form-item label="综合分数权重">
            <div class="weight-config">
              <span>Embedding: {{ form.config.embedding_weight }}</span>
              <el-slider
                v-model="form.config.embedding_weight"
                :min="0.5"
                :max="1"
                :step="0.1"
                style="width: 200px"
                @change="(val:number) => (form.config.keyword_weight = +(1 - val).toFixed(1))"
              />
              <span>关键词: {{ form.config.keyword_weight }}</span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="form-actions">
        <el-checkbox v-model="useStreamMode" style="margin-right: 16px">
          🌊 流式分析模式（实时显示智能体进度）
        </el-checkbox>
        <el-button type="primary" size="large" :loading="analyzing" :disabled="!form.xmind_source_id" @click="onAnalyze">
          🚀 开始分析
        </el-button>
      </div>
    </el-card>

    <!-- 分析进度 -->
    <el-card v-if="currentRun" class="progress-card">
      <div class="progress-header">
        <span class="progress-title">⚡ 分析进度</span>
        <el-tag :type="statusTagType">{{ statusText }}</el-tag>
      </div>
      <el-progress :percentage="progressPercent" :status="progressStatus" />
      
      <!-- 流式消息列表 -->
      <div v-if="streamMessages.length > 0" class="stream-messages">
        <div class="messages-header">
          <span>🤖 智能体消息</span>
          <el-button text size="small" @click="streamMessages = []">清空</el-button>
        </div>
        <div class="messages-list" ref="messagesListRef">
          <div 
            v-for="(msg, index) in streamMessages" 
            :key="index" 
            :class="['message-item', `message-${msg.event}`]"
          >
            <span class="message-time">{{ formatTime(msg.time) }}</span>
            <span class="message-content">{{ msg.message }}</span>
          </div>
        </div>
      </div>
      
      <div class="progress-actions" v-if="currentRun.status === 'completed'">
        <el-button type="primary" @click="viewResult">
          查看详细结果 →
        </el-button>
      </div>
    </el-card>

    <!-- 历史记录 -->
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <span>📜 分析历史</span>
          <el-button text @click="loadHistory">刷新</el-button>
        </div>
      </template>
      <el-table :data="history" v-loading="loadingHistory" stripe>
        <el-table-column label="XMind 来源" prop="xmind_source_name" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="覆盖率" width="100">
          <template #default="{ row }">
            <span v-if="row.coverage_rate != null" :class="getCoverageClass(row.coverage_rate)">
              {{ row.coverage_rate.toFixed(1) }}%
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="测试点数" prop="total_criteria" width="100" />
        <el-table-column label="分析时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed'"
              type="primary"
              size="small"
              text
              @click="$router.push(`/coverage/${row.run_id}`)"
            >
              查看结果
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { startCoverageAnalysis, getCoverageResult, listCoverageRuns, startStreamingAnalysis } from '@/api/endpoints'
import { http } from '@/api/http'

const router = useRouter()

// 表单
const form = reactive({
  xmind_source_id: '',
  requirements_page_ids: [] as string[],
  config: {
    threshold_cover: 0.8,
    threshold_partial: 0.65,
    enable_dynamic_threshold: true,
    embedding_weight: 0.7,
    keyword_weight: 0.3,
  },
})

// 数据源
const xmindSources = ref<any[]>([])
const loadingXmindSources = ref(false)
const requirementsPages = ref<any[]>([])
const loadingRequirements = ref(false)

// 分析状态
const analyzing = ref(false)
const currentRun = ref<any>(null)
const pollingTimer = ref<number | null>(null)
const useStreamMode = ref(true) // 默认使用流式模式
const streamMessages = ref<{ event: string; message: string; time: Date }[]>([])
const streamController = ref<{ close: () => void } | null>(null)
const messagesListRef = ref<HTMLElement | null>(null)

// 历史记录
const history = ref<any[]>([])
const loadingHistory = ref(false)

// 计算属性
const statusText = computed(() => {
  if (!currentRun.value) return ''
  const map: Record<string, string> = {
    pending: '等待中',
    running: '分析中',
    completed: '已完成',
    failed: '失败',
  }
  return map[currentRun.value.status] || currentRun.value.status
})

const statusTagType = computed(() => {
  if (!currentRun.value) return 'info'
  const map: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[currentRun.value.status] || 'info'
})

const progressPercent = computed(() => {
  if (!currentRun.value) return 0
  if (currentRun.value.status === 'completed') return 100
  if (currentRun.value.status === 'running') return 50
  return 0
})

const progressStatus = computed(() => {
  if (!currentRun.value) return undefined
  if (currentRun.value.status === 'completed') return 'success'
  if (currentRun.value.status === 'failed') return 'exception'
  return undefined
})

// 加载 XMind 来源
async function loadXmindSources() {
  loadingXmindSources.value = true
  try {
    const resp = await http.get('/tests/sources')
    xmindSources.value = resp.data.items || resp.data
  } catch (e) {
    // 静默失败
  } finally {
    loadingXmindSources.value = false
  }
}

// 加载需求页面
async function loadRequirementsPages() {
  loadingRequirements.value = true
  try {
    const resp = await http.get('/requirements/pages')
    requirementsPages.value = resp.data.items || resp.data
  } catch (e) {
    // 静默失败
  } finally {
    loadingRequirements.value = false
  }
}

// 加载历史记录
async function loadHistory() {
  loadingHistory.value = true
  try {
    const res = await listCoverageRuns({ limit: 20 })
    history.value = res.items
  } catch (e) {
    // 静默失败
  } finally {
    loadingHistory.value = false
  }
}

// 开始分析
async function onAnalyze() {
  analyzing.value = true
  streamMessages.value = []
  
  if (useStreamMode.value) {
    // 流式分析模式
    await onStreamAnalyze()
  } else {
    // 传统轮询模式
    await onPollingAnalyze()
  }
}

// 流式分析
async function onStreamAnalyze() {
  currentRun.value = { run_id: '', status: 'running' }
  
  try {
    streamController.value = startStreamingAnalysis(
      {
        xmind_source_id: form.xmind_source_id,
        requirements_page_ids: form.requirements_page_ids.length ? form.requirements_page_ids : undefined,
        config: form.config,
      },
      {
        onStart: (data) => {
          currentRun.value = { run_id: data.run_id, status: 'running' }
          addStreamMessage('start', data.message || '开始分析...')
        },
        onProgress: (data) => {
          if (data.progress) {
            currentRun.value = { ...currentRun.value, progress: data.progress }
          }
          addStreamMessage('progress', data.message || `进度: ${data.progress}%`)
        },
        onMessage: (data) => {
          addStreamMessage('message', data.message || data.source || '...')
        },
        onComplete: (data) => {
          currentRun.value = { run_id: data.run_id, status: 'completed', summary: data.summary }
          addStreamMessage('complete', '✅ 分析完成')
          ElMessage.success('分析完成！')
          loadHistory()
          analyzing.value = false
        },
        onError: (error) => {
          currentRun.value = { ...currentRun.value, status: 'failed' }
          addStreamMessage('error', `❌ ${error}`)
          ElMessage.error('分析失败: ' + error)
          analyzing.value = false
        },
      }
    )
  } catch (e: any) {
    ElMessage.error('分析失败: ' + (e.message || e))
    analyzing.value = false
  }
}

// 添加流式消息
function addStreamMessage(event: string, message: string) {
  streamMessages.value.push({ event, message, time: new Date() })
  // 自动滚动到底部
  setTimeout(() => {
    if (messagesListRef.value) {
      messagesListRef.value.scrollTop = messagesListRef.value.scrollHeight
    }
  }, 50)
}

// 格式化时间
function formatTime(date: Date) {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// 传统轮询分析
async function onPollingAnalyze() {
  try {
    const res = await startCoverageAnalysis({
      xmind_source_id: form.xmind_source_id,
      requirements_page_ids: form.requirements_page_ids.length ? form.requirements_page_ids : undefined,
      config: form.config,
    })

    currentRun.value = { run_id: res.run_id, status: res.status }
    ElMessage.success('分析任务已创建')

    // 开始轮询状态
    startPolling(res.run_id)
  } catch (e: any) {
    ElMessage.error('分析失败: ' + (e.response?.data?.detail || e.message || e))
  } finally {
    analyzing.value = false
  }
}

// 轮询状态
function startPolling(runId: string) {
  if (pollingTimer.value) clearInterval(pollingTimer.value)

  pollingTimer.value = window.setInterval(async () => {
    try {
      const res = await getCoverageResult(runId)
      currentRun.value = res

      if (res.status === 'completed' || res.status === 'failed') {
        if (pollingTimer.value) clearInterval(pollingTimer.value)
        pollingTimer.value = null
        loadHistory()
      }
    } catch (e) {
      // 静默失败
    }
  }, 2000)
}

// 查看结果
function viewResult() {
  if (currentRun.value?.run_id) {
    router.push(`/coverage/${currentRun.value.run_id}`)
  }
}

// 工具函数
function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[status] || 'info'
}

function getCoverageClass(rate: number) {
  if (rate >= 80) return 'coverage-high'
  if (rate >= 60) return 'coverage-medium'
  return 'coverage-low'
}

// 初始化
onMounted(() => {
  loadXmindSources()
  loadRequirementsPages()
  loadHistory()
})
</script>

<style scoped>
.analyze-page {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.page-desc {
  color: #666;
  margin: 0;
}

.config-card {
  margin-bottom: 24px;
}

.config-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px 0;
}

.section-desc {
  font-size: 13px;
  color: #888;
  margin: 0 0 12px 0;
}

.slider-value {
  margin-left: 12px;
  color: #409eff;
  font-weight: 500;
}

.weight-config {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #888;
}

.form-actions {
  text-align: center;
  margin-top: 24px;
}

.progress-card {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-title {
  font-weight: 500;
}

.progress-actions {
  margin-top: 16px;
  text-align: center;
}

.history-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coverage-high {
  color: #67c23a;
  font-weight: 600;
}

.coverage-medium {
  color: #e6a23c;
  font-weight: 600;
}

.coverage-low {
  color: #f56c6c;
  font-weight: 600;
}

/* 流式消息列表样式 */
.stream-messages {
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
}

.messages-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.message-item {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.2s;
}

.message-item:hover {
  background: #f0f0f0;
}

.message-time {
  color: #999;
  font-size: 11px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  word-break: break-word;
}

.message-start {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.message-progress {
  background: #fffbe6;
  border-left: 3px solid #faad14;
}

.message-complete {
  background: #f6ffed;
  border-left: 3px solid #52c41a;
}

.message-error {
  background: #fff1f0;
  border-left: 3px solid #f5222d;
}
</style>
