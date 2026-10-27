import { shakeCoins, formatShakeResult } from '~/server/utils/bagua'
import type { BaguaShakeResult } from '~/types/fortune'

import { billingError, ledger, requestIp } from '../../services/billing/http'
import { digest } from '../../services/billing/ledger'

export default defineEventHandler(async (event) => {
  try { ledger().limit('draw:' + digest(requestIp(event)), 10, 60_000) } catch (error) { billingError(error) }

  const body = await readBody<{ locale?: string }>(event)
  const locale = body?.locale ?? 'zh-CN'

  const result = shakeCoins()
  const formattedText = formatShakeResult(result, locale)

  return {
    ...result,
    formattedText,
  } satisfies BaguaShakeResult & { formattedText: string }
})
