<template>
  <div class="space-y-2">
    <h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{{ t('skill.selectorTitle') }}</h2>
    <button
      v-for="skill in skills"
      :key="skill.id"
      :class="[
        'w-full rounded-xl border px-4 py-3 text-left transition-all hover:shadow-sm',
        isActive(skill.id)
          ? 'border-purple-300 bg-purple-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300',
      ]"
      @click="$emit('select', skill.id)"
    >
      <div class="flex items-center gap-3">
        <span class="text-2xl">{{ skill.icon }}</span>
        <div>
          <div class="text-sm font-semibold text-gray-800">{{ t(`skill.${skill.id}.name`) }}</div>
          <div class="text-xs text-gray-500">{{ t(`skill.${skill.id}.desc`) }}</div>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SkillId } from '~/types/skill'
import { getAllSkills } from '~/config/skills'

const props = withDefaults(defineProps<{
  activeSkillId: SkillId | null
}>(), { activeSkillId: null })

defineEmits<{
  select: [id: SkillId]
}>()

const skills = getAllSkills()
const { t } = useI18n()

function isActive(id: SkillId) {
  return props.activeSkillId === id
}
</script>
