<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>评审详情</template>
      <div>run_id：<code>{{ runId }}</code></div>
      <el-space style="margin-top: 12px" wrap>
        <el-button @click="loadAll" :loading="loading">刷新</el-button>
        <el-button @click="doExport('json')">导出 JSON</el-button>
        <el-button @click="doExport('md')">导出 Markdown</el-button>
      </el-space>
      <el-alert v-if="error" type="error" :title="error" show-icon style="margin-top: 12px" />
    </el-card>

    <el-card style="width: 100%">
      <template #header>Summary</template>
      <pre style="white-space: pre-wrap">{{ summary }}</pre>
    </el-card>

    <el-card style="width: 100%">
      <template #header>Gaps（未覆盖验收标准）</template>
      <el-form inline>
        <el-form-item label="优先级">
          <el-checkbox-group v-model="gapPriority">
            <el-checkbox label="P0" />
            <el-checkbox label="P1" />
            <el-checkbox label="P2" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item>
          <el-button @click="loadGaps">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="gaps" style="width: 100%" v-loading="gapsLoading">
        <el-table-column prop="priority" label="优先级" width="90" />
        <el-table-column prop="criterion.path" label="路径" min-width="240" />
        <el-table-column prop="criterion.normalized_text" label="验收标准" min-width="520" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button link type="primary" @click="viewLinksByCriterion(scope.row.criterion.criterion_id)">查看 Links</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="width: 100%">
      <template #header>质量问题</template>
      <el-table :data="quality" style="width: 100%" v-loading="qualityLoading">
        <el-table-column prop="scenario_id" label="scenario_id" min-width="280" />
        <el-table-column prop="executable_score" label="可执行性" width="100" />
        <el-table-column prop="completeness_score" label="完善度" width="100" />
        <el-table-column prop="consistency_score" label="规范性" width="100" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button link type="primary" @click="viewLinksByScenario(scope.row.scenario_id)">查看 Links</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="width: 100%">
      <template #header>Links（关联关系）</template>

      <el-form inline>
        <el-form-item label="scenario_id">
          <el-input v-model="linksScenarioId" placeholder="输入 scenario_id（可选）" style="width: 380px" />
        </el-form-item>
        <el-form-item label="criterion_id">
          <el-input v-model="linksCriterionId" placeholder="输入 criterion_id（可选）" style="width: 380px" />
        </el-form-item>
        <el-form-item label="status">
          <el-select v-model="linksStatus" clearable placeholder="全部" style="width: 140px">
            <el-option label="covered" value="covered" />
            <el-option label="maybe" value="maybe" />
            <el-option label="rejected" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="loadLinks" :loading="linksLoading">查询</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        type="info"
        show-icon
        title="提示：二选一查询。填写 scenario_id 将查询该场景的 links；否则填写 criterion_id 查询该验收标准的 links。"
        style="margin: 8px 0"
      />

      <el-table :data="links" style="width: 100%" v-loading="linksLoading">
        <el-table-column prop="status" label="状态" width="110" />
        <el-table-column prop="score_vector" label="相似度" width="120" />
        <el-table-column prop="scenario_id" label="scenario_id" min-width="240" />
        <el-table-column prop="criterion_id" label="criterion_id" min-width="240" />
        <el-table-column prop="verifier_used" label="LLM" width="80">
          <template #default="scope">
            {{ scope.row.verifier_used ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button link type="success" @click="openConfirm(scope.row, 'confirm')">确认</el-button>
            <el-button link type="danger" @click="openConfirm(scope.row, 'reject')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="exportDialogVisible" title="导出内容" width="70%">
      <pre style="white-space: pre-wrap">{{ exportContent }}</pre>
    </el-dialog>

    <el-dialog v-model="confirmDialogVisible" title="人工确认/驳回" width="520px">
      <div style="margin-bottom: 8px">
        link_id：<code>{{ pendingLink?.link_id }}</code>
      </div>
      <div style="margin-bottom: 8px">动作：{{ pendingAction }}</div>
      <el-input v-model="manualComment" type="textarea" :rows="4" placeholder="备注（可选）" />
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirmSubmitting" @click="submitConfirm">提交</el-button>
      </template>
    </el-dialog>
  </el-space>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  confirmLink,
  exportReview,
  getQualityIssues,
  getReviewGaps,
  getReviewSummary,
  listCriterionLinks,
  listScenarioLinks,
} from '@/api/endpoints'
import type { GapItem, Link, QualityReviewItem, ReviewSummaryResponse } from '@/api/types'
import { useJobPoller } from '@/composables/useJobPoller'

const props = defineProps<{ runId: string }>()

const runId = props.runId

const loading = ref(false)
const error = ref<string | null>(null)

const summary = ref<ReviewSummaryResponse | null>(null)

const gapsLoading = ref(false)
const gaps = ref<GapItem[]>([])
const gapPriority = ref<string[]>(['P0', 'P1', 'P2'])

const qualityLoading = ref(false)
const quality = ref<QualityReviewItem[]>([])

const linksLoading = ref(false)
const links = ref<Link[]>([])
const linksScenarioId = ref('')
const linksCriterionId = ref('')
const linksStatus = ref<'covered' | 'maybe' | 'rejected' | ''>('')

const confirmDialogVisible = ref(false)
const confirmSubmitting = ref(false)
const pendingLink = ref<Link | null>(null)
const pendingAction = ref<'confirm' | 'reject'>('confirm')
const manualComment = ref('')

const exportDialogVisible = ref(false)
const exportContent = ref('')

const { poll, job } = useJobPoller()

async function loadSummary() {
  summary.value = await getReviewSummary(runId)
}

async function loadLinks() {
  const scenarioId = linksScenarioId.value.trim()
  const criterionId = linksCriterionId.value.trim()
  const status = linksStatus.value ? (linksStatus.value as any) : undefined

  if (!scenarioId && !criterionId) {
    links.value = []
    return
  }

  linksLoading.value = true
  try {
    if (scenarioId) {
      const data = await listScenarioLinks(runId, scenarioId, status)
      links.value = data.items
    } else {
      const data = await listCriterionLinks(runId, criterionId, status)
      links.value = data.items
    }
  } finally {
    linksLoading.value = false
  }
}

function openConfirm(link: Link, action: 'confirm' | 'reject') {
  pendingLink.value = link
  pendingAction.value = action
  manualComment.value = ''
  confirmDialogVisible.value = true
}

async function submitConfirm() {
  if (!pendingLink.value) return
  confirmSubmitting.value = true
  try {
    await confirmLink({
      link_id: pendingLink.value.link_id,
      action: pendingAction.value,
      comment: manualComment.value || null,
    })
    confirmDialogVisible.value = false
    await loadLinks()
  } finally {
    confirmSubmitting.value = false
  }
}

async function viewLinksByCriterion(criterionId: string) {
  linksScenarioId.value = ''
  linksCriterionId.value = criterionId
  await loadLinks()
}

async function viewLinksByScenario(scenarioId: string) {
  linksCriterionId.value = ''
  linksScenarioId.value = scenarioId
  await loadLinks()
}

async function loadGaps() {
  gapsLoading.value = true
  try {
    const data = await getReviewGaps(runId, { priority: gapPriority.value, page: 1, page_size: 50 })
    gaps.value = data.items
  } finally {
    gapsLoading.value = false
  }
}

async function loadQuality() {
  qualityLoading.value = true
  try {
    const data = await getQualityIssues(runId, { page: 1, page_size: 50, filters: {} })
    quality.value = data.items
  } finally {
    qualityLoading.value = false
  }
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    await Promise.all([loadSummary(), loadGaps(), loadQuality()])
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function doExport(fmt: 'json' | 'md') {
  const { job_id } = await exportReview(runId, { format: fmt })
  await poll(job_id)
  exportContent.value = String(job.value?.result?.content || '')
  exportDialogVisible.value = true
}

onMounted(() => {
  void loadAll()
})
</script>
