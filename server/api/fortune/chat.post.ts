import { createAIClient, getDefaultModel } from '~/server/services/ai/provider'
import { checkRateLimit, getRemainingRequests } from '~/server/services/ai/rate-limiter'
import { getSkill } from '~/config/skills'
import type { ChatRequest } from '~/types/chat'

export default defineEventHandler(async (event) => {
  // 1. 解析请求体
  const body = await readBody<ChatRequest>(event)

  if (!body?.skillId || !body?.messages?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少必要参数: skillId 或 messages',
    })
  }

  // 2. 限流检查
  const ip = getHeader(event, 'x-forwarded-for')
    ?? getHeader(event, 'x-real-ip')
    ?? 'unknown'

  if (!checkRateLimit(ip as string)) {
    throw createError({
      statusCode: 429,
      statusMessage: '请求过于频繁，请稍后再试',
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

  // 4. 构建系统提示词
  let systemPrompt = skill.systemPrompt
  for (const [key, value] of Object.entries(body.context ?? {})) {
    systemPrompt = systemPrompt.replaceAll(`{{${key}}}`, String(value))
  }
  systemPrompt = systemPrompt.replaceAll(/{{[^}]+}}/g, '(未提供)')

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
