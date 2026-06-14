/** 支持的 AI 供应商 */
export type AIProvider = 'qwen' | 'deepseek'

/** AI 供应商配置 */
export interface AIProviderConfig {
  baseURL: string
  apiKeyEnv: string
  defaultModel: string
  models: string[]
}

/** 塔罗牌数据 */
export interface TarotCard {
  id: number
  name: string
  nameCN: string
  arcana: 'major' | 'minor'
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles'
  upright: string
  reversed: string
  description: string
}

/** 抽取的塔罗牌结果 */
export interface DrawnCard {
  card: TarotCard
  orientation: 'upright' | 'reversed'
  position: string
}
