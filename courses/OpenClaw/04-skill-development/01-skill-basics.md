# 第十一讲：Skill 开发基础

> 实践教程：OpenClaw Skill 开发入门

## 本章概要

本章将介绍 OpenClaw Skill 的基本概念和开发方法，帮助你创建自己的第一个 Skill。

---

## 1. 什么是 Skill？

### 1.1 Skill 定义

**Skill** 是 OpenClaw 的核心扩展机制，是可复用的功能插件，为 AI Agent 新增各种定制化能力。

```
Skill 的作用
────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│   OpenClaw 核心能力                                 │
│   ┌─────────────────────────────────────────────┐  │
│   │ • 理解用户意图                               │  │
│   │ • 生成文本回复                               │  │
│   │ • 基础对话能力                               │  │
│   └─────────────────────────────────────────────┘  │
│                        +                            │
│                   Skill 扩展                        │
│   ┌─────────────────────────────────────────────┐  │
│   │ • 搜索网络信息                               │  │
│   │ • 发送邮件                                   │  │
│   │ • 操作文件                                   │  │
│   │ • 调用 API                                   │  │
│   │ • 执行代码                                   │  │
│   │ • ...任何你能想到的功能                      │  │
│   └─────────────────────────────────────────────┘  │
│                        =                            │
│              强大的 AI Agent                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 Skill 特点

| 特点 | 描述 |
|------|------|
| **Markdown 驱动** | 用自然语言描述能力，降低开发门槛 |
| **语义触发** | AI 自动判断何时调用 Skill |
| **可复用** | 一次开发，多次使用 |
| **可分享** | 发布到 ClawHub 供他人使用 |
| **安全隔离** | 在沙箱中执行，保护系统安全 |

### 1.3 Skill vs 传统插件

```
对比
────────────────────────────────────────────────────────

传统插件系统                OpenClaw Skill
─────────────────           ─────────────────
需要写代码注册              Markdown 描述即可
硬编码触发条件              AI 语义理解触发
需要了解框架 API            只需描述功能
平台强耦合                  平台无关

Skill 优势：
• 开发简单
• 更灵活
• 易于分享
```

---

## 2. Skill 目录结构

### 2.1 基本结构

```
Skill 目录结构
────────────────────────────────────────────────────────

my-skill/
├── SKILL.md           # 必需：Skill 定义文件
├── skill.json         # 可选：元数据配置
├── index.py           # 可选：Python 执行脚本
├── index.js           # 可选：JavaScript 执行脚本
├── README.md          # 可选：说明文档
└── assets/            # 可选：资源文件
    └── icon.png
```

### 2.2 SKILL.md 核心文件

```markdown
# Skill 名称

## 描述
简短描述这个 Skill 能做什么

## 触发条件
描述什么情况下应该使用这个 Skill

## 输入参数
定义需要的参数

## 执行
指定执行的命令或脚本

## 输出
描述输出格式
```

---

## 3. 创建第一个 Skill

### 3.1 Hello World Skill

```
步骤一：创建目录
────────────────────────────────────────────────────────
```

```bash
mkdir -p skills/hello-world
cd skills/hello-world
```

```
步骤二：创建 SKILL.md
────────────────────────────────────────────────────────
```

```markdown
# Hello World

## 描述
向用户打招呼的简单示例 Skill

## 触发条件
当用户说"你好"、"hello"、"打招呼"时触发

## 输入参数
无

## 执行
echo "你好！我是 OpenClaw，很高兴认识你！"

## 输出
返回打招呼的消息
```

### 3.2 测试 Skill

```bash
# 将 Skill 放入 OpenClaw 的 skills 目录
cp -r hello-world /path/to/openclaw/skills/

# 重启 OpenClaw
systemctl restart openclaw
# 或
npm run dev

# 测试
# 用户：你好
# OpenClaw：你好！我是 OpenClaw，很高兴认识你！
```

---

## 4. 带参数的 Skill

### 4.1 天气查询 Skill

```markdown
# 天气查询

## 描述
查询指定城市的天气信息

## 触发条件
当用户询问以下内容时触发：
- "xxx的天气怎么样"
- "查一下xxx的天气"
- "xxx今天天气"

## 输入参数
- city: 城市名称（必需）
- days: 预报天数（可选，默认1）

## 执行
```bash
python weather.py --city "${city}" --days ${days:-1}
```

## 输出
返回天气信息的 JSON 格式数据
```

### 4.2 执行脚本

```python
# weather.py

import argparse
import requests
import json

def get_weather(city, days=1):
    """获取天气信息"""
    # 这里使用模拟数据，实际使用时替换为真实 API
    weather_data = {
        "city": city,
        "forecast": [
            {
                "date": "2026-04-01",
                "condition": "晴",
                "temp_high": 25,
                "temp_low": 15
            }
        ]
    }
    return json.dumps(weather_data, ensure_ascii=False)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", required=True)
    parser.add_argument("--days", type=int, default=1)
    args = parser.parse_args()

    result = get_weather(args.city, args.days)
    print(result)
```

---

## 5. SKILL.md 详解

### 5.1 完整结构

```markdown
# Skill 名称

<!--
  skill.json 的 Markdown 表示
  也可以单独创建 skill.json 文件
-->

## 元数据
- 版本: 1.0.0
- 作者: Your Name
- 标签: 搜索, 网络

## 描述
详细描述这个 Skill 的功能和用途。
越详细越好，AI 会根据描述决定何时调用。

## 触发条件
描述触发条件，支持：
- 关键词匹配
- 意图识别
- 正则表达式

示例：
- 用户询问天气相关问题时
- 用户提到"天气"、"气温"、"下雨"等词时
- 用户需要了解户外活动是否合适时

## 输入参数

### city
- 类型: string
- 必需: 是
- 描述: 要查询天气的城市名称
- 示例: 北京、上海、广州

### days
- 类型: integer
- 必需: 否
- 默认值: 1
- 描述: 查询未来几天的天气
- 范围: 1-7

## 执行

### 方式一：Shell 命令
```bash
python ${SKILL_DIR}/weather.py --city "${city}" --days ${days}
```

### 方式二：JavaScript
```javascript
// 使用 ${} 引用参数
const city = "${city}";
const days = ${days};
// 执行逻辑...
```

### 方式三：HTTP 请求
```http
GET https://api.weather.com/v1/forecast?city=${city}&days=${days}
Authorization: Bearer ${WEATHER_API_KEY}
```

## 输出格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "city": "北京",
    "forecast": [...]
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "城市不存在"
}
```

## 示例对话

用户: 北京今天天气怎么样？
助手: [调用 weather skill，city="北京"]
助手: 北京今天天气晴朗，气温 15-25°C，适合户外活动。

## 注意事项
- 需要 WEATHER_API_KEY 环境变量
- 支持中国大陆城市
- 请求频率限制：100次/天
```

### 5.2 特殊变量

```
Skill 中可用的特殊变量
────────────────────────────────────────────────────────

${SKILL_DIR}        # Skill 所在目录的绝对路径
${OPENCLAW_DIR}     # OpenClaw 根目录
${USER_ID}          # 用户 ID
${SESSION_ID}       # 会话 ID
${CHANNEL}          # 当前通道（feishu/dingtalk/...）
${TIMESTAMP}        # 当前时间戳

参数变量：
${param_name}       # 字符串参数
${param_name:-default}  # 带默认值的参数
```

---

## 6. Skill 配置文件 (skill.json)

### 6.1 完整配置

```json
{
  "name": "weather",
  "version": "1.0.0",
  "description": "查询城市天气信息",
  "author": "Your Name",
  "tags": ["天气", "查询", "生活"],

  "triggers": {
    "keywords": ["天气", "气温", "下雨", "晴"],
    "intents": ["query_weather", "check_forecast"],
    "patterns": [
      "(.+)的天气",
      "查一下(.+)的天气",
      "(.+)今天天气怎么样"
    ]
  },

  "parameters": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "城市名称",
        "required": true
      },
      "days": {
        "type": "integer",
        "description": "预报天数",
        "default": 1,
        "minimum": 1,
        "maximum": 7
      }
    },
    "required": ["city"]
  },

  "execution": {
    "type": "shell",
    "command": "python ${SKILL_DIR}/weather.py --city \"${city}\" --days ${days}",
    "timeout": 30000,
    "retry": 2
  },

  "output": {
    "type": "json",
    "schema": {
      "success": "boolean",
      "data": "object"
    }
  },

  "permissions": [
    "network",
    "filesystem:read"
  ],

  "rateLimit": {
    "requests": 100,
    "period": "day"
  }
}
```

---

## 7. 调试技巧

### 7.1 日志查看

```bash
# 查看 OpenClaw 日志
tail -f /var/log/openclaw/app.log

# 或使用 journalctl
journalctl -u openclaw -f

# 过滤 Skill 相关日志
grep "skill" /var/log/openclaw/app.log
```

### 7.2 测试 Skill

```bash
# 直接测试脚本
cd skills/weather
python weather.py --city "北京" --days 1

# 使用 OpenClaw CLI 测试
openclaw skill test weather --params '{"city":"北京"}'

# 查看 Skill 是否被识别
openclaw skill list
```

### 7.3 常见问题

```
常见问题排查
────────────────────────────────────────────────────────

Q: Skill 没有被触发
A: 检查：
   1. SKILL.md 格式是否正确
   2. 触发条件描述是否清晰
   3. 查看日志确认是否识别到 Skill

Q: 执行脚本报错
A: 检查：
   1. 脚本路径是否正确
   2. 脚本是否有执行权限
   3. 依赖是否安装

Q: 参数传递失败
A: 检查：
   1. 参数名是否一致
   2. 参数类型是否正确
   3. 使用 ${param:-default} 提供默认值
```

---

## 关键要点总结

1. **Skill** 是 OpenClaw 的核心扩展机制
2. **SKILL.md** 是核心定义文件，使用 Markdown 格式
3. **语义触发**：AI 根据描述自动判断何时调用
4. **参数传递**：使用 ${param_name} 语法
5. **执行方式**：Shell 命令、JavaScript、HTTP 请求

---

*下一章：[Skill 进阶开发](02-skill-advanced.md)*
