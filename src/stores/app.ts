import { defineStore } from 'pinia'
import { ref } from 'vue'

const LAST_JOB_ID_KEY = 'coverage_platform:lastJobId'

export const useAppStore = defineStore('app', () => {
  const lastJobId = ref(localStorage.getItem(LAST_JOB_ID_KEY) || '')
  const reviewDraft = ref<any | null>(null)

  function setLastJobId(jobId: string) {
    lastJobId.value = jobId
    if (jobId) {
      localStorage.setItem(LAST_JOB_ID_KEY, jobId)
    } else {
      localStorage.removeItem(LAST_JOB_ID_KEY)
    }
  }

  function clearLastJobId() {
    setLastJobId('')
  }

  function setReviewDraft(draft: any) {
    reviewDraft.value = { ...(reviewDraft.value || {}), ...(draft || {}) }
  }

  function consumeReviewDraft(): any | null {
    const v = reviewDraft.value
    reviewDraft.value = null
    return v
  }

  return { lastJobId, setLastJobId, clearLastJobId, reviewDraft, setReviewDraft, consumeReviewDraft }
})
