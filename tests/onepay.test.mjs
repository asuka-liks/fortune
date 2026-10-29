import test from 'node:test'
import assert from 'node:assert/strict'
import {
  matchingPackages, onePayBalance, onePayPurchase, onePayConsume, onePayConsumption, confirmedConsumption, onePayConfig,
  settleOnePayConsumption, onePayCallbackUrl,
} from '../server/services/billing/onepay.ts'

const key = 'yrp_live_test_only'
const wallet = 'wallet-test'
const id = 'ft_test'

test('暂停新购买时仍可读取一人付配置以使用已有次数', t => {
  const oldKey = process.env.ONEPAY_API_KEY, oldEnabled = process.env.PAYMENTS_ENABLED
  t.after(() => {
    if (oldKey === undefined) delete process.env.ONEPAY_API_KEY
    else process.env.ONEPAY_API_KEY = oldKey
    if (oldEnabled === undefined) delete process.env.PAYMENTS_ENABLED
    else process.env.PAYMENTS_ENABLED = oldEnabled
  })
  process.env.ONEPAY_API_KEY = key
  process.env.PAYMENTS_ENABLED = 'false'
  assert.deepEqual(onePayConfig(), { key })
  process.env.ONEPAY_API_KEY = 'bad-key'
  assert.equal(onePayConfig(), null)
})

function stub(t, handler) {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).origin, 'https://pay.66opc.com')
    assert.equal(options.headers.Authorization, `Bearer ${key}`)
    assert.equal(options.redirect, 'error')
    return handler(new URL(url).pathname, options)
  }
}

test('只匹配已启用、价格和次数完全相同的一人付套餐', () => {
  const option = (sku_id, price, quota_amount) => ({
    sku_id, price, quota_amount, billing_mode: 'QUANTITY', entitlement_rule: 'QUOTA',
    currency: 'CNY', quota_unit: 'COUNT',
  })
  const product = {
    capability_status: 'ENABLED', billing_mode: 'QUANTITY', quota_unit: 'COUNT',
    charging_options: [option('one', '1.00', 1), option('twelve', '9.90', 12), option('thirty', '19.90', 30),
      option('old-price', '20.00', 30), option('wrong-count', '19.90', 29)],
  }
  assert.deepEqual(matchingPackages(product), { single: 'one', dozen: 'twelve', thirty: 'thirty' })
  assert.deepEqual(matchingPackages({ ...product, capability_status: 'PENDING' }), {})
  assert.deepEqual(matchingPackages({ ...product, charging_options: [...product.charging_options, option('duplicate', '19.90', 30)] }),
    { single: 'one', dozen: 'twelve' })
})

test('余额来自一人付权益，拒绝不一致或非次数响应', async t => {
  let access = { access_granted: true, requires_consumption: true, quota_unit: 'COUNT', remaining: 12 }
  stub(t, (path, options) => {
    assert.equal(path, '/api/pay/v1/access')
    assert.deepEqual(JSON.parse(options.body), { user_id: wallet, amount: 1 })
    return Response.json(access)
  })
  assert.equal(await onePayBalance(key, wallet), 12)
  access = { ...access, remaining: 0, access_granted: false }
  assert.equal(await onePayBalance(key, wallet), 0)
  access = { ...access, remaining: 1 }
  await assert.rejects(onePayBalance(key, wallet), /余额响应无效/)
})

test('购买入口指定平台 SKU 和固定用户 ID，不将密钥放入返回 URL', async t => {
  stub(t, (path, options) => {
    assert.equal(path, '/api/pay/v1/purchase')
    assert.deepEqual(JSON.parse(options.body), {
      user_id: wallet, idempotency_key: id, sku_id: 'sku-test', callback_url: 'https://example.com/payment',
    })
    return Response.json({ status: 'READY', idempotency_key: id,
      purchase_url: 'alipays://platformapi/startapp?appId=test',
      purchase_qr_code: 'https://mobilecodec.alipay.com/show.htm?code=test' })
  })
  const entry = await onePayPurchase(key, wallet, id, 'sku-test', 'https://example.com/payment')
  assert.equal(entry.appUrl, 'alipays://platformapi/startapp?appId=test')
  assert.equal(JSON.stringify(entry).includes(key), false)
})

test('购买入口未就绪、协议不安全时拒绝跳转', async t => {
  let purchase = { status: 'UNKNOWN', idempotency_key: id,
    purchase_url: 'alipays://platformapi/startapp?appId=test',
    purchase_qr_code: 'https://mobilecodec.alipay.com/show.htm?code=test' }
  stub(t, () => Response.json(purchase))
  await assert.rejects(onePayPurchase(key, wallet, id, 'sku', 'https://example.com/payment'))
  purchase = { ...purchase, status: 'READY', purchase_url: 'http://example.com/' }
  await assert.rejects(onePayPurchase(key, wallet, id, 'sku', 'https://example.com/payment'))
})

test('真实接口的支付宝 App 链接和扫码页面都可交给买家', async t => {
  stub(t, (path, options) => {
    assert.equal(path, '/api/pay/v1/purchase')
    assert.equal(JSON.parse(options.body).callback_url, 'https://www.example.com/payment')
    return Response.json({
      status: 'READY', idempotency_key: id,
      purchase_url: 'alipays://platformapi/startapp?appId=test',
      purchase_qr_code: 'https://mobilecodec.alipay.com/show.htm?code=test',
    })
  })
  assert.deepEqual(await onePayPurchase(key, wallet, id, 'sku-test', 'https://www.example.com/payment'), {
    appUrl: 'alipays://platformapi/startapp?appId=test',
    qrUrl: 'https://mobilecodec.alipay.com/show.htm?code=test',
  })
})

test('仅从登记的 www 域名购买才使用一人付回跳地址', async t => {
  const callback = 'https://www.example.com/project/fortune/payment'
  assert.equal(onePayCallbackUrl('https://www.example.com', callback), callback)
  assert.equal(onePayCallbackUrl('https://example.com', callback), undefined)
  stub(t, (path, options) => {
    assert.equal(path, '/api/pay/v1/purchase')
    assert.equal(Object.hasOwn(JSON.parse(options.body), 'callback_url'), false)
    return Response.json({ status: 'READY', idempotency_key: id,
      purchase_url: 'alipays://platformapi/startapp?appId=test',
      purchase_qr_code: 'https://mobilecodec.alipay.com/show.htm?code=test' })
  })
  assert.equal((await onePayPurchase(key, wallet, id, 'sku-test')).qrUrl,
    'https://mobilecodec.alipay.com/show.htm?code=test')
})

test('核销只认原请求号、确认状态及实际扣除一次；查询保持同一编号', async t => {
  stub(t, (path, options) => {
    assert.ok(path.endsWith('/consume') || path.endsWith('/consumption'))
    const body = JSON.parse(options.body)
    assert.equal(body.user_id, wallet)
    assert.equal(body.idempotency_key, id)
    if (path.endsWith('/consume')) assert.deepEqual(body, {
      user_id: wallet, idempotency_key: id, amount: 1, reason: 'AI 运势解读',
    })
    return Response.json({ status: 'SUCCEEDED', confirmed: true, idempotency_key: id, consumed: 1 })
  })
  assert.equal(confirmedConsumption(await onePayConsume(key, wallet, id), id), true)
  assert.equal(confirmedConsumption(await onePayConsumption(key, wallet, id), id), true)
  assert.equal(confirmedConsumption({ status: 'PROCESSING', confirmed: false, idempotency_key: id }, id), false)
  assert.equal(confirmedConsumption({ status: 'SUCCEEDED', confirmed: true, idempotency_key: 'other', consumed: 1 }, id), false)
})

test('核销状态不明时用原编号查询，确认后才交付', async t => {
  let calls = 0
  stub(t, (path, options) => {
    assert.equal(JSON.parse(options.body).idempotency_key, id)
    calls++
    if (path.endsWith('/consume')) return Response.json({ status: 'UNKNOWN', confirmed: false, idempotency_key: id })
    return Response.json({ status: 'SUCCEEDED', confirmed: true, idempotency_key: id, consumed: 1 })
  })
  assert.equal(await settleOnePayConsumption(key, wallet, id), 'confirmed')
  assert.equal(calls, 2)
})

test('明确失败不交付，查询也无法确认时保留待定状态', async t => {
  let result = { status: 'FAILED', confirmed: false, idempotency_key: id }
  stub(t, () => Response.json(result))
  assert.equal(await settleOnePayConsumption(key, wallet, id), 'failed')
  result = { status: 'PROCESSING', confirmed: false, idempotency_key: id }
  assert.equal(await settleOnePayConsumption(key, wallet, id), 'pending')
})
