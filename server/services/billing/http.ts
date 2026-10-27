import { resolve } from 'node:path'
import { isIP } from 'node:net'
import { createError, getCookie, getHeader, getRequestIP, getRequestURL, setCookie, setResponseHeader, type H3Event } from 'h3'
import { BillingError, Ledger } from './ledger.ts'

let instance: Ledger | undefined
export function ledger() { return instance ??= new Ledger(resolve(process.env.PAYMENT_DB_PATH || '.data/billing.sqlite')) }
const COOKIE = 'fortune_wallet'
export function requestIp(event: H3Event) {
  // 仅在 Nginx 覆盖 X-Real-IP 且容器不对公网开放时启用；不信任客户端的 X-Forwarded-For。
  const proxyIp = process.env.PAYMENT_TRUST_PROXY === 'true' ? getHeader(event, 'x-real-ip') : undefined
  const ip = proxyIp && isIP(proxyIp) ? proxyIp : getRequestIP(event, { xForwardedFor: false })
  if (!ip) throw createError({ statusCode: 400, message: '无法识别请求来源' })
  return ip.replace(/^::ffff:/, '')
}
export function currentWallet(event: H3Event) { return ledger().session(getCookie(event, COOKIE)) }
export function requireWallet(event: H3Event) {
  const wallet = currentWallet(event)
  if (!wallet) throw createError({ statusCode: 401, message: '请先创建恢复码或恢复已有额度' })
  return wallet
}
export function walletCookie(event: H3Event, token: string) {
  setCookie(event, COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/project/fortune/', maxAge: 365 * 86400,
  })
}
export function noStore(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'Referrer-Policy', 'no-referrer')
}
/** 购买、恢复、换码只接受本站 JSON 请求，拒绝跨站表单和跨站 fetch。 */
export function sameOriginMutation(event: H3Event) {
  noStore(event)
  const origin = getHeader(event, 'origin')
  const expected = process.env.NODE_ENV === 'production'
    ? new URL(process.env.NUXT_PUBLIC_SITE_URL || 'https://askoutsider.com/project/fortune').origin
    : getRequestURL(event, { xForwardedHost: false, xForwardedProto: false }).origin
  if (origin !== expected || !getHeader(event, 'content-type')?.toLowerCase().startsWith('application/json')) {
    throw createError({ statusCode: 403, message: '请求来源无效' })
  }
}
export function billingError(error: unknown): never {
  if (error instanceof BillingError) throw createError({ statusCode: error.statusCode, message: error.message })
  throw error
}
