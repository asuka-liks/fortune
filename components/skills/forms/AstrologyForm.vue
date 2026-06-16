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

        <!-- 生日自动匹配星座 -->
        <div class="mt-2 text-center">
          <button
            v-if="!showBirthdayPicker"
            class="text-xs text-indigo-500 hover:text-indigo-700 underline transition-colors"
            @click="showBirthdayPicker = true"
          >
            {{ t('astrology.findByBirthday') }}
          </button>
          <div v-else class="flex items-center gap-1.5">
            <select
              v-model="birthMonth"
              class="h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
              @change="tryMatchSign"
            >
              <option value="0" disabled>{{ t('astrology.birthMonth') }}</option>
              <option v-for="m in 12" :key="m" :value="m">{{ m }}{{ locale === 'zh' ? '月' : '' }}</option>
            </select>
            <select
              v-model="birthDay"
              class="h-8 rounded border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
              @change="tryMatchSign"
            >
              <option value="0" disabled>{{ t('astrology.birthDay') }}</option>
              <option v-for="d in maxDay" :key="d" :value="d">{{ d }}{{ locale === 'zh' ? '日' : '' }}</option>
            </select>
            <button
              class="shrink-0 text-xs text-gray-400 hover:text-gray-600"
              :title="t('astrology.closePicker')"
              @click="showBirthdayPicker = false"
            >
              ✕
            </button>
          </div>
          <p
            v-if="showBirthdayPicker && matchedSignName"
            class="mt-1 text-xs text-indigo-600"
          >
            → {{ matchedSignName }}
          </p>
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

// ---- 生日自动匹配星座 ----
const showBirthdayPicker = ref(false)
const birthMonth = ref(0)
const birthDay = ref(0)

// 每月天数
const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const maxDay = computed(() => {
  const m = birthMonth.value
  return m >= 1 && m <= 12 ? daysInMonth[m - 1] : 31
})

// 星座日期范围（与 zodiacSigns 顺序对应）
const zodiacRanges = [
  { start: [3, 21], end: [4, 19] },   // 白羊 Aries
  { start: [4, 20], end: [5, 20] },   // 金牛 Taurus
  { start: [5, 21], end: [6, 21] },   // 双子 Gemini
  { start: [6, 22], end: [7, 22] },   // 巨蟹 Cancer
  { start: [7, 23], end: [8, 22] },   // 狮子 Leo
  { start: [8, 23], end: [9, 22] },   // 处女 Virgo
  { start: [9, 23], end: [10, 23] },  // 天秤 Libra
  { start: [10, 24], end: [11, 21] }, // 天蝎 Scorpio
  { start: [11, 22], end: [12, 21] }, // 射手 Sagittarius
  { start: [12, 22], end: [1, 19] },  // 摩羯 Capricorn (跨年)
  { start: [1, 20], end: [2, 18] },   // 水瓶 Aquarius
  { start: [2, 19], end: [3, 20] },   // 双鱼 Pisces
]

function findZodiacIndex(m: number, d: number): number {
  for (let i = 0; i < zodiacRanges.length; i++) {
    const { start, end } = zodiacRanges[i]
    if (start[0] <= end[0]) {
      // 同年区间 e.g. 3/21 - 4/19
      if (
        (m > start[0] || (m === start[0] && d >= start[1])) &&
        (m < end[0] || (m === end[0] && d <= end[1]))
      ) return i
    } else {
      // 跨年区间 e.g. 12/22 - 1/19（摩羯）
      if (
        (m > start[0] || (m === start[0] && d >= start[1])) ||
        (m < end[0] || (m === end[0] && d <= end[1]))
      ) return i
    }
  }
  return -1
}

const matchedSignName = ref('')

function tryMatchSign() {
  if (birthMonth.value > 0 && birthDay.value > 0) {
    const idx = findZodiacIndex(birthMonth.value, birthDay.value)
    if (idx >= 0 && idx < zodiacSigns.value.length) {
      form.zodiacSign = zodiacSigns.value[idx].value
      matchedSignName.value = zodiacSigns.value[idx].label
    }
  }
}

// 手动选择星座时清除匹配提示
watch(() => form.zodiacSign, () => {
  if (showBirthdayPicker.value) {
    matchedSignName.value = ''
  }
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
