import { PACKAGES } from '../../services/billing/ledger'
import { paymentConfig } from '../../services/billing/epay'
import { onePayBalance, onePayConfig, onePayPackages } from '../../services/billing/onepay'
import { currentWallet, ledger, noStore, requestIp } from '../../services/billing/http'

export default defineEventHandler(async (event) => {
  noStore(event)
  const wallet = currentWallet(event)
  let xiaodouEnabled = false
  try { xiaodouEnabled = !!paymentConfig() } catch { /* 微信配置错误不影响支付宝权益。 */ }
  const onepay = onePayConfig()
  let onePayBalanceCount = 0, onePayUnavailable = false
  let alipayPackages: string[] = []
  if (onepay) {
    const [products, balance] = await Promise.allSettled([
      process.env.PAYMENTS_ENABLED === 'true' ? onePayPackages(onepay.key) : Promise.resolve({}),
      wallet ? onePayBalance(onepay.key, wallet.id) : Promise.resolve(0),
    ])
    if (products.status === 'fulfilled') alipayPackages = Object.keys(products.value)
    if (balance.status === 'fulfilled') onePayBalanceCount = balance.value
    else onePayUnavailable = true
  }
  const quota = ledger().quota(requestIp(event), wallet?.id)
  return {
    enabled: xiaodouEnabled || alipayPackages.length > 0, packages: PACKAGES,
    channels: { wxpay: xiaodouEnabled, alipayPackages }, onePayUnavailable,
    hasWallet: !!wallet, recoverySaved: !!wallet?.recovery_saved,
    quota: { ...quota, paid: quota.paid + onePayBalanceCount, remaining: quota.remaining + onePayBalanceCount,
      xiaodou: quota.paid, onepay: onePayBalanceCount },
    orders: wallet ? ledger().orders(wallet.id).map(order => ({
      id: order.id, amountFen: order.amount_fen, credits: order.credits, status: order.status, createdAt: order.created_at,
    })) : [],
  }
})
