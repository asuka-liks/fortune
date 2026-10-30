<template>
  <div class="reading-form space-y-6">
    <div class="flex items-center gap-2">
      <span class="text-lg">🃏</span>
      <span class="font-semibold text-gray-800">{{ t('tarot.title') }}</span>
    </div>

    <div class="space-y-3">
      <!-- 问题（可选） -->
      <div>
        <label for="tarot-question" class="mb-2 block font-medium">{{ t('tarot.question') }}</label>
        <textarea
          id="tarot-question"
          v-model="question"
          :placeholder="t('tarot.questionPlaceholder')"
          rows="2"
          class="w-full resize-none rounded-sm border border-[#d8d5c9] bg-[#fffefa] px-3 py-3 text-sm text-[#1c302d] placeholder-[#738077] focus:border-[#a84637] focus:outline-none focus:ring-1 focus:ring-[#a84637]"
        />
      </div>

      <!-- 牌阵选择 -->
      <div>
        <label class="mb-2 block font-medium">{{ t('tarot.selectSpread') }}</label>
        <div class="flex gap-2">
          <button
            v-for="spread in spreads"
            :key="spread.value"
            :class="[
              'min-h-16 flex-1 rounded-sm border px-3 py-2 text-center text-sm transition-colors',
              selectedSpread === spread.value
                ? 'border-[#a84637] bg-[#f4e6e0] text-[#843428]'
                : 'border-[#d8d5c9] bg-[#fffefa] text-[#52615b] hover:border-[#a84637]',
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
        <div class="border border-[#d8d5c9] bg-[#fffefa] p-4">
          <div class="mb-2 text-xs font-medium text-gray-500">{{ t('tarot.drawResult') }}</div>
          <div class="space-y-2">
            <div
              v-for="(card, i) in drawResult.cards"
              :key="i"
              class="flex items-center gap-2 border-b border-[#d8d5c9] p-2 last:border-0"
            >
              <span class="font-serif text-lg text-[#a84637]">✦</span>
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
