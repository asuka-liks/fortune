<template>
  <div class="border-b bg-purple-50 px-4 py-2 text-sm">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-purple-800">{{ copy.free }} {{ overview?.quota.free ?? '—' }} · {{ copy.paid }} {{ overview?.quota.paid ?? '—' }}</span>
      <div class="flex gap-3">
        <button class="font-medium text-purple-700 hover:underline" :disabled="busy" @click="openShop">{{ copy.buy }}</button>
        <button class="text-gray-600 hover:underline" @click="show = true; restoring = true">{{ copy.restore }}</button>
      </div>
    </div>
    <p v-if="activeOrder" class="mt-2 text-xs text-gray-600" role="status">
      {{ orderStatus === 'paid' ? copy.received : orderStatus === 'refunded' ? copy.refunded : copy.pending }}
      <button class="ml-2 text-purple-700 underline" :disabled="checking" @click="checkOrder">{{ copy.check }}</button>
    </p>
    <p v-if="error && !show" class="mt-2 text-xs text-red-600" role="alert">{{ error }}</p>

    <BaseModal v-model="show">
      <div class="max-h-[80vh] overflow-y-auto">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">{{ restoring ? copy.restore : copy.buy }}</h2>
          <button class="rounded px-2 py-1 text-gray-500" :aria-label="copy.close" @click="show = false">✕</button>
        </div>
        <p v-if="error" class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{{ error }}</p>
        <form v-if="restoring" class="space-y-4" @submit.prevent="restore">
          <p class="text-sm text-gray-600">{{ copy.restoreHelp }}</p>
          <label class="block text-sm font-medium text-gray-700" for="recovery-input">{{ copy.code }}</label>
          <textarea id="recovery-input" v-model="restoreCode" autocomplete="off" spellcheck="false" rows="3"
            class="w-full rounded-lg border p-3 font-mono text-sm" :placeholder="copy.code" />
          <button type="submit" class="w-full rounded-xl bg-purple-600 py-3 text-white disabled:opacity-50" :disabled="busy || !restoreCode.trim()">{{ copy.restore }}</button>
          <button type="button" class="text-sm text-purple-700 underline" @click="restoring = false; openShop()">{{ copy.back }}</button>
        </form>
        <div v-else class="space-y-4">
          <p class="text-sm text-gray-600">{{ copy.rules }}</p>
          <p v-if="!overview?.enabled" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{{ copy.unavailable }}</p>
          <div v-if="newCode" class="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p class="font-semibold text-amber-900">{{ copy.saveTitle }}</p>
            <p class="text-xs text-amber-800">{{ copy.saveHelp }}</p>
            <pre class="whitespace-pre-wrap break-all rounded bg-white p-3 font-mono text-sm text-gray-900">{{ newCode }}</pre>
            <button class="text-sm text-purple-700 underline" @click="copyCode">{{ copied ? copy.copied : copy.copy }}</button>
            <label class="flex items-start gap-2 pt-2 text-sm text-gray-700">
              <input v-model="savedCheck" type="checkbox" class="mt-1" :disabled="busy" @change="confirmSaved">
              {{ copy.saved }}
            </label>
          </div>
          <button v-else-if="overview?.hasWallet" class="text-xs text-purple-700 underline" :disabled="busy" @click="rotate">{{ copy.replaceCode }}</button>
          <fieldset class="grid grid-cols-3 gap-2">
            <legend class="sr-only">{{ copy.package }}</legend>
            <label v-for="pack in overview?.packages ?? []" :key="pack.id" class="cursor-pointer rounded-xl border p-3 text-center"
              :class="selected === pack.id ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-gray-200'">
              <input v-model="selected" type="radio" name="reading-package" :value="pack.id" class="sr-only">
              <span class="block text-lg font-bold text-purple-800">¥{{ (pack.amountFen / 100).toFixed(pack.amountFen % 100 ? 2 : 0) }}</span>
              <span class="text-xs text-gray-600">{{ pack.credits }} {{ copy.credits }}</span>
            </label>
          </fieldset>
          <label class="block text-sm text-gray-700">{{ copy.method }}
            <select v-model="channel" class="mt-1 w-full rounded-lg border p-2">
              <option value="alipay">{{ copy.alipay }}</option>
              <option value="wxpay" :disabled="!inWeChat">{{ copy.wechat }}</option>
            </select>
          </label>
          <p v-if="!inWeChat" class="text-xs text-gray-500">{{ copy.wechatHelp }}</p>
          <button class="w-full rounded-xl bg-purple-600 py-3 font-medium text-white disabled:opacity-50"
            :disabled="busy || !overview?.enabled || !overview?.recoverySaved" @click="purchase">{{ busy ? copy.working : copy.pay }}</button>
          <p v-if="!overview?.recoverySaved" class="text-xs text-amber-700">{{ copy.mustSave }}</p>
          <div v-if="overview?.orders.length" class="border-t pt-3">
            <h3 class="mb-2 text-sm font-medium text-gray-700">{{ copy.orders }}</h3>
            <button v-for="order in overview.orders" :key="order.id" class="mb-2 flex w-full justify-between gap-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600"
              @click="activeOrder = order.id; orderStatus = order.status; checkOrder()">
              <span>{{ new Date(order.createdAt).toLocaleDateString() }} · ¥{{ (order.amountFen / 100).toFixed(2) }} · {{ order.credits }} {{ copy.credits }}</span>
              <span>{{ order.status === 'paid' ? copy.received : order.status === 'refunded' ? copy.refunded : copy.pending }}</span>
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
interface Overview {
  enabled: boolean; hasWallet: boolean; recoverySaved: boolean
  quota: { free: number; paid: number }
  packages: { id: string; amountFen: number; credits: number }[]
  orders: { id: string; amountFen: number; credits: number; status: string; createdAt: number }[]
}
const props = defineProps<{ remainingQuota?: number; orderId?: string }>()
const emit = defineEmits<{ changed: [] }>()
const base = useRuntimeConfig().app.baseURL
const localeStore = useLocaleStore()
const copy = computed(() => localeStore.locale === 'en' ? {
  free: 'Free today:', paid: 'Purchased:', buy: 'Buy readings', restore: 'Restore credits', close: 'Close',
  received: 'Credits received', refunded: 'Refunded', pending: 'Awaiting payment confirmation', check: 'Check payment',
  restoreHelp: 'Enter your recovery code to switch to that credit account. Accounts are not merged. Chat history stays on the original device.',
  code: 'Recovery code', back: 'Back to packages', rules: 'One complete AI reply uses one credit, including follow-ups. Failed or cancelled readings return the credit. Daily free credits are used first. Purchased credits do not expire.',
  unavailable: 'Payments are not open yet. Existing credits can still be restored and used.',
  saveTitle: 'Save your recovery code before paying', saveHelp: 'This code is shown only now. Anyone with it can use your credits. Keep it privately; it is needed after switching devices or clearing browser data.',
  copy: 'Copy recovery code', copied: 'Copied', saved: 'I have saved this code somewhere safe.', replaceCode: 'Generate a new recovery code',
  replaceConfirm: 'The previous recovery code will stop working and other devices will be signed out. Continue?',
  package: 'Reading package', credits: 'readings', method: 'Payment method', alipay: 'Alipay', wechat: 'WeChat Pay',
  wechatHelp: 'To use WeChat Pay, open this website inside WeChat.', pay: 'Continue to payment', working: 'Please wait…',
  mustSave: 'Save and confirm your recovery code before purchasing.', orders: 'Recent orders (tap to check)',
  failed: 'Request failed. Please try again.', restoreFirst: 'Restore the credit account used for this purchase, then check again.',
  copyFailed: 'Could not copy automatically. Please select and copy the code manually.',
} : {
  free: '今日免费：', paid: '已购剩余：', buy: '购买次数', restore: '恢复额度', close: '关闭',
  received: '次数已到账', refunded: '已退款', pending: '等待支付确认', check: '查询支付结果',
  restoreHelp: '输入恢复码后将切换到对应的额度账户，不合并余额。聊天记录仍保存在原设备上。',
  code: '恢复码', back: '返回购买', rules: '每条完整 AI 回复扣 1 次，追问也计次；生成失败或取消返还次数。优先使用每日免费额度，已购次数不过期。',
  unavailable: '支付暂未开放，已有次数仍可恢复和使用。',
  saveTitle: '付款前请保存恢复码', saveHelp: '恢复码仅在此时展示。持有码的人可以使用你的额度，请私下保存。换设备或清除浏览器数据后，需要凭此码找回。',
  copy: '复制恢复码', copied: '已复制', saved: '我已将恢复码保存在安全的位置。', replaceCode: '生成新的恢复码',
  replaceConfirm: '旧恢复码将失效，其他设备会退出当前额度账户，是否继续？',
  package: '次数包', credits: '次', method: '付款方式', alipay: '支付宝', wechat: '微信支付',
  wechatHelp: '如需微信支付，请在微信内打开本网站。', pay: '前往付款', working: '处理中…',
  mustSave: '保存并确认恢复码后才能购买。', orders: '最近订单（点击可查单）',
  failed: '操作失败，请稍后重试。', restoreFirst: '请先用恢复码找回购买时的额度账户，再查询订单。',
  copyFailed: '自动复制失败，请手动选中并复制恢复码。',
})
const overview = ref<Overview | null>(null)
const show = ref(false), restoring = ref(false), busy = ref(false), checking = ref(false)
const error = ref(''), newCode = ref(''), restoreCode = ref(''), savedCheck = ref(false), copied = ref(false)
const selected = ref('dozen'), channel = ref<'alipay' | 'wxpay'>('alipay'), inWeChat = ref(false)
const activeOrder = ref(''), orderStatus = ref('pending')
let timer: ReturnType<typeof setInterval> | undefined
let pollCount = 0
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(base + path, body === undefined ? { cache: 'no-store' } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || copy.value.failed)
  return data as T
}
async function refresh() { overview.value = await api<Overview>('api/billing/overview') }
async function action(body: Record<string, string>) {
  const result = await api<{ recoveryCode: string | null; saved: boolean }>('api/billing/account', body)
  if (result.recoveryCode) { newCode.value = result.recoveryCode; savedCheck.value = false; copied.value = false }
  await refresh()
  emit('changed')
}
async function run(task: () => Promise<void>) {
  if (busy.value) return
  busy.value = true; error.value = ''
  try { await task() } catch (e) { error.value = e instanceof Error ? e.message : copy.value.failed }
  finally { busy.value = false }
}
async function openShop() {
  show.value = true; restoring.value = false
  await run(async () => { await refresh(); if (!overview.value?.hasWallet) await action({ action: 'create' }) })
}
async function confirmSaved() {
  if (!savedCheck.value) return
  await run(async () => { await action({ action: 'confirm' }) })
  if (!overview.value?.recoverySaved) savedCheck.value = false
}
async function rotate() {
  if (!window.confirm(copy.value.replaceConfirm)) return
  await run(async () => { await action({ action: 'rotate' }) })
}
async function restore() {
  await run(async () => {
    await action({ action: 'recover', recoveryCode: restoreCode.value.trim() })
    restoreCode.value = ''; newCode.value = ''; restoring.value = false
    if (activeOrder.value) await checkOrder()
  })
}
async function copyCode() {
  try { await navigator.clipboard.writeText(newCode.value); copied.value = true }
  catch { error.value = copy.value.copyFailed }
}
async function purchase() {
  await run(async () => {
    const result = await api<{ orderId: string; action: string; fields: Record<string, string> }>('api/payments/orders', {
      packageId: selected.value, channel: channel.value,
    })
    sessionStorage.setItem('fortune-payment-order', result.orderId)
    const form = document.createElement('form')
    form.method = 'POST'; form.action = result.action
    for (const [name, value] of Object.entries(result.fields)) {
      const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; form.appendChild(input)
    }
    document.body.appendChild(form); form.submit(); form.remove()
  })
}
async function checkOrder() {
  if (!activeOrder.value || checking.value) return
  if (!overview.value?.hasWallet) { error.value = copy.value.restoreFirst; return }
  checking.value = true
  try {
    const result = await api<{ status: string }>(`api/payments/orders/${encodeURIComponent(activeOrder.value)}`)
    orderStatus.value = result.status; error.value = ''
    if (result.status !== 'pending') {
      sessionStorage.removeItem('fortune-payment-order'); await refresh(); emit('changed')
    }
  } catch (e) { error.value = e instanceof Error ? e.message : copy.value.failed }
  finally { checking.value = false }
}
watch(() => props.remainingQuota, () => { refresh().catch(() => {}) })
onMounted(async () => {
  inWeChat.value = /MicroMessenger/i.test(navigator.userAgent)
  try {
    const pending = props.orderId || sessionStorage.getItem('fortune-payment-order') || ''
    if (/^ft_[a-f0-9]{32}$/.test(pending)) activeOrder.value = pending
    await refresh()
    if (activeOrder.value) await checkOrder()
  } catch (e) { error.value = e instanceof Error ? e.message : copy.value.failed }
  timer = setInterval(() => {
    if (activeOrder.value && orderStatus.value === 'pending' && !document.hidden && pollCount++ < 40) void checkOrder()
  }, 15_000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
