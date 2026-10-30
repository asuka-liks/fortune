<template>
  <div class="reading-form space-y-6">
    <div class="flex items-center gap-2">
      <span class="text-lg">🎴</span>
      <span class="font-semibold text-gray-800">{{ t('fun.title') }}</span>
    </div>

    <div class="space-y-3">
      <!-- 问题输入 -->
      <div>
        <label for="fun-question" class="mb-2 block font-medium">{{ t('fun.question') }}</label>
        <BaseInput
          id="fun-question"
          v-model="question"
          :placeholder="t('fun.questionPlaceholder')"
        />
      </div>

      <!-- 抽牌按钮 -->
      <BaseButton
        variant="primary"
        class="w-full"
        :disabled="isDrawing"
        @click="handleDraw"
      >
        {{ isDrawing ? t('fun.drawing') : t('fun.startDraw') }}
      </BaseButton>

      <!-- 抽牌结果 -->
      <div v-if="drawResult" class="space-y-3 border border-[#d8d5c9] bg-[#fffefa] p-4">
        <div class="text-sm font-medium text-[#1c302d]">{{ t('fun.drawResult') }}</div>

        <!-- 游戏牌 -->
        <div class="space-y-2">
          <div
            v-for="(card, idx) in drawResult.cards"
            :key="idx"
            class="flex items-center gap-2 border-b border-[#d8d5c9] px-3 py-2 text-sm"
          >
            <span
              :class="card.position === '逆位' ? 'rotate-180' : ''"
              class="text-lg"
            >牌</span>
            <div>
              <div class="font-medium text-gray-800">
                {{ card.position }} · {{ card.suit }}{{ card.pointName }} · {{ card.name }}
              </div>
              <div class="text-xs text-gray-500">{{ card.type === 'basic' ? '基本牌' : card.type === 'trick' ? '锦囊牌' : '装备牌' }}</div>
            </div>
          </div>

          <!-- 身份/武将牌 -->
          <div class="flex items-center gap-2 border-b border-[#d8d5c9] px-3 py-2 text-sm">
            <span
              :class="drawResult.third.position === '逆位' ? 'rotate-180' : ''"
              class="text-lg"
            >{{ drawResult.third.type === 'officer' ? '将' : '身' }}</span>
            <div>
              <div class="font-medium text-gray-800">
                {{ drawResult.third.position }} · {{ drawResult.third.type === 'officer' ? '武将' : '身份' }}：{{ drawResult.third.displayName }}
              </div>
              <div v-if="drawResult.third.type === 'officer' && drawResult.third.officer" class="text-xs text-gray-500">
                {{ drawResult.third.officer.hp }}血 · 技能：{{ drawResult.third.officer.skills.join('、') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 卦象摘要 -->
        <div class="bg-[#e9ebe4] px-3 py-2 text-sm">
          <div class="font-medium text-[#1c302d]">
            {{ t('fun.hexagram') }}：{{ hexagramInfo?.originalHexagram?.nameCN }}
            <span v-if="hexagramInfo?.derivedHexagram"> → {{ hexagramInfo.derivedHexagram.nameCN }}</span>
          </div>
          <div class="mt-1 text-xs text-[#52615b]">
            {{ hexagramInfo?.upperTrigramCalc }}，{{ hexagramInfo?.lowerTrigramCalc }}
            <br v-if="hexagramInfo?.changingLine">{{ hexagramInfo?.changingLineCalc }}
          </div>
        </div>

        <!-- 开始解读按钮 -->
        <BaseButton
          variant="secondary"
          class="w-full"
          @click="handleSubmit"
        >
          {{ t('fun.startReading') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const question = ref('')
const isDrawing = ref(false)
const drawResult = ref<any>(null)
const hexagramInfo = ref<any>(null)
const formattedDrawText = ref('')

async function handleDraw() {
  isDrawing.value = true
  try {
    const res = await fetch('/project/fortune/api/fortune/fun-draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: useI18n().locale.value }),
    })
    if (!res.ok) throw new Error('Draw failed')
    const data = await res.json()
    drawResult.value = data.draw
    hexagramInfo.value = data.hexagram
    formattedDrawText.value = data.formattedText
  } catch (e) {
    console.error('Fun draw failed:', e)
  } finally {
    isDrawing.value = false
  }
}

function handleSubmit() {
  emit('submit', {
    question: question.value || '未指定问题',
    drawResult: formattedDrawText.value,
  })
}
</script>
