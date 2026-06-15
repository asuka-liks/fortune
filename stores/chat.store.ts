import { defineStore } from 'pinia'
import type { ChatMessage, ChatSession } from '~/types/chat'
import { useLocaleStore } from './locale.store'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([])
  const activeSessionId = ref<string | null>(null)
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  const activeSession = computed(() =>
    sessions.value.find(s => s.id === activeSessionId.value) ?? null,
  )

  const messages = computed(() => activeSession.value?.messages ?? [])

  function createSession(skillId?: string): ChatSession {
    const id = crypto.randomUUID()
    const localeStore = useLocaleStore()
    const defaultTitle = localeStore.locale === 'en' ? 'New Chat' : '新对话'
    const session: ChatSession = {
      id,
      title: defaultTitle,
      skillId: skillId ?? null,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    sessions.value.unshift(session)
    activeSessionId.value = id
    return session
  }

  function addMessage(sessionId: string, message: ChatMessage) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = Date.now()
    }
  }

  function appendToLastAssistantMessage(token: string) {
    const session = activeSession.value
    if (!session) return
    const lastMsg = session.messages[session.messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content += token
    }
  }

  function renameSession(sessionId: string, title: string) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.title = title.trim() || 'Untitled'
    }
  }

  function deleteSession(sessionId: string) {
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = sessions.value[0]?.id ?? null
    }
  }

  function clearCurrentSession() {
    if (activeSession.value) {
      activeSession.value.messages = []
    }
  }

  function setStreaming(val: boolean) {
    isStreaming.value = val
  }

  function setError(val: string | null) {
    error.value = val
  }

  return {
    sessions,
    activeSessionId,
    isStreaming,
    error,
    activeSession,
    messages,
    createSession,
    addMessage,
    appendToLastAssistantMessage,
    renameSession,
    deleteSession,
    clearCurrentSession,
    setStreaming,
    setError,
  }
})
