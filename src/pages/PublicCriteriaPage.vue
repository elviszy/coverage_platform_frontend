<template>
  <div class="criteria-page">
    <!-- 页面头 -->
    <div class="page-header">
      <h1 class="page-title">📋 公共测试标准管理</h1>
      <p class="page-desc">导入和管理公共测试用例标准，用于覆盖度分析</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="action-bar">
      <div class="action-row">
        <div class="left-actions">
          <el-button type="primary" @click="showImportDialog = true">
            📥 导入标准
          </el-button>
          <el-button :loading="indexing" @click="onIndex">
            🔄 重建索引
          </el-button>
        </div>
        <div class="right-actions">
          <el-select v-model="filters.category" placeholder="按类型筛选" clearable style="width: 180px" @change="loadData">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
          <el-input
            v-model="filters.search"
            placeholder="搜索测试点..."
            clearable
            style="width: 200px"
            @clear="loadData"
            @keyup.enter="loadData"
          >
            <template #prefix>🔍</template>
          </el-input>
        </div>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <div class="stats-row" v-if="total > 0">
      <el-tag type="info" size="large">共 {{ total }} 条标准</el-tag>
      <el-tag v-for="cat in categoryCounts" :key="cat.name" type="primary" size="large">
        {{ cat.name }}: {{ cat.count }}
      </el-tag>
    </div>

    <!-- 数据表格 -->
    <el-card class="data-card">
      <el-table :data="items" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="category" label="类型" width="140">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="test_point" label="测试点" min-width="200" />
        <el-table-column prop="test_content" label="测试内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="关键词" width="200">
          <template #default="{ row }">
            <span class="keywords">
              {{ (row.keywords || []).slice(0, 5).join(', ') }}
              <span v-if="(row.keywords || []).length > 5">...</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确定删除此标准吗？" @confirm="onDelete(row.criterion_id)">
              <template #reference>
                <el-button type="danger" size="small" text>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 导入对话框 -->
    <el-dialog v-model="showImportDialog" title="📥 导入公共测试标准" width="600px">
      <el-tabs v-model="importTab">
        <el-tab-pane label="文件上传" name="file">
          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".md,.txt"
            :on-change="onFileSelect"
            :show-file-list="false"
          >
            <div class="upload-content">
              <div class="upload-icon">📄</div>
              <div class="upload-text">
                <span v-if="!importFile">拖放 .md 或 .txt 文件到此处，或 <em>点击上传</em></span>
                <span v-else class="file-selected">✅ 已选择: {{ importFile.name }}</span>
              </div>
            </div>
          </el-upload>
        </el-tab-pane>
        <el-tab-pane label="粘贴内容" name="paste">
          <el-input
            v-model="importContent"
            type="textarea"
            :rows="10"
            placeholder="粘贴 Markdown 表格内容，格式：&#10;类型	测试点	测试内容&#10;增删改	正常新增	新增数据保存成功..."
          />
        </el-tab-pane>
      </el-tabs>

      <div class="import-options">
        <el-checkbox v-model="replaceAll">
          替换全部现有数据（勾选后将清空现有标准）
        </el-checkbox>
        <el-checkbox v-model="useLlm">
          🧠 使用 LLM 提取关键词（更准确，但较慢）
        </el-checkbox>
      </div>

      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="onImport">
          确认导入
        </el-button>
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

// 索引相关
const indexing = ref(false)

// 计算属性
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  items.value.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1
  })
  return Object.entries(counts).map(([name, count]) => ({ name, count }))
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

// 文件选择
function onFileSelect(file: any) {
  importFile.value = file.raw
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
    const result = await indexPublicCriteria(false)
    ElMessage.success(`索引完成！已索引 ${result.indexed} 条，失败 ${result.failed} 条`)
  } catch (e: any) {
    ElMessage.error('索引失败: ' + (e.message || e))
  } finally {
    indexing.value = false
  }
}

// 删除
async function onDelete(criterionId: string) {
  try {
    await deletePublicCriterion(criterionId)
    ElMessage.success('删除成功')
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
.criteria-page {
  padding: 24px;
  max-width: 1400px;
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

.action-bar {
  margin-bottom: 16px;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.left-actions,
.right-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.data-card {
  margin-bottom: 24px;
}

.keywords {
  font-size: 12px;
  color: #888;
}

.pagination-row {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.upload-area {
  width: 100%;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  color: #666;
}

.upload-text em {
  color: #409eff;
  cursor: pointer;
}

.file-selected {
  color: #67c23a;
  font-weight: 500;
}

.import-options {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
