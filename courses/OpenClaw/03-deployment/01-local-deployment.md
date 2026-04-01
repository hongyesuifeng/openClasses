# 第八讲：OpenClaw 本地部署

> 实践教程：在本地环境部署 OpenClaw

## 本章概要

本章将指导你在本地环境部署 OpenClaw，包括环境准备、安装配置和基本使用。

---

## 1. 环境要求

### 1.1 系统要求

```
系统要求
────────────────────────────────────────────────────────

操作系统：
• macOS 10.15+
• Windows 10/11 (WSL2 推荐)
• Linux (Ubuntu 20.04+ 推荐)

硬件要求：
┌─────────────────────────────────────────────────────┐
│ 最低配置                                            │
│ • CPU: 2 核                                         │
│ • 内存: 4 GB                                        │
│ • 硬盘: 10 GB                                       │
│                                                     │
│ 推荐配置                                            │
│ • CPU: 4 核+                                        │
│ • 内存: 8 GB+                                       │
│ • 硬盘: 20 GB+                                      │
│ • GPU: 可选（本地模型推理需要）                      │
└─────────────────────────────────────────────────────┘
```

### 1.2 软件依赖

```
必需软件
────────────────────────────────────────────────────────

1. Node.js (v18+)
   验证: node --version

2. npm 或 pnpm
   验证: npm --version

3. Git
   验证: git --version

4. Python (可选，部分 Skill 需要)
   验证: python --version
```

---

## 2. 安装步骤

### 2.1 方式一：npm 全局安装（推荐新手）

```bash
# 安装 OpenClaw
npm install -g openclaw

# 验证安装
openclaw --version

# 初始化配置
openclaw init

# 启动服务
openclaw start
```

### 2.2 方式二：从源码安装（推荐开发者）

```bash
# 克隆仓库
git clone https://github.com/clawdbot/openclaw.git
cd openclaw

# 安装依赖
npm install

# 复制配置文件
cp .env.example .env

# 编辑配置
nano .env

# 启动开发模式
npm run dev

# 或构建生产版本
npm run build
npm start
```

### 2.3 方式三：Docker 安装

```bash
# 拉取镜像
docker pull clawdbot/openclaw:latest

# 运行容器
docker run -d \
  --name openclaw \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e ANTHROPIC_API_KEY=your_key \
  clawdbot/openclaw:latest

# 查看日志
docker logs -f openclaw
```

---

## 3. 配置详解

### 3.1 环境变量配置

```bash
# .env 配置文件

# ================================
# LLM 提供商配置（选择一个）
# ================================

# 方式一：使用 Anthropic Claude
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_MODEL=claude-3-opus-20240229

# 方式二：使用 OpenAI
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-xxxxx
# OPENAI_MODEL=gpt-4-turbo

# 方式三：使用 DeepSeek
# LLM_PROVIDER=deepseek
# DEEPSEEK_API_KEY=sk-xxxxx
# DEEPSEEK_MODEL=deepseek-chat

# 方式四：使用本地 Ollama
# LLM_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3

# ================================
# 基础配置
# ================================

# 服务端口
PORT=3000

# 日志级别
LOG_LEVEL=info

# 数据存储路径
DATA_DIR=./data

# ================================
# 通道配置
# ================================

# 启用的通道（逗号分隔）
CHANNELS=cli

# 飞书配置
# FEISHU_APP_ID=cli_xxxxx
# FEISHU_APP_SECRET=xxxxx

# 钉钉配置
# DINGTALK_CLIENT_ID=xxxxx
# DINGTALK_CLIENT_SECRET=xxxxx

# 企业微信配置
# WECORP_CORP_ID=xxxxx
# WECORP_AGENT_ID=xxxxx
# WECORP_SECRET=xxxxx
```

### 3.2 配置文件结构

```
OpenClaw 配置目录结构
────────────────────────────────────────────────────────

openclaw/
├── .env                    # 环境变量
├── config/
│   ├── default.yaml        # 默认配置
│   ├── production.yaml     # 生产配置
│   └── skills/             # Skill 配置
│       ├── search.yaml
│       └── email.yaml
├── skills/                 # 自定义 Skills
│   ├── my-skill/
│   │   ├── SKILL.md
│   │   └── script.py
│   └── ...
├── data/                   # 数据目录
│   ├── memory/             # 记忆存储
│   ├── logs/               # 日志
│   └── cache/              # 缓存
└── plugins/                # 插件目录
```

---

## 4. 获取 API Key

### 4.1 Anthropic Claude

```
获取 Claude API Key
────────────────────────────────────────────────────────

1. 访问 https://console.anthropic.com/
2. 注册/登录账号
3. 进入 API Keys 页面
4. 点击 "Create Key" 创建新密钥
5. 复制密钥到 .env 文件

定价参考：
• Claude 3 Opus: $15/1M input, $75/1M output
• Claude 3 Sonnet: $3/1M input, $15/1M output
• Claude 3 Haiku: $0.25/1M input, $1.25/1M output
```

### 4.2 OpenAI GPT

```
获取 OpenAI API Key
────────────────────────────────────────────────────────

1. 访问 https://platform.openai.com/
2. 注册/登录账号
3. 进入 API keys 页面
4. 点击 "Create new secret key"
5. 复制密钥到 .env 文件

定价参考：
• GPT-4 Turbo: $10/1M input, $30/1M output
• GPT-3.5 Turbo: $0.5/1M input, $1.5/1M output
```

### 4.3 DeepSeek（国产推荐）

```
获取 DeepSeek API Key
────────────────────────────────────────────────────────

1. 访问 https://platform.deepseek.com/
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新密钥
5. 复制密钥到 .env 文件

优势：
• 价格便宜（约 GPT-4 的 1/30）
• 中文能力强
• 支持深度思考模式
```

### 4.4 本地 Ollama（免费）

```
使用 Ollama 本地部署
────────────────────────────────────────────────────────

1. 安装 Ollama
   # macOS/Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Windows
   # 下载 https://ollama.com/download/windows

2. 下载模型
   ollama pull llama3
   ollama pull qwen2

3. 启动服务
   ollama serve

4. 配置 OpenClaw
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3

优点：完全免费，隐私安全
缺点：需要较好的硬件，能力略弱
```

---

## 5. 基本使用

### 5.1 CLI 模式

```bash
# 启动 CLI 交互
openclaw chat

# 或直接启动服务
openclaw start
```

```
交互示例
────────────────────────────────────────────────────────

You: 你好，请介绍一下你自己

OpenClaw: 你好！我是 OpenClaw，一个开源的 AI 助手。
我可以帮你处理各种任务，比如：

• 回答问题和提供建议
• 搜索网络获取信息
• 发送邮件和消息
• 管理日程和提醒
• 执行文件操作

有什么我可以帮你的吗？

You: 帮我搜索一下今天的科技新闻

OpenClaw: [调用搜索 Skill]
我找到了今天的几条重要科技新闻：

1. OpenAI 发布 GPT-5 预览版
2. 苹果宣布 WWDC 2026 日期
3. 英伟达发布新一代 AI 芯片

想了解更多详情吗？
```

### 5.2 Web UI

```bash
# 启动 Web 服务
openclaw start --web

# 访问
# http://localhost:3000
```

### 5.3 API 调用

```bash
# 发送 API 请求
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好",
    "session_id": "test-001"
  }'
```

```python
# Python 调用示例
import requests

response = requests.post(
    "http://localhost:3000/api/chat",
    json={
        "message": "你好",
        "session_id": "test-001"
    }
)

print(response.json())
```

---

## 6. 常见问题

### 6.1 安装问题

```
常见安装问题
────────────────────────────────────────────────────────

Q: npm install 报错 EACCES
A: 权限问题，尝试：
   sudo chown -R $(whoami) ~/.npm
   或使用 nvm 管理 Node.js

Q: Node.js 版本过低
A: 安装 Node.js 18+：
   # 使用 nvm
   nvm install 18
   nvm use 18

Q: 依赖安装失败
A: 尝试清理缓存：
   rm -rf node_modules
   npm cache clean --force
   npm install
```

### 6.2 配置问题

```
常见配置问题
────────────────────────────────────────────────────────

Q: API Key 无效
A: 检查：
   1. Key 是否正确复制（无多余空格）
   2. Key 是否已激活
   3. 账户是否有余额

Q: 模型连接失败
A: 检查：
   1. 网络连接
   2. API 端点是否正确
   3. 防火墙设置

Q: Ollama 连接失败
A: 确保：
   1. Ollama 服务已启动
   2. 端口 11434 未被占用
   3. 模型已下载
```

### 6.3 运行问题

```
常见运行问题
────────────────────────────────────────────────────────

Q: 内存不足
A: 尝试：
   1. 减少并发数
   2. 使用更小的模型
   3. 增加系统内存

Q: 响应很慢
A: 检查：
   1. 网络延迟
   2. 模型选择（Haiku 比 Opus 快）
   3. 服务器负载

Q: 中文乱码
A: 确保：
   1. 终端支持 UTF-8
   2. 系统语言设置正确
```

---

## 7. 下一步

完成本地部署后，你可以：

1. **[接入平台](02-platform-integration.md)** - 接入微信、飞书、钉钉
2. **[开发 Skill](../04-skill-development/01-skill-basics.md)** - 开发自定义技能
3. **[高级配置](02-cloud-deployment.md)** - 云服务器部署

---

## 关键要点总结

1. **三种安装方式**：npm、源码、Docker
2. **配置核心**：选择 LLM 提供商并配置 API Key
3. **推荐新手**：使用 Claude API + npm 安装
4. **成本优化**：本地 Ollama 完全免费

---

## 扩展阅读

- [OpenClaw 中文文档](https://github.com/yeuxuan/openclaw-docs)
- [Ollama 官网](https://ollama.com/)
- [Anthropic Console](https://console.anthropic.com/)

---

*下一章：[云服务器部署](02-cloud-deployment.md)*
