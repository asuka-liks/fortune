<template>
  <div
    :class="['card-flip', { flipped: isFlipped }]"
    class="h-48 w-32 cursor-pointer select-none"
    @click="handleFlip"
  >
    <div class="card-flip-inner relative h-full w-full">
      <!-- 正面（牌背） -->
      <div class="card-flip-front absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 shadow-md">
        <span class="text-4xl">🃏</span>
        <span class="mt-2 text-xs font-medium text-amber-700">{{ position }}</span>
        <span class="mt-1 text-[10px] text-amber-500">点击翻牌</span>
      </div>

      <!-- 反面（牌面） -->
      <div class="card-flip-back absolute inset-0 flex flex-col rounded-xl border-2 bg-white p-3 shadow-md"
        :class="orientation === 'upright' ? 'border-green-300' : 'border-orange-300'">
        <div class="mb-1 text-[10px] font-medium text-gray-400">
          {{ position }}
        </div>
        <div class="text-lg font-bold text-gray-800">
          {{ card.nameCN }}
        </div>
        <div class="text-[10px] text-gray-500">
          {{ card.name }}
        </div>
        <div
          :class="orientation === 'upright' ? 'text-green-600' : 'text-orange-500'"
          class="mt-1 text-xs font-medium"
        >
          {{ orientation === 'upright' ? '▲ 正位' : '▼ 逆位' }}
        </div>
        <div class="mt-2 flex-1 overflow-y-auto text-[11px] leading-relaxed text-gray-600">
          {{ orientation === 'upright' ? card.upright : card.reversed }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TarotCard as TarotCardType } from '~/types/ai'

const props = defineProps<{
  card: TarotCardType
  position: string
  orientation: 'upright' | 'reversed'
  forceFlipped?: boolean
}>()

const isFlipped = ref(props.forceFlipped ?? false)

const emit = defineEmits<{
  flipped: []
}>()

function handleFlip() {
  if (!isFlipped.value) {
    isFlipped.value = true
    emit('flipped')
  }
}

// 如果外部强制翻转
watch(() => props.forceFlipped, (val) => {
  if (val) isFlipped.value = true
})
</script>
