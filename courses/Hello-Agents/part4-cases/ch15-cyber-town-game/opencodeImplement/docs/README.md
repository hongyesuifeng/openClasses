# 赛博小镇 (Cyber Town)

一个基于多智能体(Multi-Agent)系统的虚拟社会模拟游戏。

## 项目概述

赛博小镇是一个由 AI Agent 驱动的虚拟社会模拟系统，其中每个角色都是一个独立的智能体，拥有自己的性格、记忆、目标和关系。角色之间会自主交互，形成动态故事，整个小镇会自动演化，产生意想不到的情节。

### 核心特点

- **自主性**: 角色自主决定行为
- **社交性**: 角色之间形成社交网络
- **记忆性**: 角色记得过去发生的事情
- **目标性**: 角色有自己的目标和动机
- **动态性**: 故事线实时生成

## 技术栈

| 层级 | 技术选择 |
|------|---------|
| **LLM** | MiniMax-M2.5 |
| **后端** | Python + FastAPI |
| **前端** | 原生 HTML/CSS/JavaScript |
| **Agent数量** | 精简版 (3-5个) |

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动后端

```bash
cd backend
python main.py
```

后端服务将在 `http://localhost:8000` 启动。

### 3. 打开前端

在浏览器中打开 `frontend/index.html`

### 4. 配置 LLM

首次使用时，在前端配置面板中填写 MiniMax API Key 并选择模型。

## 项目结构

```
opencodeImplement/
├── docs/                           # 文档目录
│   ├── README.md                   # 项目介绍
│   ├── ARCHITECTURE.md            # 技术架构
│   ├── AGENT_IMPLEMENTATION.md    # Agent实现规划
│   └── TECH_PRINCIPLES.md         # 技术原理点
├── backend/                        # 后端Python
│   ├── main.py                    # FastAPI主入口
│   ├── config.py                  # 配置文件
│   ├── agent/                     # Agent系统
│   │   ├── character.py           # 角色类
│   │   ├── behavior.py            # 行为系统
│   │   ├── memory.py              # 记忆系统
│   │   └── decision.py            # 决策系统
│   ├── world/                     # 世界系统
│   │   ├── time.py                # 时间系统
│   │   ├── location.py            # 地点系统
│   │   └── event.py               # 事件系统
│   ├── social/                    # 社交系统
│   │   ├── relationship.py        # 关系网络
│   │   └── communication.py       # 对话系统
│   └── llm/                       # LLM集成
│       └── minimax.py             # MiniMax集成
├── frontend/                       # 前端
│   ├── index.html                 # 主页面
│   ├── css/
│   │   └── style.css              # 样式
│   └── js/
│       ├── game.js                # 游戏逻辑
│       ├── renderer.js            # 渲染器
│       └── api.js                 # API调用
└── requirements.txt               # 依赖
```

## 学习路径

本项目设计为学习 Agent 相关技术的教学案例，建议按以下顺序学习：

1. **ARCHITECTURE.md** - 了解整体技术架构
2. **AGENT_IMPLEMENTATION.md** - 理解 Agent 实现规划
3. **TECH_PRINCIPLES.md** - 掌握核心技术原理
4. **代码实现** - 通过代码加深理解

## 文档说明

- [技术架构](docs/ARCHITECTURE.md) - 系统的整体架构设计
- [Agent实现规划](docs/AGENT_IMPLEMENTATION.md) - Agent系统的详细实现步骤
- [技术原理](docs/TECH_PRINCIPLES.md) - 核心技术的原理讲解

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/config` | POST | 配置 LLM |
| `/api/world` | GET | 获取世界状态 |
| `/api/characters` | GET | 获取所有角色 |
| `/api/character/<id>` | GET | 获取角色详情 |
| `/api/tick` | POST | 推进游戏 tick |
| `/api/chat` | POST | 发送对话 |

## 注意事项

- 首次使用需要配置 MiniMax API Key
- API Key 仅保存在浏览器本地，不会上传
- 游戏会自动运行，也可以手动控制节奏

## 参考资料

- [Stanford's Smallville](https://arxiv.org/abs/2304.03442) - Generative Agents 论文
- [MiniMax API 文档](https://platform.minimaxi.com/docs/api-reference/text-openai-api)
