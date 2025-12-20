<template>
  <el-space direction="vertical" alignment="start" style="width: 100%" :size="16">
    <el-card style="width: 100%">
      <template #header>设置（LLM）</template>

      <el-alert type="warning" show-icon title="当前后端 /settings/llm 为 MVP：仅返回 ok，不会持久化配置。生产环境建议使用环境变量。" />

      <el-form label-width="160px" :model="form" style="max-width: 900px; margin-top: 12px">
        <el-form-item label="provider">
          <el-select v-model="form.provider" style="width: 240px">
            <el-option label="openai" value="openai" />
          </el-select>
        </el-form-item>

        <el-form-item label="api_key">
          <el-input v-model="form.api_key" type="password" show-password placeholder="可留空" />
        </el-form-item>

        <el-form-item label="base_url">
          <el-input v-model="form.base_url" placeholder="可留空（默认官方）" />
        </el-form-item>

        <el-form-item label="model_verifier">
          <el-input v-model="form.model_verifier" />
        </el-form-item>

        <el-form-item label="model_quality">
          <el-input v-model="form.model_quality" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="result" type="success" :title="result" show-icon />
      <el-alert v-if="error" type="error" :title="error" show-icon />
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

import { updateSettings } from '@/api/endpoints'

const form = reactive({
  provider: 'openai',
  api_key: '',
  base_url: '',
  model_verifier: 'gpt-4o-mini',
  model_quality: 'gpt-4o-mini',
})

const submitting = ref(false)
const result = ref<string | null>(null)
const error = ref<string | null>(null)

async function onSubmit() {
  submitting.value = true
  result.value = null
  error.value = null
  try {
    await updateSettings({
      provider: form.provider,
      api_key: form.api_key || null,
      base_url: form.base_url || null,
      model_verifier: form.model_verifier,
      model_quality: form.model_quality,
    })
    result.value = '已提交（后端当前为 MVP：仅返回 ok）'
  } catch (e: any) {
    error.value = e?.message || '提交失败'
  } finally {
    submitting.value = false
  }
}
</script>
