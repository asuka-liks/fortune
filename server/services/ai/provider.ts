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
    reasoning: true,
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

/** 推理模型的 max_tokens 需覆盖「思考 + 答案」，不能只按技能的答案预算算 */
const REASONING_MAX_TOKENS = 8192

/**
 * 计算实际传给 AI 的 max_tokens。
 * 推理模型（如 deepseek-v4-pro）会把大量 token 花在思考（reasoning_content）上，
 * 若仍用技能的答案预算（2048），答案会在思考阶段被 max_tokens 耗尽。
 */
export function getMaxTokens(provider: AIProvider, answerBudget: number): number {
  if (providerConfigs[provider].reasoning) {
    return Math.max(answerBudget, REASONING_MAX_TOKENS)
  }
  return answerBudget
}
