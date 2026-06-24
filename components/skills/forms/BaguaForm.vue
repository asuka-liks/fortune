<template>
  <div class="max-h-[55vh] space-y-4 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50/50 p-4">
    <div class="flex items-center gap-2">
      <span class="text-lg">🔯</span>
      <span class="font-semibold text-gray-800">{{ t('bagua.title') }}</span>
    </div>

    <div class="space-y-3">
      <!-- 提示 -->
      <p class="rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-700">
        💡 {{ locale === 'en' ? 'Works even better when combined with BaZi (Eight Characters) readings.' : '配合八字命理解读效果更好哦～' }}
      </p>

      <!-- 问题（可选） -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('bagua.question') }}</label>
        <textarea
          v-model="question"
          :placeholder="t('bagua.questionPlaceholder')"
          rows="2"
          class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <!-- 摇卦按钮 -->
      <div v-if="!shakeResult" class="text-center">
        <BaseButton
          variant="primary"
          class="w-full"
          :disabled="isShaking"
          @click="handleShake"
        >
          {{ isShaking ? t('bagua.shaking') : t('bagua.startShake') }}
        </BaseButton>
      </div>

      <!-- 摇卦结果 -->
      <div v-else class="space-y-3">
        <!-- 六爻展示 -->
        <div class="rounded-lg bg-white p-3">
          <div class="mb-2 text-xs font-medium text-gray-500">{{ t('bagua.shakeResult') }}</div>
          <div class="space-y-1.5">
            <div
              v-for="s in shakeResult.shakes"
              :key="s.index"
              class="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
              :class="s.isChanging ? 'border-amber-300 bg-amber-50' : 'border-gray-200'"
            >
              <span class="w-12 text-xs text-gray-500">{{ t('bagua.shakeIndex', { n: s.index }) }}</span>
              <span class="text-sm">{{ coinDisplay(s.heads) }}</span>
              <span class="font-medium" :class="s.isYang ? 'text-blue-600' : 'text-red-500'">
                {{ locale === 'en' ? (s.type === '老阴' ? 'Old Yin' : s.type === '老阳' ? 'Old Yang' : s.type === '少阳' ? 'Young Yang' : 'Young Yin') : s.type }}
              </span>
              <span class="text-lg">{{ s.isYang ? '⚊' : '⚋' }}</span>
              <span v-if="s.isChanging" class="ml-auto rounded bg-amber-200 px-1.5 py-0.5 text-xs text-amber-700">{{ t('bagua.changing') }}</span>
            </div>
          </div>
        </div>

        <!-- 卦名信息 -->
        <div class="rounded-lg bg-white p-3">
          <div class="mb-2 text-xs font-medium text-gray-500">{{ t('bagua.hexagramInfo') }}</div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="rounded bg-amber-50 p-2 text-center">
              <div class="text-xs text-gray-500">{{ t('bagua.originalHexagram') }}</div>
              <div class="font-bold text-gray-800">{{ shakeResult.originalHexagram.nameCN }}</div>
              <div class="text-xs text-gray-500">{{ shakeResult.originalHexagram.name }}</div>
            </div>
            <div class="rounded p-2 text-center" :class="shakeResult.derivedHexagram ? 'bg-emerald-50' : 'bg-gray-100'">
              <div class="text-xs text-gray-500">{{ t('bagua.derivedHexagram') }}</div>
              <div class="font-bold" :class="shakeResult.derivedHexagram ? 'text-emerald-700' : 'text-gray-400'">
                {{ shakeResult.derivedHexagram ? shakeResult.derivedHexagram.nameCN : t('bagua.noDerived') }}
              </div>
              <div class="text-xs text-gray-500">{{ shakeResult.derivedHexagram?.name ?? '-' }}</div>
            </div>
          </div>
          <!-- 动爻信息 -->
          <div v-if="shakeResult.changingLineIndices.length > 0" class="mt-2 text-center text-xs text-amber-600">
            {{ t('bagua.changingLines') }}：{{ t('bagua.lineNumbers', { lines: shakeResult.changingLineIndices.join('、') }) }}
          </div>
          <div v-else class="mt-2 text-center text-xs text-gray-400">
            {{ t('bagua.noChangingLines') }}
          </div>
        </div>

        <BaseButton
          variant="primary"
          class="w-full"
          @click="handleSubmit"
        >
          {{ t('bagua.startReading') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BaguaShakeResult } from '~/types/fortune'

const { t, locale } = useI18n()

const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const question = ref('')
const isShaking = ref(false)
const shakeResult = ref<BaguaShakeResult | null>(null)

function coinDisplay(heads: number): string {
  const full = '⚪'
  const empty = '⚫'
  return full.repeat(heads) + empty.repeat(3 - heads)
}

async function handleShake() {
  isShaking.value = true
  try {
    const res = await $fetch<BaguaShakeResult & { formattedText: string }>('/api/fortune/bagua-shake', {
      method: 'POST',
      body: { locale: locale.value },
    })
    shakeResult.value = res
  } catch (err: any) {
    console.error('Shake failed:', err)
  } finally {
    isShaking.value = false
  }
}

function handleSubmit() {
  if (!shakeResult.value) return

  const isEn = locale.value === 'en'

  // 格式化摇卦结果文本
  const { shakes, originalHexagram, derivedHexagram, changingLineIndices } = shakeResult.value

  const shakeLines = shakes.map((s) => {
    const yaoSymbol = s.isYang ? '⚊' : '⚋'
    const changeMark = s.isChanging ? (isEn ? ' ← Changing' : ' ← 动爻') : ''
    const headsStr = '●'.repeat(s.heads) + '○'.repeat(3 - s.heads)
    const typeEn = s.type === '老阴' ? 'Old Yin' : s.type === '老阳' ? 'Old Yang' : s.type === '少阳' ? 'Young Yang' : 'Young Yin'
    if (isEn) {
      return `Shake ${s.index}: ${headsStr} → ${typeEn} ${yaoSymbol}${changeMark}`
    }
    return `第${s.index}摇：${headsStr} → ${s.type} ${yaoSymbol}${changeMark}`
  }).join('\n')

  const derivInfo = derivedHexagram
    ? (isEn
      ? `\n## Derived Hexagram\n${derivedHexagram.nameCN} (${derivedHexagram.name})\n${derivedHexagram.descriptionEn}\nJudgment: ${derivedHexagram.judgmentEn}`
      : `\n## 变卦（之卦）\n${derivedHexagram.nameCN}（${derivedHexagram.name}）\n${derivedHexagram.description}\n卦辞：${derivedHexagram.judgment}`)
    : (isEn ? '\n## No Derived Hexagram\nAll six lines are stable.' : '\n## 无变卦\n六爻皆静，无变卦。')

  const changingInfo = changingLineIndices.length > 0
    ? (isEn
      ? `\n## Changing Lines\nLine ${changingLineIndices.join(', ')}`
      : `\n## 动爻\n第${changingLineIndices.join('、')}爻为动爻`)
    : ''

  const shakeResultText = `## ${isEn ? 'Coin Shake Process' : '铜钱摇卦过程'}
${shakeLines}

## ${isEn ? 'Original Hexagram' : '本卦'}
${originalHexagram.nameCN} (${originalHexagram.name})
${isEn ? `Upper Trigram: ${originalHexagram.upperTrigram}, Lower Trigram: ${originalHexagram.lowerTrigram}` : `上卦${originalHexagram.upperTrigram} · 下卦${originalHexagram.lowerTrigram}`}
${isEn ? originalHexagram.descriptionEn : originalHexagram.description}
${isEn ? 'Judgment' : '卦辞'}：${isEn ? originalHexagram.judgmentEn : originalHexagram.judgment}${derivInfo}${changingInfo}`

  emit('submit', {
    question: question.value || (isEn ? 'Not specified' : '未指定问题'),
    shakeResult: shakeResultText,
  })
}
</script>
