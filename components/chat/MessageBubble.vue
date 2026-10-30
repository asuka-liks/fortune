<template>
  <div class="message-line" :class="message.role === 'user' ? 'user' : ''">
    <div v-if="message.role === 'assistant'" class="message-role" aria-hidden="true">{{ locale === 'en' ? 'F' : '象' }}</div>

    <!-- 消息气泡 -->
    <div
      class="message-body"
    >
      <template v-if="message.role === 'user'">
        <p class="whitespace-pre-wrap">{{ message.content }}</p>
      </template>
      <template v-else>
        <MarkdownRenderer :content="message.content" />
      </template>
    </div>

    <div v-if="message.role === 'user'" class="message-role" aria-hidden="true">{{ locale === 'en' ? 'Q' : '问' }}</div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

defineProps<{
  message: ChatMessage
}>()
const { locale } = useI18n()
</script>
