# 🎮 游戏小镇 (Game Dev Town)

AI Agent 协作开发游戏演示平台 - 展示 4 个 AI Agent 扮演不同游戏开发角色，通过会议讨论的方式协作开发游戏《王者之路》。

## 📋 项目概述

游戏小镇是一个展示 AI Agent 协作能力的演示项目。四个 AI Agent 分别扮演：
- 🎯 **张制作** - 制作人：负责项目整体规划和进度管理
- 💻 **李程序** - 程序员：负责技术架构和系统开发
- 📋 **王策划** - 策划：负责玩法设计和数值平衡
- 🎨 **陈美术** - 美术：负责视觉风格和美术资源

## ✨ 功能特性

### 核心功能
- 🎭 **多角色扮演** - 4 个 AI Agent 扮演不同游戏开发角色
- 💬 **实时对话** - WebSocket 实现的实时消息推送
- 🔄 **会议中断** - 支持随时中断正在进行的会议
- 📊 **任务统计** - 会议结束后自动生成任务和进度统计
- 👤 **角色详情** - 点击团队成员查看详细信息弹框

### 会议场景
- **新英雄设计讨论** - 团队讨论新英雄的技能设计
- **性能问题紧急讨论** - 解决游戏卡顿问题
- **付费系统设计方案** - 设计商业化系统

### 系统组件
- **记忆系统** - Agent 可以记住之前的讨论内容
- **决策系统** - 基于角色特征做出决策
- **任务系统** - 跟踪项目任务和进度
- **对话系统** - 管理会议流程和消息

## 🛠️ 技术栈

- **后端**: Python 3.10+ / FastAPI
- **前端**: HTML5 + CSS3 + JavaScript ES6+
- **LLM**: MiniMax API (Anthropic 兼容模式)
- **通信**: REST API + WebSocket

## 📁 项目结构

```
claudeImplement/
├── backend/
│   ├── app/
│   │   ├── api/              # API 路由和 WebSocket
│   │   │   ├── routes.py     # REST API 端点
│   │   │   └── websocket.py  # WebSocket 处理（支持中断）
│   │   ├── agents/           # Agent 实现
│   │   │   ├── base.py       # 基础 Agent 类
│   │   │   ├── producer.py   # 制作人
│   │   │   ├── developer.py  # 程序员
│   │   │   ├── designer.py   # 策划
│   │   │   └── artist.py     # 美术
│   │   ├── core/             # 核心系统
│   │   │   ├── memory.py     # 记忆系统
│   │   │   ├── decision.py   # 决策系统
│   │   │   ├── task.py       # 任务系统
│   │   │   └── conversation.py # 对话管理
│   │   ├── meeting/          # 会议编排系统
│   │   │   ├── orchestrator.py # 会议编排器（支持中断）
│   │   │   └── templates.py  # 场景模板
│   │   ├── services/         # LLM 服务
│   │   │   └── llm.py        # MiniMax 集成（含 think 标签过滤）
│   │   ├── config.py         # 配置管理
│   │   └── main.py           # FastAPI 入口
│   ├── prompts/              # 提示词模板
│   ├── requirements.txt      # Python 依赖
│   └── .env                  # 环境变量配置
└── frontend/
    ├── index.html            # 主页面
    ├── css/style.css         # 样式文件（含弹框样式）
    └── js/
        ├── app.js            # 主应用逻辑
        ├── api.js            # API 通信
        ├── chat.js           # 聊天组件
        ├── characters.js     # 角色组件（含弹框）
        └── dashboard.js      # 看板组件
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# MiniMax API 配置
MINIMAX_API_KEY=your_api_key_here
MINIMAX_BASE_URL=https://api.minimax.chat/v1
MINIMAX_MODEL=MiniMax-M2.5

# 服务器配置
HOST=0.0.0.0
PORT=5051
DEBUG=true

# 游戏配置
GAME_NAME=王者之路
MAX_MEMORY_ITEMS=50
MEETING_TURN_DELAY=2.0
```

### 3. 启动后端服务

```bash
cd backend
python -m app.main
```

服务将在 `http://localhost:5051` 启动。

### 4. 访问前端页面

浏览器打开：`http://localhost:5051/static/index.html`

## 📡 API 文档

### REST API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 欢迎页面 |
| `/health` | GET | 健康检查 |
| `/api/agents` | GET | 获取所有 Agent 信息 |
| `/api/meetings/templates` | GET | 获取会议模板 |
| `/api/meetings/scenarios` | GET | 获取会议场景 |
| `/api/meetings/start` | POST | 开始会议 |
| `/api/project/progress` | GET | 获取项目进度 |
| `/api/project/tasks` | GET | 获取任务列表 |
| `/api/system/status` | GET | 系统状态 |

### WebSocket

连接地址: `ws://localhost:5051/ws/meeting`

**客户端发送消息类型：**
| 类型 | 说明 |
|------|------|
| `start_meeting` | 开始会议 |
| `run_scenario` | 运行场景（后台任务） |
| `send_message` | 发送用户消息 |
| `end_meeting` | 结束会议（可中断进行中的讨论） |
| `get_status` | 获取状态 |

**服务端推送消息类型：**
| 类型 | 说明 |
|------|------|
| `connected` | 连接成功 |
| `meeting_started` | 会议已开始 |
| `agent_status` | Agent 状态更新 |
| `new_message` | 新消息 |
| `meeting_ended` | 会议结束（含任务统计） |
| `status_update` | 状态更新 |
| `error` | 错误信息 |

## 🔧 配置说明

### 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `MINIMAX_API_KEY` | MiniMax API 密钥 | - |
| `MINIMAX_BASE_URL` | API 基础 URL | `https://api.minimax.chat/v1` |
| `MINIMAX_MODEL` | 模型名称 | `MiniMax-M2.5` |
| `HOST` | 服务主机 | `0.0.0.0` |
| `PORT` | 服务端口 | `5051` |
| `DEBUG` | 调试模式 | `true` |
| `GAME_NAME` | 游戏名称 | `王者之路` |
| `MEETING_TURN_DELAY` | 发言间隔(秒) | `2.0` |

## 🎓 学习要点

1. **Agent 架构设计** - 如何设计可扩展的多 Agent 系统
2. **角色扮演** - 如何让 LLM 有效地扮演不同角色
3. **协作机制** - Agent 之间如何协调和通信
4. **异步任务管理** - 使用 `asyncio.create_task` 实现可中断的后台任务
5. **实时通信** - WebSocket 在 AI 应用中的使用
6. **LLM 输出处理** - 过滤思考过程标签，提取有效内容

## 🔍 技术亮点

### 1. 会议中断机制
使用 `asyncio.create_task` 在后台运行场景讨论，主 WebSocket 循环保持响应，支持随时中断。

### 2. Think 标签过滤
自动过滤 MiniMax 模型输出的 `<think＞... Ellis` 思考过程，只显示最终发言内容。

### 3. 角色详情弹框
点击团队成员卡片显示详细信息，包括专业技能和性格特点。

### 4. 任务统计更新
会议结束后自动提取行动项，更新项目进度和任务统计。

## 📝 开发说明

### 添加新的 Agent

1. 在 `backend/app/agents/` 创建新的 Agent 类
2. 继承 `BaseAgent` 并实现必要方法
3. 在 `config.py` 的 `AGENT_ROLES` 中添加角色配置
4. 在 `agents/__init__.py` 的 `create_agent` 工厂函数中注册

### 添加新的会议场景

1. 在 `backend/app/meeting/templates.py` 的 `SCENARIO_PROMPTS` 中添加场景
2. 在 `frontend/index.html` 的场景选择器中添加选项

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
