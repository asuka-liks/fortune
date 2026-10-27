import { PACKAGES } from '../../services/billing/ledger'
import { paymentConfig } from '../../services/billing/epay'
import { currentWallet, ledger, noStore, requestIp } from '../../services/billing/http'

export default defineEventHandler((event) => {
  noStore(event)
  const wallet = currentWallet(event)
  return {
    enabled: !!paymentConfig(), packages: PACKAGES,
    hasWallet: !!wallet, recoverySaved: !!wallet?.recovery_saved,
    quota: ledger().quota(requestIp(event), wallet?.id),
    orders: wallet ? ledger().orders(wallet.id).map(order => ({
      id: order.id, amountFen: order.amount_fen, credits: order.credits, status: order.status, createdAt: order.created_at,
    })) : [],
  }
})
