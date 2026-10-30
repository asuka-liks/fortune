<template>
  <div class="prose prose-sm max-w-none prose-headings:text-[#1c302d] prose-p:text-[#1c302d] prose-strong:text-[#1c302d] prose-li:text-[#1c302d]" v-html="renderedMarkdown" />
</template>

<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{
  content: string
}>()

// 配置 marked 的安全选项
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedMarkdown = computed(() => {
  try {
    return marked.parse(props.content) as string
  } catch {
    return props.content
  }
})
</script>
