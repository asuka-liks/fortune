import { z } from 'zod'
import { digest } from '../../services/billing/ledger'
import { paymentConfig, paymentForm } from '../../services/billing/epay'
import { onePayCallbackUrl, onePayConfig, onePayPackages, onePayPurchase } from '../../services/billing/onepay'
import { billingError, ledger, requestIp, requireWallet, sameOriginMutation } from '../../services/billing/http'

const schema = z.object({
  packageId: z.enum(['single', 'dozen', 'thirty']), channel: z.enum(['alipay', 'wxpay']),
  requestId: z.string().uuid(),
}).strict()
export default defineEventHandler(async (event) => {
  sameOriginMutation(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: '请求参数错误' })
  const body = parsed.data
  const wallet = requireWallet(event)
  try {
    const db = ledger()
    db.limit('order-ip:' + digest(requestIp(event)), 10, 60_000)
    db.limit('order-wallet:' + wallet.id, 5, 60_000)
    if (body.channel === 'wxpay') {
      const config = paymentConfig()
      if (!config) throw createError({ statusCode: 503, message: '微信支付暂未开放' })
      const order = db.createOrder(wallet.id, body.packageId, 'wxpay')
      return { mode: 'form', orderId: order.id, ...paymentForm(order, config, getHeader(event, 'origin')) }
    }
    const config = process.env.PAYMENTS_ENABLED === 'true' ? onePayConfig() : null
    if (!config) throw createError({ statusCode: 503, message: '支付宝支付暂未开放' })
    const skuId = (await onePayPackages(config.key))[body.packageId]
    if (!skuId) throw createError({ statusCode: 503, message: '一人付暂未提供该价格和次数的套餐' })
    const id = 'ft_yp_' + body.requestId
    const callbackUrl = onePayCallbackUrl(getHeader(event, 'origin')!,
      process.env.ONEPAY_CALLBACK_URL || 'https://www.askoutsider.com/project/fortune/payment')
    const intent = db.startOnePayPurchase(wallet.id, body.packageId, skuId, callbackUrl ?? '', id)
    const entry = await onePayPurchase(config.key, wallet.id, intent.id, intent.sku_id, intent.callback_url)
    db.saveOnePayPurchaseUrl(wallet.id, id, entry.appUrl)
    return { mode: 'onepay', ...entry }
  } catch (error) { billingError(error) }
})
