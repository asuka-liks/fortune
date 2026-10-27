import { paymentConfig, parseNotification } from '../../../services/billing/epay'
import { billingError, ledger, noStore } from '../../../services/billing/http'

export default defineEventHandler((event) => {
  noStore(event)
  try {
    const config = paymentConfig()
    if (!config) throw createError({ statusCode: 503, message: '支付功能暂未开放' })
    const notification = parseNotification(getRequestURL(event).searchParams, config)
    ledger().creditOrder(notification.id, notification.amountFen, notification.channel, notification.tradeNo)
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return 'success'
  } catch (error) { billingError(error) }
})
