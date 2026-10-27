import { z } from 'zod'
import { digest } from '../../services/billing/ledger'
import { billingError, currentWallet, ledger, requestIp, requireWallet, sameOriginMutation, walletCookie } from '../../services/billing/http'

const schema = z.object({ action: z.enum(['create', 'recover', 'rotate', 'confirm']), recoveryCode: z.string().max(80).optional() }).strict()
export default defineEventHandler(async (event) => {
  sameOriginMutation(event)
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: '请求参数错误' })
  const body = parsed.data
  try {
    const db = ledger()
    db.limit('account:' + digest(requestIp(event)), 10, 60_000)
    if (body.action === 'create') {
      const existing = currentWallet(event)
      if (existing) return { recoveryCode: null, saved: !!existing.recovery_saved }
      const account = db.createWallet()
      walletCookie(event, account.token)
      return { recoveryCode: account.recoveryCode, saved: false }
    }
    if (body.action === 'recover') {
      const account = db.recover(body.recoveryCode ?? '')
      walletCookie(event, account.token)
      return { recoveryCode: null, saved: !!account.wallet.recovery_saved }
    }
    const wallet = requireWallet(event)
    if (body.action === 'rotate') {
      const result = db.rotateRecovery(wallet.id)
      walletCookie(event, result.token)
      return { recoveryCode: result.recoveryCode, saved: false }
    }
    db.confirmRecovery(wallet.id)
    return { recoveryCode: null, saved: true }
  } catch (error) { billingError(error) }
})
