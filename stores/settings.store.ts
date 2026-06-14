import { defineStore } from 'pinia'
import type { AIProvider } from '~/types/ai'

export const useSettingsStore = defineStore('settings', () => {
  const preferredProvider = ref<AIProvider>('deepseek')
  const model = ref<string>('deepseek-v4-pro')
  const language = ref<'zh-CN'>('zh-CN')

  function setProvider(provider: AIProvider) {
    preferredProvider.value = provider
    if (provider === 'qwen') {
      model.value = 'qwen-plus'
    } else {
      model.value = 'deepseek-v4-pro'
    }
  }

  function setModel(m: string) {
    model.value = m
  }

  return {
    preferredProvider,
    model,
    language,
    setProvider,
    setModel,
  }
})
