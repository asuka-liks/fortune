# ============================================================
# Fortune AI — Docker 多阶段构建
# ============================================================

# ── 阶段 1️⃣：构建 ──────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# 先装依赖（利用 Docker 缓存层，代码没变就不用重装）
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建时注入站点 URL（默认 Vercel 域名，部署到自己服务器时覆盖）
ARG NUXT_PUBLIC_SITE_URL=https://askoutsider.com/project/fortune
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL}

RUN npm run build

# ── 阶段 2️⃣：运行 ──────────────────────────────────────────
FROM node:22-alpine

# 创建非 root 用户，防止容器被攻破后提权到宿主机
RUN addgroup -S fortune && adduser -S fortune -G fortune

WORKDIR /app

# 只复制构建产物，不包含源码 / node_modules / .git
COPY --from=build /app/.output ./.output

# 复制 wiki 知识库文件（运行时检索和 ingest 需要）
COPY --from=build /app/server/knowledge/wiki ./.output/server/knowledge/wiki

# 本地运维退款记录工具，仅容器内命令行可用
COPY --from=build /app/scripts/refund-payment.mjs ./scripts/refund-payment.mjs
COPY --from=build /app/server/services/billing/ledger.ts ./server/services/billing/ledger.ts

# 文件归属给 fortune 用户
RUN mkdir -p /app/.data && chown -R fortune:fortune ./.output /app/.data

USER fortune

EXPOSE 3000

ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV PAYMENT_DB_PATH=/app/.data/billing.sqlite

CMD ["node", ".output/server/index.mjs"]
