<template>
  <div ref="containerRef" class="message-list chat-scrollbar">
    <template v-if="messages.length">
      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
      <TypingIndicator v-if="isStreaming" />
    </template>
    <div ref="bottomRef" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  messages: import('~/types/chat').ChatMessage[]
  isStreaming: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
const bottomRef = ref<HTMLElement | null>(null)

// 新消息到达时自动滚动到底部
watch(
  () => [props.messages.length, props.isStreaming],
  () => {
    nextTick(() => {
      bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
    })
  },
  { flush: 'post' },
)
</script>
