import { z } from 'zod'
import { digest } from '../../services/billing/ledger'
import { paymentConfig, paymentForm } from '../../services/billing/epay'
import { billingError, ledger, requestIp, requireWallet, sameOriginMutation } from '../../services/billing/http'

const schema = z.object({ packageId: z.enum(['single', 'dozen', 'thirty']), channel: z.enum(['alipay', 'wxpay']) }).strict()
export default defineEventHandler(async (event) => {
  sameOriginMutation(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: '请求参数错误' })
  const body = parsed.data
  const wallet = requireWallet(event)
  try {
    const config = paymentConfig()
    if (!config) throw createError({ statusCode: 503, message: '支付功能暂未开放' })
    const db = ledger()
    db.limit('order-ip:' + digest(requestIp(event)), 10, 60_000)
    db.limit('order-wallet:' + wallet.id, 5, 60_000)
    const order = db.createOrder(wallet.id, body.packageId, body.channel)
    return { orderId: order.id, ...paymentForm(order, config, getHeader(event, 'origin')) }
  } catch (error) { billingError(error) }
})
