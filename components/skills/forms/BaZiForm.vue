<template>
  <div class="space-y-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
    <div class="flex items-center gap-2">
      <span class="text-lg">☯️</span>
      <span class="font-semibold text-gray-800">{{ t('bazi.title') }}</span>
    </div>

    <div class="space-y-3">
      <!-- 出生日期 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('bazi.birthDate') }}</label>
        <BaseInput
          v-model="form.birthDate"
          type="date"
          placeholder="1990-05-20"
        />
      </div>

      <!-- 出生时辰 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('bazi.birthTime') }}</label>
        <BaseSelect
          v-model="form.birthTime"
          :options="birthTimeOptions"
          :placeholder="t('bazi.selectTime')"
        />
      </div>

      <!-- 性别 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('bazi.gender') }}</label>
        <div class="flex gap-2">
          <button
            :class="[
              'flex-1 rounded-lg border px-3 py-2 text-sm transition-all',
              form.gender === genderMaleValue
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ]"
            @click="form.gender = genderMaleValue"
          >
            {{ t('bazi.male') }}
          </button>
          <button
            :class="[
              'flex-1 rounded-lg border px-3 py-2 text-sm transition-all',
              form.gender === genderFemaleValue
                ? 'border-pink-400 bg-pink-50 text-pink-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ]"
            @click="form.gender = genderFemaleValue"
          >
            {{ t('bazi.female') }}
          </button>
        </div>
      </div>

      <!-- 提交按钮 -->
      <BaseButton
        variant="primary"
        class="w-full"
        :disabled="!isValid"
        @click="handleSubmit"
      >
        {{ t('bazi.submit') }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SkillId } from '~/types/skill'

const { t, locale } = useI18n()

const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const form = reactive({
  birthDate: '2004-01-01',
  birthTime: '',
  gender: '',
})

// 中文时辰
const zhTimeOptions = [
  { value: '子时 (23:00-01:00)', label: '子时 (23:00-01:00)' },
  { value: '丑时 (01:00-03:00)', label: '丑时 (01:00-03:00)' },
  { value: '寅时 (03:00-05:00)', label: '寅时 (03:00-05:00)' },
  { value: '卯时 (05:00-07:00)', label: '卯时 (05:00-07:00)' },
  { value: '辰时 (07:00-09:00)', label: '辰时 (07:00-09:00)' },
  { value: '巳时 (09:00-11:00)', label: '巳时 (09:00-11:00)' },
  { value: '午时 (11:00-13:00)', label: '午时 (11:00-13:00)' },
  { value: '未时 (13:00-15:00)', label: '未时 (13:00-15:00)' },
  { value: '申时 (15:00-17:00)', label: '申时 (15:00-17:00)' },
  { value: '酉时 (17:00-19:00)', label: '酉时 (17:00-19:00)' },
  { value: '戌时 (19:00-21:00)', label: '戌时 (19:00-21:00)' },
  { value: '亥时 (21:00-23:00)', label: '亥时 (21:00-23:00)' },
]

// 英文时辰
const enTimeOptions = [
  { value: 'Zi Hour (23:00-01:00)', label: 'Zi Hour (23:00-01:00)' },
  { value: 'Chou Hour (01:00-03:00)', label: 'Chou Hour (01:00-03:00)' },
  { value: 'Yin Hour (03:00-05:00)', label: 'Yin Hour (03:00-05:00)' },
  { value: 'Mao Hour (05:00-07:00)', label: 'Mao Hour (05:00-07:00)' },
  { value: 'Chen Hour (07:00-09:00)', label: 'Chen Hour (07:00-09:00)' },
  { value: 'Si Hour (09:00-11:00)', label: 'Si Hour (09:00-11:00)' },
  { value: 'Wu Hour (11:00-13:00)', label: 'Wu Hour (11:00-13:00)' },
  { value: 'Wei Hour (13:00-15:00)', label: 'Wei Hour (13:00-15:00)' },
  { value: 'Shen Hour (15:00-17:00)', label: 'Shen Hour (15:00-17:00)' },
  { value: 'You Hour (17:00-19:00)', label: 'You Hour (17:00-19:00)' },
  { value: 'Xu Hour (19:00-21:00)', label: 'Xu Hour (19:00-21:00)' },
  { value: 'Hai Hour (21:00-23:00)', label: 'Hai Hour (21:00-23:00)' },
]

const unknownTimeValue = computed(() => locale.value === 'en' ? 'Unknown' : '时辰未知')

const birthTimeOptions = computed(() => {
  const unknownOpt = { value: unknownTimeValue.value, label: t('bazi.unknownTime') }
  return [unknownOpt, ...(locale.value === 'en' ? enTimeOptions : zhTimeOptions)]
})

const genderMaleValue = computed(() => locale.value === 'en' ? 'Male' : '男')
const genderFemaleValue = computed(() => locale.value === 'en' ? 'Female' : '女')

const isValid = computed(
  () => form.birthDate && form.birthTime && form.gender,
)

function handleSubmit() {
  if (!isValid.value) return
  emit('submit', {
    birthDate: form.birthDate,
    birthTime: form.birthTime,
    gender: form.gender,
  })
}
</script>
