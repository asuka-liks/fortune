<template>
  <div class="selection-list">
    <div class="section-heading">
      <h2>{{ t('skill.selectorTitle') }}</h2>
      <span class="text-xs text-[#738077]">01 — 05</span>
    </div>
    <button
      v-for="(skill, index) in skills"
      :key="skill.id"
      class="skill-row"
      @click="$emit('select', skill.id)"
    >
      <span class="skill-number">{{ String(index + 1).padStart(2, '0') }}</span>
      <span class="min-w-0 flex-1">
        <span class="skill-name">{{ t(`skill.${skill.id}.name`) }}</span>
        <span class="skill-description">{{ t(`skill.${skill.id}.desc`) }}</span>
      </span>
      <span class="skill-arrow" aria-hidden="true">↗</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SkillId } from '~/types/skill'
import { getAllSkills } from '~/config/skills'

defineEmits<{
  select: [id: SkillId]
}>()

const skills = getAllSkills()
const { t } = useI18n()

</script>
