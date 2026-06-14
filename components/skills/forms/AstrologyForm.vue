<template>
  <div class="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
    <div class="flex items-center gap-2">
      <span class="text-lg">✨</span>
      <span class="font-semibold text-gray-800">星座运势 · 选择星座</span>
    </div>

    <div class="space-y-3">
      <!-- 星座选择 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">选择星座</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="sign in zodiacSigns"
            :key="sign.value"
            :class="[
              'rounded-lg border px-2 py-2 text-center text-xs transition-all',
              form.zodiacSign === sign.value
                ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ]"
            @click="form.zodiacSign = sign.value"
          >
            {{ sign.label }}
          </button>
        </div>
      </div>

      <!-- 周期选择 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">运势周期</label>
        <div class="flex gap-2">
          <button
            v-for="p in periods"
            :key="p.value"
            :class="[
              'flex-1 rounded-lg border px-3 py-2 text-sm transition-all',
              form.period === p.value
                ? 'border-indigo-400 bg-indigo-100 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ]"
            @click="form.period = p.value"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <BaseButton
        variant="primary"
        class="w-full"
        :disabled="!isValid"
        @click="handleSubmit"
      >
        查看运势
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const form = reactive({
  zodiacSign: '',
  period: '',
})

const zodiacSigns = [
  { value: '白羊座 (3.21-4.19)', label: '♈ 白羊' },
  { value: '金牛座 (4.20-5.20)', label: '♉ 金牛' },
  { value: '双子座 (5.21-6.21)', label: '♊ 双子' },
  { value: '巨蟹座 (6.22-7.22)', label: '♋ 巨蟹' },
  { value: '狮子座 (7.23-8.22)', label: '♌ 狮子' },
  { value: '处女座 (8.23-9.22)', label: '♍ 处女' },
  { value: '天秤座 (9.23-10.23)', label: '♎ 天秤' },
  { value: '天蝎座 (10.24-11.22)', label: '♏ 天蝎' },
  { value: '射手座 (11.23-12.21)', label: '♐ 射手' },
  { value: '摩羯座 (12.22-1.19)', label: '♑ 摩羯' },
  { value: '水瓶座 (1.20-2.18)', label: '♒ 水瓶' },
  { value: '双鱼座 (2.19-3.20)', label: '♓ 双鱼' },
]

const periods = [
  { value: '今日运势', label: '今日' },
  { value: '本周运势', label: '本周' },
  { value: '本月运势', label: '本月' },
  { value: '年度运势', label: '年度' },
]

const isValid = computed(() => form.zodiacSign && form.period)

function handleSubmit() {
  if (!isValid.value) return
  emit('submit', {
    zodiacSign: form.zodiacSign,
    period: form.period,
  })
}
</script>
