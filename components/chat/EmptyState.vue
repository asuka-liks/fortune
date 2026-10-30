<template>
  <div class="selection-stage">
    <div class="selection-intro">
      <span class="eyebrow">FORTUNE · AN OPEN NOTEBOOK</span>
      <h1>{{ locale === 'en' ? 'A little space for your question.' : '给你的问题，留一处空间。' }}</h1>
      <p>{{ locale === 'en' ? 'Choose a way to read the moment. Begin with what is on your mind.' : '选一种方式看此刻，从你正在想的事开始。' }}</p>
      <div class="orbit-art" aria-hidden="true"><span class="orbit-cross"/><span class="orbit-core"/><span class="orbit-dot"/></div>
    </div>
    <SkillSelector @select="$emit('select', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { SkillId } from '~/types/skill'

defineEmits<{ select: [id: SkillId] }>()
const { locale } = useI18n()
</script>
