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
ARG NUXT_PUBLIC_SITE_URL=https://fortunetellor.vercel.app
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL}

RUN npm run build

# ── 阶段 2️⃣：运行 ──────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# 只复制构建产物，不包含源码 / node_modules / .git
COPY --from=build /app/.output ./.output

EXPOSE 3000

ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

CMD ["node", ".output/server/index.mjs"]
