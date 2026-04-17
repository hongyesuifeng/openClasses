# 第十讲：多平台接入

> 实践教程：将 OpenClaw 接入微信、飞书、钉钉等平台

## 本章概要

本章将指导你将 OpenClaw 接入各种即时通讯平台，实现多渠道使用。

---

## 1. 平台接入概览

### 1.1 支持的平台

```
OpenClaw 支持的平台
────────────────────────────────────────────────────────

国内平台                      海外平台
┌─────────────────┐          ┌─────────────────┐
│ 微信 (个人/企业) │          │ Telegram        │
│ QQ              │          │ Discord         │
│ 钉钉            │          │ WhatsApp        │
│ 飞书            │          │ Slack           │
└─────────────────┘          └─────────────────┘

其他接入方式
┌─────────────────┐
│ Web UI          │
│ CLI 命令行      │
│ REST API        │
│ WebSocket       │
└─────────────────┘
```

### 1.2 接入架构

```
多平台接入架构
────────────────────────────────────────────────────────

                    ┌─────────────┐
                    │  OpenClaw   │
                    │    核心     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │微信适配器│       │飞书适配器│       │钉钉适配器│
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        ↓                  ↓                  ↓
   微信服务器          飞书服务器         钉钉服务器
```

---

## 2. 飞书接入

### 2.1 创建飞书应用

```
步骤一：创建应用
────────────────────────────────────────────────────────

1. 访问飞书开放平台
   https://open.feishu.cn/

2. 创建企业自建应用
   • 应用名称：OpenClaw 助手
   • 应用描述：AI 智能助手

3. 获取凭证
   • App ID: cli_xxxxxxxxx
   • App Secret: xxxxxxxxxxxxxxxx
```

### 2.2 配置权限

```
步骤二：配置应用权限
────────────────────────────────────────────────────────

在"权限管理"中开启：

必需权限：
✅ contact:user.base:readonly     # 获取用户基本信息
✅ im:message                      # 获取与发送消息
✅ im:message:send_as_bot         # 以应用身份发消息

可选权限：
⬜ im:chat:readonly               # 获取群组信息
⬜ im:chat.member:readonly        # 获取群成员列表
```

### 2.3 配置事件订阅

```
步骤三：配置事件订阅
────────────────────────────────────────────────────────

1. 在"事件订阅"页面配置：
   • 请求地址: https://your-domain.com/feishu/webhook

2. 订阅事件：
   ✅ im:message.receive_v1       # 接收消息

3. 验证请求地址（需要服务器已部署）
```

### 2.4 配置 OpenClaw

```bash
# .env 配置

# 启用飞书通道
CHANNELS=feishu

# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxx
FEISHU_ENCRYPT_KEY=xxxxxxxx        # 可选，用于消息加密
FEISHU_VERIFICATION_TOKEN=xxxxx    # 可选，用于验证请求
```

### 2.5 测试接入

```
测试步骤
────────────────────────────────────────────────────────

1. 发布应用版本
   在飞书开放平台创建版本并发布

2. 添加到组织
   将应用添加到你的组织/团队

3. 发送消息测试
   在飞书中找到应用，发送"你好"

4. 检查响应
   OpenClaw 应该会回复消息
```

---

## 3. 钉钉接入

### 3.1 创建钉钉应用

```
步骤一：创建应用
────────────────────────────────────────────────────────

1. 访问钉钉开放平台
   https://open.dingtalk.com/

2. 创建应用
   • 应用类型：H5 微应用
   • 应用名称：OpenClaw 助手

3. 获取凭证
   • Client ID: dingxxxxxxxxxxxx
   • Client Secret: xxxxxxxxxxxxxxxx
```

### 3.2 配置机器人

```
步骤二：配置机器人能力
────────────────────────────────────────────────────────

1. 在应用详情页，找到"机器人与消息推送"

2. 启用机器人
   • 机器人名称：OpenClaw
   • 机器人图标：上传图标

3. 配置消息接收地址
   • 消息接收地址: https://your-domain.com/dingtalk/webhook
```

### 3.3 配置 OpenClaw

```bash
# .env 配置

# 启用钉钉通道
CHANNELS=dingtalk

# 钉钉配置
DINGTALK_CLIENT_ID=dingxxxxxxxxxxxx
DINGTALK_CLIENT_SECRET=xxxxxxxxxxxxxxxx
DINGTALK_AGENT_ID=xxxxxxxxxx          # 应用 AgentId
```

---

## 4. 企业微信接入

### 4.1 创建企业微信应用

```
步骤一：创建应用
────────────────────────────────────────────────────────

1. 访问企业微信管理后台
   https://work.weixin.qq.com/

2. 应用管理 → 自建 → 创建应用
   • 应用名称：OpenClaw 助手
   • 应用logo：上传图标

3. 获取凭证
   • AgentId: 1000001
   • Secret: xxxxxxxxxxxxxxxx

4. 获取企业凭证
   • 企业ID (CorpId): wwxxxxxxxxxxxx
```

### 4.2 配置 API 接收

```
步骤二：设置 API 接收
────────────────────────────────────────────────────────

1. 在应用详情页，找到"接收消息"

2. 设置 API 接收
   • URL: https://your-domain.com/wework/webhook
   • Token: 自定义字符串
   • EncodingAESKey: 随机生成

3. 保存配置（需要服务器已部署）
```

### 4.3 配置 OpenClaw

```bash
# .env 配置

# 启用企业微信通道
CHANNELS=wework

# 企业微信配置
WEWORK_CORP_ID=wwxxxxxxxxxxxx
WEWORK_AGENT_ID=1000001
WEWORK_SECRET=xxxxxxxxxxxxxxxx
WEWORK_TOKEN=your_token
WEWORK_ENCODING_AES_KEY=your_aes_key
```

---

## 5. Telegram 接入

### 5.1 创建 Telegram Bot

```
步骤一：创建 Bot
────────────────────────────────────────────────────────

1. 在 Telegram 中找到 @BotFather

2. 发送 /newbot 命令

3. 按提示设置：
   • Bot 名称：OpenClaw Assistant
   • Bot 用户名：YourOpenClawBot

4. 获取 Token
   • 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 5.2 配置 Webhook

```bash
# 设置 Webhook
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/telegram/webhook"
```

### 5.3 配置 OpenClaw

```bash
# .env 配置

# 启用 Telegram 通道
CHANNELS=telegram

# Telegram 配置
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## 6. Discord 接入

### 6.1 创建 Discord 应用

```
步骤一：创建应用和 Bot
────────────────────────────────────────────────────────

1. 访问 Discord Developer Portal
   https://discord.com/developers/applications

2. 创建应用
   • 应用名称：OpenClaw

3. 创建 Bot
   • 进入 Bot 页面
   • 点击 "Add Bot"
   • 复制 Token

4. 配置权限
   在 OAuth2 → URL Generator 中：
   • Scopes: bot
   • Permissions: Send Messages, Read Messages
```

### 6.2 邀请 Bot 到服务器

```
步骤二：邀请 Bot
────────────────────────────────────────────────────────

1. 使用生成的邀请链接
2. 选择要添加的服务器
3. 授权 Bot 权限
```

### 6.3 配置 OpenClaw

```bash
# .env 配置

# 启用 Discord 通道
CHANNELS=discord

# Discord 配置
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_CLIENT_ID=xxxxxxxxxxxxx              # 可选
```

---

## 7. 多通道同时使用

### 7.1 配置多个通道

```bash
# .env 配置

# 启用多个通道（逗号分隔）
CHANNELS=feishu,dingtalk,wework,telegram

# 各平台配置...
FEISHU_APP_ID=xxx
FEISHU_APP_SECRET=xxx

DINGTALK_CLIENT_ID=xxx
DINGTALK_CLIENT_SECRET=xxx

WEWORK_CORP_ID=xxx
WEWORK_AGENT_ID=xxx
WEWORK_SECRET=xxx

TELEGRAM_BOT_TOKEN=xxx
```

### 7.2 通道优先级

```yaml
# config/channels.yaml

channels:
  feishu:
    priority: 1      # 最高优先级
    enabled: true

  dingtalk:
    priority: 2
    enabled: true

  wework:
    priority: 3
    enabled: true

  telegram:
    priority: 4
    enabled: true
```

### 7.3 统一会话管理

```
多通道会话管理
────────────────────────────────────────────────────────

OpenClaw 通过 session_id 统一管理不同通道的会话：

飞书用户 A:
session_id = "feishu:ou_xxxxx"

钉钉用户 B:
session_id = "dingtalk:user_xxxxx"

企业微信用户 C:
session_id = "wework:zhangsan"

不同通道的用户可以共享记忆和上下文！
```

---

## 8. 故障排查

### 8.1 常见问题

```
飞书接入问题
────────────────────────────────────────────────────────

Q: 消息发出去没响应
A: 检查：
   1. 事件订阅是否配置正确
   2. 服务器是否可公网访问
   3. 查看服务器日志

Q: 提示权限不足
A: 检查：
   1. 应用权限是否开启
   2. 应用是否已发布
   3. 用户是否在可见范围内
```

```
钉钉接入问题
────────────────────────────────────────────────────────

Q: Webhook 验证失败
A: 检查：
   1. URL 是否可访问
   2. 是否正确处理签名验证

Q: 机器人不回复
A: 检查：
   1. 消息接收地址是否正确
   2. 是否开启了消息推送
```

```
企业微信接入问题
────────────────────────────────────────────────────────

Q: 设置 API 接收失败
A: 检查：
   1. URL 是否 HTTPS
   2. 服务器是否正确响应验证请求
   3. EncodingAESKey 是否正确
```

---

## 9. 最佳实践

### 9.1 安全建议

```
安全配置建议
────────────────────────────────────────────────────────

1. 使用 HTTPS
   • 所有 Webhook 必须使用 HTTPS
   • 配置 SSL 证书

2. 验证请求来源
   • 验证签名
   • 验证 Token

3. 限流控制
   • 防止消息轰炸
   • 设置用户请求频率限制

4. 敏感信息保护
   • 不在消息中传输敏感数据
   • 重要操作需要二次确认
```

### 9.2 用户体验优化

```
优化建议
────────────────────────────────────────────────────────

1. 快速响应
   • 先发送"收到，正在处理..."
   • 异步执行耗时任务

2. 消息格式化
   • 使用 Markdown/富文本
   • 添加表情符号
   • 适当分段

3. 错误处理
   • 友好的错误提示
   • 提供重试选项

4. 帮助信息
   • 提供使用说明
   • 支持帮助命令
```

---

## 关键要点总结

1. **飞书接入**：创建应用 → 配置权限 → 事件订阅
2. **钉钉接入**：创建应用 → 启用机器人 → 配置消息接收
3. **企业微信接入**：创建应用 → 设置 API 接收
4. **多通道配置**：CHANNELS 环境变量逗号分隔
5. **安全配置**：HTTPS、签名验证、限流

---

## 扩展阅读

- [飞书开放平台文档](https://open.feishu.cn/document/)
- [钉钉开发文档](https://open.dingtalk.com/document/)
- [企业微信开发文档](https://developer.work.weixin.qq.com/document/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Discord Developer Portal](https://discord.com/developers/docs)

---

*下一阶段：[Skill 开发](../04-skill-development/01-skill-basics.md)*
