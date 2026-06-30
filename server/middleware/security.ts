/**
 * 安全响应头中间件
 * 为所有 HTTP 响应添加基础安全头，防止常见 Web 攻击
 */
export default defineEventHandler((event) => {
  // 防止页面被嵌入 iframe（点击劫持防护）
  setResponseHeader(event, 'X-Frame-Options', 'DENY')

  // 禁止浏览器 MIME 类型嗅探
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')

  // 强制 HTTPS 连接（1 年缓存）
  setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // 跨域跳转时仅发送源 host，不泄露完整 URL 路径
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')

  // 禁止 Adobe Flash / PDF 等做跨域请求
  setResponseHeader(event, 'X-Permitted-Cross-Domain-Policies', 'none')

  // 禁用不必要的高权限浏览器功能
  setResponseHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
})
