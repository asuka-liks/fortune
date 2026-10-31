import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export const PACKAGES = [
  { id: 'single', amountFen: 100, credits: 1 },
  { id: 'dozen', amountFen: 990, credits: 12 },
  { id: 'thirty', amountFen: 1990, credits: 30 },
] as const
export const FREE_PER_DAY = 3
export const INTERNAL_CREDIT_GRANT = 5
export const RESERVATION_MS = 10 * 60_000
const SESSION_MS = 365 * 24 * 3600_000
export const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const recoveryHash = (code: string) => digest(code.replaceAll('-', '').trim().toUpperCase())
export function isInternalCreditCode(code: string, configuredHash?: string) {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z0-9_-]{16,80}$/.test(normalized) || !configuredHash || !/^[A-Fa-f0-9]{64}$/.test(configuredHash)) return false
  return timingSafeEqual(Buffer.from(digest(normalized), 'hex'), Buffer.from(configuredHash, 'hex'))
}
const newRecovery = () => randomBytes(24).toString('hex').toUpperCase().match(/.{8}/g)!.join('-')
const dayKey = (now: number) => new Date(now + 8 * 3600_000).toISOString().slice(0, 10)

export class BillingError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) { super(message); this.statusCode = statusCode }
}
export interface Wallet { id: string; credits: number; recovery_saved: number }
export interface Order {
  id: string; wallet_id: string; amount_fen: number; credits: number
  channel: 'alipay' | 'wxpay'; status: 'pending' | 'paid' | 'refunded'
  trade_no: string | null; created_at: number; last_checked_at: number
}
export interface OnePayPurchase {
  id: string; wallet_id: string; package_id: string; sku_id: string
  callback_url: string; purchase_url: string | null; created_at: number
}
export interface OnePayReading {
  id: string; wallet_id: string; state: 'generating' | 'awaiting' | 'delivered'
  content: string | null; created_at: number
}
interface Reservation {
  id: string; wallet_id: string | null; free_key: string | null; day: string
  state: 'reserved' | 'committed' | 'released'; expires_at: number
}

/** 金额、到账和扣次全部在 SQLite 事务内处理；单实例部署，数据库放在持久卷。 */
export class Ledger {
  db: DatabaseSync
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
    this.db = new DatabaseSync(path)
    this.db.exec(`
      PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY, recovery_hash TEXT UNIQUE NOT NULL,
        recovery_saved INTEGER NOT NULL DEFAULT 0, credits INTEGER NOT NULL DEFAULT 0 CHECK(credits >= 0)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, wallet_id TEXT NOT NULL REFERENCES wallets(id), expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL REFERENCES wallets(id),
        amount_fen INTEGER NOT NULL CHECK(amount_fen > 0), credits INTEGER NOT NULL CHECK(credits > 0),
        channel TEXT NOT NULL CHECK(channel IN ('alipay','wxpay')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','refunded')),
        trade_no TEXT UNIQUE, created_at INTEGER NOT NULL, last_checked_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS orders_wallet ON orders(wallet_id, created_at);
      CREATE TABLE IF NOT EXISTS free_usage (
        ip_hash TEXT NOT NULL, day TEXT NOT NULL, used INTEGER NOT NULL CHECK(used >= 0),
        PRIMARY KEY(ip_hash, day)
      );
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY, wallet_id TEXT REFERENCES wallets(id), free_key TEXT, day TEXT NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('reserved','committed','released')), expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS reservations_expiry ON reservations(state, expires_at);
      CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS internal_credit_grants (
        id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL REFERENCES wallets(id),
        credits INTEGER NOT NULL CHECK(credits > 0), created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS internal_credit_grants_wallet ON internal_credit_grants(wallet_id, created_at);
      CREATE TABLE IF NOT EXISTS onepay_purchases (
        id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL REFERENCES wallets(id),
        package_id TEXT NOT NULL, sku_id TEXT NOT NULL, callback_url TEXT NOT NULL,
        purchase_url TEXT, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS onepay_readings (
        id TEXT PRIMARY KEY, wallet_id TEXT NOT NULL REFERENCES wallets(id),
        state TEXT NOT NULL CHECK(state IN ('generating','awaiting','delivered')),
        content TEXT, created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS onepay_readings_wallet ON onepay_readings(wallet_id, state);
    `)
  }
  close() { this.db.close() }
  private transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE')
    try { const result = fn(); this.db.exec('COMMIT'); return result }
    catch (error) { this.db.exec('ROLLBACK'); throw error }
  }
  wallet(id: string) { return this.db.prepare('SELECT id, credits, recovery_saved FROM wallets WHERE id=?').get(id) as Wallet | undefined }
  session(token?: string, now = Date.now()) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return undefined
    const row = this.db.prepare('SELECT wallet_id FROM sessions WHERE token_hash=? AND expires_at>?').get(digest(token), now)
    return row ? this.wallet(row.wallet_id as string) : undefined
  }
  private addSession(walletId: string, now: number) {
    const token = randomBytes(32).toString('hex')
    this.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token), walletId, now + SESSION_MS)
    return token
  }
  createWallet(now = Date.now()) {
    return this.transaction(() => {
      const id = randomUUID(), recoveryCode = newRecovery()
      this.db.prepare('INSERT INTO wallets (id,recovery_hash) VALUES (?,?)').run(id, recoveryHash(recoveryCode))
      return { wallet: this.wallet(id)!, recoveryCode, token: this.addSession(id, now) }
    })
  }
  recover(code: string, now = Date.now()) {
    if (!/^[A-Fa-f0-9-]{48,53}$/.test(code.trim())) throw new BillingError('恢复码不正确', 401)
    return this.transaction(() => {
      const row = this.db.prepare('SELECT id FROM wallets WHERE recovery_hash=?').get(recoveryHash(code))
      if (!row) throw new BillingError('恢复码不正确', 401)
      return { wallet: this.wallet(row.id as string)!, token: this.addSession(row.id as string, now) }
    })
  }
  rotateRecovery(walletId: string, now = Date.now()) {
    return this.transaction(() => {
      const recoveryCode = newRecovery()
      this.db.prepare('UPDATE wallets SET recovery_hash=?, recovery_saved=0 WHERE id=?').run(recoveryHash(recoveryCode), walletId)
      this.db.prepare('DELETE FROM sessions WHERE wallet_id=?').run(walletId)
      return { recoveryCode, token: this.addSession(walletId, now) }
    })
  }
  confirmRecovery(walletId: string) { this.db.prepare('UPDATE wallets SET recovery_saved=1 WHERE id=?').run(walletId) }
  grantInternalCredits(walletId?: string, now = Date.now()) {
    return this.transaction(() => {
      let recoveryCode: string | null = null
      let token: string | null = null
      if (!walletId) {
        walletId = randomUUID()
        recoveryCode = newRecovery()
        this.db.prepare('INSERT INTO wallets (id,recovery_hash) VALUES (?,?)').run(walletId, recoveryHash(recoveryCode))
        token = this.addSession(walletId, now)
      } else if (!this.wallet(walletId)) throw new BillingError('额度账户不存在', 404)
      this.db.prepare('INSERT INTO internal_credit_grants VALUES (?,?,?,?)').run(randomUUID(), walletId, INTERNAL_CREDIT_GRANT, now)
      this.db.prepare('UPDATE wallets SET credits=credits+? WHERE id=?').run(INTERNAL_CREDIT_GRANT, walletId)
      return { wallet: this.wallet(walletId)!, recoveryCode, token }
    })
  }
  limit(key: string, max: number, windowMs: number, now = Date.now()) {
    return this.transaction(() => {
      this.db.prepare('DELETE FROM rate_limits WHERE reset_at<=?').run(now)
      const row = this.db.prepare('SELECT count FROM rate_limits WHERE key=?').get(key)
      if (row && Number(row.count) >= max) throw new BillingError('操作过于频繁，请稍后重试', 429)
      this.db.prepare('INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, now + windowMs)
    })
  }
  private releaseRow(row: Reservation) {
    if (row.free_key) this.db.prepare('UPDATE free_usage SET used=used-1 WHERE ip_hash=? AND day=? AND used>0').run(row.free_key, row.day)
    else if (row.wallet_id) this.db.prepare('UPDATE wallets SET credits=credits+1 WHERE id=?').run(row.wallet_id)
    this.db.prepare("UPDATE reservations SET state='released' WHERE id=?").run(row.id)
  }
  private expire(now: number) {
    const rows = this.db.prepare("SELECT * FROM reservations WHERE state='reserved' AND expires_at<=?").all(now) as unknown as Reservation[]
    for (const row of rows) this.releaseRow(row)
    this.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now)
    this.db.prepare('DELETE FROM free_usage WHERE day<?').run(dayKey(now - 2 * 86400_000))
  }
  quota(ip: string, walletId?: string, now = Date.now()) {
    return this.transaction(() => {
      this.expire(now)
      const row = this.db.prepare('SELECT used FROM free_usage WHERE ip_hash=? AND day=?').get(digest(ip), dayKey(now))
      const free = Math.max(0, FREE_PER_DAY - Number(row?.used ?? 0))
      const paid = walletId ? this.wallet(walletId)?.credits ?? 0 : 0
      return { free, paid, remaining: free + paid, total: FREE_PER_DAY }
    })
  }
  reserve(ip: string, walletId?: string, now = Date.now()) {
    return this.transaction(() => {
      this.expire(now)
      const ipHash = digest(ip), day = dayKey(now), id = randomUUID()
      this.db.prepare('INSERT OR IGNORE INTO free_usage VALUES (?,?,0)').run(ipHash, day)
      const free = this.db.prepare('UPDATE free_usage SET used=used+1 WHERE ip_hash=? AND day=? AND used<?').run(ipHash, day, FREE_PER_DAY).changes
      if (!free) {
        const paid = walletId && this.db.prepare('UPDATE wallets SET credits=credits-1 WHERE id=? AND credits>0').run(walletId).changes
        if (!paid) throw new BillingError('今日免费次数已用完，请购买次数包或恢复已有额度', 402)
      }
      this.db.prepare("INSERT INTO reservations VALUES (?,?,?,?, 'reserved', ?)").run(id, walletId ?? null, free ? ipHash : null, day, now + RESERVATION_MS)
      return id
    })
  }
  finish(id: string, success: boolean, now = Date.now()) {
    return this.transaction(() => {
      const row = this.db.prepare('SELECT * FROM reservations WHERE id=?').get(id) as unknown as Reservation | undefined
      if (!row || row.state !== 'reserved') return false
      if (!success || row.expires_at <= now) { this.releaseRow(row); return false }
      this.db.prepare("UPDATE reservations SET state='committed' WHERE id=?").run(id)
      return true
    })
  }
  createOrder(walletId: string, packageId: string, channel: 'alipay' | 'wxpay', now = Date.now()) {
    const pack = PACKAGES.find(p => p.id === packageId)
    if (!pack) throw new BillingError('次数包不存在')
    return this.transaction(() => {
      if (!this.wallet(walletId)?.recovery_saved) throw new BillingError('请先保存并确认恢复码')
      const id = 'ft_' + randomBytes(16).toString('hex')
      this.db.prepare('INSERT INTO orders (id,wallet_id,amount_fen,credits,channel,created_at) VALUES (?,?,?,?,?,?)')
        .run(id, walletId, pack.amountFen, pack.credits, channel, now)
      return this.order(id)!
    })
  }
  order(id: string) { return this.db.prepare('SELECT * FROM orders WHERE id=?').get(id) as unknown as Order | undefined }
  orders(walletId: string) { return this.db.prepare('SELECT * FROM orders WHERE wallet_id=? ORDER BY created_at DESC LIMIT 10').all(walletId) as unknown as Order[] }
  onePayPurchase(walletId: string, id: string) {
    return this.db.prepare('SELECT * FROM onepay_purchases WHERE id=? AND wallet_id=?').get(id, walletId) as OnePayPurchase | undefined
  }
  startOnePayPurchase(walletId: string, packageId: string, skuId: string, callbackUrl: string, id: string, now = Date.now()) {
    return this.transaction(() => {
      if (!this.wallet(walletId)?.recovery_saved) throw new BillingError('请先保存并确认恢复码')
      const existing = this.onePayPurchase(walletId, id)
      if (existing) {
        if (existing.package_id !== packageId || existing.sku_id !== skuId || existing.callback_url !== callbackUrl) {
          throw new BillingError('购买请求与原请求不一致')
        }
        return existing
      }
      this.db.prepare('INSERT INTO onepay_purchases VALUES (?,?,?,?,?,NULL,?)')
        .run(id, walletId, packageId, skuId, callbackUrl, now)
      return this.onePayPurchase(walletId, id)!
    })
  }
  saveOnePayPurchaseUrl(walletId: string, id: string, url: string) {
    this.db.prepare('UPDATE onepay_purchases SET purchase_url=? WHERE id=? AND wallet_id=?').run(url, id, walletId)
  }
  onePayReading(walletId: string, id: string) {
    return this.db.prepare('SELECT * FROM onepay_readings WHERE id=? AND wallet_id=?').get(id, walletId) as OnePayReading | undefined
  }
  startOnePayReading(walletId: string, id: string, now = Date.now()) {
    return this.transaction(() => {
      const existing = this.onePayReading(walletId, id)
      if (existing) return existing
      this.db.prepare("INSERT INTO onepay_readings VALUES (?,?,'generating',NULL,?)").run(id, walletId, now)
      return this.onePayReading(walletId, id)!
    })
  }
  saveOnePayReading(walletId: string, id: string, content: string) {
    return !!this.db.prepare("UPDATE onepay_readings SET state='awaiting',content=? WHERE id=? AND wallet_id=? AND state='generating'")
      .run(content, id, walletId).changes
  }
  deliverOnePayReading(walletId: string, id: string) {
    return !!this.db.prepare("UPDATE onepay_readings SET state='delivered' WHERE id=? AND wallet_id=? AND state='awaiting'")
      .run(id, walletId).changes
  }
  removeOnePayReading(walletId: string, id: string) {
    this.db.prepare("DELETE FROM onepay_readings WHERE id=? AND wallet_id=? AND state='generating'").run(id, walletId)
  }
  discardOnePayReading(walletId: string, id: string) {
    this.db.prepare("DELETE FROM onepay_readings WHERE id=? AND wallet_id=? AND state='awaiting'").run(id, walletId)
  }
  claimCheck(id: string, now = Date.now()) {
    return !!this.db.prepare("UPDATE orders SET last_checked_at=? WHERE id=? AND status='pending' AND last_checked_at<?")
      .run(now, id, now - 15_000).changes
  }
  creditOrder(id: string, amountFen: number, channel: string, tradeNo: string) {
    return this.transaction(() => {
      const order = this.order(id)
      if (!order || order.amount_fen !== amountFen || order.channel !== channel || !tradeNo || tradeNo.length > 128) {
        throw new BillingError('支付通知与订单不符')
      }
      if (order.status !== 'pending') {
        if (order.trade_no !== tradeNo) throw new BillingError('支付流水与订单不符')
        return false
      }
      const used = this.db.prepare('SELECT id FROM orders WHERE trade_no=?').get(tradeNo)
      if (used) throw new BillingError('支付流水已用于其他订单')
      this.db.prepare("UPDATE orders SET status='paid',trade_no=? WHERE id=?").run(tradeNo, id)
      this.db.prepare('UPDATE wallets SET credits=credits+? WHERE id=?').run(order.credits, order.wallet_id)
      return true
    })
  }
  /** 仅供服务器运维在确认渠道退款成功后调用，不暴露公网接口。 */
  recordRefund(id: string) {
    return this.transaction(() => {
      const order = this.order(id)
      if (!order || order.status !== 'paid') throw new BillingError('订单不是可退款状态')
      const pending = this.db.prepare("SELECT id FROM reservations WHERE wallet_id=? AND state='reserved' LIMIT 1").get(order.wallet_id)
      if (pending) throw new BillingError('该用户仍有进行中的解读，请等待完成')
      const changed = this.db.prepare('UPDATE wallets SET credits=credits-? WHERE id=? AND credits>=?').run(order.credits, order.wallet_id, order.credits).changes
      if (!changed) throw new BillingError('剩余额度不足以撤回整包次数，请人工处理已消费部分')
      this.db.prepare("UPDATE orders SET status='refunded' WHERE id=?").run(id)
    })
  }
}
