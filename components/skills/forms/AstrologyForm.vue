<template>
  <div class="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
    <div class="flex items-center gap-2">
      <span class="text-lg">✨</span>
      <span class="font-semibold text-gray-800">{{ t('astrology.title') }}</span>
    </div>

    <div class="space-y-3">
      <!-- 星座选择 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('astrology.selectSign') }}</label>
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
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('astrology.period') }}</label>
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
        {{ t('astrology.submit') }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()

const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const form = reactive({
  zodiacSign: '',
  period: '',
})

// 星座数据：中英文 value 不同（value 会被发送给 AI）
const zhZodiacSigns = [
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

const enZodiacSigns = [
  { value: 'Aries (3.21-4.19)', label: '♈ Aries' },
  { value: 'Taurus (4.20-5.20)', label: '♉ Taurus' },
  { value: 'Gemini (5.21-6.21)', label: '♊ Gemini' },
  { value: 'Cancer (6.22-7.22)', label: '♋ Cancer' },
  { value: 'Leo (7.23-8.22)', label: '♌ Leo' },
  { value: 'Virgo (8.23-9.22)', label: '♍ Virgo' },
  { value: 'Libra (9.23-10.23)', label: '♎ Libra' },
  { value: 'Scorpio (10.24-11.22)', label: '♏ Scorpio' },
  { value: 'Sagittarius (11.23-12.21)', label: '♐ Sagittarius' },
  { value: 'Capricorn (12.22-1.19)', label: '♑ Capricorn' },
  { value: 'Aquarius (1.20-2.18)', label: '♒ Aquarius' },
  { value: 'Pisces (2.19-3.20)', label: '♓ Pisces' },
]

// 周期数据
const zhPeriods = [
  { value: '今日运势', label: '今日' },
  { value: '本周运势', label: '本周' },
  { value: '本月运势', label: '本月' },
  { value: '年度运势', label: '年度' },
]

const enPeriods = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
]

const zodiacSigns = computed(() =>
  locale.value === 'en' ? enZodiacSigns : zhZodiacSigns,
)

const periods = computed(() =>
  locale.value === 'en' ? enPeriods : zhPeriods,
)

const isValid = computed(() => form.zodiacSign && form.period)

function handleSubmit() {
  if (!isValid.value) return
  emit('submit', {
    zodiacSign: form.zodiacSign,
    period: form.period,
  })
}
</script>
