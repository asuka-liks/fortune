import { shakeCoins, formatShakeResult } from '~/server/utils/bagua'
import type { BaguaShakeResult } from '~/types/fortune'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ locale?: string }>(event)
  const locale = body?.locale ?? 'zh-CN'

  const result = shakeCoins()
  const formattedText = formatShakeResult(result, locale)

  return {
    ...result,
    formattedText,
  } satisfies BaguaShakeResult & { formattedText: string }
})
