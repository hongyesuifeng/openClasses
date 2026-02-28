# 赛博小镇 (Cyber Town)

🎮 **一个由AI Agent驱动的虚拟社会模拟游戏**

赛博小镇是一个教育性的游戏项目，展示了如何使用Agent技术构建一个生动的虚拟世界。灵感来自Stanford的Smallville项目。

## 🌟 特色功能

- **🤖 AI驱动的NPC**: 每个角色都是独立的Agent，具有自己的性格、记忆和目标
- **🧠 ReAct决策**: 基于ReAct范式的行为决策系统
- **💭 记忆系统**: 角色拥有短期、长期和社交记忆
- **👥 社交网络**: 角色之间形成复杂的关系网络
- **⏰ 时间系统**: 完整的游戏时间模拟
- **🗺️ 虚拟世界**: 可探索的地点系统

## 📚 知识点映射

本游戏是《Hello Agents》课程的实践项目，涵盖了以下知识点：

| 知识点 | 课程章节 | 游戏实现 |
|--------|----------|----------|
| ReAct范式 | 第4章 | NPC行为决策 |
| 记忆系统 | 第7、8章 | 角色记忆 |
| 多Agent协作 | 第7章 | 游戏编排器 |
| OCEAN性格 | 第15章 | 角色性格 |
| 社交网络 | 第15章 | 关系图谱 |

## 🚀 快速开始

### 方式一：直接打开

1. 克隆或下载本项目
2. 使用浏览器打开 `static/index.html`

### 方式二：使用本地服务器

```bash
# 使用 Python
cd claudeImplement
python -m http.server 8080

# 或使用 Node.js
npx serve .

# 然后访问 http://localhost:8080/static/
```

### 配置 MiniMax API（可选）

如需启用智能对话功能：

1. 点击游戏右上角的「设置」按钮
2. 输入你的 MiniMax API Key
3. 保存设置

## 🎮 游戏操作

- **暂停/继续**: 点击顶部「暂停」按钮
- **时间速度**: 选择 0.5x ~ 5x 速度
- **查看角色**: 点击左侧角色列表或地图上的角色
- **事件日志**: 底部显示游戏事件
- **关系图谱**: 查看角色间的社交网络

## 📁 项目结构

```
claudeImplement/
├── docs/                          # 文档
│   ├── ARCHITECTURE.md           # 技术架构
│   ├── IMPLEMENTATION_PLAN.md    # 实现计划
│   └── KNOWLEDGE_POINTS.md       # 知识点映射
├── src/                           # 源代码
│   ├── framework/                # Agent框架核心
│   │   └── agent_framework.js    # 基础Agent类
│   ├── core/                     # 核心模块
│   │   ├── character.js          # 角色Agent
│   │   ├── memory.js             # 记忆系统
│   │   ├── behavior.js           # 行为系统
│   │   └── goal.js               # 目标系统
│   ├── world/                    # 世界系统
│   │   ├── time_system.js        # 时间系统
│   │   ├── location.js           # 地点系统
│   │   └── event_system.js       # 事件系统
│   ├── social/                   # 社交系统
│   │   ├── relationship.js       # 关系系统
│   │   ├── conversation.js       # 对话系统
│   │   └── social_network.js     # 社交网络
│   └── orchestrator.js           # 游戏编排器
├── static/                        # 静态文件
│   ├── index.html                # 主页面
│   ├── css/style.css             # 样式
│   └── js/app.js                 # 前端逻辑
├── data/                          # 数据配置
│   ├── characters.json           # 角色配置
│   ├── locations.json            # 地点配置
│   └── events.json               # 事件配置
└── README.md                      # 本文件
```

## 🔧 技术架构

### 系统分层

```
┌─────────────────────────────────────────────┐
│              UI Layer (用户界面)             │
│   地图 │ 角色面板 │ 事件日志 │ 关系图谱      │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         Orchestrator (游戏编排器)           │
│   游戏循环 │ 角色调度 │ 事件广播             │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│           World Layer (世界层)              │
│   时间系统 │ 地点系统 │ 事件系统             │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│           Agent Layer (Agent层)             │
│   CharacterAgent │ BehaviorSystem           │
│   MemorySystem │ GoalSystem                 │
└─────────────────────────────────────────────┘
```

### 核心类

- **GameOrchestrator**: 游戏主控制器
- **CharacterAgent**: 角色Agent（继承自BaseAgent）
- **BehaviorSystem**: 行为决策系统
- **MemorySystem**: 记忆管理系统
- **SocialNetwork**: 社交网络分析

## 🎯 核心概念

### ReAct决策循环

每个NPC都使用ReAct范式进行决策：

```
1. Thought（思考）: 分析当前状态和需求
2. Action（行动）: 选择并执行行为
3. Observation（观察）: 评估结果
4. 循环...
```

### OCEAN性格模型

角色性格由五个维度构成：

- **O**penness（开放性）: 好奇心、创造力
- **C**onscientiousness（尽责性）: 自律、效率
- **E**xtraversion（外向性）: 社交性、活力
- **A**greeableness（宜人性）: 合作、友善
- **N**euroticism（神经质）: 情绪稳定性

### 记忆衰减

记忆会随时间衰减：

```
importance(t) = importance_0 × e^(-decay_rate × t)
```

## 🛠️ 扩展开发

### 添加新角色

编辑 `data/characters.json`：

```json
{
    "id": "new_char",
    "name": "新角色",
    "age": 25,
    "occupation": "职业",
    "personality": {
        "openness": 0.7,
        "conscientiousness": 0.6,
        "extraversion": 0.8,
        "agreeableness": 0.5,
        "neuroticism": 0.3
    },
    "location": "home"
}
```

### 添加新地点

编辑 `data/locations.json`：

```json
{
    "id": "new_location",
    "name": "新地点",
    "type": "social",
    "icon": "🎉",
    "position": { "x": 300, "y": 200 }
}
```

### 添加新行为

在 `src/core/behavior.js` 的 `BEHAVIORS` 对象中添加：

```javascript
newAction: {
    type: BehaviorType.INTERACT,
    name: '新行为',
    description: '行为描述',
    effects: { energy: -0.1, mood: 0.1 },
    requirements: { energy: 0.2 }
}
```

## 📖 文档

- [技术架构文档](docs/ARCHITECTURE.md)
- [知识点映射](docs/KNOWLEDGE_POINTS.md)

## 🙏 致谢

- Stanford Smallville 项目提供灵感
- 《Hello Agents》课程提供理论基础
- MiniMax 提供LLM支持

## 📄 许可证

MIT License
