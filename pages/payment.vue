<template>
  <main class="mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-10">
    <span class="eyebrow">FORTUNE · ACCOUNT</span>
    <h1 class="font-display text-3xl font-semibold text-[#1c302d]">{{ english ? 'Payment result' : '支付结果' }}</h1>
    <p class="text-sm leading-7 text-[#52615b]">{{ english ? 'WeChat orders are verified here. Alipay readings reflect your OnePay balance. Restore the account used for purchase if you paid on another device.' : '微信订单核实后到账；支付宝次数以一人付权益余额为准。若在其他设备付款，请先恢复购买时的额度账户。' }}</p>
    <PaymentPanel :order-id="orderId" returned-from-payment />
    <NuxtLink to="/" class="inline-flex min-h-11 items-center bg-[#a84637] px-5 py-3 text-white hover:bg-[#843428]">{{ english ? 'Back to readings' : '返回解读' }}</NuxtLink>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const store = useLocaleStore()
const english = computed(() => store.locale === 'en')
const orderId = computed(() => typeof route.query.out_trade_no === 'string' ? route.query.out_trade_no : '')
useHead({ meta: [{ name: 'robots', content: 'noindex,nofollow' }, { name: 'referrer', content: 'no-referrer' }] })
</script>
