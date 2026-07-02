---
type: source
tags: ["Fortune", "AI算命", "占卜系统", "Nuxt3", "OpenAI SDK"]
summary: "Fortune 是一个基于 AI 的算命网络应用，提供五种占卜技能（八字/星座/塔罗/八卦/趣味），技术栈为 Nuxt 3 + TypeScript + OpenAI SDK。核心创新：AI 不假装通灵，而是诚实地扮演叙事建构者的角色。"
sources:
  - "config/skills/bazi.skill.ts"
  - "config/skills/astrology.skill.ts"
  - "config/skills/tarot.skill.ts"
  - "config/skills/bagua.skill.ts"
  - "config/skills/fun.skill.ts"
  - "server/utils/tarot.ts"
  - "server/utils/bagua.ts"
  - "server/utils/sanguosha.ts"
  - "types/fortune.ts"
  - "types/skill.ts"
updated: "2026-07-01"
---

## 来源信息

- **项目名称**：Fortune（算命）
- **仓库**：`git@github.com:asuka-liks/fortune.git`
- **技术栈**：Nuxt 3（Vue 3 + Nitro 服务器）、TypeScript、Tailwind CSS、Pinia
- **AI 层**：OpenAI SDK 统一调用 DeepSeek / Qwen
- **部署**：Docker 容器，Nginx 反向代理 `askoutsider.com/project/fortune/`

## 核心要点

1. **五种占卜技能**：八字命理（BaZi）、星座运势（Astrology）、塔罗占卜（Tarot）、八卦五行（Bagua）、趣味占卜（Fun）——系统抽象出一套统一的 Skill Definition 接口
2. **数据流设计**：用户填写技能表单 → SkillStore 保存上下文 → 发送消息 → POST /api/fortune/chat → 服务器解析模板 prompt → AI 流式返回 → SSE 逐 token 推送
3. **符号系统分层实现**：每种技能在代码里被拆成三层——符号定义（`server/utils/`）、用户输入（`*Form.vue`）、AI 解读（system prompt 模板）
4. **非神秘化设计**：所有 system prompt 统一以 "⚠️ 以上内容由 AI 生成，仅供娱乐参考" 结尾——这是建构论在设计层面的直接体现
5. **趣味模式的方法论意义**：Fortune 的趣味模式不是玩笑——它是"符号可迁移性"的最诚实版本，敢于暴露符号系统的建构过程（AI + 游戏卡牌 + 你的想象力）
6. **安全措施**：Zod 输入校验、IP 频率限流（10次/分钟）、Docker 非 root 运行、安全响应头

## 关键架构

```
用户 → Vue 组件 → Pinia Store → POST API
  → Zod 校验 → 限流检查 → 加载 Skill 定义
  → 模板替换 {{placeholder}} → system prompt
  → OpenAI SDK (DeepSeek/Qwen) → SSE 流返回
  → 客户端逐 token 渲染 → Markdown 展示
```

## 关联页面

- [[entities/Fortune项目]] — 作为占卜系统的实体页
- [[concepts/概念_八字命理排盘]] — 八字技能的实现细节
- [[concepts/概念_铜钱摇卦算法]] — 八卦技能的算法实现
- [[concepts/概念_AI占卜Prompt设计模式]] — Prompt 模板工程
- [[concepts/概念_星座运势白盒化]] — 星座技能的差异化设计
- [[comparisons/Fortune五种技能对比]] — 五技能系统性对比
- [[overview/AI算命应用的设计哲学]] — 建构论在工程中的体现
