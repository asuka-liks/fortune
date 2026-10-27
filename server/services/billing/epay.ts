import { createHash, timingSafeEqual } from 'node:crypto'
import { BillingError, type Order } from './ledger.ts'

export interface PaymentConfig { gateway: string; pid: string; key: string; siteUrl: string }
export function paymentConfig(): PaymentConfig | null {
  if (process.env.PAYMENTS_ENABLED !== 'true') return null
  const gateway = process.env.PAYMENT_GATEWAY ?? ''
  const pid = process.env.PAYMENT_PID ?? '', key = process.env.PAYMENT_KEY ?? ''
  const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  if (gateway !== 'https://pay.xiaodouap.cn/submit.php' || !/^\d{8}$/.test(pid) || !/^[a-fA-F0-9]{32}$/.test(key)) {
    throw new BillingError('支付配置尚未完成', 503)
  }
  const site = new URL(siteUrl)
  if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash) throw new BillingError('支付网站地址必须为 HTTPS', 503)
  return { gateway, pid, key, siteUrl }
}
export function signEpay(params: Record<string, string>, key: string) {
  const text = Object.keys(params).filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '')
    .sort().map(k => `${k}=${params[k]}`).join('&')
  return createHash('md5').update(text + key, 'utf8').digest('hex')
}
export function verifyEpay(params: Record<string, string>, key: string) {
  if ((params.sign_type && params.sign_type !== 'MD5') || !/^[a-f0-9]{32}$/.test(params.sign ?? '')) return false
  return timingSafeEqual(Buffer.from(params.sign, 'hex'), Buffer.from(signEpay(params, key), 'hex'))
}
export function moneyToFen(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{1,8}(\.\d{1,2})?$/.test(value)) throw new BillingError('金额格式错误')
  const [yuan, decimal = ''] = value.split('.')
  return Number(yuan) * 100 + Number(decimal.padEnd(2, '0'))
}
export function paymentForm(order: Order, config: PaymentConfig) {
  const fields: Record<string, string> = {
    pid: config.pid, type: order.channel, out_trade_no: order.id,
    money: (order.amount_fen / 100).toFixed(2), name: `AI 运势解读 ${order.credits} 次`,
    notify_url: `${config.siteUrl}/api/payments/xiaodou/notify`,
    return_url: `${config.siteUrl}/payment`, sign_type: 'MD5',
  }
  fields.sign = signEpay(fields, config.key)
  return { action: config.gateway, fields }
}
export function parseNotification(search: URLSearchParams, config: PaymentConfig) {
  const params: Record<string, string> = Object.create(null)
  for (const [key, value] of search) {
    if (Object.hasOwn(params, key) || value.length > 4096) throw new BillingError('通知参数无效')
    params[key] = value
  }
  if (!verifyEpay(params, config.key) || params.pid !== config.pid || params.trade_status !== 'TRADE_SUCCESS') {
    throw new BillingError('支付通知校验失败', 400)
  }
  return { id: params.out_trade_no, amountFen: moneyToFen(params.money), channel: params.type, tradeNo: params.trade_no }
}
/** 密钥只放服务端 POST 表单，不出现在 URL、浏览器或日志里。 */
export async function queryPayment(id: string, config: PaymentConfig) {
  const response = await fetch(new URL('api.php', config.gateway), {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ act: 'order', pid: config.pid, key: config.key, out_trade_no: id }),
  })
  if (!response.ok) throw new BillingError('暂时无法查询支付结果，请稍后重试', 502)
  const data = await response.json() as Record<string, unknown>
  if (Number(data.code) !== 1 || Number(data.status) !== 1) return null
  if (String(data.pid) !== config.pid || data.out_trade_no !== id || typeof data.trade_no !== 'string' || typeof data.type !== 'string') {
    throw new BillingError('支付查询结果与订单不符', 502)
  }
  return { id, amountFen: moneyToFen(data.money), channel: data.type, tradeNo: data.trade_no }
}
