import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { request } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const code = 'PRIVATEACCESSKEYS'
const hash = createHash('sha256').update(code).digest('hex')
const port = 30000 + Math.floor(Math.random() * 20000)
const base = `http://127.0.0.1:${port}/project/fortune/api`

test('内部码通过公开域名来源校验，每次给当前浏览器增加 5 次', { timeout: 40000 }, async t => {
  const temp = mkdtempSync(join(tmpdir(), 'fortune-internal-credit-'))
  const child = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOST: '127.0.0.1',
      PAYMENT_DB_PATH: join(temp, 'billing.sqlite'), PAYMENTS_ENABLED: 'false', ONEPAY_API_KEY: '',
      NUXT_PUBLIC_SITE_URL: 'https://askoutsider.com/project/fortune', INTERNAL_CREDIT_CODE_HASH: hash },
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
    try { if ((await fetch(base + '/health')).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
    if (i === 99) throw new Error(`服务器启动超时：${stderr}`)
  }
  const api = (path, body, cookie = '', origin = 'https://www.askoutsider.com') => new Promise((resolve, reject) => {
    const outgoing = request(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Host: 'www.askoutsider.com', Origin: origin, Cookie: cookie,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    }, incoming => {
      let raw = ''
      incoming.setEncoding('utf8')
      incoming.on('data', chunk => { raw += chunk })
      incoming.on('end', () => resolve({ status: incoming.statusCode, data: JSON.parse(raw),
        cookie: incoming.headers['set-cookie']?.[0]?.split(';')[0] ?? null }))
    })
    outgoing.on('error', reject)
    outgoing.end(body === undefined ? undefined : JSON.stringify(body))
  })

  const initial = await api('/billing/overview')
  assert.equal(initial.status, 200)
  assert.equal(initial.data.quota.free, 3)
  assert.equal(initial.data.quota.paid, 0)
  const invalid = await api('/billing/account', { action: 'recover', recoveryCode: code.replace('PRIVATE', 'PUBLIC') })
  assert.equal(invalid.status, 401)
  assert.equal(invalid.cookie, null)

  const first = await api('/billing/account', { action: 'recover', recoveryCode: code })
  assert.equal(first.status, 200)
  assert.equal(first.data.grantedCredits, 5)
  assert.match(first.data.recoveryCode, /^[A-F0-9-]{53}$/)
  assert.ok(first.cookie)
  assert.equal((await api('/billing/overview', undefined, first.cookie)).data.quota.paid, 5)

  const second = await api('/billing/account', { action: 'recover', recoveryCode: code.toLowerCase() }, first.cookie)
  assert.equal(second.status, 200)
  assert.equal(second.data.grantedCredits, 5)
  assert.equal(second.data.recoveryCode, null)
  assert.equal((await api('/billing/overview', undefined, first.cookie)).data.quota.paid, 10)

  const crossSite = await api('/billing/account', { action: 'recover', recoveryCode: code }, first.cookie, 'https://untrusted.example')
  assert.equal(crossSite.status, 403)
  assert.equal((await api('/billing/overview', undefined, first.cookie)).data.quota.paid, 10)
  const recovered = await api('/billing/account', { action: 'recover', recoveryCode: first.data.recoveryCode })
  assert.equal(recovered.status, 200)
  assert.equal((await api('/billing/overview', undefined, recovered.cookie)).data.quota.paid, 10)
})
