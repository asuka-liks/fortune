<template>
  <div class="space-y-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
    <div class="flex items-center gap-2">
      <span class="text-lg">☯️</span>
      <span class="font-semibold text-gray-800">八字命理 · 出生信息</span>
    </div>

    <div class="space-y-3">
      <!-- 出生日期 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">出生日期（公历）</label>
        <BaseInput
          v-model="form.birthDate"
          type="date"
          placeholder="1990-05-20"
        />
      </div>

      <!-- 出生时辰 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">出生时辰</label>
        <BaseSelect
          v-model="form.birthTime"
          :options="birthTimeOptions"
          placeholder="请选择时辰"
        />
      </div>

      <!-- 性别 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">性别</label>
        <div class="flex gap-2">
          <button
            :class="[
              'flex-1 rounded-lg border px-3 py-2 text-sm transition-all',
              form.gender === '男'
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ]"
            @click="form.gender = '男'"
          >
            ♂ 男
          </button>
          <button
            :class="[
              'flex-1 rounded-lg border px-3 py-2 text-sm transition-all',
              form.gender === '女'
                ? 'border-pink-400 bg-pink-50 text-pink-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ]"
            @click="form.gender = '女'"
          >
            ♀ 女
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
        开始八字分析
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SkillId } from '~/types/skill'

const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const form = reactive({
  birthDate: '',
  birthTime: '',
  gender: '',
})

const birthTimeOptions = [
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
