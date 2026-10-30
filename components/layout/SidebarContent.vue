<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="sidebar-heading hidden lg:block">
      <p class="eyebrow">Your readings</p>
      <h2 class="font-display mt-2 text-xl font-semibold">{{ t('sidebar.history') }}</h2>
    </div>
    <div class="sidebar-history">
      <div class="space-y-1">
        <div
          v-for="session in chatStore.sessions"
          :key="session.id"
          class="group relative"
        >
          <!-- 正常显示模式 -->
          <div
            v-if="editingId !== session.id"
            class="flex items-center"
          >
            <button
              :class="[
                'history-item flex-1 truncate',
                chatStore.activeSessionId === session.id
                  ? 'active'
                  : '',
              ]"
              @click="handleSelectSession(session.id)"
              @dblclick="startRename(session.id, session.title)"
            >
              {{ session.title || t('sidebar.newChatDefault') }}
            </button>
            <!-- 删除按钮，hover 时显示 -->
            <button
              class="ml-0.5 shrink-0 rounded p-2 text-[#738077] opacity-0 transition-opacity hover:text-[#a84637] group-hover:opacity-100 focus:opacity-100"
              :aria-label="`${t('chat.dismiss')} ${session.title}`"
              @click="handleDelete(session.id)"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 编辑模式 -->
          <input
            v-else
            :data-rename-input="session.id"
            v-model="renameText"
            class="w-full rounded border border-[#a84637] bg-[#fbf9f4] px-2 py-2 text-sm text-[#1c302d]"
            maxlength="50"
            @keydown.enter="confirmRename(session.id)"
            @keydown.escape="cancelRename"
            @blur="confirmRename(session.id)"
          />
        </div>
        <p v-if="chatStore.sessions.length === 0" class="px-3 py-3 text-xs leading-6 text-[#738077]">
          {{ t('sidebar.empty') }}
        </p>
      </div>
    </div>
    <div class="sidebar-bottom">
      <button class="flex min-h-11 w-full items-center justify-center gap-2 border border-[#1c302d] px-3 text-sm text-[#1c302d] transition-colors hover:bg-[#1c302d] hover:text-white" @click="handleNewChat">
        <span aria-hidden="true">＋</span>{{ t('sidebar.newChat').replace('+ ', '') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const skillStore = useSkillStore()
const { t } = useI18n()
const emit = defineEmits<{ selectSession: [] }>()

// ---- 重命名 ----
const editingId = ref<string | null>(null)
const renameText = ref('')

function startRename(id: string, currentTitle: string) {
  editingId.value = id
  renameText.value = currentTitle
  nextTick(() => {
    // 自动聚焦到输入框
    const el = document.querySelector<HTMLInputElement>(
      `[data-rename-input="${id}"]`,
    )
    el?.focus()
    el?.select()
  })
}

function confirmRename(id: string) {
  if (editingId.value !== id) return
  chatStore.renameSession(id, renameText.value)
  editingId.value = null
}

function cancelRename() {
  editingId.value = null
}

// ---- 删除 ----
function handleDelete(id: string) {
  chatStore.deleteSession(id)
  // 删除后若无活跃会话，自动新建
  if (!chatStore.activeSession) {
    chatStore.createSession()
  }
}

function handleSelectSession(id: string) {
  chatStore.activeSessionId = id
  skillStore.deactivateSkill()
  emit('selectSession')
}

function handleNewChat() {
  chatStore.createSession(skillStore.activeSkillId ?? undefined)
  skillStore.deactivateSkill()
  emit('selectSession')
}
</script>
