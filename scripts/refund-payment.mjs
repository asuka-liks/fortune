import { resolve } from 'node:path'
import { Ledger } from '../server/services/billing/ledger.ts'

const [id, mode] = process.argv.slice(2)
if (!/^ft_[a-f0-9]{32}$/.test(id ?? '') || !['--inspect', '--confirmed'].includes(mode)) {
  console.error('用法：node scripts/refund-payment.mjs <订单号> --inspect 或 --confirmed（仅渠道退款成功后）')
  process.exit(1)
}
const db = new Ledger(resolve(process.env.PAYMENT_DB_PATH || '.data/billing.sqlite'))
try {
  const order = db.order(id)
  if (!order) throw new Error('找不到订单')
  if (mode === '--confirmed') db.recordRefund(id)
  console.log(JSON.stringify({ order: db.order(id), availableCredits: db.wallet(order.wallet_id)?.credits }, null, 2))
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally { db.close() }
