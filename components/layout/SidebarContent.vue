<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <div class="flex-1 overflow-y-auto p-4">
      <SkillSelector
        :active-skill-id="skillStore.activeSkillId"
        @select="handleSelectSkill"
      />
    </div>
    <div class="border-t p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-gray-400">{{ t('sidebar.history') }}</span>
        <button
          class="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          @click="handleNewChat"
        >
          {{ t('sidebar.newChat') }}
        </button>
      </div>
      <div class="mt-2 max-h-40 overflow-y-auto space-y-1">
        <button
          v-for="session in chatStore.sessions"
          :key="session.id"
          :class="[
            'w-full truncate rounded px-3 py-1.5 text-left text-xs transition-colors',
            chatStore.activeSessionId === session.id
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100',
          ]"
          @click="chatStore.activeSessionId = session.id"
        >
          {{ session.title || t('sidebar.newChatDefault') }}
        </button>
        <p v-if="chatStore.sessions.length === 0" class="text-xs text-gray-400">
          {{ t('sidebar.empty') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SkillId } from '~/types/skill'

const chatStore = useChatStore()
const skillStore = useSkillStore()
const { t } = useI18n()

function handleSelectSkill(id: SkillId) {
  skillStore.activateSkill(id)
  if (!chatStore.activeSession) {
    chatStore.createSession(id)
  }
}

function handleNewChat() {
  chatStore.createSession(skillStore.activeSkillId ?? undefined)
  skillStore.deactivateSkill()
}
</script>
