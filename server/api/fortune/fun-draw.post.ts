import { drawFunCards, formatSGCard, formatSGThird } from '~/server/utils/sanguosha'
import { deriveByPoints, formatPointHexagram } from '~/server/utils/bagua'

import { checkMinuteRateLimit } from '~/server/services/ai/rate-limiter'

export default defineEventHandler(async (event) => {
  // IP 频率限流
  const ip = getHeader(event, 'x-forwarded-for')
    ?? getHeader(event, 'x-real-ip')
    ?? 'unknown'
  if (!checkMinuteRateLimit(ip as string)) {
    throw createError({ statusCode: 429, statusMessage: '请求过于频繁，请稍后再试' })
  }

  const body = await readBody(event).catch(() => ({}))
  const locale = body.locale || 'zh-CN'

  // 1. 抽牌
  const draw = drawFunCards()

  // 2. 数字起卦：用两张游戏牌的点数
  const hexagram = deriveByPoints(draw.cards[0].point, draw.cards[1].point)

  // 3. 格式化抽牌结果
  const cardTexts = draw.cards.map(c => formatSGCard(c, locale))
  const thirdText = formatSGThird(draw.third, locale)

  // 4. 格式化卦象结果
  const hexagramText = formatPointHexagram(hexagram, locale)

  // 5. 构建 AI prompt 用的完整文本
  const isEn = locale === 'en'
  const formattedText = isEn
    ? `## Drawn Cards
Card 1: ${cardTexts[0]}
Card 2: ${cardTexts[1]}
Card 3: ${thirdText}

${hexagramText}`
    : `## 抽牌结果
第一张：${cardTexts[0]}
第二张：${cardTexts[1]}
第三张：${thirdText}

${hexagramText}`

  return {
    draw,
    hexagram: {
      point1: hexagram.point1,
      point2: hexagram.point2,
      upperTrigram: hexagram.upperTrigram,
      lowerTrigram: hexagram.lowerTrigram,
      upperTrigramCalc: hexagram.upperTrigramCalc,
      lowerTrigramCalc: hexagram.lowerTrigramCalc,
      changingLine: hexagram.changingLine,
      changingLineCalc: hexagram.changingLineCalc,
      originalHexagram: hexagram.originalHexagram,
      derivedHexagram: hexagram.derivedHexagram,
      intergram: hexagram.intergram,
      interLower: hexagram.interLower,
      interUpper: hexagram.interUpper,
    },
    formattedText,
  }
})
