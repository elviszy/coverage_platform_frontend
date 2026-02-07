<template>
  <div class="criteria-page">
    <!-- 背景装饰 -->
    <div class="bg-gradient"></div>
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    
    <!-- 页面头 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
          公共测试标准管理
        </h1>
        <p class="page-desc">导入和管理公共测试用例标准，用于覆盖度分析</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showImportDialog = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          导入标准
        </button>
        <button class="btn btn-secondary" :class="{ loading: indexing }" @click="onIndex">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ spin: indexing }">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          重建索引
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">测试标准总数</div>
        </div>
      </div>
      <div class="stat-card" v-for="cat in topCategories" :key="cat.name">
        <div class="stat-icon category">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ cat.count }}</div>
          <div class="stat-label">{{ cat.name }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar glass-card">
      <div class="filter-left">
        <div class="category-chips">
          <button 
            class="chip" 
            :class="{ active: !filters.category }"
            @click="filters.category = ''; loadData()"
          >
            全部
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat" 
            class="chip"
            :class="{ active: filters.category === cat }"
            @click="filters.category = cat; loadData()"
          >
            {{ cat }}
          </button>
        </div>
      </div>
      <div class="filter-right">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            v-model="filters.search" 
            placeholder="搜索测试点..."
            @keyup.enter="loadData"
          />
          <button v-if="filters.search" class="clear-btn" @click="filters.search = ''; loadData()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table glass-card" v-loading="loading">
      <table>
        <thead>
          <tr>
            <th style="width: 140px">类型</th>
            <th style="min-width: 200px">测试点</th>
            <th style="min-width: 300px">测试内容</th>
            <th style="width: 220px">关键词</th>
            <th style="width: 80px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.criterion_id">
            <td>
              <span class="category-tag">{{ row.category }}</span>
            </td>
            <td class="test-point">{{ row.test_point }}</td>
            <td class="test-content">{{ row.test_content || '-' }}</td>
            <td class="keywords">
              <span class="keyword-tag" v-for="kw in (row.keywords || []).slice(0, 4)" :key="kw">{{ kw }}</span>
              <span v-if="(row.keywords || []).length > 4" class="keyword-more">+{{ (row.keywords || []).length - 4 }}</span>
            </td>
            <td>
              <button class="btn-delete" @click="confirmDelete(row)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="items.length === 0 && !loading">
            <td colspan="5" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span>暂无数据</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination" v-if="total > pageSize">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="currentPage--; loadData()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span class="page-info">{{ currentPage }} / {{ Math.ceil(total / pageSize) }}</span>
        <button 
          class="page-btn" 
          :disabled="currentPage >= Math.ceil(total / pageSize)"
          @click="currentPage++; loadData()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 导入对话框 -->
    <el-dialog v-model="showImportDialog" title="导入公共测试标准" width="600px" class="import-dialog">
      <el-tabs v-model="importTab">
        <el-tab-pane label="文件上传" name="file">
          <div 
            class="upload-zone" 
            :class="{ 'has-file': importFile }"
            @dragover.prevent
            @drop.prevent="onDrop"
            @click="triggerFileInput"
          >
            <input type="file" ref="fileInput" accept=".md,.txt" @change="onFileInputChange" hidden />
            <svg v-if="!importFile" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="success-icon">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <span v-if="!importFile">拖放 .md 或 .txt 文件，或点击选择</span>
            <span v-else class="file-name">{{ importFile.name }}</span>
          </div>
        </el-tab-pane>
        <el-tab-pane label="粘贴内容" name="paste">
          <textarea 
            v-model="importContent" 
            class="paste-area"
            placeholder="粘贴 Markdown 表格内容，格式：&#10;类型&#9;测试点&#9;测试内容&#10;增删改&#9;正常新增&#9;新增数据保存成功..."
          ></textarea>
        </el-tab-pane>
      </el-tabs>

      <div class="import-options">
        <label class="checkbox-label">
          <input type="checkbox" v-model="replaceAll" />
          <span class="checkbox-custom"></span>
          替换全部现有数据
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="useLlm" />
          <span class="checkbox-custom"></span>
          使用 LLM 提取关键词（更准确）
        </label>
      </div>

      <template #footer>
        <button class="btn btn-ghost" @click="showImportDialog = false">取消</button>
        <button class="btn btn-primary" :class="{ loading: importing }" @click="onImport">
          确认导入
        </button>
      </template>
    </el-dialog>

    <!-- 删除确认 -->
    <el-dialog v-model="showDeleteDialog" title="确认删除" width="400px">
      <p>确定要删除此测试标准吗？</p>
      <p class="delete-item-name">{{ deleteTarget?.test_point }}</p>
      <template #footer>
        <button class="btn btn-ghost" @click="showDeleteDialog = false">取消</button>
        <button class="btn btn-danger" @click="doDelete">确认删除</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

import {
  listPublicCriteria,
  getPublicCriteriaCategories,
  importPublicCriteria,
  importPublicCriteriaFile,
  indexPublicCriteria,
  deletePublicCriterion,
} from '@/api/endpoints'

// 状态
const loading = ref(false)
const items = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 50
const categories = ref<string[]>([])

const filters = reactive({
  category: '',
  search: '',
})

// 导入相关
const showImportDialog = ref(false)
const importTab = ref('file')
const importFile = ref<File | null>(null)
const importContent = ref('')
const replaceAll = ref(false)
const useLlm = ref(true)
const importing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 索引相关
const indexing = ref(false)

// 删除相关
const showDeleteDialog = ref(false)
const deleteTarget = ref<any>(null)

// 计算属性
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  items.value.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1
  })
  return Object.entries(counts).map(([name, count]) => ({ name, count }))
})

const topCategories = computed(() => {
  return categoryCounts.value.slice(0, 3)
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const params: any = {
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
    }
    if (filters.category) params.category = filters.category
    if (filters.search) params.search = filters.search

    const res = await listPublicCriteria(params)
    items.value = res.items
    total.value = res.total
  } catch (e: any) {
    ElMessage.error('加载失败: ' + (e.message || e))
  } finally {
    loading.value = false
  }
}

// 加载类型列表
async function loadCategories() {
  try {
    const res = await getPublicCriteriaCategories()
    categories.value = res.categories
  } catch (e) {
    // ignore
  }
}

// 文件拖放
function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
    importFile.value = file
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) {
    importFile.value = target.files[0]
  }
}

// 导入
async function onImport() {
  importing.value = true
  try {
    let result: any

    if (importTab.value === 'file' && importFile.value) {
      const form = new FormData()
      form.append('file', importFile.value)
      form.append('replace_all', String(replaceAll.value))
      form.append('use_llm', String(useLlm.value))
      result = await importPublicCriteriaFile(form)
    } else if (importTab.value === 'paste' && importContent.value) {
      result = await importPublicCriteria({
        content: importContent.value,
        replace_all: replaceAll.value,
        use_llm: useLlm.value,
      })
    } else {
      ElMessage.warning('请选择文件或粘贴内容')
      importing.value = false
      return
    }

    ElMessage.success(`导入成功！新增 ${result.imported} 条，更新 ${result.updated} 条`)
    if (result.errors?.length) {
      ElMessage.warning(`${result.errors.length} 条记录有错误`)
    }

    showImportDialog.value = false
    importFile.value = null
    importContent.value = ''
    replaceAll.value = false

    await loadData()
    await loadCategories()
  } catch (e: any) {
    ElMessage.error('导入失败: ' + (e.message || e))
  } finally {
    importing.value = false
  }
}

// 重建索引
async function onIndex() {
  indexing.value = true
  try {
    const result = await indexPublicCriteria(true)  // 强制重建所有索引
    ElMessage.success(`索引完成！已索引 ${result.indexed} 条，失败 ${result.failed} 条`)
  } catch (e: any) {
    ElMessage.error('索引失败: ' + (e.message || e))
  } finally {
    indexing.value = false
  }
}

// 删除
function confirmDelete(row: any) {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  try {
    await deletePublicCriterion(deleteTarget.value.criterion_id)
    ElMessage.success('删除成功')
    showDeleteDialog.value = false
    deleteTarget.value = null
    await loadData()
  } catch (e: any) {
    ElMessage.error('删除失败: ' + (e.message || e))
  }
}

// 初始化
onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style scoped>
/* ========== 基础变量 ========== */
.criteria-page {
  --bg-primary: #0A0F1C;
  --bg-secondary: #111827;
  --bg-card: rgba(17, 24, 39, 0.7);
  --border-color: rgba(255, 255, 255, 0.08);
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --accent-blue: #3B82F6;
  --accent-purple: #8B5CF6;
  --accent-amber: #F59E0B;
  --accent-green: #10B981;
  --accent-red: #EF4444;
  
  position: relative;
  min-height: 100vh;
  padding: 32px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
}

/* ========== 背景效果 ========== */
.bg-gradient {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 100% 50%, rgba(139, 92, 246, 0.1), transparent),
    radial-gradient(ellipse 60% 40% at 0% 80%, rgba(16, 185, 129, 0.08), transparent);
  pointer-events: none;
  z-index: 0;
}

.bg-grid {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

.bg-glow {
  position: fixed;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  animation: float 20s ease-in-out infinite;
}

.bg-glow-1 {
  top: -200px;
  right: -100px;
  background: rgba(59, 130, 246, 0.15);
}

.bg-glow-2 {
  bottom: -200px;
  left: -100px;
  background: rgba(139, 92, 246, 0.1);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 30px); }
}

/* ========== 玻璃卡片 ========== */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

/* ========== 页面头部 ========== */
.page-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05));
  border: 1px solid var(--border-color);
  border-radius: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-icon {
  width: 32px;
  height: 32px;
  color: var(--accent-blue);
}

.page-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* ========== 按钮 ========== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-danger {
  background: var(--accent-red);
  color: white;
}

.btn.loading {
  opacity: 0.7;
  pointer-events: none;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== 统计卡片 ========== */
.stats-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.total {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
  color: var(--accent-blue);
}

.stat-icon.category {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2));
  color: var(--accent-amber);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  background: linear-gradient(135deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* ========== 筛选栏 ========== */
.filter-bar {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 20px;
  gap: 16px;
}

.filter-left {
  flex: 1;
  overflow-x: auto;
}

.category-chips {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.chip {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.chip.active {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border-color: transparent;
  color: white;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  min-width: 240px;
}

.search-box svg {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

.search-box input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: var(--text-muted);
}

.clear-btn:hover {
  color: var(--accent-red);
}

/* ========== 数据表格 ========== */
.data-table {
  position: relative;
  z-index: 1;
  padding: 0;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: rgba(255, 255, 255, 0.03);
}

th {
  padding: 16px 20px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-color);
}

td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
}

tbody tr {
  transition: background 0.2s;
}

tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.category-tag {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--accent-blue);
}

.test-point {
  font-weight: 500;
  color: var(--text-primary);
}

.test-content {
  color: var(--text-secondary);
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.keyword-tag {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent-green);
}

.keyword-more {
  padding: 3px 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.btn-delete {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--accent-red);
  transition: all 0.2s;
}

.btn-delete:hover {
  background: var(--accent-red);
  color: white;
}

.btn-delete svg {
  width: 16px;
  height: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px !important;
  color: var(--text-muted);
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state span {
  display: block;
}

/* ========== 分页 ========== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-btn svg {
  width: 18px;
  height: 18px;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: 'Fira Code', monospace;
}

/* ========== 导入对话框 ========== */
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.02);
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.upload-zone:hover {
  border-color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.05);
}

.upload-zone.has-file {
  border-color: var(--accent-green);
  background: rgba(16, 185, 129, 0.05);
}

.upload-zone svg {
  width: 48px;
  height: 48px;
}

.success-icon {
  color: var(--accent-green);
}

.file-name {
  color: var(--accent-green);
  font-weight: 500;
}

.paste-area {
  width: 100%;
  height: 200px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'Fira Code', monospace;
  resize: vertical;
}

.paste-area:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.import-options {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkbox-custom {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: '✓';
  display: block;
  text-align: center;
  color: white;
  font-size: 12px;
  line-height: 14px;
}

.delete-item-name {
  font-weight: 500;
  color: var(--accent-amber);
}

/* ========== 响应式 ========== */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .criteria-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
}
</style>
