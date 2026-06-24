# Fortune 项目 — 对话交接文件

> 最后更新：2026-06-24

---

## 项目概览

| 项目 | 仓库 | 部署地址 | 技术栈 |
|------|------|----------|--------|
| **fortune** | `git@github.com:asuka-liks/fortune.git` | `askoutsider.com/project/fortune/` | Nuxt 3 + Docker |
| **page** (askoutsider) | `git@github.com:asuka-liks/askoutsider.git` | `askoutsider.com/` | React + Vite |

---

## 服务器

| 项目 | 值 |
|------|-----|
| **厂商** | 腾讯云 |
| **IP** | `110.40.136.156` |
| **系统** | Ubuntu 22.04 + Docker 26 |
| **连接** | `ssh ubuntu@110.40.136.156` → `sudo su` |
| **备案** | 国内节点，需 ICP 备案（80 端口可能被拦截） |

### 部署架构

```
Nginx (80端口)
├── /                    → /var/www/askoutsider/   (page 静态站)
└── /project/fortune/    → 127.0.0.1:3000          (fortune Docker)
```

### 关键路径

| 内容 | 路径 |
|------|------|
| page 源码 | `/root/askoutsider/` |
| page 静态文件 | `/var/www/askoutsider/` |
| fortune 源码 | `/root/fortune/` |
| fortune .env | `/root/fortune/.env` |
| Nginx 配置 | `/etc/nginx/sites-available/askoutsider` |

---

## 更新命令

### page 项目

```bash
cd /root/askoutsider && git pull && export NVM_DIR="/root/.nvm" && . "$NVM_DIR/nvm.sh" && npm run build && cp -r dist/* /var/www/askoutsider/
```

### fortune 项目

```bash
cd /root/fortune && git pull && docker build -t fortune . && docker stop fortune && docker rm fortune && docker run -d --name fortune --env-file .env -p 3000:3000 --restart unless-stopped fortune
```

### Nginx

```bash
nginx -t && systemctl restart nginx
```

### 查看日志

```bash
docker logs fortune --tail 50
tail -50 /var/log/nginx/error.log
```

---

## Git 注意事项

- **必须用 SSH**，HTTPS 被 GFW 拦截
- `gh repo create` 默认 HTTPS，创建后需 `git remote set-url` 切到 SSH
- 检查协议：`git remote -v`

---

## 近期完成事项

- [x] 项目 Docker 化（Dockerfile + .dockerignore）
- [x] 部署到腾讯云，Nginx 子路径路由
- [x] 修复 page 项目 `useCallback` 未使用导入
- [x] 关于板块头像更换为真实图片
- [x] 关于我 & 技能板块更新为真实内容
- [x] SEO 基础设施（sitemap / robots / meta / hreflang）
- [x] Google Search Console 验证
- [x] Vercel 备用域名 `fortunetellor.vercel.app`
- [x] ICP 备案号添加到页脚（苏ICP备2026041456号-1）

## 待办

- [x] ICP 备案（苏ICP备2026041456号-1）
- [ ] 推广（X / Reddit / Product Hunt 方案已出，未执行）
- [ ] HTTPS（备案后加 Let's Encrypt）
- [ ] 备案完成后更新 Nginx 配置加入 443 端口

---

## CLAUDE.md

项目根目录有 `CLAUDE.md`，包含完整的工作流规范、Git 约定、部署命令。新对话前请先读取。
