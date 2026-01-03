<template>
  <div class="search-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">🔎 用例检索</h1>
      <p class="page-desc">基于向量相似度检索测试场景</p>
    </div>

    <!-- 检索表单 -->
    <el-card class="search-card">
      <div class="search-form">
        <div class="form-main">
          <div class="form-group">
            <label class="form-label">检索内容</label>
            <el-input
              v-model="form.query_text"
              placeholder="输入要检索的测试场景、步骤或预期结果..."
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
              <label class="form-label">来源过滤</label>
              <el-input v-model="form.sourceIdsRaw" placeholder="source_id，多个用逗号分隔" size="large" />
            </div>
            <div class="form-group form-group--flex">
              <label class="form-label">路径前缀</label>
              <el-input v-model="form.path_prefix" placeholder="例如：根节点/子模块" size="large" />
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
          <el-button size="large" :disabled="selectedRows.length === 0" @click="useSelectedAsScope">
            ✅ 使用选中结果
          </el-button>
        </div>
      </div>

      <el-alert v-if="error" type="error" :title="error" show-icon style="margin-top: 16px" />
    </el-card>

    <!-- 结果列表 -->
    <el-card class="result-card">
      <div class="result-header">
        <div class="result-title">
          <span class="result-icon">📋</span>
          <span>检索结果</span>
          <span v-if="items.length" class="result-count">{{ items.length }} 条</span>
        </div>
        <div v-if="selectedRows.length" class="selection-info">
          已选择 {{ selectedRows.length }} 条
        </div>
      </div>

      <el-table
        :data="items"
        style="width: 100%"
        v-loading="loading"
        @selection-change="onSelectionChange"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="相似度" width="100">
          <template #default="scope">
            <span class="score-badge">{{ (scope.row.score * 100).toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="场景标题" min-width="200">
          <template #default="scope">
            <div class="cell-title">{{ scope.row.scenario.title || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="路径" min-width="180">
          <template #default="scope">
            <span class="cell-path">{{ scope.row.scenario.path || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上下文" min-width="300">
          <template #default="scope">
            <div class="cell-context">{{ truncate(scope.row.scenario.context_text, 100) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="copyText(scope.row.scenario.scenario_id)">
              复制 ID
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!loading && items.length === 0" class="empty-state">
        <div class="empty-icon">🔎</div>
        <p class="empty-text">输入关键词开始检索测试用例</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { searchTests } from '@/api/endpoints'
import type { TestsSearchItem } from '@/api/types'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const app = useAppStore()

const form = reactive({
  query_text: '',
  top_k: 20,
  sourceIdsRaw: '',
  path_prefix: '',
})

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<TestsSearchItem[]>([])
const selectedRows = ref<TestsSearchItem[]>([])

function truncate(text: string, len: number) {
  if (!text) return '-'
  return text.length > len ? text.slice(0, len) + '...' : text
}

function tableRowClassName({ rowIndex }: { rowIndex: number }) {
  return rowIndex % 2 === 0 ? '' : 'stripe-row'
}

async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // fallback
  }
}

function splitCsv(v: string): string[] | undefined {
  const xs = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return xs.length ? xs : undefined
}

async function onSearch() {
  // 必填项验证
  if (!form.query_text.trim()) {
    error.value = '请输入检索内容'
    return
  }
  
  loading.value = true
  error.value = null
  try {
    const payload: any = {
      query_text: form.query_text,
      top_k: form.top_k,
      filters: {
        source_ids: splitCsv(form.sourceIdsRaw),
        path_prefix: form.path_prefix || undefined,
      },
    }

    const data = await searchTests(payload)
    items.value = data.items || []
  } catch (e: any) {
    error.value = e?.message || '检索失败'
  } finally {
    loading.value = false
  }
}

function useAsScope() {
  app.setReviewDraft({
    tests_scope: {
      source_ids: splitCsv(form.sourceIdsRaw),
      path_prefix: form.path_prefix || undefined,
    },
  })
  router.push('/reviews/create')
}

function onSelectionChange(rows: TestsSearchItem[]) {
  selectedRows.value = rows
}

function useSelectedAsScope() {
  const sourceIds = Array.from(
    new Set(
      selectedRows.value
        .map((r) => r?.scenario?.source_id)
        .filter((x) => typeof x === 'string' && x.length > 0),
    ),
  )

  app.setReviewDraft({
    tests_scope: {
      source_ids: sourceIds.length ? sourceIds : undefined,
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

.result-card {
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.selection-info {
  font-size: 13px;
  color: #22c55e;
  font-weight: 600;
}

.score-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4f46e5;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.cell-title {
  font-weight: 600;
  color: #0f172a;
}

.cell-path {
  font-size: 12px;
  color: #64748b;
}

.cell-context {
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
}

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
</style>
