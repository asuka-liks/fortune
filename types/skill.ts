/** 技能唯一标识 */
export type SkillId = 'bazi' | 'astrology' | 'tarot'

/** 技能输入字段定义 */
export interface SkillInputField {
  key: string
  label: string
  type: 'date' | 'datetime' | 'select' | 'number' | 'text'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

/** 完整的技能定义 */
export interface SkillDefinition {
  id: SkillId
  name: string
  description: string
  icon: string
  category: 'chinese' | 'western' | 'mystical'

  /** 系统提示词模板（中文），使用 {{placeholder}} 语法 */
  systemPrompt: string

  /** 系统提示词模板（英文） */
  systemPromptEn?: string

  /** 用户需要填写的输入字段 */
  inputs: SkillInputField[]

  /** 可选：特殊输入组件名称 (components/skills/forms/ 下) */
  inputComponent?: string

  /** 推荐使用的模型 */
  recommendedModel: string

  /** AI 回复最大 token 数 */
  maxTokens: number
}
