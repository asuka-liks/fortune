/**
 * 简单的内存限流器
 * 限制每个 IP 每分钟的请求次数
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const MAX_REQUESTS_PER_MINUTE = 10
const WINDOW_MS = 60_000

/** 检查是否超过限流。返回 true 表示允许，false 表示被限流。 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    // 重置窗口
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return false
  }

  entry.count++
  return true
}

/** 获取剩余请求次数 */
export function getRemainingRequests(ip: string): number {
  const entry = store.get(ip)
  if (!entry) return MAX_REQUESTS_PER_MINUTE
  return Math.max(0, MAX_REQUESTS_PER_MINUTE - entry.count)
}

/** 清理过期条目，防止内存泄漏 */
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(ip)
    }
  }
}, 60_000)
