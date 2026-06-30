import { shakeCoins, formatShakeResult } from '~/server/utils/bagua'
import type { BaguaShakeResult } from '~/types/fortune'

import { checkMinuteRateLimit } from '~/server/services/ai/rate-limiter'

export default defineEventHandler(async (event) => {
  // IP 频率限流
  const ip = getHeader(event, 'x-forwarded-for')
    ?? getHeader(event, 'x-real-ip')
    ?? 'unknown'
  if (!checkMinuteRateLimit(ip as string)) {
    throw createError({ statusCode: 429, statusMessage: '请求过于频繁，请稍后再试' })
  }

  const body = await readBody<{ locale?: string }>(event)
  const locale = body?.locale ?? 'zh-CN'

  const result = shakeCoins()
  const formattedText = formatShakeResult(result, locale)

  return {
    ...result,
    formattedText,
  } satisfies BaguaShakeResult & { formattedText: string }
})
