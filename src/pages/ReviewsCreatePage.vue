<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>发起评审</template>

      <el-form label-width="160px" :model="form" style="max-width: 1000px">
        <el-divider>需求范围</el-divider>

        <el-form-item label="需求 page_ids（可选）">
          <el-input v-model="form.req_page_ids" placeholder="多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="需求 path_prefix（可选）">
          <el-input v-model="form.req_path_prefix" placeholder="例如 /产品/模块" />
        </el-form-item>

        <el-divider>用例范围</el-divider>

        <el-form-item label="用例 source_ids（可选）">
          <el-input v-model="form.test_source_ids" placeholder="多个用逗号分隔（tests_sources.source_id）" />
        </el-form-item>
        <el-form-item label="用例 path_prefix（可选）">
          <el-input v-model="form.test_path_prefix" placeholder="例如 根节点/子模块" />
        </el-form-item>

        <el-divider>覆盖配置</el-divider>

        <el-form-item label="top_k">
          <el-input-number v-model="form.top_k" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="threshold_cover">
          <el-input-number v-model="form.threshold_cover" :min="0" :max="1" :step="0.01" />
        </el-form-item>
        <el-form-item label="threshold_maybe">
          <el-input-number v-model="form.threshold_maybe" :min="0" :max="1" :step="0.01" />
        </el-form-item>
        <el-form-item label="启用 LLM verifier">
          <el-switch v-model="form.enable_llm_verifier" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">开始评审</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="job" style="width: 100%">
      <template #header>任务进度</template>
      <div style="margin-bottom: 8px">job_id：<code>{{ job.job_id }}</code></div>
      <el-button @click="$router.push({ path: '/jobs', query: { job_id: job.job_id } })">在任务查询页打开</el-button>
      <el-progress :percentage="Math.round((job.progress || 0) * 100)" />
      <div style="margin-top: 8px">状态：{{ job.status }}</div>
      <el-divider />
      <pre style="white-space: pre-wrap">{{ job.result }}</pre>
      <el-button v-if="job.status === 'succeeded' && job.result?.run_id" @click="$router.push(`/reviews/${job.result.run_id}`)">
        打开评审详情
      </el-button>
      <div v-if="job.error" style="margin-top: 8px; color: var(--el-color-danger)">错误：{{ job.error.message }}</div>
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { createReviewRun } from '@/api/endpoints'
import { useJobPoller } from '@/composables/useJobPoller'
import { useAppStore } from '@/stores/app'

const form = reactive({
  req_page_ids: '',
  req_path_prefix: '',
  test_source_ids: '',
  test_path_prefix: '',
  top_k: 50,
  threshold_cover: 0.82,
  threshold_maybe: 0.75,
  enable_llm_verifier: false,
})

const submitting = ref(false)
const { job, poll } = useJobPoller()
const app = useAppStore()

function splitCsv(v: string): string[] | undefined {
  const xs = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return xs.length ? xs : undefined
}

async function onSubmit() {
  submitting.value = true
  try {
    const payload = {
      requirements_scope: {
        page_ids: splitCsv(form.req_page_ids),
        path_prefix: form.req_path_prefix || undefined,
        only_latest: true,
      },
      tests_scope: {
        source_ids: splitCsv(form.test_source_ids),
        path_prefix: form.test_path_prefix || undefined,
      },
      coverage: {
        top_k: form.top_k,
        threshold_cover: form.threshold_cover,
        threshold_maybe: form.threshold_maybe,
        enable_llm_verifier: form.enable_llm_verifier,
      },
      quality: {
        enable_quality_review: true,
        enable_llm_quality_review: false,
      },
    }

    const { job_id } = await createReviewRun(payload)
    app.setLastJobId(job_id)
    await poll(job_id)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const draft = app.consumeReviewDraft()
  if (!draft) return

  if (draft.requirements_scope) {
    if (Array.isArray(draft.requirements_scope.page_ids)) {
      form.req_page_ids = draft.requirements_scope.page_ids.join(',')
    }
    if (typeof draft.requirements_scope.path_prefix === 'string') {
      form.req_path_prefix = draft.requirements_scope.path_prefix
    }
  }

  if (draft.tests_scope) {
    if (Array.isArray(draft.tests_scope.source_ids)) {
      form.test_source_ids = draft.tests_scope.source_ids.join(',')
    }
    if (typeof draft.tests_scope.path_prefix === 'string') {
      form.test_path_prefix = draft.tests_scope.path_prefix
    }
  }
})
</script>
