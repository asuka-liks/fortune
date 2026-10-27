import { currentWallet, ledger, noStore, requestIp } from '../../services/billing/http'

/** 免费次数按来源 IP，付费次数按恢复码账户计算。 */
export default defineEventHandler((event) => {
  noStore(event)
  return ledger().quota(requestIp(event), currentWallet(event)?.id)
})
