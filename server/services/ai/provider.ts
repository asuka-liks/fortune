import OpenAI from 'openai'
import type { AIProvider, AIProviderConfig } from '~/types/ai'

const providerConfigs: Record<AIProvider, AIProviderConfig> = {
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'QWEN_API_KEY',
    defaultModel: 'qwen-plus',
    models: ['qwen-flash', 'qwen-plus', 'qwen-max'],
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-v4-pro',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  },
}

export function createAIClient(provider: AIProvider): OpenAI {
  const config = providerConfigs[provider]
  const apiKey = process.env[config.apiKeyEnv]

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: `缺少 API Key: ${config.apiKeyEnv}. 请在 .env 文件中配置。`,
    })
  }

  return new OpenAI({
    baseURL: config.baseURL,
    apiKey,
  })
}

export function getProviderConfig(provider: AIProvider): AIProviderConfig {
  return providerConfigs[provider]
}

export function getDefaultModel(provider: AIProvider): string {
  return providerConfigs[provider].defaultModel
}
