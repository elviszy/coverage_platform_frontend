import type {
  AcceptedJobResponse,
  GapsResponse,
  Job,
  LinkConfirmRequest,
  LinksResponse,
  QualityIssuesResponse,
  RequirementsSearchResponse,
  ReviewRunListResponse,
  ReviewSummaryResponse,
  TestsSearchResponse,
} from './types'
import { http } from './http'

export async function getJob(jobId: string): Promise<Job> {
  const resp = await http.get(`/jobs/${jobId}`)
  return resp.data
}

export async function importConfluence(payload: {
  page_url: string
  recursive: boolean
  max_depth: number
  include_attachments: boolean
}): Promise<AcceptedJobResponse> {
  const resp = await http.post('/requirements/import/confluence', payload)
  return resp.data
}

export async function importRequirementsText(payload: {
  title: string
  text: string
  path?: string
}): Promise<AcceptedJobResponse> {
  const resp = await http.post('/requirements/import/text', payload)
  return resp.data
}

export async function importRequirementsDocx(form: FormData): Promise<AcceptedJobResponse> {
  const resp = await http.post('/requirements/import/docx', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function indexRequirements(payload: { scope: { page_ids?: string[] | null } }): Promise<AcceptedJobResponse> {
  const resp = await http.post('/requirements/index', payload)
  return resp.data
}

export async function importXmind(form: FormData): Promise<AcceptedJobResponse> {
  const resp = await http.post('/tests/import/xmind', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function searchRequirements(payload: any): Promise<RequirementsSearchResponse> {
  const resp = await http.post('/requirements/search', payload)
  return resp.data
}

export async function searchTests(payload: any): Promise<TestsSearchResponse> {
  const resp = await http.post('/tests/search', payload)
  return resp.data
}

// 获取需求页面列表
export async function listRequirementsPages(): Promise<{
  items: Array<{ page_id: string; page_url: string; title: string; version: number; path: string; fetched_at: string }>
  total: number
}> {
  const resp = await http.get('/requirements/pages')
  return resp.data
}

// 获取用例来源列表
export async function listTestsSources(): Promise<{
  items: Array<{ source_id: string; source_type: string; file_name: string; file_hash: string; imported_at: string }>
  total: number
}> {
  const resp = await http.get('/tests/sources')
  return resp.data
}

export async function listReviewRuns(page = 1, pageSize = 20): Promise<ReviewRunListResponse> {
  const resp = await http.get('/reviews/runs', { params: { page, page_size: pageSize } })
  return resp.data
}

export async function createReviewRun(payload: any): Promise<AcceptedJobResponse> {
  const resp = await http.post('/reviews/runs', payload)
  return resp.data
}

export async function getReviewSummary(runId: string): Promise<ReviewSummaryResponse> {
  const resp = await http.get(`/reviews/runs/${runId}/summary`)
  return resp.data
}

// 获取功能点覆盖详情
export async function getFeatureCoverage(runId: string): Promise<{
  summary: { total: number; covered: number; partial: number; missed: number }
  items: Array<{
    page_id: string
    path: string
    total: number
    covered: number
    partial: number
    missed: number
    coverage_rate: number
    status: 'covered' | 'partial' | 'missed'
  }>
}> {
  const resp = await http.get(`/reviews/runs/${runId}/feature-coverage`)
  return resp.data
}

// 获取公共用例标准覆盖详情
export async function getPublicCriteriaCoverage(runId: string): Promise<{
  summary: {
    total: number
    covered: number
    partial: number
    missed: number
    by_category: Array<{ category: string; total: number; covered: number; partial: number; missed: number }>
  }
  covered: Array<{
    criterion_id: string
    category: string
    test_point: string
    test_content: string
    status: string
    score: number
    matched_scenario: any
  }>
  partial: Array<any>
  missed: Array<any>
}> {
  const resp = await http.get(`/reviews/runs/${runId}/public-criteria-coverage`)
  return resp.data
}

export async function getReviewGaps(runId: string, payload: any): Promise<GapsResponse> {
  const resp = await http.post(`/reviews/runs/${runId}/gaps`, payload)
  return resp.data
}

export async function getQualityIssues(runId: string, payload: any): Promise<QualityIssuesResponse> {
  const resp = await http.post(`/reviews/runs/${runId}/quality/issues`, payload)
  return resp.data
}

export async function listScenarioLinks(
  runId: string,
  scenarioId: string,
  status?: 'covered' | 'maybe' | 'rejected',
): Promise<LinksResponse> {
  const resp = await http.get(`/reviews/runs/${runId}/scenarios/${encodeURIComponent(scenarioId)}/links`, {
    params: status ? { status } : undefined,
  })
  return resp.data
}

export async function listCriterionLinks(
  runId: string,
  criterionId: string,
  status?: 'covered' | 'maybe' | 'rejected',
): Promise<LinksResponse> {
  const resp = await http.get(`/reviews/runs/${runId}/criteria/${encodeURIComponent(criterionId)}/links`, {
    params: status ? { status } : undefined,
  })
  return resp.data
}

export async function confirmLink(payload: LinkConfirmRequest): Promise<{ ok: boolean }> {
  const resp = await http.post('/links/confirm', payload)
  return resp.data
}

export async function exportReview(runId: string, payload: { format: 'json' | 'md' | 'xlsx' }): Promise<AcceptedJobResponse> {
  const resp = await http.post(`/reviews/runs/${runId}/export`, payload)
  return resp.data
}

export async function updateSettings(payload: any): Promise<any> {
  const resp = await http.put('/settings/llm', payload)
  return resp.data
}

// ==================== 公共测试标准 API ====================

export async function importPublicCriteria(payload: {
  content: string
  replace_all?: boolean
}): Promise<{ imported: number; updated: number; skipped: number; errors: string[] }> {
  const resp = await http.post('/public-criteria/import', payload)
  return resp.data
}

export async function importPublicCriteriaFile(form: FormData): Promise<{
  imported: number
  updated: number
  skipped: number
  errors: string[]
}> {
  const resp = await http.post('/public-criteria/import-file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function listPublicCriteria(params?: {
  category?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ items: any[]; total: number }> {
  const resp = await http.get('/public-criteria/', { params })
  return resp.data
}

export async function getPublicCriteriaCategories(): Promise<{ categories: string[] }> {
  const resp = await http.get('/public-criteria/categories')
  return resp.data
}

export async function indexPublicCriteria(force?: boolean): Promise<{
  indexed: number
  failed: number
}> {
  const resp = await http.post('/public-criteria/index', null, { params: { force: force || false } })
  return resp.data
}

export async function deletePublicCriterion(criterionId: string): Promise<{ ok: boolean }> {
  const resp = await http.delete(`/public-criteria/${criterionId}`)
  return resp.data
}

// ==================== 覆盖度分析 API ====================

export async function startCoverageAnalysis(payload: {
  xmind_source_id: string
  requirements_page_ids?: string[]
  config?: any
}): Promise<{ run_id: string; status: string }> {
  const resp = await http.post('/coverage/analyze', payload)
  return resp.data
}

export async function getCoverageResult(runId: string): Promise<any> {
  const resp = await http.get(`/coverage/${runId}`)
  return resp.data
}

export async function downloadCoverageReport(runId: string): Promise<string> {
  const resp = await http.get(`/coverage/${runId}/report`)
  return resp.data
}

export async function listCoverageRuns(params?: {
  limit?: number
  offset?: number
}): Promise<{ items: any[]; total: number }> {
  const resp = await http.get('/coverage/runs', { params })
  return resp.data
}

// ==================== 流式分析 API ====================

// 导出流式分析服务
export { startStreamingAnalysis, useStreamingAnalysis } from './streaming'
export type { SSEEvent, SSECallbacks } from './streaming'
