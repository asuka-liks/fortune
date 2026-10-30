<template>
  <div class="flex h-full flex-col">
    <PaymentPanel :remaining-quota="remainingQuota" @changed="fetchQuota" />
    <div v-if="showSelection" class="page-stage">
      <EmptyState @select="handleSelectSkill" />
    </div>
    <!-- 选中技能后在主区域填写，不再挤占聊天顶部 -->
    <div v-else-if="showSkillForm" class="page-stage">
      <div class="form-stage">
        <div class="form-stage-head">
          <span class="eyebrow">{{ locale === 'en' ? 'PREPARE YOUR READING' : '开始解读前' }}</span>
          <button class="quiet-button" @click="skillStore.deactivateSkill()">← {{ locale === 'en' ? 'All methods' : '返回选择' }}</button>
        </div>
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
    </div>

    <!-- 聊天容器 -->
    <ChatContainer v-else
      :messages="chatStore.messages"
      :is-streaming="chatStore.isStreaming"
      :error="chatStore.error"
      :can-chat="!!skillStore.activeSkillId && skillStore.isSkillReady"
      :skill-name="activeSkillName"
      :remaining-quota="remainingQuota"
      :quota-total="quotaTotal"
      @send="handleSend"
      @stop="handleStop"
      @change-skill="handleChangeSkill"
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

const { t, locale } = useI18n()
const choosingAgain = ref(false)

const showSelection = computed(() => choosingAgain.value || (!skillStore.activeSkillId && chatStore.messages.length === 0))

watch(() => chatStore.activeSessionId, () => { choosingAgain.value = false })

const activeSkillName = computed(() => {
  if (!skillStore.activeSkillId) return undefined
  return t(`skill.${skillStore.activeSkillId}.name`)
})

// 是否显示技能表单：已选技能但尚未就绪
const showSkillForm = computed(
  () => skillStore.activeSkillId && !skillStore.isSkillReady,
)

function handleSelectSkill(id: import('~/types/skill').SkillId) {
  choosingAgain.value = false
  skillStore.activateSkill(id)
}

function handleChangeSkill() {
  skillStore.deactivateSkill()
  choosingAgain.value = true
}

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
