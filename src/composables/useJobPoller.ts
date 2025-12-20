import { onBeforeUnmount, ref } from 'vue'

import type { Job } from '@/api/types'
import { getJob } from '@/api/endpoints'

export function useJobPoller() {
  const job = ref<Job | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let timer: number | null = null

  async function stop() {
    if (timer) {
      window.clearInterval(timer)
      timer = null
    }
  }

  async function poll(jobId: string, intervalMs = 1000) {
    await stop()

    loading.value = true
    error.value = null

    const tick = async () => {
      try {
        const j = await getJob(jobId)
        job.value = j
        if (j.status === 'succeeded' || j.status === 'failed' || j.status === 'canceled') {
          await stop()
          loading.value = false
        }
      } catch (e: any) {
        error.value = e?.message || '查询任务失败'
        loading.value = false
        await stop()
      }
    }

    await tick()
    timer = window.setInterval(tick, intervalMs)
  }

  onBeforeUnmount(() => {
    void stop()
  })

  return { job, loading, error, poll, stop }
}
