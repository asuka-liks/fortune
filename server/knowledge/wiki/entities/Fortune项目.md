---
type: entity
tags: ["Fortune", "AI算命", "Nuxt3", "Web应用", "建构论"]
summary: "Fortune 是一个运行在 askoutsider.com 上的 AI 算命应用。五种占卜技能覆盖中西体系，技术架构清晰，设计哲学上秉承建构论——AI 是叙事建构者而非通灵者。是符号可迁移性理论在生产环境中的工程验证。"
sources:
  - "config/skills/index.ts"
  - "sources/Fortune项目占卜实现.md"
updated: "2026-07-01"
---

## 基本信息

- **名称**：Fortune
- **类型**：Web 应用（Nuxt 3 SSR）
- **上线地址**：`askoutsider.com/project/fortune/`
- **技术栈**：Nuxt 3 + TypeScript + Tailwind CSS + Pinia + OpenAI SDK
- **AI 供应商**：DeepSeek（默认）、Qwen
- **运行方式**：Docker 容器，Nginx 反向代理

## 五种占卜技能

| 技能 | 符号来源 | AI 角色 | 随机性 | 用户输入 |
|------|---------|---------|--------|---------|
| 八字命理 | 出生时间 + 干支历法 | 命理分析者 | 无（生辰固定） | 日期 + 时辰 + 性别 |
| 星座运势 | 黄道十二宫 | 温暖占星师 | 无（星座固定） | 星座 + 周期 |
| 塔罗占卜 | 78 张塔罗牌（实现22张大牌） | 牌面解读者 | 服务端随机抽牌 | 提问（可选） |
| 八卦五行 | 铜钱抛掷 → 64 卦 | 易学高手 | 硬币随机 → 卦象 | 提问（可选） |
| 趣味占卜 | 三国杀卡牌（108+25+10） | 直播间搞笑主播 | 随机抽牌 + 随机卦象 | 提问（可选） |

## 技术特征

### Skill Definition 抽象

五种技能共享同一接口（`types/skill.ts`）：

- `id` / `name` / `description` / `icon` — 元数据
- `systemPrompt` / `systemPromptEn` — 中英文 prompt 模板（用 `{{placeholder}}` 语法）
- `inputs` — 用户输入字段定义（类型、选项、是否必填）
- `inputComponent` — 对应的 Vue 表单组件
- `recommendedModel` / `maxTokens` — AI 参数

这套抽象使得添加新技能只需 3 步：写一个 skill 配置 + 写一个 Form 组件 + 注册到 registry。

### 三个"符号工具"模块

| 模块 | 作用 | 输出 |
|------|------|------|
| `server/utils/tarot.ts` | 22 张大阿卡纳定义 + 洗牌抽牌 | `DrawnCard[]` → `formatDrawnCards()` |
| `server/utils/bagua.ts` | 64 卦定义 + 铜钱模拟 + 梅花易数 | `BaguaShakeResult` / `PointDerivedHexagram` |
| `server/utils/sanguosha.ts` | 108 张游戏牌 + 25 武将 + 10 身份 | `FunDrawResult` |

### 安全设计

- Zod v3 输入校验（防注入和无效请求）
- 全端点 IP 频率限流（10次/分钟/IP）
- 免费对话次数限制（每次成功对话扣减）
- Docker 容器以非 root 用户 `fortune` 运行
- 6 个安全响应头（X-Frame/HSTS/CSP 等）

## 设计哲学：建构论在工程中的体现

Fortune 是 [[overview/占卜符号系统的可迁移性]] 的生产级实现验证：

1. **不假装"灵验"**：每个 system prompt 都要求 "不搞绝对化预测" / "不搞宿命论"，塔罗 prompt 明确说"强调自由意志"
2. **暴露 AI 身份**：所有回复结尾强制 "⚠️ 以上内容由 AI 生成，仅供娱乐参考"
3. **趣味模式 = 建构论的最诚实版本**：趣味占卜不假装神圣——它就是 AI + 游戏卡牌 + 你的想象力，[[entities/三国杀占卜]] 是这个理念的前身
4. **符号与解释解耦**：同一套 64 卦符号，八卦模式用铜钱摇卦解读，趣味模式用梅花易数解读——同一个 `bagua.ts`，两套 prompt

## 与 wiki 其他实体的关系

- [[entities/三国杀占卜]] — Fortune 趣味模式的灵感来源
- [[entities/塔罗]] — Fortune 塔罗技能只实现了大阿卡纳子集
- [[entities/易经]] — Fortune 八卦模式是 64 卦在 web 应用中的实现
- [[entities/梅花易数]] — Fortune 趣味模式中的数字起卦算法
- [[overview/占卜符号系统的可迁移性]] — 理论框架，Fortune 是工程验证

## 关联

- [[sources/Fortune项目占卜实现]]
- [[concepts/概念_八字命理排盘]]
- [[concepts/概念_铜钱摇卦算法]]
- [[concepts/概念_AI占卜Prompt设计模式]]
- [[concepts/概念_星座运势白盒化]]
- [[comparisons/Fortune五种技能对比]]
- [[overview/AI算命应用的设计哲学]]
