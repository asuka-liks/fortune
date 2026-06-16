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
                'flex-1 truncate rounded px-3 py-1.5 text-left text-xs transition-colors',
                chatStore.activeSessionId === session.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100',
              ]"
              @click="chatStore.activeSessionId = session.id"
              @dblclick="startRename(session.id, session.title)"
            >
              {{ session.title || t('sidebar.newChatDefault') }}
            </button>
            <!-- 删除按钮，hover 时显示 -->
            <button
              class="ml-0.5 shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
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
            class="w-full rounded px-2 py-1 text-xs text-gray-700 outline-none ring-1 ring-purple-400"
            maxlength="50"
            @keydown.enter="confirmRename(session.id)"
            @keydown.escape="cancelRename"
            @blur="confirmRename(session.id)"
          />
        </div>
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

// ---- 切换技能：点击已选模式取消，点击未选模式切换 ----
function handleSelectSkill(id: SkillId) {
  if (skillStore.activeSkillId === id) {
    // 再次点击已激活的模式 → 取消选择
    skillStore.deactivateSkill()
  } else {
    // 点击未激活的模式 → 切换并弹出表单
    skillStore.activateSkill(id)
  }
}

function handleNewChat() {
  chatStore.createSession(skillStore.activeSkillId ?? undefined)
  skillStore.deactivateSkill()
}
</script>
