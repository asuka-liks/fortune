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

## Git 工作流
- **分支策略**：每个功能/修复在 `feature/*` 或 `fix/*` 分支上开发，完成后通过 fast-forward 合并到 `master`，然后推送两个分支
- **提交格式**：`type: 简短描述`，type 用 `feat`（新功能）/ `fix`（修复）/ `chore`（杂项）
- **推送前确认**：修改超过 3 个文件时先告知用户再执行
- **推送命令**：`git push origin master` + `git push origin <分支名>`（分支也一并推送，方便回滚）

### Git 连接方式
- **必须使用 SSH**，HTTPS 在国内被 GFW 拦截无法连接
- SSH 格式：`git@github.com:asuka-liks/<仓库名>.git`
- HTTPS 格式：`https://github.com/asuka-liks/<仓库名>.git`（❌ 不可用）
- `gh repo create` 默认用 HTTPS，创建后需手动切到 SSH：
  ```bash
  git remote set-url origin git@github.com:asuka-liks/<仓库名>.git
  ```
- 已有仓库用 `git remote -v` 检查当前协议

```bash
# 示例：完整工作流
git checkout -b feature/new-feature
# ... 开发、提交 ...
git checkout master
git merge --ff-only feature/new-feature
git push origin master
git push origin feature/new-feature
```

---

## 关联项目

| 项目 | 仓库 | 部署路径 | 技术栈 |
|------|------|----------|--------|
| **fortune** | `git@github.com:asuka-liks/fortune.git` | `askoutsider.com/project/fortune/` | Nuxt 3 + Docker |
| **askoutsider** | `git@github.com:asuka-liks/askoutsider.git` | `askoutsider.com/` | React + Vite |

两个项目部署在同一台服务器上，Nginx 统一路由：
- `/` → askoutsider 静态文件 (`dist/`)
- `/project/fortune/` → fortune Docker 容器 (`127.0.0.1:3000`)

---

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

服务器连接：
ssh ubuntu@110.40.136.156
sudo su

### 服务器部署更新

**page 项目（askoutsider 主页）**：
```bash
cd /root/askoutsider && git pull && export NVM_DIR="/root/.nvm" && . "$NVM_DIR/nvm.sh" && npm run build && cp -r dist/* /var/www/askoutsider/
```
> 静态文件由 Nginx 直接托管，无需重启服务
> root 默认 Node 太旧，需要先加载 nvm

**fortune 项目（算命应用）**：
```bash
cd /root/fortune && git pull && docker build -t fortune . && docker stop fortune && docker rm fortune && docker run -d --name fortune --env-file .env -p 3000:3000 --restart unless-stopped fortune
```
> 修改 `nuxt.config.ts` 或 `Dockerfile` 时需要重建镜像

**Nginx 配置文件**：`/etc/nginx/sites-available/askoutsider`
```bash
nginx -t && systemctl restart nginx  # 验证并重载 Nginx
```

**查看日志**：
```bash
docker logs fortune --tail 50        # fortune 容器日志
tail -50 /var/log/nginx/error.log   # Nginx 错误日志
```

---

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