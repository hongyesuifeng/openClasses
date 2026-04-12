# 第十三讲：Skill 实战案例

> 实践教程：完整的 Skill 开发案例

## 本章概要

本章将通过几个完整的实战案例，展示如何开发实用的 OpenClaw Skill。

---

## 案例一：RSS 订阅 Skill

### 1.1 功能需求

```
RSS 订阅 Skill 功能
────────────────────────────────────────────────────────

• 订阅 RSS/Atom 源
• 获取最新文章
• 搜索历史文章
• 管理订阅列表
```

### 1.2 SKILL.md

```markdown
# RSS 订阅

## 描述
订阅和管理 RSS/Atom 信息源，获取最新资讯

## 元数据
- 版本: 1.0.0
- 作者: OpenClaw Team
- 标签: RSS, 订阅, 新闻

## 触发条件
当用户：
- 订阅某个 RSS 源
- 查看订阅的更新
- 搜索相关文章
- 管理订阅列表

## 输入参数

### action
- 类型: string
- 必需: 是
- 枚举: [subscribe, unsubscribe, list, fetch, search]
- 描述: 要执行的操作

### url
- 类型: string
- 必需: 否（subscribe 时必需）
- 描述: RSS 源的 URL

### keyword
- 类型: string
- 必需: 否（search 时使用）
- 描述: 搜索关键词

### limit
- 类型: integer
- 必需: 否
- 默认值: 10
- 描述: 返回结果数量

## 执行
```bash
python ${SKILL_DIR}/rss.py \
  --action "${action}" \
  --url "${url:-}" \
  --keyword "${keyword:-}" \
  --limit ${limit:-10} \
  --data-dir "${OPENCLAW_DIR}/data/rss"
```

## 输出格式
```json
{
  "success": true,
  "action": "fetch",
  "data": {
    "feed": {
      "title": "Feed Name",
      "url": "https://example.com/feed"
    },
    "entries": [
      {
        "title": "Article Title",
        "link": "https://...",
        "published": "2026-04-01",
        "summary": "Article summary..."
      }
    ]
  }
}
```

## 示例

用户: 订阅阮一峰的网络日志 https://www.ruanyifeng.com/blog/atom.xml
助手: [调用 RSS skill，action=subscribe, url=...]
助手: 已成功订阅"阮一峰的网络日志"！现在可以随时查看最新文章。

用户: 有什么新的技术资讯？
助手: [调用 RSS skill，action=fetch]
助手: 以下是最新的技术资讯：
1. [科技] AI 领域重大突破...
2. [编程] Python 4.0 发布...
```

### 1.3 实现代码

```python
# rss.py

import argparse
import json
import os
import feedparser
from datetime import datetime
from typing import List, Dict, Optional
import sqlite3

class RSSManager:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.db_path = os.path.join(data_dir, "rss.db")
        self._init_db()

    def _init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # 订阅表
        c.execute('''
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY,
                url TEXT UNIQUE,
                title TEXT,
                last_updated TEXT,
                created_at TEXT
            )
        ''')

        # 文章表
        c.execute('''
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY,
                feed_id INTEGER,
                title TEXT,
                link TEXT UNIQUE,
                summary TEXT,
                published TEXT,
                fetched_at TEXT,
                FOREIGN KEY (feed_id) REFERENCES subscriptions(id)
            )
        ''')

        conn.commit()
        conn.close()

    def subscribe(self, url: str) -> Dict:
        """订阅 RSS 源"""
        try:
            feed = feedparser.parse(url)

            if feed.bozo:
                return {
                    "success": False,
                    "error": f"无法解析 RSS 源: {feed.bozo_exception}"
                }

            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            c.execute('''
                INSERT OR IGNORE INTO subscriptions (url, title, last_updated, created_at)
                VALUES (?, ?, ?, ?)
            ''', (url, feed.feed.title, datetime.now().isoformat(), datetime.now().isoformat()))

            conn.commit()

            # 获取 feed_id
            c.execute('SELECT id FROM subscriptions WHERE url = ?', (url,))
            feed_id = c.fetchone()[0]

            # 保存文章
            self._save_entries(c, feed_id, feed.entries)

            conn.commit()
            conn.close()

            return {
                "success": True,
                "data": {
                    "title": feed.feed.title,
                    "url": url,
                    "entries_count": len(feed.entries)
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def unsubscribe(self, url: str) -> Dict:
        """取消订阅"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('DELETE FROM subscriptions WHERE url = ?', (url,))

        conn.commit()
        conn.close()

        return {"success": True, "message": "已取消订阅"}

    def list_subscriptions(self) -> Dict:
        """列出所有订阅"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT id, url, title, last_updated FROM subscriptions')
        rows = c.fetchall()
        conn.close()

        subscriptions = [
            {
                "id": row[0],
                "url": row[1],
                "title": row[2],
                "last_updated": row[3]
            }
            for row in rows
        ]

        return {
            "success": True,
            "data": {"subscriptions": subscriptions}
        }

    def fetch(self, limit: int = 10) -> Dict:
        """获取最新文章"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''
            SELECT s.title, e.title, e.link, e.summary, e.published
            FROM entries e
            JOIN subscriptions s ON e.feed_id = s.id
            ORDER BY e.fetched_at DESC
            LIMIT ?
        ''', (limit,))

        rows = c.fetchall()
        conn.close()

        entries = [
            {
                "feed_title": row[0],
                "title": row[1],
                "link": row[2],
                "summary": row[3][:200] if row[3] else "",
                "published": row[4]
            }
            for row in rows
        ]

        return {
            "success": True,
            "data": {"entries": entries}
        }

    def search(self, keyword: str, limit: int = 10) -> Dict:
        """搜索文章"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''
            SELECT s.title, e.title, e.link, e.summary, e.published
            FROM entries e
            JOIN subscriptions s ON e.feed_id = s.id
            WHERE e.title LIKE ? OR e.summary LIKE ?
            ORDER BY e.fetched_at DESC
            LIMIT ?
        ''', (f'%{keyword}%', f'%{keyword}%', limit))

        rows = c.fetchall()
        conn.close()

        entries = [
            {
                "feed_title": row[0],
                "title": row[1],
                "link": row[2],
                "summary": row[3][:200] if row[3] else "",
                "published": row[4]
            }
            for row in rows
        ]

        return {
            "success": True,
            "data": {"entries": entries, "keyword": keyword}
        }

    def _save_entries(self, cursor, feed_id: int, entries: List):
        """保存文章到数据库"""
        for entry in entries:
            cursor.execute('''
                INSERT OR IGNORE INTO entries
                (feed_id, title, link, summary, published, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                feed_id,
                entry.get('title', ''),
                entry.get('link', ''),
                entry.get('summary', ''),
                entry.get('published', ''),
                datetime.now().isoformat()
            ))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", required=True)
    parser.add_argument("--url", default="")
    parser.add_argument("--keyword", default="")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--data-dir", required=True)

    args = parser.parse_args()

    manager = RSSManager(args.data_dir)

    if args.action == "subscribe":
        result = manager.subscribe(args.url)
    elif args.action == "unsubscribe":
        result = manager.unsubscribe(args.url)
    elif args.action == "list":
        result = manager.list_subscriptions()
    elif args.action == "fetch":
        result = manager.fetch(args.limit)
    elif args.action == "search":
        result = manager.search(args.keyword, args.limit)
    else:
        result = {"success": False, "error": f"未知操作: {args.action}"}

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
```

---

## 案例二：邮件发送 Skill

### 2.1 SKILL.md

```markdown
# 邮件发送

## 描述
发送电子邮件，支持 HTML 格式和附件

## 触发条件
当用户：
- 发送邮件
- 写邮件给某人
- 通知某人

## 输入参数

### to
- 类型: string
- 必需: 是
- 描述: 收件人邮箱地址

### subject
- 类型: string
- 必需: 是
- 描述: 邮件主题

### body
- 类型: string
- 必需: 是
- 描述: 邮件正文

### cc
- 类型: string
- 必需: 否
- 描述: 抄送地址（逗号分隔）

### html
- 类型: boolean
- 必需: 否
- 默认值: false
- 描述: 是否为 HTML 格式

## 执行
```bash
python ${SKILL_DIR}/email.py \
  --to "${to}" \
  --subject "${subject}" \
  --body "${body}" \
  --cc "${cc:-}" \
  --html ${html:-false}
```

## 环境变量
需要配置以下环境变量：
- SMTP_HOST: SMTP 服务器地址
- SMTP_PORT: SMTP 端口
- SMTP_USER: SMTP 用户名
- SMTP_PASSWORD: SMTP 密码
- EMAIL_FROM: 发件人地址

## 示例
用户: 发送邮件给 zhangsan@example.com，主题是"项目进度"，内容是"项目已完成80%"
```

### 2.2 实现代码

```python
# email.py

import argparse
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

def send_email(to: str, subject: str, body: str,
               cc: str = "", html: bool = False) -> dict:
    """发送邮件"""

    # 从环境变量获取配置
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    email_from = os.environ.get("EMAIL_FROM")

    if not all([smtp_host, smtp_user, smtp_password, email_from]):
        return {
            "success": False,
            "error": "邮件配置不完整，请检查环境变量"
        }

    try:
        # 创建邮件
        msg = MIMEMultipart()
        msg['From'] = formataddr(("OpenClaw", email_from))
        msg['To'] = to
        msg['Subject'] = subject

        if cc:
            msg['Cc'] = cc

        # 添加正文
        content_type = 'html' if html else 'plain'
        msg.attach(MIMEText(body, content_type, 'utf-8'))

        # 发送
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)

            recipients = [to]
            if cc:
                recipients.extend(cc.split(","))

            server.sendmail(email_from, recipients, msg.as_string())

        return {
            "success": True,
            "data": {
                "to": to,
                "subject": subject,
                "message": "邮件发送成功"
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"发送失败: {str(e)}"
        }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--to", required=True)
    parser.add_argument("--subject", required=True)
    parser.add_argument("--body", required=True)
    parser.add_argument("--cc", default="")
    parser.add_argument("--html", type=lambda x: x.lower() == 'true', default=False)

    args = parser.parse_args()

    result = send_email(
        to=args.to,
        subject=args.subject,
        body=args.body,
        cc=args.cc,
        html=args.html
    )

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
```

---

## 案例三：日程管理 Skill

### 3.1 SKILL.md

```markdown
# 日程管理

## 描述
管理日程安排，包括添加、查询、删除日程

## 触发条件
当用户：
- 添加日程/提醒
- 查看日程
- 删除日程
- 询问今天/明天有什么安排

## 输入参数

### action
- 类型: string
- 必需: 是
- 枚举: [add, list, delete, search]
- 描述: 操作类型

### title
- 类型: string
- 必需: 否（add 时必需）
- 描述: 日程标题

### datetime
- 类型: string
- 必需: 否（add 时必需）
- 描述: 日程时间（ISO 格式或自然语言）

### description
- 类型: string
- 必需: 否
- 描述: 日程描述

### date
- 类型: string
- 必需: 否（list 时使用）
- 描述: 查询日期

## 执行
```bash
python ${SKILL_DIR}/calendar.py \
  --action "${action}" \
  --title "${title:-}" \
  --datetime "${datetime:-}" \
  --description "${description:-}" \
  --date "${date:-}" \
  --data-dir "${OPENCLAW_DIR}/data/calendar"
```

## 示例
用户: 明天下午3点提醒我开会
助手: [调用 calendar skill，action=add，datetime=明天15:00]
助手: 已添加日程：明天下午3点开会

用户: 我明天有什么安排？
助手: [调用 calendar skill，action=list，date=明天]
助手: 你明天的日程安排：
1. 15:00 - 开会
```

### 3.2 实现代码

```python
# calendar.py

import argparse
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import sqlite3
import re

class CalendarManager:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.db_path = os.path.join(data_dir, "calendar.db")
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_time TEXT NOT NULL,
                created_at TEXT,
                status TEXT DEFAULT 'active'
            )
        ''')
        conn.commit()
        conn.close()

    def parse_datetime(self, dt_str: str) -> Optional[str]:
        """解析自然语言日期时间"""
        now = datetime.now()

        # 相对日期
        if "今天" in dt_str:
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

        # 只有日期没有时间
        return base.replace(hour=9, minute=0, second=0).isoformat()

    def add_event(self, title: str, datetime_str: str, description: str = "") -> Dict:
        """添加日程"""
        event_time = self.parse_datetime(datetime_str)

        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''
            INSERT INTO events (title, description, event_time, created_at)
            VALUES (?, ?, ?, ?)
        ''', (title, description, event_time, datetime.now().isoformat()))

        event_id = c.lastrowid
        conn.commit()
        conn.close()

        return {
            "success": True,
            "data": {
                "id": event_id,
                "title": title,
                "event_time": event_time,
                "message": "日程添加成功"
            }
        }

    def list_events(self, date: str = "") -> Dict:
        """查询日程"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        if date:
            # 解析日期
            target_date = self.parse_datetime(date)
            date_str = target_date[:10]  # YYYY-MM-DD

            c.execute('''
                SELECT id, title, description, event_time
                FROM events
                WHERE DATE(event_time) = ? AND status = 'active'
                ORDER BY event_time
            ''', (date_str,))
        else:
            c.execute('''
                SELECT id, title, description, event_time
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
                "description": row[2],
                "event_time": row[3]
            }
            for row in rows
        ]

        return {
            "success": True,
            "data": {"events": events}
        }

    def delete_event(self, event_id: int) -> Dict:
        """删除日程"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('UPDATE events SET status = ? WHERE id = ?', ('deleted', event_id))

        conn.commit()
        conn.close()

        return {
            "success": True,
            "message": "日程已删除"
        }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", required=True)
    parser.add_argument("--title", default="")
    parser.add_argument("--datetime", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--date", default="")
    parser.add_argument("--data-dir", required=True)

    args = parser.parse_args()

    manager = CalendarManager(args.data_dir)

    if args.action == "add":
        result = manager.add_event(args.title, args.datetime, args.description)
    elif args.action == "list":
        result = manager.list_events(args.date)
    elif args.action == "delete":
        result = manager.delete_event(int(args.title))  # 使用 title 传递 id
    else:
        result = {"success": False, "error": f"未知操作: {args.action}"}

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
```

---

## 关键要点总结

1. **RSS Skill**：演示了数据存储、订阅管理、内容解析
2. **邮件 Skill**：演示了外部 API 集成、环境变量使用
3. **日程 Skill**：演示了自然语言解析、时间处理

---

*下一阶段：[进阶专题](../05-advanced/01-model-editing.md)*
