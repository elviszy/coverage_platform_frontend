<template>
  <div class="result-page">
    <!-- 页面头 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.back()">← 返回</el-button>
        <h1 class="page-title">📊 覆盖度分析结果</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="downloadReport">📥 导出报告</el-button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 结果内容 -->
    <template v-else-if="result">
      <!-- 概览卡片 -->
      <el-row :gutter="16" class="overview-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-value" :class="getCoverageClass(result.summary?.coverage_rate || 0)">
              {{ (result.summary?.coverage_rate || 0).toFixed(1) }}%
            </div>
            <div class="stat-label">总覆盖率</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-covered">
            <div class="stat-value">{{ result.summary?.covered || 0 }}</div>
            <div class="stat-label">✅ 已覆盖</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-partial">
            <div class="stat-value">{{ result.summary?.partial || 0 }}</div>
            <div class="stat-label">⚠️ 部分覆盖</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-missed">
            <div class="stat-value">{{ result.summary?.missed || 0 }}</div>
            <div class="stat-label">❌ 未覆盖</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 基本信息 -->
      <el-card class="info-card">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="XMind 来源">{{ result.xmind_source_name }}</el-descriptions-item>
          <el-descriptions-item label="分析状态">
            <el-tag :type="getStatusType(result.status)">{{ result.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="公共测试点总数">{{ result.summary?.total_criteria || 0 }}</el-descriptions-item>
          <el-descriptions-item label="关联需求数">{{ result.summary?.requirements_linked || 0 }}</el-descriptions-item>
          <el-descriptions-item label="分析时间">{{ formatDate(result.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ formatDate(result.finished_at) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 按类型统计 -->
      <el-card class="category-card" v-if="result.summary?.by_category?.length">
        <template #header>
          <span>📈 按类型分组统计</span>
        </template>
        <el-table :data="result.summary.by_category" stripe>
          <el-table-column prop="category" label="类型" width="150">
            <template #default="{ row }">
              <el-tag>{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="total" label="总数" width="80" align="center" />
          <el-table-column prop="covered" label="已覆盖" width="80" align="center">
            <template #default="{ row }">
              <span class="text-success">{{ row.covered }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="partial" label="部分" width="80" align="center">
            <template #default="{ row }">
              <span class="text-warning">{{ row.partial }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="missed" label="未覆盖" width="80" align="center">
            <template #default="{ row }">
              <span class="text-danger">{{ row.missed }}</span>
            </template>
          </el-table-column>
          <el-table-column label="覆盖率" width="200">
            <template #default="{ row }">
              <el-progress
                :percentage="row.coverage_rate"
                :color="getProgressColor(row.coverage_rate)"
                :stroke-width="12"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 详细结果 Tabs -->
      <el-card class="detail-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="`❌ 未覆盖 (${result.missed_items?.length || 0})`" name="missed">
            <el-table :data="result.missed_items" stripe>
              <el-table-column prop="category" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="test_point" label="测试点" min-width="200" />
              <el-table-column prop="test_content" label="测试内容" min-width="250" show-overflow-tooltip />
              <el-table-column prop="best_score" label="最高分" width="80" align="center">
                <template #default="{ row }">
                  {{ (row.best_score * 100).toFixed(0) }}%
                </template>
              </el-table-column>
              <el-table-column label="匹配关键词" width="150">
                <template #default="{ row }">
                  <span class="keywords">{{ (row.matched_keywords || []).join(', ') || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="`⚠️ 部分覆盖 (${result.partial_items?.length || 0})`" name="partial">
            <el-table :data="result.partial_items" stripe>
              <el-table-column prop="category" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="test_point" label="测试点" min-width="200" />
              <el-table-column prop="best_score" label="匹配分" width="80" align="center">
                <template #default="{ row }">
                  {{ (row.best_score * 100).toFixed(0) }}%
                </template>
              </el-table-column>
              <el-table-column label="匹配场景" min-width="250">
                <template #default="{ row }">
                  <div v-for="s in (row.matched_scenarios || []).slice(0, 2)" :key="s.scenario_id" class="matched-scenario">
                    <span>{{ s.title }}</span>
                    <el-tag size="small" type="info">{{ (s.score * 100).toFixed(0) }}%</el-tag>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="`✅ 已覆盖 (${result.covered_items?.length || 0})`" name="covered">
            <el-table :data="result.covered_items" stripe>
              <el-table-column prop="category" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.category }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="test_point" label="测试点" min-width="200" />
              <el-table-column prop="best_score" label="匹配分" width="80" align="center">
                <template #default="{ row }">
                  <span class="text-success">{{ (row.best_score * 100).toFixed(0) }}%</span>
                </template>
              </el-table-column>
              <el-table-column label="匹配场景" min-width="300">
                <template #default="{ row }">
                  <div v-for="s in (row.matched_scenarios || []).slice(0, 2)" :key="s.scenario_id" class="matched-scenario">
                    <span>{{ s.title }}</span>
                    <el-tag size="small" type="success">{{ (s.score * 100).toFixed(0) }}%</el-tag>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <!-- 错误 -->
    <el-alert v-else-if="error" :title="error" type="error" show-icon />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

import { getCoverageResult, downloadCoverageReport } from '@/api/endpoints'

const route = useRoute()
const runId = route.params.runId as string

const loading = ref(true)
const result = ref<any>(null)
const error = ref('')
const activeTab = ref('missed')

// 加载结果
async function loadResult() {
  loading.value = true
  error.value = ''
  try {
    result.value = await getCoverageResult(runId)
  } catch (e: any) {
    error.value = '加载失败: ' + (e.message || e)
  } finally {
    loading.value = false
  }
}

// 下载报告
async function downloadReport() {
  try {
    const content = await downloadCoverageReport(runId)
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coverage_report_${runId}.md`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('报告下载成功')
  } catch (e: any) {
    ElMessage.error('下载失败: ' + (e.message || e))
  }
}

// 工具函数
function formatDate(dateStr: string) {
  if (!dateStr || dateStr === 'None') return '-'
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

function getProgressColor(rate: number) {
  if (rate >= 80) return '#67c23a'
  if (rate >= 60) return '#e6a23c'
  return '#f56c6c'
}

// 初始化
onMounted(() => {
  loadResult()
})
</script>

<style scoped>
.result-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.loading-container {
  padding: 40px;
}

.overview-row {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-covered .stat-value {
  color: #67c23a;
}

.stat-partial .stat-value {
  color: #e6a23c;
}

.stat-missed .stat-value {
  color: #f56c6c;
}

.coverage-high {
  color: #67c23a;
}

.coverage-medium {
  color: #e6a23c;
}

.coverage-low {
  color: #f56c6c;
}

.info-card,
.category-card,
.detail-card {
  margin-bottom: 24px;
}

.text-success {
  color: #67c23a;
  font-weight: 500;
}

.text-warning {
  color: #e6a23c;
  font-weight: 500;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}

.keywords {
  font-size: 12px;
  color: #888;
}

.matched-scenario {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
}
</style>
