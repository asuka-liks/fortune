/** 生成 UUID v4，兼容非安全上下文（HTTP）环境 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: 使用 crypto.getRandomValues（所有浏览器都支持，包括 HTTP）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3)
    return c === 'x' ? r.toString(16) : (r & 0x3 | 0x8).toString(16)
  })
}
