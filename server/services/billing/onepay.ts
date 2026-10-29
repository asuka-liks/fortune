import { BillingError, PACKAGES } from './ledger.ts'

const API_BASE = 'https://pay.66opc.com/api/pay/v1/'

interface ChargingOption {
  sku_id: string
  billing_mode: string
  price: string
  currency: string
  entitlement_rule: string
  quota_unit?: string
  quota_amount?: number
}

interface Product {
  capability_status: string
  billing_mode?: string
  quota_unit?: string
  charging_options: ChargingOption[]
}

interface Access {
  access_granted: boolean
  requires_consumption?: boolean
  quota_unit?: string
  remaining?: number
}

interface Purchase {
  status: 'READY' | 'FAILED' | 'UNKNOWN'
  idempotency_key: string
  purchase_url?: string
  purchase_qr_code?: string
}

interface Consumption {
  status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING' | 'UNKNOWN'
  confirmed: boolean
  idempotency_key: string
  consumed?: number
}

export function onePayConfig() {
  if (!process.env.ONEPAY_API_KEY) return null
  const key = process.env.ONEPAY_API_KEY
  if (!/^yrp_live_[A-Za-z0-9_-]+$/.test(key)) return null
  return { key }
}

async function request<T>(path: string, key: string, body?: object): Promise<T> {
  let response: Response
  try {
    response = await fetch(new URL(path, API_BASE), {
      method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch { throw new BillingError('一人付暂时无法连接，请稍后再试', 502) }
  if (!response.ok) throw new BillingError('一人付暂时无法处理请求，请稍后再试', 502)
  try { return await response.json() as T }
  catch { throw new BillingError('一人付响应无效，请稍后再试', 502) }
}

function priceFen(value: string): number | null {
  if (!/^\d{1,6}\.\d{2}$/.test(value)) return null
  const [yuan, fen] = value.split('.')
  return Number(yuan) * 100 + Number(fen)
}

/** 只有平台当前启用的 COUNT 次数包，且价格和次数都匹配本站套餐时才能出售。 */
export function matchingPackages(product: Product) {
  const result: Partial<Record<(typeof PACKAGES)[number]['id'], string>> = {}
  if (product.capability_status !== 'ENABLED' || product.billing_mode !== 'QUANTITY' || product.quota_unit !== 'COUNT' || !Array.isArray(product.charging_options)) return result
  for (const pack of PACKAGES) {
    const options = product.charging_options.filter(option =>
      option.billing_mode === 'QUANTITY' && option.entitlement_rule === 'QUOTA' &&
      option.currency === 'CNY' && option.quota_unit === 'COUNT' &&
      option.quota_amount === pack.credits && priceFen(option.price) === pack.amountFen &&
      typeof option.sku_id === 'string' && option.sku_id.length > 0,
    )
    if (options.length === 1) result[pack.id] = options[0].sku_id
  }
  return result
}

export async function onePayPackages(key: string) { return matchingPackages(await request<Product>('product', key)) }

export function onePayCallbackUrl(origin: string, registeredUrl: string) {
  const callback = new URL(registeredUrl)
  if (callback.protocol !== 'https:' || callback.username || callback.password) throw new BillingError('支付宝回跳地址配置无效', 503)
  return new URL(origin).host === callback.host ? callback.href : undefined
}

export async function onePayBalance(key: string, walletId: string): Promise<number> {
  const access = await request<Access>('access', key, { user_id: walletId, amount: 1 })
  if (access.quota_unit !== 'COUNT' || access.requires_consumption !== true ||
      !Number.isSafeInteger(access.remaining) || (access.remaining ?? -1) < 0 ||
      access.access_granted !== ((access.remaining ?? 0) > 0)) {
    throw new BillingError('一人付余额响应无效，请稍后再试', 502)
  }
  return access.remaining!
}

export async function onePayPurchase(key: string, walletId: string, id: string, skuId: string, callbackUrl?: string) {
  const purchase = await request<Purchase>('purchase', key, {
    user_id: walletId, idempotency_key: id, sku_id: skuId,
    ...(callbackUrl ? { callback_url: callbackUrl } : {}),
  })
  if (purchase.status !== 'READY' || purchase.idempotency_key !== id || !purchase.purchase_url || !purchase.purchase_qr_code) {
    throw new BillingError('支付宝购买入口尚未就绪，请稍后再试', 502)
  }
  let app: URL, qr: URL
  try { app = new URL(purchase.purchase_url); qr = new URL(purchase.purchase_qr_code) }
  catch { throw new BillingError('支付宝购买入口无效', 502) }
  if (app.protocol !== 'alipays:' || app.host !== 'platformapi' || app.pathname !== '/startapp' ||
      app.username || app.password || qr.protocol !== 'https:' ||
      qr.host !== 'mobilecodec.alipay.com' || qr.pathname !== '/show.htm' || qr.username || qr.password) {
    throw new BillingError('支付宝购买入口无效', 502)
  }
  return { appUrl: purchase.purchase_url, qrUrl: purchase.purchase_qr_code }
}

export async function onePayConsume(key: string, walletId: string, id: string) {
  return request<Consumption>('consume', key, {
    user_id: walletId, idempotency_key: id, amount: 1, reason: 'AI 运势解读',
  })
}

export async function onePayConsumption(key: string, walletId: string, id: string) {
  return request<Consumption>('consumption', key, { user_id: walletId, idempotency_key: id })
}

export function confirmedConsumption(value: Consumption, id: string) {
  return value.idempotency_key === id && value.status === 'SUCCEEDED' && value.confirmed === true && value.consumed === 1
}

/** 网络或平台状态不明时，只使用已保存的原编号重试或查询。 */
export async function settleOnePayConsumption(key: string, walletId: string, id: string, submitted = false): Promise<'confirmed' | 'failed' | 'pending'> {
  let value: Consumption
  try { value = submitted ? await onePayConsumption(key, walletId, id) : await onePayConsume(key, walletId, id) }
  catch {
    try { value = submitted ? await onePayConsume(key, walletId, id) : await onePayConsumption(key, walletId, id) }
    catch { return 'pending' }
  }
  if (confirmedConsumption(value, id)) return 'confirmed'
  if (value.idempotency_key === id && value.status === 'FAILED' && value.confirmed === false) return 'failed'
  try {
    value = await onePayConsumption(key, walletId, id)
    if (confirmedConsumption(value, id)) return 'confirmed'
    if (value.idempotency_key === id && value.status === 'FAILED' && value.confirmed === false) return 'failed'
  } catch { /* 保留原编号和回复，供下次查询。 */ }
  return 'pending'
}
