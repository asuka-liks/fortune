# 小豆支付部署与验收

使用小豆易支付共享密钥协议，不使用 RSA 应用凭证。官方协议：https://github.com/xiaodou-official/xiaodou-open-platform/blob/main/docs/13-epay-compat-integration.md 。

## 业务规则

- 1 元 1 次、9.9 元 12 次、20 元 30 次；金额和次数固定在服务端。
- 每条完整 AI 回复消耗一次，追问也计次。每日同一来源 IP 免费 5 次，先用免费额度，再用已购额度。购买次数不过期。
- 免登录，HttpOnly Cookie 标识额度账户；恢复码可用于换设备。数据库仅存恢复码和会话令牌的 SHA-256 摘要。首次购买前必须确认已保存恢复码。
- 更换恢复码会撤销旧恢复码和所有旧会话。恢复码不恢复聊天记录，聊天记录仍在原浏览器 localStorage 中。
- 回复开始前在数据库事务内预占额度。空回复、截断、超时、取消和断线释放预占；正常完成才确认消费。AI 请求最多 5 分钟，进程崩溃遗留的预占最迟 10 分钟后在下次查询/使用时释放。

## 运行环境

Node.js 22.18+（22.x），使用内置 `node:sqlite`。当前支持单个 Docker 实例和持久化 SQLite 卷，不支持无状态 Serverless 或多副本部署。SQLite 在 Node 22 中仍有 experimental 警告。

服务器 `.env` 配置参见 `.env.example`。`PAYMENT_KEY` 仅保存在服务器，禁止写进前端、Git、日志、URL 或 Docker 镜像。

```dotenv
NUXT_PUBLIC_SITE_URL=https://askoutsider.com/project/fortune
PAYMENTS_ENABLED=true
PAYMENT_GATEWAY=https://pay.xiaodouap.cn/submit.php
PAYMENT_PID=49616103
PAYMENT_KEY=填写后台当前有效商户密钥
PAYMENT_DB_PATH=/app/.data/billing.sqlite
PAYMENT_TRUST_PROXY=true
```

本地默认 `PAYMENTS_ENABLED=false`，钱包恢复和已有次数不受此开关影响。关闭支付开关也会暂停通知处理，维护时应先处理在途订单；重新启用后可通过订单查询补记到账。

当前商户申报的是「实物当面交易／卡密虚拟物品交易」。AI 解读次数包属于在线服务，不能自行当作卡密商品申报。启用收款前，请向小豆对接人说明实际售卖内容并取得对应交易范围确认。已在聊天中发送过的商户密钥应在后台重置；将新密钥只写入服务器 `.env`，再开启 `PAYMENTS_ENABLED=true`。

## Docker 与 Nginx

每次更新容器都必须使用同一个 `fortune-data` 命名卷。**不要直接使用 AGENTS.md 中未挂载数据卷的旧运行命令**。

```bash
docker build -t fortune .
docker volume create fortune-data
docker stop fortune
docker rm fortune
docker run -d --name fortune --env-file .env -p 127.0.0.1:3000:3000 -v fortune-data:/app/.data --restart unless-stopped fortune
```

若已有容器产生了支付数据，必须先备份、迁移到该卷，再替换容器。定期备份数据卷；备份时停止容器，复制卷内数据库及 WAL/SHM 文件后再启动，或使用 SQLite 在线备份工具。

启用 `PAYMENT_TRUST_PROXY=true` 前，确认 Nginx 覆盖（而非追加）真实客户端地址：

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

容器端口只绑定 127.0.0.1，公网流量只能经过 Nginx。服务端不采用客户端传来的 X-Forwarded-For。订单通知的查询串有签名，建议对通知路径关闭 access_log 或使用不记录查询串的日志格式。恢复码和付款页面不得缓存。

## 支付与通知

- 下单入口：`POST /project/fortune/api/payments/orders`，本站 JSON 请求，服务端生成签名，浏览器 POST 到 `submit.php`。
- 通知地址：`https://askoutsider.com/project/fortune/api/payments/xiaodou/notify`，易支付使用 **GET**，不是原生 API 的 POST Webhook。
- 支付回跳：`https://askoutsider.com/project/fortune/payment`。回跳参数不直接开通权益。
- 通知验签通过后仍核对商户号、订单号、金额、支付方式及流水唯一性。事务内只发放一次。
- 查单使用服务端 `POST api.php`，密钥只放 POST 表单；用户只能查询自己额度账户的订单。渠道超时保持待确认，不按付款失败处理。
- 支付宝可在普通浏览器使用。微信支付只在微信内打开本站时提供入口，是否受理以商户通道实际放行为准。

## 测试与真实验收

```bash
npm test
npm run build
node --test smoke/billing-http.mjs
```

自动测试使用临时数据库和虚假凭证，不请求真实支付渠道。上线后由商户完成一次 1 元真实付款，核验以下结果：

1. 保存恢复码后创建订单，金额为 1.00 元，支付页收款商户正确。
2. 付款成功后仅到账 1 次，刷新、重复通知或重复查单不会再增加。
3. 换浏览器通过恢复码找回余额；别人的恢复码、订单号无法访问本账户。
4. 免费额度用尽后成功回复扣 1 次；AI 失败/截断/取消/断线不扣。多个请求竞争最后一次额度只能预占成功一次。
5. 回跳没有会话时提示先恢复账户；用户未回跳也可通过通知到账。
6. 重建容器并挂载原卷，订单和次数保持。

本地模拟和构建通过不能替代真实支付链验收。

## 退款

该协议不支持 API 退款或退款通知自动同步。管理员先检查订单及余额，暂停该账户使用或等待在途解读结束；在小豆后台确认退款成功后，用容器内工具撤回整包次数：

```bash
docker exec fortune node scripts/refund-payment.mjs ft_订单号 --inspect
# 在小豆后台退款成功后再执行：
docker exec fortune node scripts/refund-payment.mjs ft_订单号 --confirmed
```

工具拒绝已退款订单、正在解读的账户及剩余额度不足的整包撤回，避免重复扣减或负余额。已消费部分需要人工协商退款金额；不要先退款再假设一定可整包撤回。恢复码找回额度不会补发已经退款的订单。
