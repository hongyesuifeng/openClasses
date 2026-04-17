# 学习项目目录结构规划

> 系统化的学习内容组织和导航

## 📊 当前学习领域概览

基于现有内容分析，你的学习项目涵盖以下核心领域：

| 领域 | 主题 | 状态 | 关联内容 |
|------|------|------|----------|
| **AI Agent** | Agent架构、MCP、LLM应用 | 进行中 | CS146S、Hello-Agents、OpenClaw |
| **游戏引擎** | Cocos、Godot 源码学习 | 进行中 | cocos-engine、godot、源码文档 |
| **提示工程** | Prompt设计、对话系统 | 已掌握 | 综合指南、分享文档 |
| **论文研究** | AI Agent、游戏开发AI | 进行中 | 2025 AI Agent Index、GameDevBench |
| **CLI工具开发** | Agent应用、命令行工具 | 进行中 | CLI Agent综合指南 |

## 🗂️ 当前目录结构

```
openClasses/
├── 📁 README.md                           # 项目总览和导航
│
├── 📁 PROJECT_STRUCTURE.md                 # 本文件 - 结构规划说明
│
├── 📁 user-profile/                       # 用户学习画像系统
│   ├── learning-profile.md               # 学习档案
│   ├── skill-matrix.json                # 技能矩阵
│   ├── learning-preferences.json        # 学习偏好
│   └── progress/                        # 进度追踪
│       └── progress-tracker-template.md
│
├── 📁 learning-routes/                   # 学习路线推荐系统
│   ├── README.md                        # 框架使用指南
│   ├── topic-index/                     # 主题路线索引
│   │   ├── ai-agents.md                # AI Agent学习路线
│   │   ├── game-engine.md              # 游戏引擎学习路线
│   │   ├── prompt-engineering.md       # 提示工程学习路线
│   │   ├── cli-tools.md                # CLI工具开发路线
│   │   └── research-methodology.md     # 论文阅读方法论
│   ├── adaptive-paths/                  # 自适应学习路径
│   └── cross-domain/                    # 跨领域组合路线
│       ├── game-ai-combination.md      # 游戏+AI组合
│       └── agent-cli-combination.md    # Agent+CLI组合
│
├── 📁 domains/                           # 学习领域分区（新增）
│   │
│   ├── 📁 ai-agent/                     # AI Agent 领域
│   │   ├── README.md                   # 领域导航
│   │   ├── 📁 courses/                 # 课程学习
│   │   │   ├── CS146S-The-Modern-Software-Developer/
│   │   │   ├── Hello-Agents/
│   │   │   └── OpenClaw/
│   │   ├── 📁 papers/                  # 论文研究
│   │   │   └── 2025_AI_Agent_Index/
│   │   ├── 📁 projects/                # 实践项目
│   │   └── 📁 resources/               # 资源汇总
│   │
│   ├── 📁 game-engine/                 # 游戏引擎领域
│   │   ├── README.md                   # 领域导航
│   │   ├── 📁 engines/                 # 引擎源码
│   │   │   ├── cocos-engine/
│   │   │   └── godot/
│   │   ├── 📁 guides/                  # 学习指南
│   │   │   ├── cocos-source-learning/
│   │   │   └── godot-source-learning/
│   │   ├── 📁 papers/                  # 相关论文
│   │   │   └── GameDevBench/
│   │   └── 📁 projects/                # 实践项目
│   │
│   ├── 📁 prompt-engineering/           # 提示工程领域
│   │   ├── README.md
│   │   ├── 📁 guides/
│   │   ├── 📁 practices/
│   │   └── 📁 templates/
│   │
│   └── 📁 software-development/         # 软件开发领域
│       ├── README.md
│       ├── 📁 cli-tools/               # CLI工具开发
│       ├── 📁 testing/                 # 测试相关
│       └── 📁 deployment/              # 部署相关
│
├── 📁 docs/                             # 综合指南文档
│   ├── INDEX.md                        # 文档索引
│   │
│   ├── 📁 ai-agent/                    # AI Agent 文档
│   │   ├── AGENT_IN_GAME_DEVELOPMENT_COMPREHENSIVE_GUIDE.md
│   │   ├── AGENT_IN_GAMING_SHARING.md
│   │   ├── CLI_AGENT_COMPREHENSIVE_GUIDE.md
│   │   └── CLI_AGENT_SHARING.md
│   │
│   ├── 📁 game-engine/                 # 游戏引擎文档
│   │   ├── cocos-architecture.md
│   │   ├── godot-architecture.md
│   │   └── godot-learning-guide.md
│   │
│   └── 📁 general/                     # 通用文档
│       ├── PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md
│       ├── PROMPT_ENGINEERING_SHARING.md
│       ├── LEARNING_OPTIMIZATION_PRINCIPLES.md
│       ├── cocos-source-learning/
│       └── godot-source-learning/
│
├── 📁 templates/                        # 模板系统
│   ├── course-summary.md               # 课程总结模板
│   ├── paper-reading.md                # 论文阅读模板
│   ├── project-doc.md                  # 项目文档模板
│   └── weekly-report.md                # 周报模板
│
├── 📁 .claude/                          # Claude Code 配置
│   ├── commands/                       # 自定义命令
│   │   ├── topic-route.md             # 主题路线命令
│   │   ├── learning-plan.md           # 学习计划命令
│   │   └── progress-report.md         # 进度报告命令
│   └── skills/                         # 自定义技能
│       ├── learning-path-generator.md # 学习路径生成
│       └── learning-optimizer.md      # 学习优化技能
│
└── 📁 archive/                          # 归档区域
    └── completed/                      # 已完成的学习内容
```

## 📋 各领域详细规划

### 1. AI Agent 领域 (`domains/ai-agent/`)

**学习目标**：掌握 AI Agent 架构设计和应用开发

**当前进度**：
- CS146S: Week 4/10 进行中
- Hello-Agents: Chapter 4/12 进行中
- OpenClaw: 学习中

**学习路径**：
```
阶段1: LLM基础与Agent架构 (CS146S Week 1-4)
  ↓
阶段2: Agent开发与实践 (Hello-Agents)
  ↓
阶段3: Agent应用开发 (OpenClaw)
  ↓
阶段4: 高级主题与项目 (论文研究+实践)
```

**核心资源**：
- 课程：CS146S、Hello-Agents、OpenClaw
- 论文：2025 AI Agent Index
- 文档：CLI Agent综合指南

### 2. 游戏引擎领域 (`domains/game-engine/`)

**学习目标**：理解游戏引擎架构，掌握源码阅读能力

**当前进度**：
- Cocos Creator: 源码学习中
- Godot: 源码学习中

**学习路径**：
```
阶段1: 引擎基础架构
  - Cocos 核心系统
  - Godot 节点系统
  ↓
阶段2: 渲染系统
  - 渲染管线
  - 着色器和材质
  ↓
阶段3: 功能模块
  - 动画、物理、音频
  ↓
阶段4: 高级主题
  - 自定义渲染
  - 后处理效果
```

**核心资源**：
- 引擎源码：cocos-engine、godot
- 学习文档：cocos-source-learning、godot-source-learning
- 论文：GameDevBench

### 3. 提示工程领域 (`domains/prompt-engineering/`)

**学习目标**：掌握 Prompt 设计和优化技巧

**当前状态**：已掌握 (4/5)

**核心资源**：
- PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md
- PROMPT_ENGINEERING_SHARING.md

### 4. 软件开发领域 (`domains/software-development/`)

**学习目标**：掌握现代软件开发工具和实践

**核心方向**：
- CLI 工具开发
- 测试
- 部署

## 🔗 跨领域关联

| 领域组合 | 应用场景 | 推荐项目 |
|---------|---------|----------|
| AI Agent + 游戏引擎 | 智能NPC系统 | game-ai-combination.md |
| AI Agent + CLI工具 | Agent化工具 | agent-cli-combination.md |
| 游戏引擎 + 提示工程 | 对话系统设计 | 游戏对话系统 |
| 论文研究 + 实践 | 算法实现 | 论文复现项目 |

## 📊 学习数据统计

### 时间投入分析

| 领域 | 每周投入 | 总投入 | 进度 |
|------|---------|--------|------|
| AI Agent | 8h | ~40h | 30% |
| 游戏引擎 | 6h | ~30h | 15% |
| 提示工程 | 2h | ~20h | 90% |
| 论文研究 | 4h | ~15h | 20% |

### 技能水平矩阵

| 技能 | 当前 | 目标 | 差距 |
|------|------|------|------|
| LLM基础 | 3/5 | 4/5 | +1 |
| Agent开发 | 2/5 | 4/5 | +2 |
| 游戏引擎架构 | 2/5 | 4/5 | +2 |
| 源码阅读能力 | 2/5 | 4/5 | +2 |
| 论文阅读 | 2/5 | 3/5 | +1 |

## 🎨 学习可视化

### 当前学习焦点

```
     [AI Agent] ←───────────┐
          ↓                  │
     [游戏引擎] ←───────+─────┘
          ↓              ↓
     [论文研究] → [实践项目]
          ↓
     [提示工程] (支撑技能)
```

### 推荐学习顺序

1. **并行学习**：AI Agent + 游戏引擎
2. **交叉应用**：游戏AI项目
3. **深入研究**：源码+论文
4. **实践输出**：项目作品

## 📁 导航文件说明

### 根目录导航
- **README.md**: 项目总览，快速入口
- **PROJECT_STRUCTURE.md**: 本文件，完整结构说明

### 领域导航
- **domains/ai-agent/README.md**: AI Agent 领域导航
- **domains/game-engine/README.md**: 游戏引擎领域导航
- **domains/prompt-engineering/README.md**: 提示工程领域导航
- **domains/software-development/README.md**: 软件开发领域导航

### 文档索引
- **docs/INDEX.md**: 快速文档索引和搜索

## 🚀 使用建议

### 新手入门
1. 从项目根目录 README.md 开始
2. 选择感兴趣的学习领域
3. 查看该领域的 README.md 导航
4. 使用 `/topic-route` 获取学习路线

### 日常学习
1. 使用 `/learning-plan` 生成学习计划
2. 按领域组织学习内容
3. 定期更新进度追踪
4. 使用 `/learning-optimizer` 优化方法

### 进阶使用
1. 探索跨领域组合
2. 参与实践项目
3. 撰写学习总结
4. 分享学习经验

---

**文档版本**: 2.0
**创建日期**: 2026-04-17
**最后更新**: 2026-04-17
**维护者**: Perry's Learning System
