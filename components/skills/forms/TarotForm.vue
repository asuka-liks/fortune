<template>
  <div class="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
    <div class="flex items-center gap-2">
      <span class="text-lg">🃏</span>
      <span class="font-semibold text-gray-800">塔罗占卜 · 抽牌</span>
    </div>

    <div class="space-y-3">
      <!-- 问题（可选） -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">你想问什么？（可选）</label>
        <textarea
          v-model="question"
          placeholder="例如：最近的事业发展如何？"
          rows="2"
          class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <!-- 牌阵选择 -->
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">选择牌阵</label>
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
          {{ isDrawing ? '抽牌中...' : '🃏 开始抽牌' }}
        </BaseButton>
      </div>

      <!-- 已抽牌结果 -->
      <div v-else class="space-y-3">
        <div class="rounded-lg bg-white p-3">
          <div class="mb-2 text-xs font-medium text-gray-500">抽牌结果</div>
          <div class="space-y-2">
            <div
              v-for="(card, i) in drawResult.cards"
              :key="i"
              class="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2"
            >
              <span class="text-lg">🃏</span>
              <div class="flex-1 text-sm">
                <span class="font-medium text-gray-800">{{ card.card.nameCN }}</span>
                <span class="text-xs text-gray-500"> · {{ card.position }}</span>
                <span :class="card.orientation === 'upright' ? 'text-green-600' : 'text-orange-600'" class="ml-1 text-xs">
                  {{ card.orientation === 'upright' ? '正位' : '逆位' }}
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
          开始解读
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TarotDrawResult } from '~/types/fortune'

const emit = defineEmits<{
  submit: [context: Record<string, string>]
}>()

const question = ref('')
const selectedSpread = ref('three-card')
const isDrawing = ref(false)
const drawResult = ref<TarotDrawResult | null>(null)

const spreads = [
  { value: 'single', label: '单张', desc: '快速指引' },
  { value: 'three-card', label: '三张', desc: '过去·现在·未来' },
  { value: 'celtic-cross', label: '凯尔特十字', desc: '十张全面解读' },
]

async function handleDraw() {
  isDrawing.value = true
  try {
    const res = await $fetch<TarotDrawResult & { formattedText: string }>('/api/fortune/tarot-draw', {
      method: 'POST',
      body: { spreadType: selectedSpread.value },
    })
    drawResult.value = res
  } catch (err: any) {
    console.error('抽牌失败:', err)
  } finally {
    isDrawing.value = false
  }
}

function handleSubmit() {
  if (!drawResult.value) return
  // 生成牌面描述文本，作为 drawnCards 上下文
  const cardsText = drawResult.value.cards
    .map(
      (d, i) =>
        `### 第${i + 1}张：${d.position}
- 牌名：${d.card.nameCN} (${d.card.name})
- 方向：${d.orientation === 'upright' ? '正位' : '逆位'}
- 含义：${d.orientation === 'upright' ? d.card.upright : d.card.reversed}
- 描述：${d.card.description}`,
    )
    .join('\n\n')

  emit('submit', {
    question: question.value || '未指定问题',
    drawnCards: cardsText,
    spreadType: selectedSpread.value,
  })
}
</script>
