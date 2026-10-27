import { createAIClient, getDefaultModel, getMaxTokens } from '~/server/services/ai/provider'
import { billingError, currentWallet, ledger, noStore, requestIp, sameOriginMutation } from '../../services/billing/http'
import { digest } from '../../services/billing/ledger'
import { getSkill } from '~/config/skills'
import { searchWiki, formatWikiContext } from '~/server/knowledge/search'
import { tryAutoIngest } from '~/server/knowledge/ingest'
import { z } from 'zod'

// 请求体校验 schema
const chatRequestSchema = z.object({
  skillId: z.enum(['bazi', 'astrology', 'tarot', 'bagua', 'fun']),
  context: z.record(z.string().max(5000)).optional().default({}),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(10000),
    }),
  ).min(1).max(40),
  provider: z.enum(['qwen', 'deepseek']).optional().default('deepseek'),
  locale: z.enum(['zh-CN', 'en']).optional().default('zh-CN'),
})

export default defineEventHandler(async (event) => {
  sameOriginMutation(event)
  // 1. 解析并校验请求体
  const rawBody = await readBody(event)
  const parsed = chatRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    throw createError({
      statusCode: 400,
      statusMessage: `请求参数错误: ${firstIssue.path.join('.')} - ${firstIssue.message}`,
    })
  }
  const body = parsed.data

  // 2. 获取 IP
  const ip = requestIp(event)
  const db = ledger()

  // 3. 每分钟频率限流
  try { db.limit('chat:' + digest(ip), 10, 60_000) } catch (error) { billingError(error) }

  // 5. 加载技能定义
  const skill = getSkill(body.skillId)
  if (!skill) {
    throw createError({
      statusCode: 400,
      statusMessage: `未知的技能: ${body.skillId}`,
    })
  }

  // 6. 构建系统提示词（根据语言选择）
  const locale = body.locale ?? 'zh-CN'
  const rawPrompt = (locale === 'en' && skill.systemPromptEn)
    ? skill.systemPromptEn
    : skill.systemPrompt
  let systemPrompt = rawPrompt
  for (const [key, value] of Object.entries(body.context ?? {})) {
    systemPrompt = systemPrompt.replaceAll(`{{${key}}}`, String(value))
  }
  systemPrompt = systemPrompt.replaceAll(/{{[^}]+}}/g, locale === 'en' ? '(not provided)' : '(未提供)')

  // 7. 检索 wiki 知识库（失败不影响主流程）
  const userQuery = body.messages[body.messages.length - 1]?.content ?? ''
  let retrievedPages: { name: string; body: string; type: string; summary: string }[] = []
  let wikiContext = ''
  try {
    const result = searchWiki(userQuery, body.skillId, 3)
    retrievedPages = result
    wikiContext = formatWikiContext(retrievedPages)
  } catch (err: any) {
    console.error('[WikiSearch] 检索失败（不影响对话）:', err.message)
  }

  // 8. 构建完整的 messages 数组（system prompt + wiki 知识 + 对话历史）
  const messages = [
    { role: 'system', content: systemPrompt + wikiContext },
    ...body.messages,
  ]

  // 9. 选择 AI 供应商并创建客户端
  const provider = body.provider ?? 'deepseek'
  const model = getDefaultModel(provider)
  const client = createAIClient(provider)
  // 推理模型需更大预算（思考 + 答案），否则答案会在思考阶段被 max_tokens 耗尽
  const maxTokens = getMaxTokens(provider, skill.maxTokens)

  // 调用 AI 前原子预占一次额度，最多运行五分钟，失败、取消和断线均释放。
  let reservation: string
  try { reservation = db.reserve(ip, currentWallet(event)?.id) } catch (error) { billingError(error) }
  noStore(event)
  const eventStream = createEventStream(event)
  const abort = new AbortController()
  let completed = false, disconnected = false
  const timeout = setTimeout(() => abort.abort(), 5 * 60_000)
  eventStream.onClosed(() => {
    disconnected = true
    abort.abort()
    clearTimeout(timeout)
    if (!completed) db.finish(reservation, false)
  })
  void (async () => {
    try {
      const stream = await client.chat.completions.create({
        model, messages: messages as any, stream: true, max_tokens: maxTokens, temperature: 0.7,
      }, { signal: abort.signal })
      let producedContent = false, finishReason: string | null = null
      for await (const chunk of stream) {
        finishReason = chunk.choices[0]?.finish_reason ?? finishReason
        const token = chunk.choices[0]?.delta?.content ?? ''
        if (token) { producedContent = true; await eventStream.push(token) }
      }
      if (!producedContent || finishReason !== 'stop' || abort.signal.aborted) throw new Error('Incomplete answer')
      if (!db.finish(reservation, true)) throw new Error('Reservation expired')
      completed = true
      await eventStream.push('__DONE__')
      tryAutoIngest(body.messages, body.skillId, retrievedPages, provider)
        .catch(() => console.error('[WikiIngest] 自动收录失败'))
    } catch {
      if (!completed) db.finish(reservation, false)
      if (!disconnected) await eventStream.push('__ERROR__:' + (locale === 'en'
        ? 'The reading did not complete. Your credit was returned.' : '本次回复未完整生成，次数已返还，请重试。')).catch(() => {})
    } finally {
      clearTimeout(timeout)
      await eventStream.close().catch(() => {})
    }
  })()
  return eventStream.send()
})
