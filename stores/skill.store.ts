import { defineStore } from 'pinia'
import type { SkillId, SkillDefinition } from '~/types/skill'

export const useSkillStore = defineStore('skill', () => {
  const activeSkillId = ref<SkillId | null>(null)
  const skillContext = ref<Record<string, string>>({})
  const isSkillReady = ref(false)

  function activateSkill(skillId: SkillId) {
    activeSkillId.value = skillId
    skillContext.value = {}
    isSkillReady.value = false
  }

  function setContext(key: string, value: string) {
    skillContext.value[key] = value
  }

  function validateSkill(skill: SkillDefinition): boolean {
    const allRequired = skill.inputs
      .filter(i => i.required)
      .every(i => skillContext.value[i.key]?.trim())
    isSkillReady.value = allRequired
    return allRequired
  }

  function resolveSystemPrompt(systemPrompt: string): string {
    let resolved = systemPrompt
    for (const [key, value] of Object.entries(skillContext.value)) {
      resolved = resolved.replaceAll(`{{${key}}}`, value ?? '')
    }
    resolved = resolved.replaceAll(/{{[^}]+}}/g, '')
    return resolved
  }

  function deactivateSkill() {
    activeSkillId.value = null
    skillContext.value = {}
    isSkillReady.value = false
  }

  return {
    activeSkillId,
    skillContext,
    isSkillReady,
    activateSkill,
    setContext,
    validateSkill,
    resolveSystemPrompt,
    deactivateSkill,
  }
})
