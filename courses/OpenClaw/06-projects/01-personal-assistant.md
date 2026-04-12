# 第十八讲：实战项目 - 个人 AI 助手

> 项目实战：打造你的专属 AI 助手

## 项目目标

本章将指导你使用 OpenClaw 搭建一个完整的个人 AI 助手，具备日程管理、信息检索、任务执行等能力。

---

## 1. 项目规划

### 1.1 功能需求

```
个人 AI 助手功能清单
────────────────────────────────────────────────────────

核心功能：
┌─────────────────────────────────────────────────────┐
│ ✅ 日程管理                                         │
│    • 添加/查看/删除日程                             │
│    • 提醒功能                                       │
│                                                     │
│ ✅ 信息管理                                         │
│    • RSS 订阅                                       │
│    • 笔记记录                                       │
│    • 信息检索                                       │
│                                                     │
│ ✅ 任务执行                                         │
│    • 发送邮件                                       │
│    • 搜索网络                                       │
│    • 执行脚本                                       │
│                                                     │
│ ✅ 智能对话                                         │
│    • 记忆用户偏好                                   │
│    • 上下文理解                                     │
│    • 多轮对话                                       │
└─────────────────────────────────────────────────────┘
```

### 1.2 技术架构

```
系统架构
────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│                      用户界面                            │
│    CLI    │    Web UI    │    飞书/钉钉    │    API     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw 核心                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 对话引擎  │  │ 记忆系统  │  │ 任务调度  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    Skills 层                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │Calendar│  │  RSS   │  │ Email  │  │ Search │       │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    数据存储                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  SQLite  │  │ ChromaDB │  │ 文件系统  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 环境准备

### 2.1 项目结构

```bash
personal-assistant/
├── config/
│   ├── .env                    # 环境变量
│   └── openclaw.yaml           # OpenClaw 配置
├── skills/
│   ├── calendar/               # 日程管理 Skill
│   ├── rss/                    # RSS 订阅 Skill
│   ├── email/                  # 邮件 Skill
│   ├── notes/                  # 笔记 Skill
│   └── search/                 # 搜索 Skill
├── data/
│   ├── db/                     # 数据库文件
│   ├── vector/                 # 向量存储
│   └── logs/                   # 日志
├── web/                        # Web UI（可选）
│   ├── static/
│   └── templates/
├── scripts/
│   ├── start.sh                # 启动脚本
│   └── backup.sh               # 备份脚本
└── README.md
```

### 2.2 安装依赖

```bash
# 创建项目目录
mkdir -p personal-assistant && cd personal-assistant

# 初始化 npm 项目
npm init -y

# 安装 OpenClaw
npm install openclaw

# 安装 Python 依赖（Skills 需要）
pip install feedparser requests python-dateutil
```

### 2.3 配置文件

```bash
# config/.env

# LLM 配置
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_MODEL=deepseek-chat

# 基础配置
PORT=3000
LOG_LEVEL=info
DATA_DIR=./data

# 启用的通道
CHANNELS=cli,web

# 邮件配置（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
EMAIL_FROM=your_email@example.com
```

```yaml
# config/openclaw.yaml

model:
  provider: deepseek
  name: deepseek-chat
  temperature: 0.7
  max_tokens: 4096

memory:
  enabled: true
  type: sqlite
  path: ./data/db/memory.db

vector_store:
  enabled: true
  type: chromadb
  path: ./data/vector

skills:
  path: ./skills
  auto_discover: true

logging:
  level: info
  file: ./data/logs/app.log
```

---

## 3. Skills 开发

### 3.1 日程管理 Skill

```markdown
# skills/calendar/SKILL.md

# 日程管理

## 描述
管理用户的日程安排，包括添加、查询、删除日程

## 触发条件
当用户：
- 添加日程或提醒
- 查看今天/明天/本周的安排
- 删除日程
- 询问有什么安排

## 输入参数

### action
- 类型: string
- 必需: 是
- 枚举: [add, list, delete, search]

### title
- 类型: string
- 描述: 日程标题

### datetime
- 类型: string
- 描述: 日程时间

### description
- 类型: string
- 描述: 详细描述

## 执行
```bash
python ${SKILL_DIR}/calendar.py \
  --action "${action}" \
  --title "${title:-}" \
  --datetime "${datetime:-}" \
  --description "${description:-}" \
  --db "${OPENCLAW_DIR}/data/db/calendar.db"
```
```

```python
# skills/calendar/calendar.py

import argparse
import sqlite3
import json
from datetime import datetime, timedelta
import re

def parse_datetime(dt_str: str) -> str:
    """解析自然语言日期时间"""
    now = datetime.now()

    if "今天" in dt_str or "今日" in dt_str:
        base = now
    elif "明天" in dt_str:
        base = now + timedelta(days=1)
    elif "后天" in dt_str:
        base = now + timedelta(days=2)
    elif "下周" in dt_str:
        base = now + timedelta(weeks=1)
    else:
        base = now

    # 提取时间
    time_match = re.search(r'(\d{1,2})[：:](\d{2})', dt_str)
    if time_match:
        hour, minute = int(time_match.group(1)), int(time_match.group(2))
        return base.replace(hour=hour, minute=minute, second=0).isoformat()

    # 默认早上9点
    return base.replace(hour=9, minute=0, second=0).isoformat()

def add_event(db_path: str, title: str, datetime_str: str, description: str = ""):
    """添加日程"""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            event_time TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT
        )
    ''')

    event_time = parse_datetime(datetime_str)

    c.execute('''
        INSERT INTO events (title, event_time, description, created_at)
        VALUES (?, ?, ?, ?)
    ''', (title, event_time, description, datetime.now().isoformat()))

    event_id = c.lastrowid
    conn.commit()
    conn.close()

    return {
        "success": True,
        "data": {
            "id": event_id,
            "title": title,
            "event_time": event_time
        }
    }

def list_events(db_path: str, date_filter: str = ""):
    """查询日程"""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    if date_filter:
        target_date = parse_datetime(date_filter)[:10]
        c.execute('''
            SELECT id, title, event_time, description
            FROM events
            WHERE DATE(event_time) = ? AND status = 'active'
            ORDER BY event_time
        ''', (target_date,))
    else:
        c.execute('''
            SELECT id, title, event_time, description
            FROM events
            WHERE event_time >= ? AND status = 'active'
            ORDER BY event_time
            LIMIT 20
        ''', (datetime.now().isoformat(),))

    rows = c.fetchall()
    conn.close()

    events = [
        {
            "id": row[0],
            "title": row[1],
            "event_time": row[2],
            "description": row[3]
        }
        for row in rows
    ]

    return {"success": True, "data": {"events": events}}

def delete_event(db_path: str, event_id: int):
    """删除日程"""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('UPDATE events SET status = ? WHERE id = ?', ('deleted', event_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "日程已删除"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", required=True)
    parser.add_argument("--title", default="")
    parser.add_argument("--datetime", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--db", required=True)

    args = parser.parse_args()

    if args.action == "add":
        result = add_event(args.db, args.title, args.datetime, args.description)
    elif args.action == "list":
        result = list_events(args.db)
    elif args.action == "delete":
        result = delete_event(args.db, int(args.title))
    else:
        result = {"success": False, "error": f"未知操作: {args.action}"}

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
```

### 3.2 笔记 Skill

```markdown
# skills/notes/SKILL.md

# 笔记管理

## 描述
记录和管理用户的笔记

## 触发条件
当用户：
- 记录/保存笔记
- 查看笔记
- 搜索笔记

## 输入参数

### action
- 类型: string
- 枚举: [add, list, search, delete]

### content
- 类型: string
- 描述: 笔记内容

### tags
- 类型: string
- 描述: 标签（逗号分隔）

### keyword
- 类型: string
- 描述: 搜索关键词

## 执行
```bash
python ${SKILL_DIR}/notes.py \
  --action "${action}" \
  --content "${content:-}" \
  --tags "${tags:-}" \
  --keyword "${keyword:-}" \
  --db "${OPENCLAW_DIR}/data/db/notes.db"
```
```

### 3.3 网络搜索 Skill

```markdown
# skills/search/SKILL.md

# 网络搜索

## 描述
搜索互联网获取信息

## 触发条件
当用户：
- 搜索/查找信息
- 询问实时信息
- 需要最新资讯

## 输入参数

### query
- 类型: string
- 必需: 是
- 描述: 搜索关键词

### num_results
- 类型: integer
- 默认值: 5
- 描述: 返回结果数量

## 执行
```bash
python ${SKILL_DIR}/search.py \
  --query "${query}" \
  --num ${num_results:-5}
```

## 环境变量
SERP_API_KEY: SerpAPI 密钥（可选）
```

---

## 4. 启动与使用

### 4.1 启动脚本

```bash
#!/bin/bash
# scripts/start.sh

cd "$(dirname "$0")/.."

# 检查环境
if [ ! -f "config/.env" ]; then
    echo "请先创建 config/.env 文件"
    exit 1
fi

# 加载环境变量
export $(cat config/.env | grep -v '^#' | xargs)

# 启动 OpenClaw
npx openclaw start --config config/openclaw.yaml
```

### 4.2 使用示例

```
对话示例
────────────────────────────────────────────────────────

用户: 你好
助手: 你好！我是你的个人 AI 助手。我可以帮你：
     • 管理日程和提醒
     • 记录和查找笔记
     • 搜索网络信息
     • 发送邮件
     有什么可以帮你的吗？

用户: 明天下午3点提醒我开会
助手: [调用 calendar skill]
     已添加日程：明天下午3点开会
     我会在明天下午3点提醒你。

用户: 帮我搜索一下最新的 AI 新闻
助手: [调用 search skill]
     以下是最新的 AI 新闻：
     1. OpenAI 发布 GPT-5 预览版...
     2. DeepSeek 开源新模型...
     3. ...

用户: 记录一条笔记：项目截止日期是下周五
助手: [调用 notes skill]
     已记录笔记："项目截止日期是下周五"

用户: 我明天有什么安排？
助手: [调用 calendar skill]
     你明天的日程安排：
     • 15:00 - 开会
```

---

## 5. 进阶功能

### 5.1 定时提醒

```python
# scripts/scheduler.py

import schedule
import time
import sqlite3
from datetime import datetime
import requests

def check_reminders():
    """检查并发送提醒"""
    conn = sqlite3.connect('./data/db/calendar.db')
    c = conn.cursor()

    now = datetime.now()

    c.execute('''
        SELECT id, title, event_time
        FROM events
        WHERE status = 'active'
        AND datetime(event_time) BETWEEN datetime(?) AND datetime(?, '+15 minutes')
    ''', (now.isoformat(), now.isoformat()))

    events = c.fetchall()
    conn.close()

    for event in events:
        # 发送通知（可以是飞书、邮件等）
        send_notification(event[1])

def send_notification(message: str):
    """发送通知"""
    # 实现通知逻辑
    print(f"提醒: {message}")

# 每5分钟检查一次
schedule.every(5).minutes.do(check_reminders)

while True:
    schedule.run_pending()
    time.sleep(60)
```

### 5.2 Web UI（可选）

```python
# web/app.py

from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)
OPENCLAW_API = "http://localhost:3000"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    response = requests.post(
        f"{OPENCLAW_API}/api/chat",
        json={"message": data["message"]}
    )
    return jsonify(response.json())

if __name__ == "__main__":
    app.run(port=8080)
```

---

## 关键要点总结

1. **项目规划**：明确功能需求和技术架构
2. **Skills 开发**：日程、笔记、搜索等核心能力
3. **配置管理**：环境变量和配置文件分离
4. **定时任务**：提醒和通知功能
5. **扩展性**：易于添加新 Skills

---

*下一章：[企业场景应用](02-business-scenarios.md)*
