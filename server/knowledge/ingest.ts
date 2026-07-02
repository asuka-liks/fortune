import fs from 'fs'
import path from 'path'
import { createAIClient } from '~/server/services/ai/provider'
import { resetIndex } from '~/server/knowledge/search'
import type { AIProvider } from '~/types/ai'

// ── 类型 ────────────────────────────────────────────

interface IngestFinding {
  type: 'new_insight' | 'correction' | 'gap'
  title: string
  description: string
  relatedPages: string[]
  suggestedAction: 'create_page' | 'update_page' | 'append_section'
  suggestedContent: string
  pageType: 'concept' | 'entity' | 'comparison' | 'overview'
  fileName: string
  tags: string[]
}

interface IngestAnalysis {
  hasNewKnowledge: boolean
  findings: IngestFinding[]
}

// ── 配置 ────────────────────────────────────────────

/**
 * 解析 wiki 目录路径，兼容开发环境和 Docker 生产环境
 * - 开发环境: process.cwd()/server/knowledge/wiki
 * - 生产环境: process.cwd()/.output/server/knowledge/wiki 或 .output/server/assets/wiki
 */
function resolveWikiDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/knowledge/wiki'),
    path.resolve(process.cwd(), '.output/server/knowledge/wiki'),
    path.resolve(process.cwd(), 'knowledge/wiki'),
    path.resolve(process.cwd(), 'server/assets/wiki'),
    path.resolve(process.cwd(), '.output/server/assets/wiki'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  // 默认返回开发路径（即使不存在，后续操作会优雅失败）
  return candidates[0]
}

const WIKI_DIR = resolveWikiDir()

// ── 核心：分析对话 ──────────────────────────────────

/**
 * 分析对话是否产生值得收录的新知识
 * @param messages 完整对话历史
 * @param skillId 当前技能
 * @param retrievedPages 本次检索到的 wiki 页面（用于判断是否已有覆盖）
 * @param provider AI 供应商
 */
export async function analyzeConversationForIngest(
  messages: { role: string; content: string }[],
  skillId: string,
  retrievedPages: { name: string; body: string }[],
  provider: AIProvider = 'deepseek',
): Promise<IngestAnalysis | null> {
  // 快速过滤：对话太短不值得分析
  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  if (userMessages.length < 2 || assistantMessages.length < 1) return null

  // 最后一次 AI 回复太短也不分析
  const lastAssistant = assistantMessages[assistantMessages.length - 1]
  if (!lastAssistant || lastAssistant.content.length < 300) return null

  const client = createAIClient(provider)

  const retrievedSummary = retrievedPages.length > 0
    ? retrievedPages.map(p => `- ${p.name}`).join('\n')
    : '(未检索到相关页面)'

  const conversationText = messages.map(m => `[${m.role === 'user' ? '用户' : 'AI'}]: ${m.content}`).join('\n\n')

  const analysisPrompt = `你是占卜知识库的维护助手。请分析以下对话，判断是否产生了值得收录的新知识。

## 当前技能
${skillId}

## 本次检索到的 wiki 页面（即现有知识库中已覆盖的内容）
${retrievedSummary}

## 对话记录
${conversationText}

## 分析任务

判断对话中是否出现了**现有 wiki 未覆盖**的新知识。只关注以下三类：

1. **新见解**：AI 的解读方法、理论视角、表达技巧是否超出了现有 wiki 的描述？
2. **修正点**：用户是否指出了 AI 回答中的问题？现有 wiki 是否有内容需要修正？
3. **知识缺口**：用户的问题是否暴露了 wiki 尚未覆盖的占卜知识领域？

如果以上三项都没有，返回：
{"hasNewKnowledge": false, "findings": []}

如果有，返回 JSON（不要包含其他文字）：
{
  "hasNewKnowledge": true,
  "findings": [
    {
      "type": "new_insight | correction | gap",
      "title": "一句话标题",
      "description": "2-3 句话说明发现了什么",
      "relatedPages": ["wiki/xxx/yyy.md"],
      "suggestedAction": "create_page | update_page | append_section",
      "pageType": "concept | entity | comparison | overview",
      "fileName": "概念_xxx",
      "tags": ["标签1", "标签2"],
      "suggestedContent": "建议写入的内容（Markdown 格式，含 ## 标题段落）"
    }
  ]
}

## 重要规则

- fileName 必须遵循命名规则：概念页用"概念_xxx"，实体用"实体_xxx"，比较用"xxx_vs_yyy"，综述用描述性中文
- tags 至少 2 个，最多 5 个
- suggestedContent 必须用 Markdown 写，包含 frontmatter 模板、正文、## 关联 部分
- 只收录真正有价值的内容，宁缺毋滥
- pageType 判断标准：
  * concept — 新的解读方法、理论视角、操作技巧
  * entity — 新出现的人物、流派、工具等实体
  * comparison — 对话中做了两种体系/方法的对比
  * overview — 产生了跨多个概念的综合性理解`

  try {
    const response = await client.chat.completions.create({
      model: provider === 'deepseek' ? 'deepseek-v4-flash' : 'qwen-flash',
      messages: [
        { role: 'system', content: '你是一个精确的 JSON 输出机器。只输出合法的 JSON，不要有任何解释或额外文字。' },
        { role: 'user', content: analysisPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    })

    const raw = response.choices[0]?.message?.content?.trim() ?? ''
    // 清理可能的 markdown 代码块包裹
    const jsonStr = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
    const parsed = JSON.parse(jsonStr) as IngestAnalysis

    if (!parsed.hasNewKnowledge || !parsed.findings?.length) return null

    console.log(`[WikiIngest] 发现 ${parsed.findings.length} 条可收录内容:`, parsed.findings.map(f => f.title))
    return parsed
  } catch (err: any) {
    console.error('[WikiIngest] 分析对话失败:', err.message)
    return null
  }
}

// ── 核心：执行写入 ──────────────────────────────────

/**
 * 执行 ingest 写入操作，严格遵守 TheSchema 规范
 */
export function executeIngest(findings: IngestFinding[]): { created: string[]; updated: string[] } {
  const created: string[] = []
  const updated: string[] = []

  for (const finding of findings) {
    try {
      if (finding.suggestedAction === 'create_page') {
        const filePath = createWikiPage(finding)
        created.push(filePath)
      } else if (finding.suggestedAction === 'update_page' || finding.suggestedAction === 'append_section') {
        const filePath = updateWikiPage(finding)
        updated.push(filePath)
      }
    } catch (err: any) {
      console.error(`[WikiIngest] 写入 "${finding.title}" 失败:`, err.message)
    }
  }

  // 更新索引和日志
  if (created.length > 0 || updated.length > 0) {
    updateIndex(findings, created, updated)
    appendLog(findings, created, updated)
  }

  return { created, updated }
}

// ── TheSchema 写入辅助函数 ───────────────────────────

/**
 * 根据 pageType 确定文件存放的子目录
 */
function getSubDir(pageType: string): string {
  const map: Record<string, string> = {
    concept: 'concepts',
    entity: 'entities',
    comparison: 'comparisons',
    overview: 'overview',
  }
  return map[pageType] || 'concepts'
}

/**
 * 生成符合 TheSchema 规范的 frontmatter 文本
 */
function buildFrontmatter(finding: IngestFinding): string {
  const today = new Date().toISOString().slice(0, 10)
  const tagsStr = JSON.stringify(finding.tags)

  return [
    '---',
    `type: ${finding.pageType}`,
    `tags: ${tagsStr}`,
    `summary: "${finding.title}"`,
    'sources:',
    '  - "Fortune对话记录"',
    `updated: "${today}"`,
    '---',
    '',
  ].join('\n')
}

/**
 * 清洗文件名，移除不安全字符
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/\.md$/i, '')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .slice(0, 80) // 限制长度
}

/**
 * 创建新的 wiki 页面
 */
function createWikiPage(finding: IngestFinding): string {
  const subDir = getSubDir(finding.pageType)
  const dir = path.join(WIKI_DIR, subDir)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const safeName = sanitizeFileName(finding.fileName)
  const fileName = `${safeName}.md`
  const filePath = path.join(dir, fileName)

  // 如果文件已存在，加时间戳后缀避免覆盖
  let finalPath = filePath
  if (fs.existsSync(finalPath)) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const altName = `${safeName}_${stamp}.md`
    finalPath = path.join(dir, altName)
  }

  const content = buildFrontmatter(finding) + '\n' + ensureCrossReferences(finding.suggestedContent, finding.relatedPages)

  fs.writeFileSync(finalPath, content, 'utf-8')
  console.log(`[WikiIngest] 创建页面: ${path.relative(WIKI_DIR, finalPath)}`)
  return path.relative(WIKI_DIR, finalPath)
}

/**
 * 更新已有 wiki 页面（追加或替换段落）
 */
function updateWikiPage(finding: IngestFinding): string {
  // 查找要更新的页面
  const targetPath = findExistingPage(finding.relatedPages)
  if (!targetPath) {
    // 找不到目标页面，改为创建新页面
    console.log(`[WikiIngest] 未找到目标页面 ${finding.relatedPages.join(', ')}，改为创建`)
    return createWikiPage(finding)
  }

  const fullPath = path.join(WIKI_DIR, targetPath)
  const existing = fs.readFileSync(fullPath, 'utf-8')

  // 在正文末尾追加新章节
  const today = new Date().toISOString().slice(0, 10)
  const appendix = `\n\n## 补充：${finding.title}（${today}）\n\n${finding.suggestedContent.replace(/^#.*\n?/gm, '').trim()}`

  fs.writeFileSync(fullPath, existing + appendix, 'utf-8')

  // 更新 frontmatter 的 updated 日期
  const updated = existing.replace(/^updated:\s*".*"$/m, `updated: "${today}"`)
  fs.writeFileSync(fullPath, updated + appendix, 'utf-8')

  console.log(`[WikiIngest] 更新页面: ${targetPath}`)
  return targetPath
}

/**
 * 在 wiki 目录中查找已有页面
 */
function findExistingPage(references: string[]): string | null {
  for (const ref of references) {
    const cleanRef = ref.replace(/^wiki\//, '').replace(/^\[\[|\]\]$/g, '')
    const fullPath = path.join(WIKI_DIR, cleanRef)
    if (fs.existsSync(fullPath)) return cleanRef
  }
  return null
}

/**
 * 确保内容中包含对相关页面的 [[wikilink]] 交叉引用
 */
function ensureCrossReferences(content: string, relatedPages: string[]): string {
  // 从 suggestedContent 中提取已有的 [[links]]
  const existingLinks = content.match(/\[\[([^\]]+)\]\]/g) || []

  if (relatedPages.length === 0) return content

  // 检查是否已有 "## 关联" 章节
  if (!content.includes('## 关联') && !content.includes('## 相关')) {
    const links = relatedPages
      .map(p => {
        const name = p.replace(/^wiki\//, '').replace(/\.md$/, '')
        return `- [[${name}]]`
      })
      .join('\n')

    content += `\n\n## 关联\n\n${links}\n`
  }

  return content
}

// ── 索引与日志维护 ──────────────────────────────────

/**
 * 更新 wiki/index.md，在新页面类型对应的表格中添加条目
 */
function updateIndex(findings: IngestFinding[], created: string[], updated: string[]): void {
  const indexPath = path.join(WIKI_DIR, 'index.md')
  if (!fs.existsSync(indexPath)) return

  let indexContent = fs.readFileSync(indexPath, 'utf-8')

  // 将 pageType 映射到 index 中的表格标题
  const typeLabelMap: Record<string, string> = {
    concept: 'Concepts（概念）',
    entity: 'Entities（实体）',
    comparison: 'Comparisons（比较）',
    overview: 'Overview（综述）',
  }

  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i]
    const relPath = created[i]
    if (!relPath) continue

    const label = typeLabelMap[finding.pageType] || 'Concepts（概念）'
    const newEntry = `| [[${relPath.replace(/\.md$/, '')}]] | ${finding.title} |`

    // 在对应表格的最后一个条目后插入
    const sectionStart = indexContent.indexOf(`## ${label}`)
    if (sectionStart === -1) continue

    // 找到该表格的下一个 ## 标题或文件末尾
    const nextSection = indexContent.indexOf('\n## ', sectionStart + 5)
    const sectionEnd = nextSection === -1 ? indexContent.length : nextSection

    const before = indexContent.slice(0, sectionEnd)
    const after = indexContent.slice(sectionEnd)

    // 找到最后一行表格条目
    const lastEntry = before.lastIndexOf('\n| [[')
    if (lastEntry !== -1) {
      const lineEnd = before.indexOf('\n', lastEntry + 1)
      indexContent = before.slice(0, lineEnd) + '\n' + newEntry + after
    }
  }

  // 更新最后更新日期
  const today = new Date().toISOString().slice(0, 10)
  indexContent = indexContent.replace(/^> 最后更新：.*$/m, `> 最后更新：${today}`)

  fs.writeFileSync(indexPath, indexContent, 'utf-8')
}

/**
 * 追加 wiki/log.md 操作记录
 */
function appendLog(findings: IngestFinding[], created: string[], updated: string[]): void {
  const logPath = path.join(WIKI_DIR, 'log.md')
  if (!fs.existsSync(logPath)) return

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toTimeString().slice(0, 5)
  const createdPaths = created.map(p => `wiki/${p}`).join(', ')
  const updatedPaths = updated.map(p => `wiki/${p}`).join(', ')

  let logEntry = `\n## [${dateStr} ${timeStr}] ingest | Fortune对话 → `

  if (created.length > 0) logEntry += createdPaths
  if (updated.length > 0) logEntry += (created.length > 0 ? ' + 更新 ' : '更新 ') + updatedPaths

  logEntry += `\n\n**收录内容**：\n`
  for (const f of findings) {
    logEntry += `- ${f.title}（${f.type === 'new_insight' ? '新见解' : f.type === 'correction' ? '修正' : '知识缺口'}）\n`
  }

  logEntry += `\n**交叉引用**：${findings.flatMap(f => f.relatedPages).filter(Boolean).join('、') || '无'}\n`

  fs.appendFileSync(logPath, logEntry, 'utf-8')
}

// ── 批量入口 ────────────────────────────────────────

/**
 * 一键分析 + 写入（供 chat.post.ts 调用）
 * 异步执行，不阻塞主流程，失败不影响对话
 */
export async function tryAutoIngest(
  messages: { role: string; content: string }[],
  skillId: string,
  retrievedPages: { name: string; body: string }[],
  provider: AIProvider = 'deepseek',
): Promise<void> {
  try {
    const analysis = await analyzeConversationForIngest(messages, skillId, retrievedPages, provider)
    if (!analysis || !analysis.hasNewKnowledge) return

    const result = executeIngest(analysis.findings)
    if (result.created.length > 0 || result.updated.length > 0) {
      // 清理索引缓存，下次搜索会重新加载
      clearIndexCache()
      console.log(`[WikiIngest] 完成：创建 ${result.created.length}，更新 ${result.updated.length}`)
    }
  } catch (err: any) {
    console.error('[WikiIngest] 自动收录失败（不影响对话）:', err.message)
  }
}

/**
 * 清除搜索索引缓存（写入新页面后调用）
 */
function clearIndexCache(): void {
  resetIndex()
}
