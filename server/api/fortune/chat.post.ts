import { createAIClient, getDefaultModel } from '~/server/services/ai/provider'
import {
  checkMinuteRateLimit,
  canStartConversation,
  incrementConversation,
} from '~/server/services/ai/rate-limiter'
import { getSkill } from '~/config/skills'
import { z } from 'zod'

// 请求体校验 schema
const chatRequestSchema = z.object({
  skillId: z.enum(['bazi', 'astrology', 'tarot', 'bagua', 'fun']),
  context: z.record(z.string(), z.string().max(5000)).optional().default({}),
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
  const ip = getHeader(event, 'x-forwarded-for')
    ?? getHeader(event, 'x-real-ip')
    ?? 'unknown'

  // 3. 每分钟频率限流
  if (!checkMinuteRateLimit(ip as string)) {
    throw createError({
      statusCode: 429,
      statusMessage: '请求过于频繁，请稍后再试',
    })
  }

  // 4. 免费次数检查
  if (!canStartConversation(ip as string)) {
    throw createError({
      statusCode: 402,
      statusMessage: '免费对话次数已用完，敬请期待更新',
    })
  }

  // 3. 加载技能定义
  const skill = getSkill(body.skillId)
  if (!skill) {
    throw createError({
      statusCode: 400,
      statusMessage: `未知的技能: ${body.skillId}`,
    })
  }

  // 4. 构建系统提示词（根据语言选择）
  const locale = body.locale ?? 'zh-CN'
  const rawPrompt = (locale === 'en' && skill.systemPromptEn)
    ? skill.systemPromptEn
    : skill.systemPrompt
  let systemPrompt = rawPrompt
  for (const [key, value] of Object.entries(body.context ?? {})) {
    systemPrompt = systemPrompt.replaceAll(`{{${key}}}`, String(value))
  }
  systemPrompt = systemPrompt.replaceAll(/{{[^}]+}}/g, locale === 'en' ? '(not provided)' : '(未提供)')

  // 5. 构建完整的 messages 数组
  const messages = [
    { role: 'system', content: systemPrompt },
    ...body.messages,
  ]

  // 6. 选择 AI 供应商并创建客户端
  const provider = body.provider ?? 'deepseek'
  const model = getDefaultModel(provider)
  const client = createAIClient(provider)

  // 7. 创建 SSE 流
  const eventStream = createEventStream(event)

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: messages as any,
      stream: true,
      max_tokens: skill.maxTokens,
      temperature: 0.7,
    })

    // 异步转发 token 流
    ;(async () => {
      try {
        for await (const chunk of stream) {
          const token = (chunk.choices[0]?.delta?.content as string) ?? ''
          if (token) {
            await eventStream.push(token)
          }
        }
        // 成功完成，扣减一次对话次数
        incrementConversation(ip as string)
        await eventStream.push('__DONE__')
        await eventStream.close()
      } catch (err: any) {
        await eventStream.push(`[错误] ${err.message}`)
        await eventStream.close()
      }
    })()
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `AI 服务调用失败: ${err.message}`,
    })
  }

  return eventStream.send()
})
