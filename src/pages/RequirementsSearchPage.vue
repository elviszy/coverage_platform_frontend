<template>
  <div class="search-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">🎯 需求检索</h1>
      <p class="page-desc">基于向量相似度检索验收标准，或使用智能问答获取需求信息</p>
    </div>

    <!-- 模式切换 -->
    <el-tabs v-model="activeTab" class="mode-tabs" @tab-change="onTabChange">
      <el-tab-pane label="📝 列表检索" name="search" />
      <el-tab-pane label="🤖 智能问答" name="chat" />
    </el-tabs>

    <!-- 检索表单 - 只在"列表检索"标签激活时显示 -->
    <el-card v-show="activeTab === 'search'" class="search-card">
      <div class="search-form">
        <div class="form-main">
          <div class="form-group">
            <label class="form-label">检索内容</label>
            <el-input
              v-model="form.query_text"
              placeholder="输入要检索的需求或验收标准描述..."
              size="large"
              clearable
            >
              <template #prefix>
                <span style="color: #94a3b8">🔍</span>
              </template>
            </el-input>
          </div>

          <div class="form-row">
            <div class="form-group form-group--small">
              <label class="form-label">返回数量</label>
              <el-input-number v-model="form.top_k" :min="1" :max="200" size="large" />
            </div>
            <div class="form-group form-group--flex">
              <label class="form-label">页面 ID 过滤</label>
              <el-input v-model="form.pageIdsRaw" placeholder="多个用逗号分隔" size="large" />
            </div>
            <div class="form-group form-group--flex">
              <label class="form-label">路径前缀</label>
              <el-input v-model="form.path_prefix" placeholder="例如：/产品/模块" size="large" />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <el-button type="primary" size="large" :loading="loading" @click="onSearch">
            🔍 开始检索
          </el-button>
          <el-button size="large" @click="useAsScope">
            🎯 作为评审范围
          </el-button>
          <el-button size="large" :disabled="selectedItems.length === 0" @click="useSelectedAsScope">
            ✅ 使用选中结果 ({{ selectedItems.length }})
          </el-button>
        </div>
      </div>

      <el-alert v-if="error" type="error" :title="error" show-icon style="margin-top: 16px" />
    </el-card>

    <!-- 智能问答组件 -->
    <el-card v-show="activeTab === 'chat'" class="chat-card">
      <div class="chat-container">
        <!-- 问答历史 -->
        <div class="chat-history" ref="chatHistoryRef">
          <div v-if="chatMessages.length === 0" class="chat-empty">
            <div class="empty-icon">🤖</div>
            <p>输入问题，智能体将基于需求知识库回答</p>
            <p class="empty-hint">例如：“订单取消的验收标准是什么？”</p>
          </div>
          
          <div v-for="(msg, index) in chatMessages" :key="index" :class="['chat-message', `chat-${msg.role}`]">
            <div class="message-avatar">
              {{ msg.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="message-content">
              <div class="message-text" v-html="msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content"></div>
              <!-- 来源引用 - 按页面去重 -->
              <div v-if="msg.sources && msg.sources.length > 0" class="message-sources">
                <div class="sources-header">📚 引用来源</div>
                <div v-for="(src, i) in deduplicateSources(msg.sources)" :key="i" class="source-item">
                  <span class="source-path">{{ src.path }}</span>
                  <span class="source-score">{{ (src.score * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 加载中 -->
          <div v-if="chatLoading" class="chat-message chat-assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 输入区 -->
        <div class="chat-input-area">
          <el-input
            v-model="chatQuery"
            placeholder="输入您的问题..."
            size="large"
            :disabled="chatLoading"
            @keyup.enter="onChatSubmit"
          >
            <template #prefix>
              <span>💬</span>
            </template>
          </el-input>
          <el-button type="primary" size="large" :loading="chatLoading" :disabled="!chatQuery.trim()" @click="onChatSubmit">
            发送
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 结果列表 - 卡片式展示 -->
    <div v-show="activeTab === 'search'" class="result-section">
      <div class="result-header">
        <div class="result-title">
          <span class="result-icon">📝</span>
          <span>检索结果</span>
          <span v-if="items.length" class="result-count">{{ items.length }} 条</span>
        </div>
      </div>

      <div v-loading="loading" class="result-cards">
        <!-- 空状态 -->
        <div v-if="!loading && items.length === 0" class="empty-state">
          <div class="empty-icon">🎯</div>
          <p class="empty-text">输入关键词开始检索验收标准</p>
        </div>

        <!-- 卡片列表 -->
        <div
          v-for="(item, index) in items"
          :key="item.criterion.criterion_id"
          class="result-card"
          :class="{ 'result-card--selected': isSelected(item) }"
          @click="toggleSelect(item)"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="card-path">
              <span class="card-index">#{{ index + 1 }}</span>
              <span class="path-text">{{ item.criterion.path || '未分类' }}</span>
            </div>
            <div class="card-score" :class="getScoreClass(item.score)">
              {{ (item.score * 100).toFixed(1) }}%
            </div>
          </div>

          <!-- 表格标题 -->
          <div v-if="item.criterion.table_title" class="card-table-title">
            📋 {{ item.criterion.table_title }}
          </div>

          <!-- 需求点/功能点（Markdown 渲染） -->
          <div v-if="item.criterion.feature_points" class="feature-points">
            <div class="feature-points-header">
              <span class="feature-icon">✨</span>
              <span>需求点/功能点</span>
            </div>
            <div class="markdown-content" v-html="renderMarkdown(item.criterion.feature_points)"></div>
          </div>

          <!-- 结构化数据展示（无功能点时显示） -->
          <div v-else class="card-content">
            <template v-if="item.criterion.row && Object.keys(item.criterion.row).length > 0">
              <div
                v-for="(value, key) in item.criterion.row"
                :key="key"
                class="data-row"
              >
                <span class="data-label">{{ key }}</span>
                <span class="data-value">{{ value || '-' }}</span>
              </div>
            </template>
            <template v-else>
              <div class="data-text">{{ truncate(item.criterion.normalized_text, 300) }}</div>
            </template>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <el-checkbox :model-value="isSelected(item)" @click.stop>选择</el-checkbox>
            <div class="card-actions">
              <el-button link type="primary" size="small" @click.stop="copyText(item.criterion.criterion_id)">
                复制 ID
              </el-button>
              <el-button v-if="item.criterion.page_url" link type="success" size="small" @click.stop="openUrl(item.criterion.page_url)">
                打开页面
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import { searchRequirements } from '@/api/endpoints'
import type { RequirementsSearchItem } from '@/api/types'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const app = useAppStore()

// Tab 切换
const activeTab = ref('search')

// 检索表单
const form = reactive({
  query_text: '',
  top_k: 20,
  pageIdsRaw: '',
  path_prefix: '',
})

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<RequirementsSearchItem[]>([])
const selectedIds = ref<Set<string>>(new Set())

// 计算选中的项目
const selectedItems = computed(() => {
  return items.value.filter(item => selectedIds.value.has(item.criterion.criterion_id))
})

function truncate(text: string, len: number) {
  if (!text) return '-'
  return text.length > len ? text.slice(0, len) + '...' : text
}

// 判断是否选中
function isSelected(item: RequirementsSearchItem): boolean {
  return selectedIds.value.has(item.criterion.criterion_id)
}

// 切换选中状态
function toggleSelect(item: RequirementsSearchItem) {
  const id = item.criterion.criterion_id
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  // 触发响应式更新
  selectedIds.value = new Set(selectedIds.value)
}

// 根据相似度分数返回样式类
function getScoreClass(score: number): string {
  const pct = score * 100
  if (pct >= 85) return 'score-high'
  if (pct >= 70) return 'score-medium'
  return 'score-low'
}

async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // fallback
  }
}

function openUrl(url: string) {
  if (!url) return
  window.open(url, '_blank')
}

// 简单的 Markdown 渲染函数
function renderMarkdown(md: string): string {
  if (!md) return ''
  
  // 先处理特殊情况：保留代码块中的内容
  const codeBlocks: string[] = []
  let processed = md.replace(/`([^`]+)`/g, (_, code) => {
    codeBlocks.push(code)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })
  
  // HTML 转义（但保留 > 用于 blockquote）
  processed = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
  
  // Markdown 渲染
  processed = processed
    // ### 标题
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    // ## 标题
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    // **粗体**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // > 引用块
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // - 列表项
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // 将连续的 <li> 包装成 <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="md-list">$&</ul>')
    // 换行
    .replace(/\n/g, '<br>')
    // 清理多余的 <br> 在 block 元素后
    .replace(/<\/h[23]><br>/g, '</h$1>')
    .replace(/<\/blockquote><br>/g, '</blockquote>')
    .replace(/<\/ul><br>/g, '</ul>')
  
  // 恢复代码块
  codeBlocks.forEach((code, i) => {
    processed = processed.replace(`__CODE_BLOCK_${i}__`, `<code>${code.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code>`)
  })
  
  return `<div class="markdown-content">${processed}</div>`
}

function splitCsv(v: string): string[] | undefined {
  const xs = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return xs.length ? xs : undefined
}

// 对引用来源按页面路径去重，每个页面只保留得分最高的一条
function deduplicateSources(sources: ChatMessage['sources']): ChatMessage['sources'] {
  if (!sources || sources.length === 0) return sources
  
  // 按 path 分组，保留每组中 score 最高的
  const pathMap = new Map<string, typeof sources[0]>()
  
  for (const src of sources) {
    const existing = pathMap.get(src.path)
    if (!existing || src.score > existing.score) {
      pathMap.set(src.path, src)
    }
  }
  
  // 按 score 降序排列返回
  return Array.from(pathMap.values()).sort((a, b) => b.score - a.score)
}

async function onSearch() {
  // 清空选择
  selectedIds.value = new Set()
  
  loading.value = true
  error.value = null
  try {
    const payload: any = {
      query_text: form.query_text,
      top_k: form.top_k,
      filters: {
        page_ids: splitCsv(form.pageIdsRaw),
        path_prefix: form.path_prefix || undefined,
        only_active: true,
      },
    }

    const data = await searchRequirements(payload)
    items.value = data.items || []
  } catch (e: any) {
    error.value = e?.message || '检索失败'
  } finally {
    loading.value = false
  }
}

function useAsScope() {
  app.setReviewDraft({
    requirements_scope: {
      page_ids: splitCsv(form.pageIdsRaw),
      path_prefix: form.path_prefix || undefined,
    },
  })
  router.push('/reviews/create')
}

function useSelectedAsScope() {
  const pageIds = Array.from(
    new Set(
      selectedItems.value
        .map((r) => r?.criterion?.page_id)
        .filter((x) => typeof x === 'string' && x.length > 0),
    ),
  )

  app.setReviewDraft({
    requirements_scope: {
      page_ids: pageIds.length ? pageIds : undefined,
      path_prefix: form.path_prefix || undefined,
    },
  })
  router.push('/reviews/create')
}

// ==================== 智能问答 ====================

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: { path: string; table_title?: string; score: number }[]
}

const chatQuery = ref('')
const chatMessages = ref<ChatMessage[]>([])
const chatLoading = ref(false)
const chatHistoryRef = ref<HTMLElement | null>(null)

function onTabChange(tab: string) {
  // 切换时可以做一些清理
}

async function onChatSubmit() {
  if (!chatQuery.value.trim() || chatLoading.value) return
  
  const query = chatQuery.value.trim()
  chatQuery.value = ''
  
  // 添加用户消息
  chatMessages.value.push({
    role: 'user',
    content: query,
  })
  
  // 滚动到底部
  scrollToBottom()
  
  chatLoading.value = true
  
  try {
    // 使用 SSE 流式接口
    const API_BASE_URL = '/api/v1'
    const response = await fetch(`${API_BASE_URL}/requirements/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        top_k: 10,
      }),
    })
    
    if (!response.ok) {
      throw new Error('请求失败')
    }
    
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }
    
    const decoder = new TextDecoder()
    let buffer = ''
    let fullAnswer = ''
    let sources: ChatMessage['sources'] = []
    
    // 添加助手消息占位
    chatMessages.value.push({
      role: 'assistant',
      content: '',
    })
    const msgIndex = chatMessages.value.length - 1
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      
      // 兼容 CRLF 和 LF：将 \r\n 统一转换为 \n
      buffer = buffer.replace(/\r\n/g, '\n')
      
      // 解析 SSE 事件
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      
      for (const eventStr of events) {
        if (!eventStr.trim()) continue
        
        const lines = eventStr.split('\n')
        let eventType = 'message'
        let eventData = ''
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim()
          }
        }
        
        if (eventData) {
          try {
            const data = JSON.parse(eventData)
            
            if (eventType === 'message') {
              // 收到首个消息时，关闭加载状态以显示内容
              if (chatLoading.value) {
                chatLoading.value = false
              }
              fullAnswer += data.content || ''
              // 使用 splice 替换确保 Vue 响应式触发
              chatMessages.value.splice(msgIndex, 1, {
                ...chatMessages.value[msgIndex],
                content: fullAnswer,
              })
              scrollToBottom()
            } else if (eventType === 'complete') {
              fullAnswer = data.answer || fullAnswer
              sources = data.sources || []
              // 使用 splice 替换确保 Vue 响应式触发
              chatMessages.value.splice(msgIndex, 1, {
                ...chatMessages.value[msgIndex],
                content: fullAnswer,
                sources: sources,
              })
            }
          } catch (e) {
            console.warn('SSE 解析失败:', eventData)
          }
        }
      }
    }
    
  } catch (e: any) {
    chatMessages.value.push({
      role: 'assistant',
      content: `抱歉，发生错误：${e.message || '未知错误'}`,
    })
  } finally {
    chatLoading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.search-page {
  max-width: 1400px;
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

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group--small {
  width: 140px;
  flex-shrink: 0;
}

.form-group--flex {
  flex: 1;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

/* 结果区域 */
.result-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.result-icon {
  font-size: 20px;
}

.result-count {
  font-size: 13px;
  font-weight: 500;
  color: #6366f1;
  background: #e0e7ff;
  padding: 2px 10px;
  border-radius: 12px;
}

/* 卡片容器 */
.result-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 200px;
}

/* 单个卡片 */
.result-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.result-card--selected {
  border-color: #6366f1;
  background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-path {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-index {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

.path-text {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

/* 相似度分数 */
.card-score {
  font-size: 14px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}

.card-score.score-high {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
}

.card-score.score-medium {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
}

.card-score.score-low {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

/* 表格标题 */
.card-table-title {
  font-size: 13px;
  color: #6366f1;
  font-weight: 600;
  margin-bottom: 12px;
  padding: 6px 10px;
  background: #eef2ff;
  border-radius: 6px;
  display: inline-block;
}

/* 卡片内容 */
.card-content {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

/* 数据行（键值对） */
.data-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.data-row:last-child {
  border-bottom: none;
}

.data-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  min-width: 120px;
  flex-shrink: 0;
}

.data-value {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.5;
  flex: 1;
}

/* 纯文本展示 */
.data-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.card-actions {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

/* 功能点样式 */
.feature-points {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fcd34d 100%);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.feature-points-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 12px;
}

.feature-icon {
  font-size: 16px;
}

/* Markdown 内容样式 */
.markdown-content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

.markdown-content :deep(ul) {
  list-style-type: none;
  padding-left: 0;
  margin: 0;
}

.markdown-content :deep(ul ul) {
  padding-left: 20px;
  margin-top: 4px;
}

.markdown-content :deep(li) {
  margin-bottom: 6px;
  position: relative;
}

/* 第一层级：模块 */
.markdown-content :deep(> ul > li) {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}

.markdown-content :deep(> ul > li:last-child) {
  border-bottom: none;
  margin-bottom: 0;
}

/* 强调文字样式 */
.markdown-content :deep(strong) {
  color: #0369a1;
  font-weight: 600;
  margin-right: 4px;
}

/* 引用样式（用于原文） */
.markdown-content :deep(blockquote), .markdown-content :deep(em) {
  display: block;
  font-style: normal;
  color: #64748b;
  font-size: 12px;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  border-left: 2px solid #cbd5e1;
}

/* ==================== 智能问答样式 ==================== */

.mode-tabs {
  margin-bottom: 20px;
}

.chat-card {
  margin-bottom: 20px;
  /* 覆盖 Element Plus 默认白色背景 */
  --el-card-bg-color: transparent !important;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%) !important;
  border: 1px solid rgba(99, 102, 241, 0.2) !important;
  backdrop-filter: blur(8px);
}

.chat-card :deep(.el-card__body) {
  background: transparent !important;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  /* 深色渐变背景，与平台整体风格一致 */
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
}

.chat-empty {
  text-align: center;
  padding: 60px 20px;
  color: rgba(148, 163, 184, 0.9);
}

.chat-empty .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  filter: brightness(0.8);
}

.chat-empty .empty-hint {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.6);
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.chat-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.chat-user .message-avatar {
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  border: 1px solid rgba(129, 140, 248, 0.5);
}

.message-content {
  max-width: 80%;
  /* AI 回复使用半透明深色背景 */
  background: rgba(51, 65, 85, 0.8);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.15);
  color: #e2e8f0;
}

.chat-user .message-content {
  /* 用户消息使用渐变紫色 */
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  color: #fff;
  border: 1px solid rgba(129, 140, 248, 0.3);
}

.message-text {
  line-height: 1.6;
  font-size: 14px;
}

/* 智能问答区域的 Markdown 深色主题样式 */
.chat-assistant .message-text .markdown-content {
  background: transparent !important;
  color: #e2e8f0 !important;
  padding: 0 !important;
}

.chat-assistant .message-text .markdown-content :deep(h3) {
  color: #a5b4fc !important;
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.chat-assistant .message-text .markdown-content :deep(ul) {
  padding-left: 0;
  margin: 8px 0;
}

.chat-assistant .message-text .markdown-content :deep(li) {
  color: #cbd5e1;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
  border-left: 3px solid rgba(99, 102, 241, 0.5);
}

.chat-assistant .message-text .markdown-content :deep(strong) {
  color: #818cf8 !important;
}

.chat-assistant .message-text .markdown-content :deep(code) {
  background: rgba(99, 102, 241, 0.15) !important;
  color: #a5b4fc !important;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.chat-assistant .message-text .markdown-content :deep(blockquote),
.chat-assistant .message-text .markdown-content :deep(em) {
  background: rgba(15, 23, 42, 0.6) !important;
  color: #94a3b8 !important;
  border-left-color: rgba(99, 102, 241, 0.4) !important;
}

.chat-assistant .message-text .markdown-content :deep(> ul > li) {
  border-bottom-color: rgba(99, 102, 241, 0.2);
}

.message-sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(99, 102, 241, 0.2);
}

.sources-header {
  font-size: 12px;
  font-weight: 600;
  color: rgba(148, 163, 184, 0.9);
  margin-bottom: 8px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 10px;
  /* 来源卡片使用深色背景 */
  background: rgba(15, 23, 42, 0.6);
  border-radius: 6px;
  margin-bottom: 4px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.source-path {
  color: rgba(203, 213, 225, 0.9);
  flex: 1;
}

.source-table {
  color: #a5b4fc;
  font-weight: 500;
}

.source-score {
  color: #4ade80;
  font-weight: 600;
  background: rgba(34, 197, 94, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.chat-input-area {
  display: flex;
  gap: 12px;
}

.chat-input-area .el-input {
  flex: 1;
}

/* 加载动画 */
.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
