import { paymentConfig, queryPayment } from '../../../services/billing/epay'
import { billingError, ledger, noStore, requireWallet } from '../../../services/billing/http'

export default defineEventHandler(async (event) => {
  noStore(event)
  const wallet = requireWallet(event), db = ledger()
  const id = getRouterParam(event, 'id') ?? ''
  const order = db.order(id)
  if (!order || order.wallet_id !== wallet.id) throw createError({ statusCode: 404, message: '找不到此订单，请先恢复购买时的额度账户' })
  let verificationPending = false
  try {
    db.limit('check:' + wallet.id, 30, 60_000)
    const config = paymentConfig()
    if (config && db.claimCheck(id)) {
      try {
        const paid = await queryPayment(id, config)
        if (paid) db.creditOrder(paid.id, paid.amountFen, paid.channel, paid.tradeNo)
      } catch {
        // 渠道不可用不能等同支付失败，更不能重建订单或增加次数。
        verificationPending = true
      }
    }
    const latest = db.order(id)!
    return { id, status: latest.status, credits: latest.credits, amountFen: latest.amount_fen, verificationPending }
  } catch (error) { billingError(error) }
})
