<template>
  <div class="search-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">🎯 需求检索</h1>
      <p class="page-desc">基于向量相似度检索验收标准</p>
    </div>

    <!-- 检索表单 -->
    <el-card class="search-card">
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

    <!-- 结果列表 - 卡片式展示 -->
    <div class="result-section">
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
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import { searchRequirements } from '@/api/endpoints'
import type { RequirementsSearchItem } from '@/api/types'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const app = useAppStore()

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
  
  return md
    // 转义 HTML 特殊字符
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // ### 标题
    .replace(/^### (\d+)\. (.+)$/gm, '<h4 class="md-h4"><span class="md-num">$1</span> $2</h4>')
    // **粗体**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 换行
    .replace(/\n/g, '<br>')
}

function splitCsv(v: string): string[] | undefined {
  const xs = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return xs.length ? xs : undefined
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
</style>
