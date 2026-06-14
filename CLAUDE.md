本文件为在本仓库中使用代码时提供给Claude Code（claude.ai/code）的指导。

1.全部用中文回复
2.每次回复前用固定的称呼：梨 开头
3.不能写兼容性代码，除非我主动要求
4.写代码前先描述方案，等我批准再动手
5.需求模糊时，先提问澄清再写代码
6.写完代码后，列出边缘情况并建议测试用例
7.修改超过3个文件，先拆成小任务
8.出bug时，先写能重现的测试再修复
9.每次被纠正后，反思并制定不再犯的计划

项目
**fortune** — 一款基于人工智能的算命网络应用。用户通过聊天与AI互动，获取个性化的运势解读。提供三种占卜技能：八字命理、星座运势和塔罗牌占卜。
技术栈：Nuxt 3（Vue 3 + Nitro 服务器）、TypeScript、Tailwind CSS、Pinia 状态管理、OpenAI SDK 作为通用 AI 客户端。
## 命令
```bash
npm run dev        # 启动开发服务器，支持热重载
npm run build      # 生产环境构建
npm run preview    # 在本地预览生产环境构建版本
npm run generate   # 生成静态站点（SSG）```
taskkill /F /IM node.exe   #关闭服务器


尚未配置测试套件或代码检查器。
## 建筑
数据流
```
用户填写技能表单 → SkillStore 保存上下文（isSkillReady = true）  
→ 用户发送消息 → ChatStore 跟踪会话  
→ POST /api/fortune/chat { skillId， context， messages[]， provider？ }
→ 服务器解析技能的系统提示模板（{{placeholder}} → → → 值）  
→ AI 提供方（Qwen 或通过 OpenAIAI 兼容 API 的 DeepSeek）流式传输令牌  
→ 服务器通过 Nitro EventStreamStream 推送令牌（SSESE 格式：data: <token>\n\n）  
→→ 客户端解析 SSE SSE 协议，用 \nn 连接多行数据中的事件  
→ ChatStore.appendToLastAssistantMessage() 通过 MarkdownRendererRenderer 渲染（marked）```

组件解析（关键配置）
Nuxt 3 默认会根据目录前缀自动导入组件（例如，使用 `LayoutAppSidebar` 而不是 `AppSidebar`）。本项目在 [nuxt.config.ts](nuxt.config.ts) 中**禁用了前缀功能**：
components: 
dirs: [{ path: '~/components', pathPrefix: false }]