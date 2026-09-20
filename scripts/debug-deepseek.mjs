/**
 * 诊断脚本：复现"扣次数但无回复"问题
 * 用线上一致的参数直接调用 deepseek-v4-pro（stream: true + max_tokens: 2048 + temperature: 0.7），
 * 打印原始 chunk 的 delta 结构，观察是否只有 reasoning_content 而没有 content。
 *
 * 运行：node scripts/debug-deepseek.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

// 读取 .env 中的 DEEPSEEK_API_KEY
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const apiKey = envContent
  .match(/^DEEPSEEK_API_KEY=["']?([^"'\r\n]+)["']?\s*$/m)?.[1]
  ?.trim()

if (!apiKey || apiKey === 'sk-your-deepseek-api-key') {
  console.error('❌ 未找到有效的 DEEPSEEK_API_KEY（.env 中可能是占位符）')
  process.exit(1)
}

// 模拟线上八卦模式：system prompt 已填充 context，用户消息为"开始分析"
const systemPrompt = `你是一位精通《易经》的易学高手，说话接地气，不拽古文。

## 用户提问
最近事业发展如何？

## 摇卦结果
## 铜钱摇卦过程
第1摇：●●○ → 少阳 ⚊
第2摇：●●● → 老阳 ⚊ ← 动爻
第3摇：●○○ → 少阴 ⚋
第4摇：●●● → 老阳 ⚊ ← 动爻
第5摇：●○○ → 少阴 ⚋
第6摇：●●○ → 少阳 ⚊

## 本卦
火风鼎 (Ding)
上卦离 · 下卦巽
...

## 风格要求
- 简短口语化，像朋友聊天
- 先说明卦象结构
- 结尾加免责声明`

const body = {
  model: 'deepseek-v4-pro',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '开始分析' },
  ],
  stream: true,
  max_tokens: Number(process.argv[2]) || 2048,
  temperature: 0.7,
}

console.log('→ 请求参数:', JSON.stringify({ model: body.model, max_tokens: body.max_tokens, temperature: body.temperature }))
console.log('→ 调用中...\n')

const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(body),
})

console.log('HTTP status:', res.status)

if (!res.ok) {
  const text = await res.text()
  console.error('❌ 接口返回错误（非 2xx），响应体：')
  console.error(text)
  process.exit(1)
}

// 解析 SSE，逐 chunk 观察 delta 结构
const reader = res.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
let contentTotal = ''
let reasoningTotal = ''
let chunkCount = 0
let contentChunks = 0
let reasoningChunks = 0
let otherFields = new Set()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  buffer = buffer.replaceAll('\r', '')
  const lines = buffer.split('\n')
  buffer = lines.pop() ?? ''

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const data = line.slice(6).trim()
    if (data === '[DONE]') continue
    let chunk
    try {
      chunk = JSON.parse(data)
    } catch {
      continue
    }
    const delta = chunk.choices?.[0]?.delta
    if (!delta) continue
    chunkCount++
    const rc = typeof delta.reasoning_content === 'string' ? delta.reasoning_content : ''
    const c = typeof delta.content === 'string' ? delta.content : ''
    for (const k of Object.keys(delta)) {
      if (k !== 'reasoning_content' && k !== 'content') otherFields.add(k)
    }
    if (rc) { reasoningTotal += rc; reasoningChunks++ }
    if (c) { contentTotal += c; contentChunks++ }
  }
}

console.log('\n===== 汇总 =====')
console.log(`delta chunk 总数: ${chunkCount}`)
console.log(`含 reasoning_content 的 chunk: ${reasoningChunks}，总长度 ${reasoningTotal.length} 字`)
console.log(`含 content 的 chunk: ${contentChunks}，总长度 ${contentTotal.length} 字`)
if (otherFields.size) console.log('delta 中出现的其他字段:', [...otherFields].join(', '))
console.log('\n--- reasoning_content 前 300 字 ---')
console.log(JSON.stringify(reasoningTotal.slice(0, 300)))
console.log('\n--- content 前 300 字 ---')
console.log(JSON.stringify(contentTotal.slice(0, 300)))

if (contentTotal.length === 0) {
  console.log('\n⚠️ 结论：content 全程为空 → 与"扣次数但无回复"完全吻合')
} else {
  console.log('\n✅ content 有值，问题可能在别处（如 Nginx 缓冲/超时），需进一步排查')
}
