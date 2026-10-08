# Godot 游戏开发项目 - 多角色 Agent 系统

本目录包含使用 Godot 引擎开发的游戏项目，配备多角色 Agent 系统支持学习和实践。

---

## 项目概览

| 项目 | 描述 | 状态 |
|------|------|------|
| first2DGame | Godot 入门教程项目（2D 街机游戏） | 完成 |
| Gopeak-godot-mcp | MCP 服务器项目（AI 辅助 Godot 开发） | 活跃 |
| slayDemo | 卡牌玩法、技术方法与项目复盘学习资料 | 工程已迁移至独立 cocosProjects 仓库 |

---

## 多角色 Agent 系统

本项目支持四个游戏开发角色，帮助你从不同专业视角理解游戏开发。

### 可用角色

| 角色 | 斜杠命令 | 核心职责 |
|------|---------|---------|
| 游戏制作人 | `/role-switch producer` | 项目把控、里程碑管理 |
| 游戏开发者 | `/role-switch developer` | 技术架构、代码实现 |
| 游戏美术 | `/role-switch artist` | 视觉风格、资源管理 |
| 游戏策划 | `/role-switch designer` | 玩法设计、数值平衡 |

### 快速开始

```
# 切换到策划视角分析卡牌设计
/role-switch designer 卡牌 UI 应该显示哪些信息？

# 切换到开发者视角分析技术实现
/role-switch developer 如何实现卡牌效果系统？

# 分配任务给角色
/task-assign developer 实现卡牌数据结构

# 记录学习收获
/learning-log designer 学到了信息层级的重要性

# 请求其他角色评审
/role-review developer docs/design/02-card-design.md
```

---

## 文档结构

```
godotProjects/
├── .agents/                    # Agent 配置（所有工具共用）
│   ├── roles/                  # 角色定义
│   ├── shared/                 # 协作上下文
│   └── skills/                 # 技能定义
│
├── .claude/commands/           # Claude Code 斜杠命令
│
├── .opencode/                  # OpenCode 配置
│
├── slayDemo/                   # 学习资料与历史复盘
│   ├── docs/
│   │   ├── design/             # 玩法设计
│   │   ├── tech/               # 技术方法与验证经验
│   │   ├── art/                # 美术与资源组织经验
│   │   └── learning/           # 学习输出
│   └── README.md               # 资料入口与工程归属
│
├── first2DGame/                # 入门项目
└── Gopeak-godot-mcp/           # MCP 工具
```

---

## 学习资源

- **设计文档**: `slayDemo/docs/design/` - 游戏设计理念、卡牌设计、敌人设计等
- **技术文档**: `slayDemo/docs/tech/` - 架构设计、系统实现方案
- **美术文档**: `slayDemo/docs/art/` - 视觉风格、资源指南
- **学习资料入口**: `slayDemo/README.md`
- **历史实施计划**: `slayDemo/docs/00-demo-implementation-plan.md`（供学习决策与过程参考）

slayDemo 的实际工程在独立 cocosProjects 仓库中维护。本目录保留学习资料，文档中的旧 Godot 工程路径属于历史记录。

---

## MCP 集成

本项目使用 GoPeak Godot MCP 进行 AI 辅助开发：

```
MCP 服务端口：
- 编辑器桥接: 6505
- LSP: 6005
- DAP: 6006
- 运行时: 7777
```

详细使用方法见 `Gopeak-godot-mcp/README.md`

---

## 多工具支持

本配置支持多个 Coding Agent：

| 工具 | 配置位置 | 使用方式 |
|------|---------|---------|
| Claude Code | 本文件 + `.claude/commands/` | 斜杠命令 |
| OpenCode | `.opencode/opencode.json` | MCP 工具 |
| 飞书 Agent | 读取 `.agents/roles/` | 直接询问视角 |

角色定义统一存放在 `.agents/roles/`，所有工具共用。

---

## 协作机制

### 决策权限

- **制作人**：里程碑优先级、范围变更
- **开发者**：技术架构、代码规范
- **美术**：视觉风格、资源选择
- **策划**：玩法机制、数值平衡

### 任务流转

```
制作人分配任务 → task-{role}.md → 角色执行 → 完成更新 → 制作人验收
```

### 进度同步

跨角色协调信息记录在 `.agents/shared/collaboration-context.md`

---

## 开始使用

1. **了解角色**：阅读 `README_AGENTS.md`
2. **切换视角**：使用 `/role-switch <角色>` 分析问题
3. **记录学习**：使用 `/learning-log` 沉淀知识
4. **跨角色协作**：使用 `/role-review` 请求评审
