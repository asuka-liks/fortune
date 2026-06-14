import type { SkillDefinition, SkillId } from '~/types/skill'
import { baziSkill } from './bazi.skill'
import { astrologySkill } from './astrology.skill'
import { tarotSkill } from './tarot.skill'

export const skillRegistry: Record<string, SkillDefinition> = {
  [baziSkill.id]: baziSkill,
  [astrologySkill.id]: astrologySkill,
  [tarotSkill.id]: tarotSkill,
}

export function getSkill(id: string): SkillDefinition | undefined {
  return skillRegistry[id]
}

export function getAllSkills(): SkillDefinition[] {
  return Object.values(skillRegistry)
}

export function getSkillById(id: SkillId): SkillDefinition | undefined {
  return skillRegistry[id]
}
