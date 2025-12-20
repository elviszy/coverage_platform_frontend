export type AcceptedJobResponse = {
  job_id: string
}

export type Job = {
  job_id: string
  type: string
  status: string
  progress: number
  created_at: string
  updated_at: string
  result: Record<string, any>
  error?: { code: string; message: string; details?: Record<string, any> } | null
}

export type ReviewRunListItem = {
  run_id: string
  status: string
  created_at: string
  config: Record<string, any>
}

export type ReviewRunListResponse = {
  items: ReviewRunListItem[]
  page: number
  page_size: number
  total: number
}

export type ReviewSummaryResponse = {
  coverage: {
    total_criteria: number
    covered_criteria: number
    coverage_rate: number
    module_breakdown?: Array<{ path: string; total: number; covered: number; coverage_rate: number }>
    diversity_breakdown?: Array<{ type: string; count: number }>
  }
  quality: {
    avg_completeness: number
    avg_consistency: number
    avg_executable: number
    issues_breakdown?: Array<{ type: string; count: number }>
  }
}

export type GapItem = {
  priority: string
  criterion: {
    criterion_id: string
    page_id: string
    page_url: string
    page_version: number
    path: string
    table_idx: number
    row_idx: number
    table_title?: string | null
    headers: string[]
    row: Record<string, any>
    normalized_text: string
    is_active: boolean
  }
  suggested_queries: string[]
}

export type GapsResponse = {
  items: GapItem[]
  page: number
  page_size: number
  total: number
}

export type QualityReviewItem = {
  scenario_id: string
  completeness_score: number
  consistency_score: number
  executable_score: number
  issues: Array<Record<string, any>>
  llm_used: boolean
  llm_suggestions?: Record<string, any> | null
}

export type QualityIssuesResponse = {
  items: QualityReviewItem[]
  page: number
  page_size: number
  total: number
}

export type RequirementCriterion = {
  criterion_id: string
  page_id: string
  page_url: string
  page_version: number
  path: string
  table_idx: number
  row_idx: number
  table_title?: string | null
  headers: string[]
  row: Record<string, any>
  normalized_text: string
  is_active: boolean
}

export type RequirementsSearchItem = {
  criterion: RequirementCriterion
  score: number
}

export type RequirementsSearchResponse = {
  items: RequirementsSearchItem[]
}

export type TestScenario = {
  scenario_id: string
  source_id: string
  title: string
  path: string
  notes?: string | null
  context_text: string
}

export type TestsSearchItem = {
  scenario: TestScenario
  score: number
}

export type TestsSearchResponse = {
  items: TestsSearchItem[]
}

export type Link = {
  link_id: string
  run_id: string
  scenario_id: string
  criterion_id: string
  link_type: string
  status: 'covered' | 'maybe' | 'rejected'
  score_vector: number
  verifier_used: boolean
  verifier_reason?: string | null
  evidence: Record<string, any>
}

export type LinksResponse = {
  items: Link[]
}

export type LinkConfirmRequest = {
  link_id: string
  action: 'confirm' | 'reject'
  comment?: string | null
}
