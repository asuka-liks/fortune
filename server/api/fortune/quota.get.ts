import { getQuota } from '~/server/services/ai/rate-limiter'

/** 查询当前 IP 的剩余对话次数 */
export default defineEventHandler((event) => {
  const ip =
    getHeader(event, 'x-forwarded-for') ??
    getHeader(event, 'x-real-ip') ??
    'unknown'

  const quota = getQuota(ip as string)

  return {
    remaining: quota.remaining,
    total: quota.total,
    isPaid: quota.isPaid,
  }
})
