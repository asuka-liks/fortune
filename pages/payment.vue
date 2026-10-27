<template>
  <main class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-8">
    <h1 class="text-xl font-semibold text-purple-800">{{ english ? 'Payment result' : '支付结果' }}</h1>
    <p class="text-sm text-gray-600">{{ english ? 'Credits are added after payment is verified. If you paid on another device, restore your credit account first.' : '核实付款后，次数会自动到账。如果你在其他设备付款，请先恢复购买时的额度账户。' }}</p>
    <PaymentPanel :order-id="orderId" />
    <NuxtLink to="/" class="inline-block rounded-xl bg-purple-600 px-5 py-3 text-white">{{ english ? 'Back to readings' : '返回解读' }}</NuxtLink>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const store = useLocaleStore()
const english = computed(() => store.locale === 'en')
const orderId = computed(() => typeof route.query.out_trade_no === 'string' ? route.query.out_trade_no : '')
useHead({ meta: [{ name: 'robots', content: 'noindex,nofollow' }, { name: 'referrer', content: 'no-referrer' }] })
</script>
