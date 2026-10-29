import { createAIClient, getDefaultModel, getMaxTokens } from '~/server/services/ai/provider'
import { billingError, currentWallet, ledger, noStore, requestIp, sameOriginMutation } from '../../services/billing/http'
import { digest } from '../../services/billing/ledger'
import { BillingError } from '../../services/billing/ledger'
import { onePayBalance, onePayConfig, settleOnePayConsumption } from '../../services/billing/onepay'
import { getSkill } from '~/config/skills'
import { searchWiki, formatWikiContext } from '~/server/knowledge/search'
import { tryAutoIngest } from '~/server/knowledge/ingest'
import { z } from 'zod'

// 请求体校验 schema
const chatRequestSchema = z.object({
  requestId: z.string().uuid(),
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
  const wallet = currentWallet(event)
  const onepay = onePayConfig()
  let previous = wallet ? db.onePayReading(wallet.id, body.requestId) : undefined
  if (previous?.state === 'generating' && previous.created_at < Date.now() - 6 * 60_000) {
    db.removeOnePayReading(wallet!.id, body.requestId)
    previous = undefined
  }
  if (previous?.state === 'generating') throw createError({ statusCode: 409, message: '这条解读仍在生成中' })
  if (previous?.state === 'awaiting' && !onepay) throw createError({ statusCode: 503, message: '一人付暂时不可用，无法确认这条解读' })
  let reservation: string | undefined
  let onePayReading = !!previous
  if (!previous) {
    try { reservation = db.reserve(ip, wallet?.id) }
    catch (error) {
      if (!(error instanceof BillingError) || error.statusCode !== 402 || !wallet || !onepay) billingError(error)
      let balance: number
      try { balance = await onePayBalance(onepay.key, wallet.id) } catch (queryError) { billingError(queryError) }
      if (balance < 1) billingError(error)
      db.startOnePayReading(wallet.id, body.requestId)
      onePayReading = true
    }
  }
  noStore(event)
  const eventStream = createEventStream(event)
  const abort = new AbortController()
  let completed = false, disconnected = false
  const timeout = setTimeout(() => abort.abort(), 5 * 60_000)
  eventStream.onClosed(() => {
    disconnected = true
    abort.abort()
    clearTimeout(timeout)
    if (!completed && reservation) db.finish(reservation, false)
    if (!completed && onePayReading && wallet) db.removeOnePayReading(wallet.id, body.requestId)
  })
  void (async () => {
    let failureMessage = locale === 'en'
      ? 'The reading did not complete. Your credit was returned.'
      : '本次回复未完整生成，次数已返还，请重试。'
    try {
      if (previous && wallet && previous.content) {
        const result = previous.state === 'delivered' ? 'confirmed'
          : await settleOnePayConsumption(onepay!.key, wallet.id, body.requestId, true)
        if (result === 'pending') throw new Error('Pending OnePay consumption')
        if (result === 'failed') {
          db.discardOnePayReading(wallet.id, body.requestId)
          failureMessage = locale === 'en' ? 'The reading was not charged. Please try again.' : '一人付未扣次数，请重试。'
          throw new Error('Failed OnePay consumption')
        }
        if (previous.state === 'awaiting') db.deliverOnePayReading(wallet.id, body.requestId)
        completed = true
        await eventStream.push(previous.content)
        await eventStream.push('__DONE__')
        return
      }
      const stream = await client.chat.completions.create({
        model, messages: messages as any, stream: true, max_tokens: maxTokens, temperature: 0.7,
      }, { signal: abort.signal })
      let producedContent = false, finishReason: string | null = null
      const buffered: string[] = []
      for await (const chunk of stream) {
        finishReason = chunk.choices[0]?.finish_reason ?? finishReason
        const token = chunk.choices[0]?.delta?.content ?? ''
        if (token) {
          producedContent = true
          if (onePayReading) buffered.push(token)
          else await eventStream.push(token)
        }
      }
      if (!producedContent || finishReason !== 'stop' || abort.signal.aborted) throw new Error('Incomplete answer')
      if (onePayReading && wallet && onepay) {
        if (!db.saveOnePayReading(wallet.id, body.requestId, buffered.join(''))) throw new Error('Reading not saved')
        const result = await settleOnePayConsumption(onepay.key, wallet.id, body.requestId)
        if (result === 'failed') {
          db.discardOnePayReading(wallet.id, body.requestId)
          failureMessage = locale === 'en' ? 'The reading was not charged. Please try again.' : '一人付未扣次数，请重试。'
          throw new Error('Failed OnePay consumption')
        }
        if (result === 'pending') throw new Error('Pending OnePay consumption')
        db.deliverOnePayReading(wallet.id, body.requestId)
        completed = true
        await eventStream.push(buffered.join(''))
      } else {
        if (!reservation || !db.finish(reservation, true)) throw new Error('Reservation expired')
        completed = true
      }
      await eventStream.push('__DONE__')
      tryAutoIngest(body.messages, body.skillId, retrievedPages, provider)
        .catch(() => console.error('[WikiIngest] 自动收录失败'))
    } catch (error) {
      if (!completed && reservation) db.finish(reservation, false)
      if (!completed && onePayReading && wallet) {
        db.removeOnePayReading(wallet.id, body.requestId)
        if (error instanceof Error && error.message === 'Pending OnePay consumption') {
          failureMessage = locale === 'en'
            ? 'Payment deduction is pending. Send the same message again to recover this reading.'
            : '一人付扣次结果待确认，请再次发送相同消息恢复原解读。'
        } else if (failureMessage.includes('次数已返还') || failureMessage.includes('credit was returned')) {
          failureMessage = locale === 'en' ? 'The reading did not complete. No credit was charged.' : '本次回复未完整生成，未扣次数，请重试。'
        }
      }
      if (!disconnected) await eventStream.push('__ERROR__:' + failureMessage).catch(() => {})
    } finally {
      clearTimeout(timeout)
      await eventStream.close().catch(() => {})
    }
  })()
  return eventStream.send()
})
