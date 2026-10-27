import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const key = '0123456789abcdef0123456789abcdef'
const site = 'https://askoutsider.com'
const prefix = '/project/fortune/api'
const port = 30000 + Math.floor(Math.random() * 20000)
const base = `http://127.0.0.1:${port}`

function sign(fields) {
  const text = Object.keys(fields).filter(k => !['sign', 'sign_type'].includes(k) && fields[k] !== '')
    .sort().map(k => `${k}=${fields[k]}`).join('&')
  return createHash('md5').update(text + key).digest('hex')
}

test('构建产物的匿名账户、下单、签名通知和额度查询', { timeout: 40000 }, async t => {
  const temp = mkdtempSync(join(tmpdir(), 'fortune-smoke-'))
  const child = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOST: '127.0.0.1',
      PAYMENTS_ENABLED: 'true', PAYMENT_GATEWAY: 'https://pay.xiaodouap.cn/submit.php',
      PAYMENT_PID: '49616103', PAYMENT_KEY: key, PAYMENT_DB_PATH: join(temp, 'billing.sqlite'),
      NUXT_PUBLIC_SITE_URL: 'https://askoutsider.com/project/fortune' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk.toString().slice(0, 2000) })
  t.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
    rmSync(temp, { recursive: true, force: true })
  })
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`服务器启动失败：${stderr}`)
    try { if ((await fetch(base + prefix + '/billing/overview')).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
    if (i === 99) throw new Error(`服务器启动超时：${stderr}`)
  }
  const api = async (path, body, cookie = '') => {
    const response = await fetch(base + prefix + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Origin: site, Cookie: cookie, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await response.json()
    return { response, data }
  }

  const invalid = await api('/billing/account', { action: 'fake' })
  assert.equal(invalid.response.status, 400, '非法请求体应返回 400')

  const created = await api('/billing/account', { action: 'create' })
  assert.equal(created.response.status, 200)
  assert.match(created.data.recoveryCode, /^[A-F0-9-]{53}$/)
  const cookie = created.response.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie)
  const premature = await api('/payments/orders', { packageId: 'single', channel: 'alipay' }, cookie)
  assert.equal(premature.response.status, 400)
  assert.equal((await api('/billing/account', { action: 'confirm' }, cookie)).response.status, 200)

  const purchase = await api('/payments/orders', { packageId: 'dozen', channel: 'alipay' }, cookie)
  assert.equal(purchase.response.status, 200)
  assert.equal(purchase.data.action, 'https://pay.xiaodouap.cn/submit.php')
  assert.equal(purchase.data.fields.money, '9.90')
  assert.equal(purchase.data.fields.sign, sign(purchase.data.fields))
  const id = purchase.data.orderId
  assert.equal((await api(`/payments/orders/${id}`)).response.status, 401)
  assert.equal((await api('/payments/orders', { packageId: 'unknown', channel: 'alipay' }, cookie)).response.status, 400)

  const badNotice = { pid: '49616103', out_trade_no: id, trade_no: 'forged',
    money: '9.90', type: 'alipay', trade_status: 'TRADE_SUCCESS', sign_type: 'MD5', sign: '0'.repeat(32) }
  assert.equal((await fetch(base + prefix + '/payments/xiaodou/notify?' + new URLSearchParams(badNotice))).status, 400)
  assert.equal((await api('/billing/overview', undefined, cookie)).data.quota.paid, 0)

  const notice = { pid: '49616103', out_trade_no: id, trade_no: 'smoke-trade-' + id,
    money: '9.90', type: 'alipay', trade_status: 'TRADE_SUCCESS', sign_type: 'MD5' }
  notice.sign = sign(notice)
  const notification = base + prefix + '/payments/xiaodou/notify?' + new URLSearchParams(notice)
  const first = await fetch(notification)
  assert.equal(first.status, 200)
  assert.equal(await first.text(), 'success')
  const repeat = await fetch(notification)
  assert.equal(await repeat.text(), 'success')
  const overview = await api('/billing/overview', undefined, cookie)
  assert.equal(overview.data.quota.paid, 12)
  assert.equal((await api(`/payments/orders/${id}`, undefined, cookie)).data.status, 'paid')
  const recovered = await api('/billing/account', { action: 'recover', recoveryCode: created.data.recoveryCode })
  assert.equal(recovered.response.status, 200)
  const otherCookie = recovered.response.headers.get('set-cookie')?.split(';')[0]
  assert.equal((await api('/billing/overview', undefined, otherCookie)).data.quota.paid, 12)
})
