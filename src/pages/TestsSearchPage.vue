<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>用例检索（向量检索 tests_scenarios）</template>

      <el-form :model="form" label-width="160px" style="max-width: 980px">
        <el-form-item label="query_text">
          <el-input v-model="form.query_text" placeholder="输入要检索的测试场景/步骤/预期" />
        </el-form-item>

        <el-form-item label="top_k">
          <el-input-number v-model="form.top_k" :min="1" :max="200" />
        </el-form-item>

        <el-divider>过滤条件（可选）</el-divider>

        <el-form-item label="source_ids">
          <el-input v-model="form.sourceIdsRaw" placeholder="多个用逗号分隔（tests_sources.source_id）" />
        </el-form-item>
        <el-form-item label="path_prefix">
          <el-input v-model="form.path_prefix" placeholder="例如 根节点/子模块" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSearch">检索</el-button>
          <el-button @click="useAsScope">作为评审用例范围</el-button>
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
        <el-table-column prop="scenario.scenario_id" label="scenario_id" min-width="260" />
        <el-table-column prop="scenario.source_id" label="source_id" min-width="200" />
        <el-table-column prop="scenario.path" label="path" min-width="220" />
        <el-table-column prop="scenario.title" label="title" min-width="220" />
        <el-table-column prop="scenario.context_text" label="context_text" min-width="520" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button link type="primary" @click="copyText(scope.row.scenario.scenario_id)">复制 scenario_id</el-button>
            <el-button link @click="copyText(scope.row.scenario.source_id)">复制 source_id</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </el-space>
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
