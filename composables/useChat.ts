import type { ChatMessage } from '~/types/chat'

export function useChat() {
  const chatStore = useChatStore()
  const skillStore = useSkillStore()
  const settingsStore = useSettingsStore()

  let abortController: AbortController | null = null

  // 配额状态
  const remainingQuota = ref(3)
  const quotaTotal = ref(3)
  const isQuotaExhausted = computed(() => remainingQuota.value <= 0)

  /** 从服务端查询当前 IP 的剩余对话次数 */
  async function fetchQuota(): Promise<void> {
    try {
      const res = await fetch('/api/fortune/quota')
      if (res.ok) {
        const data = await res.json()
        // -1 表示付费用户（无限），用 Infinity 表示
        remainingQuota.value = data.remaining === -1 ? Infinity : data.remaining
        quotaTotal.value = data.total
      }
    } catch {
      // 查询失败时保持旧值，不阻断正常使用
    }
  }

  /** 发送消息并接收流式回复 */
  async function sendMessage(text: string): Promise<void> {
    const session = chatStore.activeSession
    if (!session) {
      chatStore.setError('请先创建一个对话会话')
      return
    }

    if (!skillStore.activeSkillId) {
      chatStore.setError('请先选择一种算命方式')
      return
    }

    // 发送前检查配额
    await fetchQuota()
    if (remainingQuota.value <= 0) {
      chatStore.setError('免费对话次数已用完，敬请期待付费功能')
      return
    }

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    chatStore.addMessage(session.id, userMsg)
    chatStore.setStreaming(true)
    chatStore.setError(null)

    // 创建 AI 消息占位
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    chatStore.addMessage(session.id, assistantMsg)

    // 构建请求体
    const resolvedPrompt = skillStore.resolveSystemPrompt('')
    const context = { ...skillStore.skillContext }

    // 过滤掉空的 AI 占位消息（内容为空的就是刚添加的占位）
    const messages = session.messages
      .filter(m => !(m.role === 'assistant' && m.content === ''))
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    abortController = new AbortController()

    try {
      const response = await fetch('/api/fortune/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: skillStore.activeSkillId,
          context: {
            ...context,
            // 如果 skill prompt 有独立解析逻辑，这里传原始 context
          },
          messages,
          provider: settingsStore.preferredProvider,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        if (response.status === 402) {
          remainingQuota.value = 0
          throw new Error('免费对话次数已用完，敬请期待付费功能')
        }
        const errText = await response.text()
        throw new Error(errText || `请求失败 (${response.status})`)
      }

      // 读取 SSE 流（Nitro EventStream 格式：data: <content>\n\n）
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''
      const sseDataLines: string[] = [] // 积累同一 SSE 事件的多条 data: 行

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        buffer = buffer.replaceAll('\r', '') // 移除 Windows 回车符

        // 按行解析 SSE 事件
        // SSE 协议：每个事件由多条 "field: value" 行组成，以空行结束
        // 多条 data: 行属于同一事件，需用 \n 拼接
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // 保留未完成的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            sseDataLines.push(line.slice(6))
          } else if (line === '' && sseDataLines.length > 0) {
            // 空行 = 事件结束，flush 积累的 data 行
            const content = sseDataLines.join('\n')
            sseDataLines.length = 0
            if (content === '__DONE__') {
              // 成功完成，本地扣减一次配额（服务端已扣，客户端同步）
              if (remainingQuota.value > 0 && remainingQuota.value < Infinity) {
                remainingQuota.value--
              }
              return
            }
            chatStore.appendToLastAssistantMessage(content)
          }
          // 忽略 event:, id:, retry: 等行
        }
      }

      // 流结束后 flush 残余数据（以防最后没有空行）
      if (sseDataLines.length > 0) {
        const content = sseDataLines.join('\n')
        if (content === '__DONE__') {
          if (remainingQuota.value > 0 && remainingQuota.value < Infinity) {
            remainingQuota.value--
          }
        } else {
          chatStore.appendToLastAssistantMessage(content)
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // 用户主动停止，移除空的 AI 消息
        const lastMsg = session.messages[session.messages.length - 1]
        if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
          session.messages.pop()
        }
      } else {
        chatStore.setError(err.message || '请求失败，请重试')
      }
    } finally {
      chatStore.setStreaming(false)
      abortController = null
    }
  }

  /** 停止生成 */
  function stopGeneration() {
    abortController?.abort()
    abortController = null
  }

  return {
    sendMessage,
    stopGeneration,
    remainingQuota,
    quotaTotal,
    isQuotaExhausted,
    fetchQuota,
  }
}
