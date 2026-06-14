/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system'

/** 单条聊天消息 */
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
}

/** 发送到 /api/fortune/chat 的请求体 */
export interface ChatRequest {
  skillId: string
  context: Record<string, string>
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  provider?: 'qwen' | 'deepseek'
}

/** 聊天会话 */
export interface ChatSession {
  id: string
  title: string
  skillId: string | null
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}
