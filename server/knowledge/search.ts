import fs from 'fs'
import path from 'path'

// ── 类型 ────────────────────────────────────────────

interface WikiPage {
  /** 相对于 wiki/ 的路径，如 "concepts/概念_塔罗正逆位.md" */
  relPath: string
  /** 文件名（无后缀），如 "概念_塔罗正逆位" */
  name: string
  /** 页面类型 */
  type: string
  /** 标签列表 */
  tags: string[]
  /** 一句话摘要 */
  summary: string
  /** Markdown 正文（不含 frontmatter） */
  body: string
}

interface SearchResult {
  page: WikiPage
  score: number
}

// ── 技能 → 相关标签映射 ────────────────────────────

const SKILL_TAG_MAP: Record<string, string[]> = {
  bazi: ['八字', '命理', '四柱', '天干', '地支', '十神', '五行', '体用'],
  astrology: ['星座', '占星', '运势', '白盒化'],
  tarot: ['塔罗', '韦特', '大阿卡纳', '正逆位', '卡牌', '共时性', '符号'],
  bagua: ['易经', '八卦', '六十四卦', '梅花易数', '六爻', '铜钱', '先天八卦', '后天八卦', '五行'],
  fun: ['三国杀', '占卜', '符号映射', '数字起卦'],
}

// ── 全局索引（服务启动时构建） ──────────────────────

let pageIndex: WikiPage[] = []
let initialized = false

// ── 工具函数 ────────────────────────────────────────

/**
 * 解析 Markdown frontmatter
 * 只处理本 wiki 约定的字段：type, tags, summary
 */
function parseFrontmatter(raw: string): { fields: Record<string, any>; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) {
    return { fields: {}, body: raw }
  }

  const yamlBlock = match[1]
  const body = match[2]
  const fields: Record<string, any> = {}

  // 逐行解析简单的 YAML 字段
  let currentKey = ''
  let inList = false
  const listValues: string[] = []

  for (const line of yamlBlock.split('\n')) {
    // 列表项:   - "value"
    const listMatch = line.match(/^\s+-\s+"([^"]*)"\s*$/) || line.match(/^\s+-\s+'([^']*)'\s*$/) || line.match(/^\s+-\s+(.+)$/)
    if (listMatch && currentKey) {
      inList = true
      listValues.push(listMatch[1] || listMatch[2] || listMatch[3].trim())
      continue
    }

    // 如果之前在收集列表，先保存
    if (inList && currentKey) {
      fields[currentKey] = listValues.slice()
      listValues.length = 0
      inList = false
    }

    // 普通键值对
    const kvMatch = line.match(/^(\w+):\s*(.+)$/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      let value = kvMatch[2].trim()

      // 带引号的字符串
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      // 标签数组内联格式: tags: ["a", "b"]
      if (currentKey === 'tags') {
        const tagMatch = value.match(/^\[(.+)\]$/)
        if (tagMatch) {
          fields[currentKey] = tagMatch[1]
            .split(',')
            .map(t => t.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean)
        }
      } else {
        fields[currentKey] = value
      }
    }
  }

  // 处理最后的列表
  if (inList && currentKey) {
    fields[currentKey] = listValues.slice()
  }

  return { fields, body }
}

/**
 * 提取中文关键词（2-4 字组合）
 */
function extractKeywords(text: string): string[] {
  const cleaned = text.replace(/[^一-鿿\w]/g, ' ')
  const words: string[] = []

  // 按空格和标点分割
  const segments = cleaned.split(/\s+/).filter(s => s.length > 0)

  for (const seg of segments) {
    if (/[一-鿿]/.test(seg)) {
      // 中文：用 2-gram、3-gram、4-gram
      for (let len = 2; len <= 4; len++) {
        for (let i = 0; i <= seg.length - len; i++) {
          words.push(seg.slice(i, i + len))
        }
      }
    } else {
      // 英文/数字：保持原词
      words.push(seg.toLowerCase())
    }
  }

  return words
}

/**
 * 统计关键词在文本中的出现次数
 */
function countMatches(keywords: string[], text: string): number {
  let count = 0
  for (const kw of keywords) {
    let pos = 0
    while ((pos = text.indexOf(kw, pos)) !== -1) {
      count++
      pos += kw.length
    }
  }
  return count
}

/**
 * 检查关键词是否在数组中部分匹配
 */
function anyPartialMatch(keywords: string[], items: string[]): number {
  let matches = 0
  for (const kw of keywords) {
    for (const item of items) {
      if (item.includes(kw) || kw.includes(item)) {
        matches++
        break
      }
    }
  }
  return matches
}

// ── 核心 API ────────────────────────────────────────

/**
 * 初始化：扫描 wiki/ 目录，解析所有页面，建立内存索引
 */
/**
 * 解析 wiki 目录路径，兼容开发环境和 Docker 生产环境
 */
function resolveWikiDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/knowledge/wiki'),
    path.resolve(process.cwd(), '.output/server/knowledge/wiki'),
    path.resolve(process.cwd(), 'knowledge/wiki'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[0]
}

export function initWikiIndex(wikiDir?: string): void {
  if (initialized) return

  const baseDir = wikiDir || resolveWikiDir()
  pageIndex = []

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.md' && entry.name !== 'log.md') {
        const raw = fs.readFileSync(fullPath, 'utf-8')
        const { fields, body } = parseFrontmatter(raw)
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
        const name = entry.name.replace(/\.md$/, '')

        // 提取标签：优先用 frontmatter tags，否则从文件名和正文推断
        let tags: string[] = fields.tags || []
        if (!Array.isArray(tags)) tags = []

        pageIndex.push({
          relPath,
          name,
          type: fields.type || 'concept',
          tags,
          summary: fields.summary || '',
          body,
        })
      }
    }
  }

  walk(baseDir)
  initialized = true

  console.log(`[WikiSearch] 已索引 ${pageIndex.length} 个 wiki 页面`)
}

/**
 * 检索与查询最相关的 wiki 页面
 * @param query 用户消息文本
 * @param skillId 当前技能 ID
 * @param topK 返回前 K 个结果，默认 3
 */
export function searchWiki(query: string, skillId: string, topK: number = 3): Pick<WikiPage, 'relPath' | 'name' | 'type' | 'summary' | 'tags' | 'body'>[] {
  if (!initialized) {
    initWikiIndex()
  }

  if (pageIndex.length === 0) return []

  const queryKeywords = extractKeywords(query)
  const skillTags = SKILL_TAG_MAP[skillId] || []

  const results: SearchResult[] = []

  for (const page of pageIndex) {
    let score = 0

    // 1. 标签匹配（权重最高）
    score += anyPartialMatch(queryKeywords, page.tags) * 10
    score += anyPartialMatch(skillTags, page.tags) * 8

    // 2. 文件名匹配
    score += countMatches(queryKeywords, page.name) * 6

    // 3. 摘要匹配
    score += countMatches(queryKeywords, page.summary) * 4

    // 4. 正文匹配
    score += countMatches(queryKeywords, page.body) * 1

    // 5. skill tag 与 query 的交叉匹配（同领域 bonus）
    score += anyPartialMatch(skillTags, [page.name]) * 3

    if (score > 0) {
      results.push({ page, score })
    }
  }

  // 按分数降序排列，取 topK
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, topK).map(r => ({
    relPath: r.page.relPath,
    name: r.page.name,
    type: r.page.type,
    summary: r.page.summary,
    tags: r.page.tags,
    body: r.page.body,
  }))
}

/**
 * 将 wiki 检索结果格式化为可注入 system prompt 的文本
 */
export function formatWikiContext(pages: Pick<WikiPage, 'name' | 'type' | 'summary' | 'body'>[]): string {
  if (pages.length === 0) return ''

  const sections = pages.map((p, i) => {
    // 截断过长的正文（保留前 2000 字），太短的不截
    let body = p.body.trim()
    if (body.length > 2000) {
      body = body.slice(0, 2000) + '\n\n...（内容过长，已截断）'
    }

    return `### ${p.name}
**类型**: ${p.type}　**摘要**: ${p.summary}

${body}`
  })

  return `\n\n# 参考知识库\n\n以下是从占卜知识库中检索到的相关内容，你可以在解读时参考这些知识，但不要逐字背诵——用你自己的话自然地融入回答：\n\n${sections.join('\n\n---\n\n')}`
}

/**
 * 获取索引中所有页面的标签集合（调试用）
 */
export function getAllTags(): string[] {
  if (!initialized) initWikiIndex()
  const tagSet = new Set<string>()
  for (const page of pageIndex) {
    for (const tag of page.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}

/**
 * 重置索引（ingest 写入新页面后调用，下次搜索时重新加载）
 */
export function resetIndex(): void {
  initialized = false
  pageIndex = []
}
