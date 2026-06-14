/** 聊天记录 localStorage 持久化 */

const STORAGE_KEY = 'fortune-chat-sessions'

export function useChatPersistence() {
  const chatStore = useChatStore()

  /** 保存当前所有会话到 localStorage */
  function save() {
    try {
      const data = JSON.stringify(chatStore.sessions)
      localStorage.setItem(STORAGE_KEY, data)
    } catch {
      // localStorage 可能已满或不可用
    }
  }

  /** 从 localStorage 恢复会话 */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const sessions = JSON.parse(raw)
      if (Array.isArray(sessions) && sessions.length > 0) {
        chatStore.sessions = sessions
        chatStore.activeSessionId = sessions[0].id
        return true
      }
    } catch {
      // 数据损坏，清除
      localStorage.removeItem(STORAGE_KEY)
    }
    return false
  }

  /** 清除所有持久化数据 */
  function clear() {
    localStorage.removeItem(STORAGE_KEY)
    chatStore.sessions = []
    chatStore.activeSessionId = null
  }

  return { save, load, clear }
}
