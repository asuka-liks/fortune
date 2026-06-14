<template>
  <div class="flex h-full flex-col">
    <!-- 技能表单区域（侧边栏选技能后显示） -->
    <div v-if="showSkillForm" class="border-b bg-white px-4 py-3">
      <BaZiForm
        v-if="skillStore.activeSkillId === 'bazi'"
        @submit="handleSkillSubmit"
      />
      <AstrologyForm
        v-else-if="skillStore.activeSkillId === 'astrology'"
        @submit="handleSkillSubmit"
      />
      <TarotForm
        v-else-if="skillStore.activeSkillId === 'tarot'"
        @submit="handleSkillSubmit"
      />
    </div>

    <!-- 聊天容器 -->
    <ChatContainer
      :messages="chatStore.messages"
      :is-streaming="chatStore.isStreaming"
      :error="chatStore.error"
      :can-chat="!!skillStore.activeSkillId && skillStore.isSkillReady"
      :skill-name="activeSkillName"
      :remaining-quota="remainingQuota"
      :quota-total="quotaTotal"
      @send="handleSend"
      @stop="handleStop"
      @change-skill="skillStore.deactivateSkill()"
      @dismiss-error="chatStore.setError(null)"
    />
  </div>
</template>

<script setup lang="ts">
import { getAllSkills } from '~/config/skills'

const chatStore = useChatStore()
const skillStore = useSkillStore()
const { sendMessage, stopGeneration, remainingQuota, quotaTotal, fetchQuota } = useChat()
const { load, save } = useChatPersistence()

// 初始化
onMounted(() => {
  const restored = load()
  if (!restored) {
    chatStore.createSession()
  }
  fetchQuota()
})

// 自动保存
watch(
  () => chatStore.sessions,
  () => save(),
  { deep: true },
)

const activeSkillName = computed(() => {
  if (!skillStore.activeSkillId) return undefined
  return getAllSkills().find(s => s.id === skillStore.activeSkillId)?.name
})

// 是否显示技能表单：已选技能但尚未就绪
const showSkillForm = computed(
  () => skillStore.activeSkillId && !skillStore.isSkillReady,
)

function handleSkillSubmit(context: Record<string, string>) {
  for (const [key, value] of Object.entries(context)) {
    skillStore.setContext(key, value)
  }
  skillStore.isSkillReady = true
}

async function handleSend(text: string) {
  await sendMessage(text)
}

function handleStop() {
  stopGeneration()
}
</script>
