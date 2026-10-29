import { currentWallet, ledger, noStore, requestIp } from '../../services/billing/http'
import { onePayBalance, onePayConfig } from '../../services/billing/onepay'

/** 免费次数按来源 IP，付费次数按恢复码账户计算。 */
export default defineEventHandler(async (event) => {
  noStore(event)
  const wallet = currentWallet(event)
  const quota = ledger().quota(requestIp(event), wallet?.id)
  const config = onePayConfig()
  if (!wallet || !config) return quota
  try {
    const onepay = await onePayBalance(config.key, wallet.id)
    return { ...quota, paid: quota.paid + onepay, remaining: quota.remaining + onepay }
  } catch { return quota }
})
