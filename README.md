# 🔮 Fortune — AI 算命应用

> 一款基于人工智能的算命网络应用，通过聊天与 AI 互动，获取个性化的运势解读。
> An AI-powered fortune telling web app — chat with AI for personalized readings.

[English](#english) · 中文

**Fortune** 提供五种占卜技能，用户填写对应的技能表单后，即可与 AI 进行流式对话，得到由大模型实时生成的运势解读。支持中英双语，内置占卜知识库（RAG），让回答更专业、更有据可依。

**Fortune** offers five divination skills. After filling in a skill form, users chat with an AI that streams personalized readings in real time. Bilingual (中文/English) with a built-in knowledge base (RAG) for more grounded, professional answers.

---

## ✨ 功能特性

- 🗣 **流式对话**：基于 SSE 的 token 级流式输出，打字机式体验
- 🔮 **五种占卜技能**：八字命理 / 星座运势 / 塔罗占卜 / 八卦五行 / 趣味占卜
- 🌐 **中英双语**：完整的 i18n 支持，可随时切换语言
- 📚 **知识库 RAG**：内置 wiki 占卜知识库，检索相关知识点注入提示词，并支持自动收录新知识
- 🤖 **双 AI 供应商**：DeepSeek（默认，推理模型）与通义千问 Qwen，可切换
- 🛡 **限流与额度**：按 IP 限频 + 免费对话次数控制
- 📝 **Markdown 渲染**：AI 回答支持富文本格式
- 📱 **响应式设计**：移动端 / 桌面端自适应
- 🔍 **SEO 优化**：meta、Open Graph、hreflang、sitemap、robots、Google 验证

## 🎯 占卜技能

| 技能 | ID | 说明 |
|------|-----|------|
| 八字命理 | `bazi` | 基于生辰八字的传统命理分析，洞察人生运势 |
| 星座运势 | `astrology` | 十二星座每日 / 每周 / 每月 / 年度运势解读 |
| 塔罗占卜 | `tarot` | 抽取塔罗牌，通过牌面解读指引方向 |
| 八卦五行 | `bagua` | 铜钱摇卦，推演六十四卦，结合五行六亲推算 |
| 趣味占卜 | `fun` | 三国杀卡牌 + 梅花易数，强行串联解读，纯属娱乐 |

## 🛠 技术栈

- **框架**：Nuxt 3（Vue 3 + Nitro 服务端）
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **状态管理**：Pinia
- **AI 客户端**：OpenAI SDK（兼容通义千问 / DeepSeek 的 OpenAI 兼容 API）
- **校验**：zod
- **Markdown**：marked
- **部署**：Docker（多阶段构建）

## 🚀 快速开始

### 前置要求

- Node.js ≥ 22
- npm

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
```

至少需要配置一个 AI 供应商的 Key（两个都配则可在请求时切换）：

```env
# DeepSeek API Key（默认供应商）
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# 通义千问 API Key（阿里云 DashScope）
QWEN_API_KEY=sk-your-qwen-api-key

# 站点 URL（本地开发可省略，默认 http://localhost:3000）
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

> 获取地址：DeepSeek → https://platform.deepseek.com/ · 通义千问 → https://dashscope.console.aliyun.com/

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 其他命令

```bash
npm run build      # 生产环境构建
npm run preview    # 预览生产构建
npm run generate   # 生成静态站点（SSG）
```

## 📁 项目结构

```
fortune/
├── components/            # Vue 组件
│   ├── chat/              #   聊天相关（消息列表、输入框、气泡…）
│   ├── layout/            #   布局（头部、侧边栏、页脚）
│   ├── skills/            #   技能表单与卡片
│   └── ui/                #   基础 UI 组件
├── config/skills/         # 五种占卜技能的定义（系统提示词、表单字段）
├── stores/                # Pinia 状态（chat / skill / locale / settings）
├── composables/           # 组合式函数（useChat、useI18n…）
├── locales/               # 中英文文案（zh-CN / en）
├── pages/                 # 页面路由
├── server/
│   ├── api/fortune/       # 后端 API 端点（chat、quota、抽牌、摇卦…）
│   ├── services/ai/       # AI 供应商、限流逻辑
│   ├── knowledge/         # wiki 知识库（检索 + 自动收录）
│   └── middleware/        # 服务端中间件
├── types/                 # TypeScript 类型定义
├── utils/                 # 工具函数
├── nuxt.config.ts         # Nuxt 配置（含 baseURL、SEO）
└── Dockerfile             # 多阶段构建
```

## 🔌 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/fortune/chat` | 核心对话接口，SSE 流式返回 AI 回答 |
| `POST` | `/api/fortune/bagua-shake` | 铜钱摇卦 |
| `POST` | `/api/fortune/tarot-draw` | 抽取塔罗牌 |
| `POST` | `/api/fortune/fun-draw` | 趣味占卜抽牌 |
| `GET` | `/api/fortune/quota` | 查询当前 IP 剩余免费次数 |
| `GET` | `/api/health` | 健康检查 |

### chat 请求示例

```json
{
  "skillId": "bazi",
  "context": { "birthDate": "1990-01-01", "gender": "male" },
  "messages": [{ "role": "user", "content": "帮我看看今年的运势" }],
  "provider": "deepseek",
  "locale": "zh-CN"
}
```

响应为 SSE 流：`data: <token>`，结束标记为 `__DONE__`。

## 🐳 部署（Docker）

项目提供多阶段构建的 Dockerfile，构建产物仅包含运行时所需文件，并以非 root 用户运行。

```bash
# 构建镜像
docker build -t fortune .

# 运行容器
docker run -d \
  --name fortune \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  fortune
```

容器默认监听 `0.0.0.0:3000`。如需部署到子路径（如 `/project/fortune/`），请在构建时或环境变量中设置 `NUXT_PUBLIC_SITE_URL`，并调整 `nuxt.config.ts` 中的 `app.baseURL` 后重新构建。

## 🔑 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 二选一 | DeepSeek API Key（默认供应商） |
| `QWEN_API_KEY` | 二选一 | 通义千问 API Key |
| `NUXT_PUBLIC_SITE_URL` | 否 | 站点完整 URL，用于 SEO 与 canonical（本地开发可省略） |

---
---

<a name="english"></a>

## English

**Fortune** is an AI-powered fortune telling web app. Users pick one of five divination skills, fill in a short form, and chat with a streaming AI for personalized readings — BaZi (八字), Astrology (星座), Tarot (塔罗), Bagua (八卦五行), and a Fun mode. It's bilingual (Chinese/English) and backed by a wiki knowledge base with retrieval-augmented generation (RAG).

### Tech Stack

Nuxt 3 (Vue 3 + Nitro) · TypeScript · Tailwind CSS · Pinia · OpenAI SDK · zod · marked · Docker

### Quick Start

```bash
npm install
cp .env.example .env   # fill in DEEPSEEK_API_KEY and/or QWEN_API_KEY
npm run dev            # http://localhost:3000
```

### Key Features

- Token-level SSE streaming chat
- Dual AI providers: DeepSeek (default) & Qwen
- Built-in knowledge base with RAG + auto-ingestion
- Rate limiting & free quota control
- Full i18n (中文 / English)
- Responsive & SEO-friendly

See the Chinese section above for the full API reference, project structure, and deployment guide.
