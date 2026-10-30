import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { Ledger, FREE_PER_DAY, INTERNAL_CREDIT_GRANT, RESERVATION_MS, digest, isInternalCreditCode } from '../server/services/billing/ledger.ts'
import { signEpay, verifyEpay, parseNotification, moneyToFen, paymentForm, queryPayment } from '../server/services/billing/epay.ts'

const config = { gateway: 'https://pay.xiaodouap.cn/submit.php', pid: '12345678', key: 'fixture-secret', siteUrl: 'https://example.com/project/fortune' }
function fixture(t) {
  const db = new Ledger(':memory:'); t.after(() => db.close())
  const account = db.createWallet(); db.confirmRecovery(account.wallet.id)
  return { db, account, walletId: account.wallet.id }
}
function buy(db, walletId, pack = 'single') {
  const order = db.createOrder(walletId, pack, 'alipay')
  db.creditOrder(order.id, order.amount_fen, 'alipay', 'trade_' + order.id)
  return order
}
function spendFree(db, ip = '203.0.113.1', now = Date.now()) {
  for (let i = 0; i < FREE_PER_DAY; i++) db.finish(db.reserve(ip, undefined, now), true, now)
}

test('每日免费次数为 3，额度用完后不能继续免费预占', t => {
  const { db } = fixture(t)
  assert.equal(FREE_PER_DAY, 3)
  spendFree(db, 'ip')
  assert.equal(db.quota('ip').free, 0)
  assert.throws(() => db.reserve('ip'), error => error.statusCode === 402)
})

test('内部码每次给同一匿名钱包增加 5 次，记录每笔发放', t => {
  const { db, walletId } = fixture(t)
  assert.equal(INTERNAL_CREDIT_GRANT, 5)
  assert.equal(db.grantInternalCredits(walletId).wallet.credits, 5)
  assert.equal(db.grantInternalCredits(walletId).wallet.credits, 10)
  assert.equal(db.wallet(walletId).credits, 10)
  assert.equal(db.db.prepare('SELECT COUNT(*) AS count FROM internal_credit_grants WHERE wallet_id=?').get(walletId).count, 2)
})

test('首次输入内部码时自动建立可恢复的匿名钱包', t => {
  const db = new Ledger(':memory:'); t.after(() => db.close())
  const grant = db.grantInternalCredits()
  assert.equal(grant.wallet.credits, 5)
  assert.equal(db.session(grant.token)?.id, grant.wallet.id)
  assert.equal(db.recover(grant.recoveryCode).wallet.id, grant.wallet.id)
})

test('内部码只接受已配置的正确随机码，大小写不影响验证', () => {
  const code = `INT-${'ABCD1234-'.repeat(5)}ABCD1234`
  const hash = digest(code.replaceAll('-', ''))
  assert.equal(isInternalCreditCode(code.toLowerCase(), hash), true)
  assert.equal(isInternalCreditCode(code.replace('ABCD', 'FFFF'), hash), false)
  assert.equal(isInternalCreditCode(code, undefined), false)
  assert.equal(isInternalCreditCode(code, 'bad-hash'), false)
})
test('恢复码只以摘要保存，换码撤销旧恢复码和其他会话', t => {
  const { db, account, walletId } = fixture(t)
  assert.equal(db.session(account.token)?.id, walletId)
  assert.equal(db.recover(account.recoveryCode.toLowerCase()).wallet.id, walletId)
  assert.notEqual(db.db.prepare('SELECT recovery_hash FROM wallets').get().recovery_hash, account.recoveryCode)
  const rotated = db.rotateRecovery(walletId)
  assert.equal(db.session(account.token), undefined)
  assert.throws(() => db.recover(account.recoveryCode), /恢复码不正确/)
  assert.equal(db.recover(rotated.recoveryCode).wallet.id, walletId)
  assert.equal(db.session(rotated.token)?.recovery_saved, 0)
})
test('未确认恢复码不能购买，套餐不能伪造', t => {
  const db = new Ledger(':memory:'); t.after(() => db.close())
  const { wallet } = db.createWallet()
  assert.throws(() => db.createOrder(wallet.id, 'single', 'alipay'), /恢复码/)
  db.confirmRecovery(wallet.id)
  assert.throws(() => db.createOrder(wallet.id, 'unlimited', 'alipay'), /不存在/)
  assert.deepEqual(['single','dozen','thirty'].map(p => { const o = db.createOrder(wallet.id, p, 'alipay'); return [o.amount_fen,o.credits] }), [[100,1],[990,12],[1990,30]])
})
test('重复付款通知只增加一次额度', t => {
  const { db, walletId } = fixture(t)
  const order = buy(db, walletId, 'dozen')
  assert.equal(db.creditOrder(order.id, 990, 'alipay', 'trade_' + order.id), false)
  assert.equal(db.wallet(walletId).credits, 12)
})
test('金额、支付方式和复用流水不符时拒绝发放', t => {
  const { db, walletId } = fixture(t), order = db.createOrder(walletId, 'single', 'alipay')
  assert.throws(() => db.creditOrder(order.id, 1, 'alipay', 'trade'), /不符/)
  assert.throws(() => db.creditOrder(order.id, 100, 'wxpay', 'trade'), /不符/)
  db.creditOrder(order.id, 100, 'alipay', 'trade')
  const second = db.createOrder(walletId, 'single', 'alipay')
  assert.throws(() => db.creditOrder(second.id, 100, 'alipay', 'trade'), /其他订单/)
  assert.equal(db.order(second.id).status, 'pending')
  assert.equal(db.wallet(walletId).credits, 1)
})
test('免费额度优先，付费次数不每日清零', t => {
  const { db, walletId } = fixture(t); buy(db, walletId, 'dozen')
  const now = Date.now(); spendFree(db, 'ip', now)
  const id = db.reserve('ip', walletId, now)
  assert.equal(db.wallet(walletId).credits, 11)
  assert.equal(db.finish(id, true, now), true)
  assert.deepEqual(db.quota('ip', walletId, now + 86400_000), { free: 3, paid: 11, remaining: 14, total: 3 })
})
test('多个未完成请求也不能超用免费或付费额度', t => {
  const { db, walletId } = fixture(t); buy(db, walletId)
  const held = Array.from({length: 4}, () => db.reserve('ip', walletId))
  assert.throws(() => db.reserve('ip', walletId), error => error.statusCode === 402)
  assert.equal(db.quota('ip', walletId).remaining, 0)
  for (const id of held) db.finish(id, false)
  assert.equal(db.quota('ip', walletId).remaining, 4)
})
test('失败、取消重复释放只返还一次，成功后不能再释放', t => {
  const { db, walletId } = fixture(t); buy(db, walletId); spendFree(db)
  const failed = db.reserve('203.0.113.1', walletId)
  db.finish(failed, false); db.finish(failed, false)
  assert.equal(db.wallet(walletId).credits, 1)
  const success = db.reserve('203.0.113.1', walletId)
  db.finish(success, true); db.finish(success, false)
  assert.equal(db.wallet(walletId).credits, 0)
})
test('跨上海零点失败只退还原日期的免费计数', t => {
  const { db } = fixture(t)
  const before = Date.parse('2026-10-25T15:59:59Z'), after = before + 2000
  const old = db.reserve('ip', undefined, before)
  db.reserve('ip', undefined, after); db.finish(old, false, after)
  assert.equal(db.quota('ip', undefined, after).free, 2)
})
test('重启后订单、会话和余额保留，崩溃遗留预占到期返还', t => {
  const dir = mkdtempSync(join(tmpdir(), 'fortune-ledger-'))
  const file = join(dir, 'billing.sqlite'), now = Date.now()
  let db = new Ledger(file)
  const account = db.createWallet(now); db.confirmRecovery(account.wallet.id)
  const order = buy(db, account.wallet.id); spendFree(db, 'ip', now)
  const reservation = db.reserve('ip', account.wallet.id, now)
  db.close(); db = new Ledger(file)
  t.after(() => {
    db.close()
    assert.equal(dirname(resolve(dir)), resolve(tmpdir()))
    rmSync(dir, { recursive: true, force: true })
  })
  assert.equal(db.session(account.token, now).id, account.wallet.id)
  assert.equal(db.order(order.id).status, 'paid')
  assert.equal(db.quota('ip', account.wallet.id, now + RESERVATION_MS + 1).paid, 1)
  assert.equal(db.finish(reservation, true, now + RESERVATION_MS + 1), false)
})
test('退款撤回次数，重复通知不会重新发放', t => {
  const { db, walletId } = fixture(t); const order = buy(db, walletId, 'dozen')
  db.recordRefund(order.id)
  assert.equal(db.wallet(walletId).credits, 0)
  assert.equal(db.order(order.id).status, 'refunded')
  assert.equal(db.creditOrder(order.id, 990, 'alipay', 'trade_' + order.id), false)
})
test('额度已消费不足或有进行中解读时阻止整包撤回', t => {
  const { db, walletId } = fixture(t); const order = buy(db, walletId); spendFree(db)
  const reservation = db.reserve('203.0.113.1', walletId)
  assert.throws(() => db.recordRefund(order.id), /进行中/)
  db.finish(reservation, true)
  assert.throws(() => db.recordRefund(order.id), /不足/)
})
test('恢复尝试和下单限流按窗口重置', t => {
  const { db } = fixture(t)
  db.limit('ip', 2, 60_000, 1000); db.limit('ip', 2, 60_000, 1000)
  assert.throws(() => db.limit('ip', 2, 60_000, 1000), error => error.statusCode === 429)
  assert.doesNotThrow(() => db.limit('ip', 2, 60_000, 61_000))
})
test('MD5 使用 ASCII 键顺序、原值和共享密钥，不签空字段或签名字段', () => {
  const params = { pid: '12345678', name: '中文 & test', money: '1.00', empty: '', sign: 'ignored', sign_type: 'MD5' }
  const expected = createHash('md5').update('money=1.00&name=中文 & test&pid=12345678fixture-secret').digest('hex')
  assert.equal(signEpay(params, config.key), expected)
  assert.equal(verifyEpay({...params, sign: expected}, config.key), true)
  assert.equal(verifyEpay({...params, money: '0.01', sign: expected}, config.key), false)
  assert.equal(verifyEpay({...params, sign: 'garbage'}, config.key), false)
  assert.equal(verifyEpay({...params, sign: expected, sign_type:'RSA'}, config.key), false)
})
test('金额用整数分比较，拒绝指数、负值及多于两位小数', () => {
  assert.equal(moneyToFen('9.9'), 990); assert.equal(moneyToFen('1.01'), 101)
  for (const input of ['1e2','-1','1.001','NaN','Infinity','',null,1]) assert.throws(() => moneyToFen(input))
})
test('通知校验商户号、成功状态和重复参数', () => {
  const params = { pid: config.pid, out_trade_no:'ft_test', trade_no:'trade', money:'1.00', type:'alipay', trade_status:'TRADE_SUCCESS' }
  const signed = p => new URLSearchParams({...p, sign:signEpay(p,config.key)})
  assert.equal(parseNotification(signed(params), config).amountFen,100)
  assert.throws(() => parseNotification(signed({...params,pid:'87654321'}),config))
  assert.throws(() => parseNotification(signed({...params,trade_status:'WAIT_BUYER_PAY'}),config))
  const duplicate = signed(params); duplicate.append('money','1.00')
  assert.throws(() => parseNotification(duplicate,config))
})
test('下单只返回签名表单，不泄露密钥；通知带部署子路径', t => {
  const {db,walletId}=fixture(t); const order=db.createOrder(walletId,'dozen','alipay')
  const form=paymentForm(order,config)
  assert.equal(form.fields.money,'9.90')
  assert.equal(form.fields.notify_url,'https://example.com/project/fortune/api/payments/xiaodou/notify')
  assert.equal(form.fields.return_url,'https://example.com/project/fortune/payment')
  assert.equal(JSON.stringify(form).includes(config.key),false)
  assert.equal(verifyEpay(form.fields,config.key),true)
  const thirty = db.createOrder(walletId, 'thirty', 'wxpay')
  const wechatForm = paymentForm(thirty, config)
  assert.equal(wechatForm.fields.money, '19.90')
  assert.equal(wechatForm.fields.type, 'wxpay')
  assert.equal(verifyEpay(wechatForm.fields, config.key), true)
})
test('从 www 域名付款时回跳原域名以保留额度账户', t => {
  const { db, walletId } = fixture(t)
  const order = db.createOrder(walletId, 'single', 'alipay')
  const form = paymentForm(order, config, 'https://www.example.com')
  assert.equal(form.fields.return_url, 'https://www.example.com/project/fortune/payment')
  assert.equal(form.fields.notify_url, 'https://example.com/project/fortune/api/payments/xiaodou/notify')
  assert.equal(verifyEpay(form.fields, config.key), true)
})
test('主动查单走 HTTPS POST，未知、未支付或错商户不能到账', async t => {
  const original=globalThis.fetch; t.after(()=>{globalThis.fetch=original})
  let response={code:1,status:1,pid:config.pid,out_trade_no:'ft_test',money:'1.00',trade_no:'trade',type:'alipay'}
  globalThis.fetch=async(url,options)=>{
    assert.equal(String(url),'https://pay.xiaodouap.cn/api.php')
    assert.equal(options.method,'POST'); assert.equal(options.body.get('key'),config.key)
    return Response.json(response)
  }
  assert.equal((await queryPayment('ft_test',config)).amountFen,100)
  response={...response,status:0}; assert.equal(await queryPayment('ft_test',config),null)
  response={...response,status:1,pid:'other'}; await assert.rejects(queryPayment('ft_test',config))
})

test('一人付购买请求先持久化，同一编号重试不改变套餐或回跳地址', t => {
  const { db, walletId } = fixture(t)
  const id = 'yp_purchase_test'
  const first = db.startOnePayPurchase(walletId, 'thirty', 'sku-30', 'https://example.com/payment', id)
  assert.equal(first.purchase_url, null)
  db.saveOnePayPurchaseUrl(walletId, id, 'https://render.alipay.com/checkout')
  assert.equal(db.startOnePayPurchase(walletId, 'thirty', 'sku-30', 'https://example.com/payment', id).purchase_url,
    'https://render.alipay.com/checkout')
  assert.throws(() => db.startOnePayPurchase(walletId, 'dozen', 'sku-12', 'https://example.com/payment', id), /不一致/)
  assert.equal(db.onePayPurchase('another-wallet', id), undefined)
})

test('一人付完整回复先保存再核销，重复请求只复用原回复', t => {
  const { db, walletId } = fixture(t)
  const id = 'yp_reading_test'
  assert.equal(db.startOnePayReading(walletId, id).state, 'generating')
  assert.equal(db.saveOnePayReading(walletId, id, '完整解读'), true)
  assert.equal(db.startOnePayReading(walletId, id).content, '完整解读')
  assert.equal(db.deliverOnePayReading(walletId, id), true)
  assert.equal(db.deliverOnePayReading(walletId, id), false)
  assert.equal(db.onePayReading(walletId, id).state, 'delivered')
  assert.equal(db.onePayReading('another-wallet', id), undefined)
})

test('改价前的微信订单仍按订单原价核实到账', t => {
  const { db, walletId } = fixture(t)
  const order = db.createOrder(walletId, 'thirty', 'wxpay')
  db.db.prepare('UPDATE orders SET amount_fen=2000 WHERE id=?').run(order.id)
  assert.equal(db.creditOrder(order.id, 2000, 'wxpay', 'old-price-trade'), true)
  assert.equal(db.wallet(walletId).credits, 30)
  assert.throws(() => db.creditOrder(order.id, 1990, 'wxpay', 'new-price-trade'), /不符/)
})
