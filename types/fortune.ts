import type { DrawnCard } from './ai'

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

/** 爻类型 */
export type YaoType = '老阴' | '少阳' | '少阴' | '老阳'

/** 单次摇卦结果 */
export interface CoinShakeResult {
  index: number
  heads: number
  type: YaoType
  isYang: boolean
  isChanging: boolean
}

/** 卦数据 */
export interface HexagramInfo {
  id: number
  name: string
  nameCN: string
  upperTrigram: string
  lowerTrigram: string
  description: string
  descriptionEn: string
  judgment: string
  judgmentEn: string
}

/** 八卦摇卦结果 */
export interface BaguaShakeResult {
  shakes: CoinShakeResult[]
  originalLines: boolean[]
  originalHexagram: HexagramInfo
  derivedHexagram: HexagramInfo | null
  changingLineIndices: number[]
  timestamp: number
}

/** 所有技能上下文联合类型 */
export interface SkillContext {
  bazi?: BaZiInput
  astrology?: AstrologyInput
  tarot?: TarotDrawResult
  bagua?: BaguaShakeResult
  fun?: Record<string, string>
}
