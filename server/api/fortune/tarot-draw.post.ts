import { drawCards, formatDrawnCards } from '~/server/utils/tarot'
import type { TarotDrawInput, TarotDrawResult } from '~/types/fortune'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ spreadType?: string }>(event)
  const spreadType = body?.spreadType ?? 'three-card'

  // 根据牌阵决定抽牌数量
  const cardCounts: Record<string, number> = {
    single: 1,
    'three-card': 3,
    'celtic-cross': 10,
  }

  const count = cardCounts[spreadType] ?? 3

  if (count > 10) {
    throw createError({
      statusCode: 400,
      statusMessage: '牌阵数量不能超过10张',
    })
  }

  const cards = drawCards(count)
  const formattedText = formatDrawnCards(cards)

  const result: TarotDrawResult = {
    spreadType,
    cards,
    timestamp: Date.now(),
  }

  return {
    ...result,
    formattedText,
  }
})
