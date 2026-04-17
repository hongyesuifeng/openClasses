# OpenClaw 速查表 (Cheat Sheet)

> 常用命令、配置和代码片段快速参考

---

## 安装命令

```bash
# npm 全局安装
npm install -g openclaw

# 从源码安装
git clone https://github.com/clawdbot/openclaw.git
cd openclaw && npm install

# Docker 安装
docker pull clawdbot/openclaw:latest
```

---

## 常用 CLI 命令

```bash
# 初始化配置
openclaw init

# 启动服务
openclaw start

# 启动并指定配置文件
openclaw start --config ./config.yaml

# 启动 Web UI
openclaw start --web

# 进入交互模式
openclaw chat

# 查看版本
openclaw --version

# 查看帮助
openclaw --help

# 列出所有 Skills
openclaw skill list

# 测试 Skill
openclaw skill test <skill-name> --params '{"key":"value"}'
```

---

## 环境变量配置

```bash
# .env 文件模板

# ============ LLM 配置 ============
# Anthropic Claude
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_MODEL=claude-3-opus-20240229

# OpenAI GPT
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-xxxxx
# OPENAI_MODEL=gpt-4-turbo

# DeepSeek
# LLM_PROVIDER=deepseek
# DEEPSEEK_API_KEY=sk-xxxxx
# DEEPSEEK_MODEL=deepseek-chat

# 本地 Ollama
# LLM_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3

# ============ 基础配置 ============
PORT=3000
LOG_LEVEL=info
DATA_DIR=./data

# ============ 通道配置 ============
CHANNELS=cli,web

# 飞书
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx

# 钉钉
DINGTALK_CLIENT_ID=xxxxx
DINGTALK_CLIENT_SECRET=xxxxx

# 企业微信
WEWORK_CORP_ID=xxxxx
WEWORK_AGENT_ID=xxxxx
WEWORK_SECRET=xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABCxxxxx
```

---

## SKILL.md 模板

```markdown
# Skill 名称

## 描述
简短描述这个 Skill 能做什么

## 触发条件
当用户：
- 关键词1
- 关键词2

## 输入参数

### param_name
- 类型: string
- 必需: 是/否
- 描述: 参数说明

## 执行
```bash
python ${SKILL_DIR}/script.py --param "${param_name}"
```

## 输出格式
```json
{
  "success": true,
  "data": {}
}
```

## 示例
用户: xxx
助手: [调用 Skill] xxx
```

---

## 常用 Skill 代码片段

### Python 参数解析

```python
import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument("--param", required=True)
parser.add_argument("--optional", default="default")
args = parser.parse_args()

result = {"success": True, "data": {"param": args.param}}
print(json.dumps(result, ensure_ascii=False))
```

### 日期时间处理

```python
from datetime import datetime, timedelta
import re

def parse_datetime(dt_str: str) -> str:
    """解析自然语言日期"""
    now = datetime.now()

    if "今天" in dt_str:
        base = now
    elif "明天" in dt_str:
        base = now + timedelta(days=1)
    elif "后天" in dt_str:
        base = now + timedelta(days=2)
    else:
        base = now

    # 提取时间
    match = re.search(r'(\d{1,2})[：:](\d{2})', dt_str)
    if match:
        hour, minute = int(match.group(1)), int(match.group(2))
        return base.replace(hour=hour, minute=minute).isoformat()

    return base.isoformat()
```

### HTTP 请求

```python
import requests

def call_api(url: str, params: dict) -> dict:
    """调用外部 API"""
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

## 采样参数速查

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `temperature` | 0.7 | 通用对话 |
| `temperature` | 0.3 | 代码生成 |
| `temperature` | 0.9 | 创意写作 |
| `top_p` | 0.9 | 核采样 |
| `max_tokens` | 2048 | 默认输出长度 |
| `repetition_penalty` | 1.1 | 防止重复 |

---

## 模型选择速查

| 场景 | 推荐模型 | 原因 |
|------|---------|------|
| 学习测试 | Ollama + Llama3 | 免费 |
| 日常使用 | DeepSeek | 便宜、中文好 |
| 代码生成 | Claude 3.5 | 能力强 |
| 长文档 | Claude 3 | 200K 上下文 |
| 企业生产 | GPT-4 / Claude | 稳定可靠 |

---

## 常见错误排查

| 错误 | 可能原因 | 解决方案 |
|------|---------|---------|
| API Key 无效 | Key 过期或错误 | 检查并重新配置 |
| 连接超时 | 网络问题 | 检查网络/代理 |
| 内存不足 | 模型太大 | 使用小模型/量化 |
| Skill 不触发 | 描述不清晰 | 优化 SKILL.md |
| 端口占用 | 3000 被占用 | 修改 PORT 配置 |

---

## 有用的链接

| 资源 | 链接 |
|------|------|
| 官方文档 | https://github.com/clawdbot/openclaw |
| 中文文档 | https://github.com/yeuxuan/openclaw-docs |
| 视频教程 | https://www.bilibili.com/video/BV1rAPfzFEYi/ |
| API 申请 | https://platform.deepseek.com/ |
| Ollama | https://ollama.com/ |

---

## Docker 常用命令

```bash
# 构建镜像
docker build -t openclaw .

# 运行容器
docker run -d -p 3000:3000 --name openclaw openclaw

# 查看日志
docker logs -f openclaw

# 进入容器
docker exec -it openclaw /bin/sh

# 停止容器
docker stop openclaw

# 删除容器
docker rm openclaw
```

---

## Systemd 服务配置

```ini
# /etc/systemd/system/openclaw.service
[Unit]
Description=OpenClaw AI Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/openclaw
ExecStart=/usr/bin/node /opt/openclaw/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
systemctl enable openclaw
systemctl start openclaw
systemctl status openclaw
```

---

*快速查阅，节省时间！*
