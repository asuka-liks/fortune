/**
 * 内存限流器
 * - 每个 IP 每分钟最多 10 次请求（防滥用）
 * - 每个 IP 总共只有 3 次免费对话（付费后无限制）
 * - 付费预留接口：markPaid(ip)
 *
 * TODO: 生产环境应换成 Redis，避免多实例/重启丢失数据
 */

interface IpEntry {
  /** 当前分钟窗口内的请求次数 */
  minuteCount: number
  /** 当前分钟窗口的结束时间戳 */
  minuteResetAt: number

  /** 累计对话次数（付费后清零或不再检查） */
  conversationCount: number
  /** 是否为付费用户 */
  isPaid: boolean
}

const store = new Map<string, IpEntry>()

const MAX_REQUESTS_PER_MINUTE = 10
const MINUTE_WINDOW_MS = 60_000

/** 免费对话次数上限 */
const MAX_FREE_CONVERSATIONS = 3

// ==================== 每分钟限流 ====================

/** 检查每分钟限流。返回 true 表示允许。 */
export function checkMinuteRateLimit(ip: string): boolean {
  const now = Date.now()
  let entry = store.get(ip)

  if (!entry) {
    store.set(ip, createEntry(now))
    return true
  }

  // 新分钟窗口，重置分钟计数
  if (now > entry.minuteResetAt) {
    entry.minuteCount = 1
    entry.minuteResetAt = now + MINUTE_WINDOW_MS
    return true
  }

  if (entry.minuteCount >= MAX_REQUESTS_PER_MINUTE) {
    return false
  }

  entry.minuteCount++
  return true
}

// ==================== 免费次数管理 ====================

/** 检查 IP 是否可以发起新对话。返回 true = 可以。 */
export function canStartConversation(ip: string): boolean {
  const entry = store.get(ip)
  if (!entry) return true
  if (entry.isPaid) return true
  return entry.conversationCount < MAX_FREE_CONVERSATIONS
}

/** 对话完成后扣减次数。返回剩余免费次数（付费用户返回 -1 表示无限）。 */
export function incrementConversation(ip: string): number {
  let entry = store.get(ip)
  if (!entry) {
    entry = createEntry(Date.now())
    store.set(ip, entry)
  }

  // 付费用户不计数
  if (entry.isPaid) return -1

  entry.conversationCount++
  return Math.max(0, MAX_FREE_CONVERSATIONS - entry.conversationCount)
}

/** 获取 IP 的剩余信息 */
export function getQuota(ip: string): {
  remaining: number
  total: number
  isPaid: boolean
} {
  const entry = store.get(ip)
  if (!entry) {
    return { remaining: MAX_FREE_CONVERSATIONS, total: MAX_FREE_CONVERSATIONS, isPaid: false }
  }
  if (entry.isPaid) {
    return { remaining: -1, total: MAX_FREE_CONVERSATIONS, isPaid: true }
  }
  return {
    remaining: Math.max(0, MAX_FREE_CONVERSATIONS - entry.conversationCount),
    total: MAX_FREE_CONVERSATIONS,
    isPaid: false,
  }
}

// ==================== 付费预留 ====================

/** 标记 IP 为付费用户（未来对接支付系统）。 */
export function markPaid(ip: string): void {
  const entry = store.get(ip)
  if (entry) {
    entry.isPaid = true
  } else {
    store.set(ip, { ...createEntry(Date.now()), isPaid: true })
  }
}

// ==================== 内部工具 ====================

function createEntry(now: number): IpEntry {
  return {
    minuteCount: 1,
    minuteResetAt: now + MINUTE_WINDOW_MS,
    conversationCount: 0,
    isPaid: false,
  }
}

// ==================== 定时清理 ====================

/** 清理超过 1 小时未活动的 IP 条目，防止内存泄漏 */
setInterval(() => {
  const cutoff = Date.now() - 3_600_000 // 1 小时前
  for (const [ip, entry] of store.entries()) {
    if (entry.minuteResetAt < cutoff) {
      store.delete(ip)
    }
  }
}, 300_000) // 每 5 分钟清理一次
