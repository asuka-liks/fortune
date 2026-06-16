<template>
  <div class="max-h-[55vh] space-y-4 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50/50 p-4">
    <div class="flex items-center gap-2">
      <span class="text-lg">🃏</span>
      <span class="font-semibold text-gray-800">{{ t('tarot.title') }}</span>
    </div>

    <div class="space-y-3">
      <!-- 问题（可选） -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('tarot.question') }}</label>
        <textarea
          v-model="question"
          :placeholder="t('tarot.questionPlaceholder')"
          rows="2"
          class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <!-- 牌阵选择 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">{{ t('tarot.selectSpread') }}</label>
        <div class="flex gap-2">
          <button
            v-for="spread in spreads"
            :key="spread.value"
            :class="[
              'flex-1 rounded-lg border px-3 py-2 text-center text-sm transition-all',
              selectedSpread === spread.value
                ? 'border-amber-400 bg-amber-100 text-amber-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            ]"
            @click="selectedSpread = spread.value"
          >
            <div class="font-semibold">{{ spread.label }}</div>
            <div class="text-xs opacity-70">{{ spread.desc }}</div>
          </button>
        </div>
      </div>

      <!-- 抽牌按钮 / 结果展示 -->
      <div v-if="!drawResult" class="text-center">
        <BaseButton
          variant="primary"
          class="w-full"
          :disabled="isDrawing"
          @click="handleDraw"
        >
          {{ isDrawing ? t('tarot.drawing') : t('tarot.startDraw') }}
        </BaseButton>
      </div>

      <!-- 已抽牌结果 -->
      <div v-else class="space-y-3">
        <div class="rounded-lg bg-white p-3">
          <div class="mb-2 text-xs font-medium text-gray-500">{{ t('tarot.drawResult') }}</div>
          <div class="space-y-2">
            <div
              v-for="(card, i) in drawResult.cards"
              :key="i"
              class="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2"
            >
              <span class="text-lg">🃏</span>
              <div class="flex-1 text-sm">
                <span class="font-medium text-gray-800">{{ locale === 'en' ? card.card.name : card.card.nameCN }}</span>
                <span class="text-xs text-gray-500"> · {{ card.position }}</span>
                <span :class="card.orientation === 'upright' ? 'text-green-600' : 'text-orange-600'" class="ml-1 text-xs">
                  {{ card.orientation === 'upright' ? t('tarot.upright') : t('tarot.reversed') }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <BaseButton
          variant="primary"
          class="w-full"
          @click="handleSubmit"
        >
          {{ t('tarot.startReading') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TarotDrawResult } from '~/types/fortune'

const { t, locale } = useI18n()

const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const question = ref('')
const selectedSpread = ref('three-card')
const isDrawing = ref(false)
const drawResult = ref<TarotDrawResult | null>(null)

const spreads = computed(() => [
  { value: 'single', label: t('tarot.single'), desc: t('tarot.singleDesc') },
  { value: 'three-card', label: t('tarot.threeCard'), desc: t('tarot.threeCardDesc') },
  { value: 'celtic-cross', label: t('tarot.celticCross'), desc: t('tarot.celticCrossDesc') },
])

async function handleDraw() {
  isDrawing.value = true
  try {
    const res = await $fetch<TarotDrawResult & { formattedText: string }>('/api/fortune/tarot-draw', {
      method: 'POST',
      body: { spreadType: selectedSpread.value, locale: locale.value },
    })
    drawResult.value = res
  } catch (err: any) {
    console.error('Draw failed:', err)
  } finally {
    isDrawing.value = false
  }
}

function handleSubmit() {
  if (!drawResult.value) return
  const isEn = locale.value === 'en'
  const orientationLabel = (o: string) => o === 'upright' ? t('tarot.upright') : t('tarot.reversed')

  const cardsText = drawResult.value.cards
    .map(
      (d, i) => {
        if (isEn) {
          return `### Card ${i + 1}: ${d.position}
- Name: ${d.card.nameCN} (${d.card.name})
- Orientation: ${d.orientation === 'upright' ? 'Upright' : 'Reversed'}
- Meaning: ${d.orientation === 'upright' ? (d.card.uprightEn ?? d.card.upright) : (d.card.reversedEn ?? d.card.reversed)}
- Description: ${d.card.descriptionEn ?? d.card.description}`
        }
        return `### ${t('tarot.cardPosition', { n: i + 1 })}${t('tarot.cardLabel')}${d.position}
- ${t('tarot.cardName')}${d.card.nameCN} (${d.card.name})
- ${t('tarot.orientation')}${orientationLabel(d.orientation)}
- ${t('tarot.meaning')}${d.orientation === 'upright' ? d.card.upright : d.card.reversed}
- ${t('tarot.descLabel')}${d.card.description}`
      },
    )
    .join('\n\n')

  emit('submit', {
    question: question.value || t('tarot.noQuestion'),
    drawnCards: cardsText,
    spreadType: selectedSpread.value,
  })
}
</script>
