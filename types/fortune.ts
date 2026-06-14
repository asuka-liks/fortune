/** 八字输入数据 */
export interface BaZiInput {
  birthDate: string
  birthTime: string
  gender: 'male' | 'female'
}

/** 星座运势输入数据 */
export interface AstrologyInput {
  zodiacSign: string
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

/** 塔罗抽牌输入 */
export interface TarotDrawInput {
  spreadType: 'single' | 'three-card' | 'celtic-cross'
}

/** 抽牌结果 */
export interface TarotDrawResult {
  spreadType: string
  cards: DrawnCard[]
  timestamp: number
}

/** 所有技能上下文联合类型 */
export interface SkillContext {
  bazi?: BaZiInput
  astrology?: AstrologyInput
  tarot?: TarotDrawResult
}
