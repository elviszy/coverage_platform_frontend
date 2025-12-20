<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>需求检索（向量检索 requirements_criteria）</template>

      <el-form :model="form" label-width="160px" style="max-width: 980px">
        <el-form-item label="query_text">
          <el-input v-model="form.query_text" placeholder="输入要检索的需求/验收标准描述" />
        </el-form-item>

        <el-form-item label="top_k">
          <el-input-number v-model="form.top_k" :min="1" :max="200" />
        </el-form-item>

        <el-divider>过滤条件（可选）</el-divider>

        <el-form-item label="page_ids">
          <el-input v-model="form.pageIdsRaw" placeholder="多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="path_prefix">
          <el-input v-model="form.path_prefix" placeholder="例如 /产品/模块" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSearch">检索</el-button>
          <el-button @click="useAsScope">作为评审需求范围</el-button>
          <el-button :disabled="selectedRows.length === 0" @click="useSelectedAsScope">使用选中结果作为范围</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="error" type="error" :title="error" show-icon />
    </el-card>

    <el-card style="width: 100%">
      <template #header>结果</template>
      <el-table
        :data="items"
        style="width: 100%"
        v-loading="loading"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="score" label="score" width="120" />
        <el-table-column prop="criterion.criterion_id" label="criterion_id" min-width="240" />
        <el-table-column prop="criterion.page_id" label="page_id" min-width="140" />
        <el-table-column prop="criterion.path" label="path" min-width="220" />
        <el-table-column prop="criterion.normalized_text" label="normalized_text" min-width="520" />
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button link type="primary" @click="copyText(scope.row.criterion.criterion_id)">复制 criterion_id</el-button>
            <el-button link @click="copyText(scope.row.criterion.page_id)">复制 page_id</el-button>
            <el-button link type="success" @click="openUrl(scope.row.criterion.page_url)">打开页面</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
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
const selectedRows = ref<RequirementsSearchItem[]>([])

async function copyText(text: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function openUrl(url: string) {
  if (!url) return
  window.open(url, '_blank')
}

function splitCsv(v: string): string[] | undefined {
  const xs = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return xs.length ? xs : undefined
}

async function onSearch() {
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

function onSelectionChange(rows: RequirementsSearchItem[]) {
  selectedRows.value = rows
}

function useSelectedAsScope() {
  const pageIds = Array.from(
    new Set(
      selectedRows.value
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
