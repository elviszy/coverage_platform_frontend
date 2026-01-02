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
