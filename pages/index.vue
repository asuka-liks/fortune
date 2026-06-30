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
      <BaguaForm
        v-else-if="skillStore.activeSkillId === 'bagua'"
        @submit="handleSkillSubmit"
      />
      <FunForm
        v-else-if="skillStore.activeSkillId === 'fun'"
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
const chatStore = useChatStore()
const skillStore = useSkillStore()
const { sendMessage, stopGeneration, remainingQuota, quotaTotal, fetchQuota } = useChat()
const { load, save } = useChatPersistence()

// 初始化：恢复历史会话到侧边栏
onMounted(() => {
  load()
  fetchQuota()
})

// 自动保存
watch(
  () => chatStore.sessions,
  () => save(),
  { deep: true },
)

const { t } = useI18n()

const activeSkillName = computed(() => {
  if (!skillStore.activeSkillId) return undefined
  return t(`skill.${skillStore.activeSkillId}.name`)
})

// 是否显示技能表单：已选技能但尚未就绪
const showSkillForm = computed(
  () => skillStore.activeSkillId && !skillStore.isSkillReady,
)

const autoStartKeys: Record<string, string> = {
  bazi: 'chat.autoStartBazi',
  astrology: 'chat.autoStartAstrology',
  tarot: 'chat.autoStartTarot',
    bagua: 'chat.autoStartBagua',
    fun: 'chat.autoStartFun',
}

function handleSkillSubmit(context: Record<string, string>) {
  // 提交表单时才新建会话
  chatStore.createSession(skillStore.activeSkillId!)
  for (const [key, value] of Object.entries(context)) {
    skillStore.setContext(key, value)
  }
  skillStore.isSkillReady = true

  // 自动发送一条消息，触发 AI 回复
  const skillId = skillStore.activeSkillId!
  sendMessage(t(autoStartKeys[skillId]))
}

async function handleSend(text: string) {
  await sendMessage(text)
}

function handleStop() {
  stopGeneration()
}
</script>
