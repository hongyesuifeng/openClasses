# AI 编程 CLI Agent 综合指南

**阅读收益**：理解三大编程 CLI Agent 的技术架构与设计原理，掌握 Agent Loop 核心机制，学会在实际工作中高效使用编程 CLI 工具。

## 目录

1.  [CLI Agent 概述](#1-cli-agent-概述)
2.  [核心架构对比](#2-核心架构对比)
3.  [Codex CLI 深度解析](#3-codex-cli-深度解析)
4.  [Claude Code 深度解析](#4-claude-code-深度解析)
5.  [OpenCode 深度解析](#5-opencode-深度解析)
6.  [关键技术原理](#6-关键技术原理)
7.  [实战最佳实践](#7-实战最佳实践)
8.  [工具选择指南](#8-工具选择指南)
9.  [参考资料](#9-参考资料)
10. [总结](#10-总结)

---

## 1. CLI Agent 概述

> 本章介绍编程 CLI Agent 的基本概念、核心特征，以及三大工具的定位差异。

### 核心要点

-   定义：编程 CLI Agent 是在终端环境中运行的 AI 编程助手，能自主理解代码、执行修改、运行命令
-   核心等式：`CLI Agent = LLM + Agent Loop + 工具系统 + 安全机制 + 配置系统`
-   与 IDE 插件和 Web 对话的关键差异：完全的终端控制能力 + 可编程的自动化工作流
-   三大工具各有侧重：Claude Code（上下文理解）、Codex CLI（安全沙箱）、OpenCode（全栈平台）

### 1.1 什么是编程 CLI Agent

编程 CLI Agent 是一类特殊的 AI Agent，它在终端环境中运行，具备以下核心能力：

| 能力 | 说明 |
|:---|:---|
| **代码理解** | 读取项目文件，理解代码结构和逻辑 |
| **代码修改** | 精确编辑、创建、删除代码文件 |
| **命令执行** | 在沙箱中运行 shell 命令（构建、测试、部署等） |
| **搜索分析** | 在代码库中搜索文件和内容 |
| **外部集成** | 通过 MCP 协议连接 GitHub、数据库等外部服务 |
| **多轮推理** | Agent Loop 循环执行，直到任务完成 |

### 1.2 CLI Agent vs IDE 插件 vs Web 对话

| 维度 | CLI Agent | IDE 插件 | Web 对话 |
|:---|:---|:---|:---|
| 运行环境 | 终端 | IDE 内嵌 | 浏览器 |
| 文件操作 | 完整读写权限 | 通过 IDE API | 无法直接操作 |
| 命令执行 | 沙箱内执行 | 受限 | 无法执行 |
| 工作流自动化 | Hook + Skill 支持 | 插件系统 | 无 |
| 可编程性 | 配置文件 + 脚本 | 插件开发 | Prompt 工程 |
| 适合场景 | 日常开发、重构、自动化 | 辅助编码 | 快速问答 |

### 1.3 三个工具的定位和特色

```
┌─────────────────────────────────────────────────────────────────┐
│                   三大工具定位光谱                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  安全优先 ←──────────────────────────────────────→ 灵活优先     │
│                                                                 │
│     Codex CLI          Claude Code          OpenCode           │
│   (Rust+TS混合)       (TS全栈闭源)        (TS全栈开源)        │
│                                                                 │
│  特点：              特点：               特点：               │
│  • 原生多平台沙箱     • 200K上下文         • 多模型支持        │
│  • 企业级安全         • 最强代码质量       • CLI+Web+Desktop   │
│  • Rust性能           • MCP生态            • 插件市场          │
│  • Python技能         • Hook/Skill系统     • 本地模型(Ollama)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心架构对比

> 本章从宏观视角对比三个工具的技术架构，理解各自的设计取舍。

### 核心要点

-   Codex CLI 采用 Rust + TypeScript 混合架构，安全层完全由 Rust 实现
-   Claude Code 采用 TypeScript 全栈架构，React (Ink) 终端 UI，闭源核心
-   OpenCode 采用 TypeScript (Bun) 统一架构，Turbo monorepo 管理多客户端
-   三者都实现了 Agent Loop、工具系统、安全机制，但实现方式截然不同

### 2.1 架构总览对比

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          架构对比总览                                    │
├─────────────────┬─────────────────┬─────────────────┬────────────────────┤
│     维度        │   Claude Code   │    Codex CLI    │      OpenCode      │
├─────────────────┼─────────────────┼─────────────────┼────────────────────┤
│ 主要语言        │ TypeScript      │ Rust + TypeScript│ TypeScript        │
│ 运行时          │ Node.js 18+     │ Rust (Tokio)    │ Bun               │
│ UI 框架         │ React (Ink)     │ ratatui (Rust)  │ SolidJS + Tauri   │
│ 包管理          │ npm             │ Cargo + npm     │ Bun + Turbo       │
│ 开源状态        │ 闭源            │ Apache 2.0      │ 开源              │
│ 底层模型        │ Claude 4.5/4.6  │ GPT-4o/o1/o3    │ 多模型支持        │
│ 上下文窗口      │ 200K            │ 128K            │ 视模型而定        │
│ 数据存储        │ 文件系统        │ JSONL + SQLite  │ SQLite (Drizzle)  │
│ 协议支持        │ MCP 原生        │ MCP + JSON-RPC  │ MCP + REST API    │
│ Crates/模块数   │ ~50 模块        │ ~87 Crates      │ ~8 Packages       │
└─────────────────┴─────────────────┴─────────────────┴────────────────────┘
```

### 2.2 Agent Loop 设计对比

Agent Loop 是 CLI Agent 的核心——它决定了 AI 如何思考、行动和迭代。

```
Claude Code Agent Loop:
┌──────────────────────────────────────────┐
│  QueryEngine.ask()                       │
│      ↓                                   │
│  构建消息 → 调用 Claude API               │
│      ↓                                   │
│  解析响应 → 工具调用 or 文本输出           │
│      ↓                                   │
│  执行工具 → 结果回传 → 继续循环           │
│      ↓                                   │
│  上下文压缩（超限时自动触发）              │
└──────────────────────────────────────────┘

Codex CLI Agent Loop:
┌──────────────────────────────────────────┐
│  CodexThread.submit(op)                  │
│      ↓                                   │
│  加载技能/工具 → 调用 OpenAI API          │
│      ↓                                   │
│  解析 ToolCall → 沙箱执行                 │
│      ↓                                   │
│  安全检查 → 执行 → 结果回传               │
│      ↓                                   │
│  会话持久化（JSONL 事件流）               │
└──────────────────────────────────────────┘

OpenCode Agent Loop:
┌──────────────────────────────────────────┐
│  Agent.run()                             │
│      ↓                                   │
│  多模型路由 → 调用 Provider API           │
│      ↓                                   │
│  Zod 验证工具参数 → 执行                  │
│      ↓                                   │
│  权限检查（ask/allow/deny）               │
│      ↓                                   │
│  会话持久化（SQLite）                     │
└──────────────────────────────────────────┘
```

### 2.3 工具系统设计对比

| 工具类型 | Claude Code | Codex CLI | OpenCode |
|:---|:---|:---|:---|
| 文件读取 | `ReadTool` | 内置 | 内置 |
| 文件编辑 | `EditTool` (精确匹配) | 内置 | 内置 |
| 文件写入 | `WriteTool` | 内置 | 内置 |
| 命令执行 | `BashTool` | `ShellCommand` | 内置 |
| 文件搜索 | `GlobTool` | `FileSearch` | 内置 |
| 内容搜索 | `GrepTool` | 内置 | 内置 |
| 子代理 | `AgentTool` | Agent 系统 | Agent 模块 |
| MCP 工具 | `MCPTool` | MCP Server | MCP 支持 |
| 技能工具 | `SkillTool` | Python Skills | 插件工具 |

### 2.4 上下文管理策略

```
┌─────────────────────────────────────────────────────────────────┐
│                     上下文管理策略对比                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│     策略        │   Claude Code   │         Codex CLI           │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ 最大窗口        │ 200K tokens     │ 128K tokens                 │
│ 自动压缩        │ micro-compaction│ 摘要压缩                    │
│ 项目上下文      │ CLAUDE.md       │ AGENTS.md                   │
│ 工具上下文消耗  │ MCP 工具占 40%+ │ 技能注入占一定比例          │
│ 压缩触发        │ 超限时自动      │ 超限时自动                  │
│ 最佳实践        │ 少即是多        │ 精简配置                    │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## 3. Codex CLI 深度解析

> 本章深入分析 Codex CLI 的 Rust + TypeScript 混合架构，重点关注其安全沙箱设计。

### 核心要点

-   87 个 Rust Crates 组成分层架构，核心引擎全部由 Rust 实现
-   多平台沙箱是其核心竞争力：Linux Landlock + seccomp、macOS Seatbelt、Windows Sandbox
-   会话管理采用 ThreadManager + CodexThread 模式，JSONL 持久化
-   JSON-RPC 2.0 协议实现进程间通信

### 3.1 分层架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     用户接口层                                │
│   TypeScript SDK (@openai/codex)                            │
│   Rust TUI (ratatui + crossterm)                            │
│   CLI (clap)                                                │
├─────────────────────────────────────────────────────────────┤
│                     应用服务层                                │
│   App Server (JSON-RPC 2.0 + WebSocket)                     │
│   Exec Server (命令执行管理)                                 │
│   ThreadManager (多会话管理)                                 │
├─────────────────────────────────────────────────────────────┤
│                     核心业务层                                │
│   Codex Core (codex-core)                                   │
│   Agent System (AgentControl)                               │
│   Skills Manager (技能注入)                                  │
│   Model Client (AI 模型调用)                                 │
├─────────────────────────────────────────────────────────────┤
│                     协议层                                    │
│   Protocol (内部消息定义)                                    │
│   MCP Server (外部工具集成)                                  │
│   App Protocol (应用通信)                                    │
├─────────────────────────────────────────────────────────────┤
│                     执行层                                    │
│   Executor (命令执行器)                                      │
│   Shell Command (Shell 命令)                                 │
│   Sandbox Manager (安全隔离)                                 │
├─────────────────────────────────────────────────────────────┤
│                     基础设施层                                │
│   Config (配置管理)    State (状态持久化)                     │
│   Logging (日志遥测)   Auth (认证管理)                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 会话管理：ThreadManager + CodexThread

```rust
// 会话协调中心
pub struct ThreadManager {
    state: Arc<Mutex<ThreadManagerInner>>,
}

struct ThreadManagerInner {
    live_connections: HashSet<ConnectionId>,
    threads: HashMap<ThreadId, ThreadEntry>,
    thread_ids_by_connection: HashMap<ConnectionId, HashSet<ThreadId>>,
}

// 单个会话实例
pub struct CodexThread {
    pub(crate) codex: Codex,
    rollout_path: Option<PathBuf>,  // JSONL 会话持久化
    out_of_band_elicitation_count: Mutex<u64>,
}
```

**会话生命周期**：

```
Created → Initializing(加载配置) → Ready → Processing(执行任务)
    ↑                                  ↓
    └── Ready ←── WaitingTool(工具调用) ←┘
    ↓
Suspended(用户暂停) → Ready(resume)
    ↓
Shutdown
```

### 3.3 多平台沙箱系统（核心竞争力）

Codex CLI 最大的技术亮点是其平台特定的沙箱实现：

| 平台 | 技术 | 原理 | 实现模块 |
|:---|:---|:---|:---|
| Linux | Landlock | 内核级文件系统访问控制（LSM） | `codex-linux-sandbox` |
| Linux | seccomp | 系统调用过滤（限制可用 syscall） | `codex-sandboxing` |
| macOS | Seatbelt | macOS 原生沙箱配置文件 | `seatbelt` |
| Windows | Restricted Token | 令牌权限限制 + Job Object | `codex-windows-sandbox` |

**Linux Landlock 沙箱示例**：

```rust
use landlock::{Access, AccessFs, Ruleset, RulesetAttr, RulesetCreated};

fn setup_sandbox() -> Result<()> {
    let abi = landlock::ABI::V1;

    let ruleset = Ruleset::new()
        .handle(AccessFs::from_all(abi))?
        .add_rule(
            RulesetAttr::new()
                // 只允许读取 /workspace
                .allow(AccessFs::ReadFile | AccessFs::ReadDir)
                .path("/workspace")?
        )?
        .create()?;

    ruleset.restrict_self()?;
    Ok(())
}
```

**macOS Seatbelt 配置示例**：

```xml
(version 1)
(deny default)
(allow file-read* (subpath "/workspace"))
(allow file-write* (subpath "/workspace"))
(deny network*)
```

**沙箱安全最佳实践**：

```bash
# 生产环境：严格沙箱 + 限制路径
codex --sandbox=strict \
  --allow-path=/app/src:ro \
  --allow-path=/app/tests:rw \
  chat

# 开发环境：宽松模式
codex --sandbox=permissive --allow-path=$(pwd) chat
```

### 3.4 JSON-RPC 2.0 通信协议

Codex CLI 的 App Server 采用 JSON-RPC 2.0 协议进行进程间通信：

```typescript
// 请求格式
{
  "jsonrpc": "2.0",
  "method": "thread.submit",
  "params": {
    "threadId": "abc123",
    "op": { "type": "user_message", "content": "修复这个 bug" }
  },
  "id": 1
}

// 响应格式
{
  "jsonrpc": "2.0",
  "result": {
    "turnId": "turn-001",
    "status": "completed"
  },
  "id": 1
}
```

---

## 4. Claude Code 深度解析

> 本章深入分析 Claude Code 的 TypeScript 全栈架构，重点关注其工具系统、扩展机制和权限模型。

### 核心要点

-   TypeScript + React (Ink) 构建终端 UI，基于 Anthropic SDK 调用 Claude API
-   7 大原生工具（Read/Edit/Write/Bash/Glob/Grep/Agent）提供完整的代码操作能力
-   Hook + Skill + MCP 三层扩展机制
-   权限系统支持 allow/deny/ask 三级控制，Bash 命令有多层安全检查

### 4.1 整体架构

```
┌────────────────────────────────────────────────────────────────────┐
│                      Claude Code 系统架构                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐  │
│  │   CLI 层    │───▶│  QueryEngine │───▶│   Claude API        │  │
│  │  (Node.js)  │    │  (核心循环)   │    │   (Anthropic SDK)   │  │
│  └─────────────┘    └──────┬───────┘    └─────────────────────┘  │
│                            │                                       │
│         ┌──────────────────┼──────────────────┐                   │
│         ▼                  ▼                  ▼                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │  工具系统   │    │  技能系统   │    │  钩子系统   │           │
│  │ 7大原生工具 │    │ (/commands) │    │ (事件触发)  │           │
│  └──────┬──────┘    └─────────────┘    └─────────────┘           │
│         │                                                        │
│         ▼                                                        │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                    MCP 服务器生态                          │   │
│  │  GitHub | PostgreSQL | Figma | Jira | Shell | 自定义...   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 核心模块详解

**目录结构（核心部分）**：

```
claudecode/src/
├── main.tsx                    # 应用主入口
├── QueryEngine.ts              # AI 查询引擎核心
├── Tool.ts                     # 工具接口定义
├── tools/                      # 工具实现
│   ├── BashTool/               # 命令执行（含安全检查）
│   ├── FileReadTool/           # 文件读取（支持图片/PDF/Notebook）
│   ├── FileEditTool/           # 精确字符串替换编辑
│   ├── FileWriteTool/          # 文件写入
│   ├── GlobTool/               # 文件搜索
│   ├── GrepTool/               # 内容搜索（基于 ripgrep）
│   ├── AgentTool/              # 子代理工具
│   ├── MCPTool/                # MCP 外部工具
│   └── SkillTool/              # 技能工具
├── services/
│   ├── mcp/                    # MCP 服务管理
│   └── compact/                # 上下文压缩服务
├── skills/                     # 技能加载和管理
├── commands/                   # 内置命令
├── bridge/                     # 远程桥接（claude.ai 集成）
└── components/                 # React (Ink) UI 组件
```

### 4.3 工具系统详解

Claude Code 的每个工具都实现了统一的 `Tool` 接口：

```typescript
interface Tool<Input, Output> {
  name: string

  // Schema 定义（Zod）
  inputSchema: z.ZodType<Input>
  outputSchema?: z.ZodType<Output>

  // 执行
  call(input: Input, context: ToolUseContext): Promise<ToolResult<Output>>

  // 权限
  checkPermissions(input: Input, context: ToolUseContext): Promise<PermissionResult>

  // 特性标记
  isEnabled(): boolean
  isReadOnly(): boolean       // 只读工具（Read, Glob, Grep）
  isDestructive(): boolean    // 破坏性工具（Bash, Write）
  isConcurrencySafe(): boolean // 可并发执行

  // UI 渲染
  renderToolUseMessage?(input: Input): React.ReactNode
  renderToolResultMessage?(output: Output): React.ReactNode
}

type PermissionResult =
  | { behavior: 'allow'; message?: string }
  | { behavior: 'deny'; message: string }
  | { behavior: 'ask'; message: string }
```

**BashTool 安全机制**（多层防护）：

```
用户命令
    ↓
┌───────────────┐
│ 1. Shell 解析  │  语法解析、环境变量提取
└───────┬───────┘
        ↓
┌───────────────┐
│ 2. 危险模式    │  命令注入检测、进程替换检测
│    检测        │  Zsh 危险命令列表
└───────┬───────┘
        ↓
┌───────────────┐
│ 3. 权限验证    │  allow/deny 规则匹配
│                │  用户交互确认
└───────┬───────┘
        ↓
┌───────────────┐
│ 4. 沙盒执行    │  环境隔离、文件系统限制
└───────────────┘
```

### 4.4 Hook 钩子系统

Hook 允许在特定事件触发时执行自定义命令：

```json
// ~/.claude/settings.json
{
  "hooks": {
    "user-prompt-submit": {
      "command": "echo 'Processing prompt...'",
      "timeout": 5000
    },
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "echo 'About to run bash command'"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "prettier --write {{file_path}}"
      },
      {
        "matcher": "Write(*.ts)",
        "command": "eslint --fix {{file_path}}"
      }
    ]
  }
}
```

**支持的 Hook 事件**：

| 事件 | 触发时机 | 典型用途 |
|:---|:---|:---|
| `user-prompt-submit` | 用户提交 prompt 时 | 日志记录、输入预处理 |
| `PreToolUse` | 工具执行前 | 权限检查、命令拦截 |
| `PostToolUse` | 工具执行后 | 自动格式化、lint |
| `Notification` | 通知事件 | 消息推送 |
| `Stop` | 会话停止时 | 清理、汇总 |

### 4.5 Skill 技能系统

技能通过 Markdown 文件定义，支持参数 schema：

```markdown
# commands/review/command.md

你是一个代码审查专家。请审查用户提供的代码变更：

1. 检查代码质量和最佳实践
2. 识别潜在的 bug 和安全问题
3. 提供具体的改进建议
4. 使用清晰的格式输出审查结果

审查范围：{{args.scope}}
重点关注：{{args.focus}}
```

```json
// commands/review/args.schema.json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "description": "审查范围 (all|changed|staged)",
      "default": "changed"
    },
    "focus": {
      "type": "string",
      "description": "重点关注领域",
      "enum": ["security", "performance", "style", "all"],
      "default": "all"
    }
  }
}
```

### 4.6 MCP 协议集成

```json
// ~/.claude/settings.json - MCP 服务器配置
{
  "mcpServers": {
    "github": {
      "command": "mcp-github",
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "postgres": {
      "command": "mcp-postgres",
      "args": ["postgresql://user:pass@localhost/db"]
    }
  }
}
```

```bash
# MCP 管理命令
claude mcp add         # 向导式添加 MCP 服务器
claude mcp list        # 列出已配置的服务器
claude mcp test github # 测试连接
claude mcp serve       # Claude Code 作为 MCP 服务器运行
```

### 4.7 权限和安全模型

```json
// 权限配置
{
  "permissions": {
    "allow": [
      "Read",                    // 允许所有读取
      "Bash(npm:*)",             // 允许 npm 命令
      "Bash(git:*)",             // 允许 git 命令
      "Write(/home/user/projects/**)"  // 限制写入路径
    ],
    "deny": [
      "Bash(rm -rf:*)",          // 禁止危险删除
      "Bash(sudo:*)",            // 禁止提权
      "Bash(chmod:*)"            // 禁止权限修改
    ]
  }
}
```

| 权限模式 | 说明 |
|:---|:---|
| `default` | 交互式确认，每次敏感操作都询问 |
| `accept` | 自动允许所有操作（危险，仅测试用） |
| `plan` | 只读模式，仅分析和规划 |

---

## 5. OpenCode 深度解析

> 本章深入分析 OpenCode 的多客户端架构，重点关注其多模型支持和插件生态。

### 核心要点

-   TypeScript (Bun) 统一架构，Turbo monorepo 管理 CLI / Web / Desktop 三个客户端
-   原生多模型支持：OpenAI、Anthropic、Google、Ollama（本地模型）
-   SQLite (Drizzle ORM) 实现会话持久化和跨设备同步
-   插件市场机制允许社区扩展

### 5.1 多客户端架构

```
┌────────────────────────────────────────────────────────────────────┐
│                      OpenCode 多客户端架构                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                        客户端层                               │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────────────────────┐  │  │
│  │  │   CLI   │    │   Web   │    │    Desktop (Tauri)      │  │  │
│  │  │  (Bun)  │    │(SolidJS)│    │    (Rust + React)       │  │  │
│  │  └────┬────┘    └────┬────┘    └───────────┬─────────────┘  │  │
│  └───────┼──────────────┼─────────────────────┼────────────────┘  │
│          └──────────────┼─────────────────────┘                    │
│                         ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    服务层 (Hono)                               │ │
│  │   Session Manager  │  Model Gateway  │  Workspace Manager    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                         ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                 数据层 (Drizzle + SQLite)                     │ │
│  │   Sessions  │  Messages  │  Workspaces                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 多模型 Provider 系统

OpenCode 的核心差异化能力——原生多模型支持：

```typescript
// 支持的 Provider 和模型
const providers = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  google: ['gemini-pro', 'gemini-ultra'],
  local: ['ollama://localhost:11434/deepseek-coder'],
};

// 模型路由策略（按任务类型自动选择）
export default {
  ai: {
    routing: {
      architecture: 'gpt-4',        // 架构设计用 GPT-4
      coding: 'claude-3-sonnet',    // 代码编写用 Claude
      review: 'claude-3-opus',      // 代码审查用 Opus
      quick: 'claude-haiku',        // 快速任务用 Haiku
    },
  },
};
```

**模型路由使用**：

```bash
# 显式指定模型
opencode chat --model=gpt-4
opencode chat --model=claude-3-sonnet
opencode chat --model=ollama:deepseek-coder

# 使用模板（自动路由）
opencode chat --template code-review
```

### 5.3 配置层级管理

OpenCode 的配置优先级从低到高：

```
1. Remote .well-known/opencode     ← 组织级默认
2. Global config (~/.config/opencode/)
3. Custom config (OPENCODE_CONFIG)
4. Project config (opencode.json)  ← 项目级
5. .opencode directories
6. Inline config (OPENCODE_CONFIG_CONTENT) ← 最高优先级
```

### 5.4 SQLite 会话持久化

```typescript
// Drizzle ORM Schema
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workspaceId: integer('workspace_id').notNull(),
  title: text('title'),
  model: text('model').notNull().default('gpt-4'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  tokens: integer('tokens'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});
```

---

## 6. 关键技术原理

> 本章深入分析 CLI Agent 背后的核心技术原理，理解这些原理有助于更好地使用和配置工具。

### 核心要点

-   Agent Loop 遵循 Observe → Think → Act → Reflect 循环
-   Function Calling / Tool Use 协议是工具调用的基础
-   流式处理实现实时响应，上下文压缩解决窗口限制
-   MCP 协议实现标准化的工具集成

### 6.1 Agent Loop 详解

Agent Loop 是 CLI Agent 的核心运行机制，本质是一个持续迭代直到任务完成的循环：

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Loop 循环                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐                                              │
│   │ Observe  │  接收用户输入、工具结果、环境状态             │
│   │  观察    │                                              │
│   └────┬─────┘                                              │
│        ↓                                                    │
│   ┌──────────┐                                              │
│   │  Think   │  LLM 推理：分析任务、规划步骤、选择工具       │
│   │  思考    │                                              │
│   └────┬─────┘                                              │
│        ↓                                                    │
│   ┌──────────┐                                              │
│   │   Act    │  执行工具调用、代码修改、命令执行             │
│   │  行动    │                                              │
│   └────┬─────┘                                              │
│        ↓                                                    │
│   ┌──────────┐                                              │
│   │ Reflect  │  评估结果、判断是否完成、更新上下文           │
│   │  反思    │                                              │
│   └────┬─────┘                                              │
│        │                                                    │
│        ├── 任务完成 → 输出结果                               │
│        └── 需要继续 → 回到 Observe                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**三个工具的 Agent Loop 实现**：

```typescript
// Claude Code - QueryEngine 核心（伪代码）
async function* agentLoop(messages, tools) {
  while (true) {
    // Think: 调用 Claude API
    const response = await claude.messages.create({
      model: currentModel,
      messages: messages,
      tools: tools,
    });

    // 检查是否完成
    if (response.stop_reason === 'end_turn') {
      yield { type: 'text', content: response.content };
      break;
    }

    // Act: 执行工具调用
    if (response.stop_reason === 'tool_use') {
      for (const toolCall of response.toolCalls) {
        // 权限检查
        const permission = checkPermission(toolCall);
        if (permission === 'deny') continue;

        // 执行工具
        const result = await executeTool(toolCall);

        // Reflect: 将结果加入上下文
        messages.push({ role: 'tool_result', content: result });

        yield { type: 'tool_use', tool: toolCall, result };
      }
    }
  }
}
```

### 6.2 Function Calling / Tool Use 协议

工具调用是 Agent 的核心能力，基于 LLM 的 Function Calling 机制：

```
┌──────────────────────────────────────────────────────────┐
│              Tool Use 交互流程                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. 用户 → Agent: "修复 src/auth.ts 的登录 bug"          │
│                                                          │
│  2. Agent → LLM:                                         │
│     messages: [{用户请求}]                                │
│     tools: [Read, Edit, Bash, Grep, ...]                 │
│                                                          │
│  3. LLM → Agent:                                         │
│     stop_reason: "tool_use"                              │
│     tool_calls: [{ name: "Read", input: {               │
│       file_path: "src/auth.ts"                           │
│     }}]                                                  │
│                                                          │
│  4. Agent → 执行工具:                                     │
│     result = Read("src/auth.ts")                         │
│                                                          │
│  5. Agent → LLM:                                         │
│     messages: [..., { role: "tool_result",               │
│       content: "文件内容..." }]                           │
│                                                          │
│  6. LLM → Agent:                                         │
│     stop_reason: "tool_use"                              │
│     tool_calls: [{ name: "Edit", input: {               │
│       old_string: "bug代码", new_string: "修复代码"      │
│     }}]                                                  │
│                                                          │
│  7. Agent → 用户: "已修复 src/auth.ts 的登录 bug"        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.3 流式处理和实时响应

所有三个工具都采用流式（Streaming）处理，实现实时输出：

```
┌───────────────────────────────────────────────────┐
│              流式处理架构                           │
├───────────────────────────────────────────────────┤
│                                                   │
│  LLM API ──(SSE stream)──▶ Agent ──▶ Terminal    │
│     │                          │         │        │
│     │ chunk1                   │ 解析    │ 渲染   │
│     │ chunk2                   │ 拼接    │ 显示   │
│     │ chunk3                   │ 处理    │ 更新   │
│     │ ...                      │         │        │
│     │ [DONE]                   │ 完成    │ 结束   │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 6.4 上下文窗口优化策略

当对话超过上下文窗口限制时，各工具采用不同的压缩策略：

| 策略 | 说明 | 使用工具 |
|:---|:---|:---|
| 微压缩 (Micro-compaction) | 移除冗余的工具结果，保留关键信息 | Claude Code |
| 摘要压缩 | 用 LLM 生成对话摘要替代完整历史 | Codex CLI |
| 历史截断 | 只保留最近 N 轮对话 | OpenCode |
| 项目上下文注入 | 通过 CLAUDE.md/AGENTS.md 持久化项目知识 | 所有工具 |

**Claude Code 上下文压缩示意**：

```
压缩前（200K tokens）：
  [系统提示] [CLAUDE.md] [MCP工具定义] [历史对话1] [工具结果1] [历史对话2] [工具结果2] ...

压缩后（~100K tokens）：
  [系统提示] [CLAUDE.md] [MCP工具定义] [摘要: 历史对话1的关键信息] [工具结果1的关键部分] [最近对话...]
```

### 6.5 MCP 协议原理

Model Context Protocol (MCP) 是 Anthropic 提出的标准化工具集成协议：

```
┌─────────────────────────────────────────────────────────┐
│                    MCP 协议架构                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐      MCP Protocol     ┌───────────┐  │
│   │   CLI Agent │◄─────────────────────▶│  MCP      │  │
│   │  (Client)   │   JSON-RPC 2.0        │  Server   │  │
│   └─────────────┘                       └───────────┘  │
│         │                                     │        │
│    tools/list                            连接外部服务  │
│    tools/call                                           │
│    resources/list                                       │
│    resources/read                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**MCP 通信流程**：

```json
// Client → Server: 列出可用工具
{ "method": "tools/list" }

// Server → Client: 工具列表
{
  "tools": [
    {
      "name": "query_database",
      "description": "查询数据库",
      "inputSchema": { "type": "object", "properties": { "sql": { "type": "string" } } }
    }
  ]
}

// Client → Server: 调用工具
{ "method": "tools/call", "params": { "name": "query_database", "arguments": { "sql": "SELECT * FROM users LIMIT 5" } } }

// Server → Client: 返回结果
{ "content": [{ "type": "text", "text": "[{id: 1, name: 'Alice'}, ...]" }] }
```

### 6.6 沙箱安全和权限控制深度对比

三个工具的安全模型代表了三种不同的安全哲学：

```
┌─────────────────────────────────────────────────────────────────┐
│                   安全模型哲学对比                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Codex CLI - "隔离一切"                                        │
│  ┌─────────────────────────────────────────┐                   │
│  │  应用层 → Rust 核心 → OS 级沙箱          │                   │
│  │  每个命令在独立沙箱进程中执行             │                   │
│  │  文件系统访问由 OS 内核级别控制           │                   │
│  │  网络访问默认全部拒绝                    │                   │
│  │  安全性：★★★★★  灵活性：★★★            │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  Claude Code - "权限管控"                                      │
│  ┌─────────────────────────────────────────┐                   │
│  │  应用层 → 权限检查 → 用户确认            │                   │
│  │  命令注入检测 + 危险模式匹配             │                   │
│  │  allow/deny 规则白名单                   │                   │
│  │  敏感操作交互式确认                      │                   │
│  │  安全性：★★★★  灵活性：★★★★            │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
│  OpenCode - "策略配置"                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │  配置文件 → 策略引擎 → 运行时检查        │                   │
│  │  文件系统路径规则                        │                   │
│  │  网络访问策略配置                        │                   │
│  │  工具执行权限控制                        │                   │
│  │  安全性：★★★  灵活性：★★★★★            │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**安全威胁防护对比**：

| 威胁类型 | Codex CLI | Claude Code | OpenCode |
|:---|:---|:---|:---|
| 命令注入 | OS 级隔离 | 正则模式检测 | 配置策略 |
| 文件越权访问 | Landlock/Seatbelt | 路径白名单 | 路径规则 |
| 网络泄露 | 默认拒绝 | 用户确认 | 策略配置 |
| 提权操作 (sudo) | 沙箱禁止 | deny 规则 | 配置禁止 |
| 敏感文件泄露 | 沙箱不可见 | 用户确认 | 路径控制 |

### 6.7 扩展机制对比：Hook / Skill / MCP

三大工具都提供了扩展机制，但设计理念不同：

```
┌──────────────────────────────────────────────────────────────┐
│                 扩展机制三层架构                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Hook（事件触发自动化）                              │
│  ─────────────────────────────────────                       │
│  触发时机：PreToolUse / PostToolUse / 文件保存               │
│  执行方式：Shell 命令                                        │
│  适用场景：自动格式化、lint、日志记录、安全审计               │
│  示例：Write(*.ts) → eslint --fix                           │
│                                                              │
│  Layer 2: Skill/Command（自定义命令）                         │
│  ─────────────────────────────────────                       │
│  Claude Code: Markdown 文件 + JSON Schema                    │
│  Codex CLI:  Python 脚本                                     │
│  OpenCode:   TypeScript 插件                                 │
│  适用场景：代码审查、测试生成、文档创建、工作流模板           │
│  示例：/review --scope changed --focus security              │
│                                                              │
│  Layer 3: MCP（外部服务集成）                                 │
│  ─────────────────────────────────────                       │
│  协议：JSON-RPC 2.0                                          │
│  传输：stdio / WebSocket                                     │
│  适用场景：GitHub、数据库、设计工具、CI/CD、自定义 API        │
│  示例：claude mcp add github                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Skill 系统对比**：

| 维度 | Claude Code | Codex CLI | OpenCode |
|:---|:---|:---|:---|
| 定义语言 | Markdown | Python | TypeScript |
| 参数验证 | JSON Schema | Python 类型 | Zod Schema |
| 工具访问 | 限定工具集 | Context API | 插件 API |
| 分发方式 | Git 仓库共享 | Git 仓库共享 | 插件市场 |
| 适用人群 | 非程序员友好 | Python 开发者 | TS 开发者 |

---

## 7. 实战最佳实践

> 本章提供具体的、可直接复制使用的配置示例和工作流模板，覆盖日常开发的主要场景。

### 7.1 项目初始化配置

#### Claude Code - CLAUDE.md 配置示例

```markdown
# 项目名称

## 技术栈
- React 18 + TypeScript
- Tailwind CSS
- Node.js 20 + Bun
- PostgreSQL + Prisma ORM

## 项目结构
- src/api/ - API 接口层
- src/components/ - React UI 组件
- src/hooks/ - 自定义 React Hooks
- src/lib/ - 工具函数
- prisma/ - 数据库 Schema

## 编码规范
- 使用函数式组件 + Hooks
- 遵循 Airbnb 风格指南
- 测试覆盖率要求 80%+
- API 路由统一使用 Zod 验证

## 常用命令
- `bun dev`: 启动开发服务器
- `bun test`: 运行测试
- `bun lint`: 代码检查
- `bun db:migrate`: 数据库迁移

## 禁止操作
- 不要修改 .env 文件
- 不要直接操作生产数据库
- 不要删除 prisma/migrations/ 下的文件
- 提交前必须运行 bun test
```

#### Codex CLI - 项目配置示例

```toml
# .codex/project.toml
[project]
name = "my-project"
description = "项目描述"

[context]
include = ["src/**/*.ts", "README.md", "AGENTS.md"]
exclude = ["node_modules", "dist", ".git", "*.lock"]

[skills]
enabled = ["code-review", "test-generator"]

[sandbox]
mode = "strict"
paths = { read = ["/workspace/src"], write = ["/workspace/src"] }
```

#### OpenCode - 项目配置示例

```json
// opencode.json
{
  "ai": {
    "defaultModel": "claude-3-sonnet",
    "routing": {
      "architecture": "gpt-4",
      "coding": "claude-3-sonnet",
      "review": "claude-3-opus",
      "quick": "claude-haiku"
    }
  },
  "database": { "path": "./data/opencode.db" }
}
```

### 7.2 Hook 系统配置示例

#### 自动格式化 Hook

```json
// ~/.claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.ts)",
        "command": "eslint --fix {{file_path}} && prettier --write {{file_path}}"
      },
      {
        "matcher": "Write(*.py)",
        "command": "black {{file_path}} && isort {{file_path}}"
      },
      {
        "matcher": "Write(*.rs)",
        "command": "rustfmt {{file_path}}"
      }
    ]
  }
}
```

#### 安全验证 Hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "echo 'Executing: {{command}}' >> /tmp/claude-audit.log"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "grep -l 'password\\|secret\\|api_key' {{file_path}} && echo 'WARNING: Sensitive data detected' >> /tmp/claude-security.log"
      }
    ]
  }
}
```

#### Codex CLI Hook 配置

```toml
# .codex/hooks.toml

# 代码保存时自动格式化
[[hooks]]
name = "auto-format"
trigger = "file-save"
pattern = "**/*.{ts,tsx}"
command = "prettier --write {file}"

# 提交前检查
[[hooks]]
name = "pre-commit"
trigger = "command-pre"
command_pattern = "git commit*"
command = "npm run lint && npm test"
abort_on_failure = true
```

### 7.3 MCP 服务器集成配置

#### GitHub MCP 集成

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "github": {
      "command": "mcp-github",
      "args": [],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

```bash
# 使用示例
claude "查看 owner/repo#123 这个 issue 的详情"
claude "列出所有待处理的 PR"
claude "为当前分支创建 PR，标题和描述基于最近的 commits"
```

#### 数据库 MCP 集成

```json
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-postgres",
      "args": ["postgresql://user:pass@localhost:5432/mydb"]
    }
  }
}
```

```bash
# 使用示例
claude "查询 users 表结构"
claude "帮我写一个查询：获取最近 7 天注册的用户数量"
```

### 7.4 常见场景工作流

#### 场景一：Bug 修复

```bash
# Claude Code
claude "运行测试并分析失败原因"
# → AI 运行 npm test，分析错误输出
claude "修复这个 bug，先告诉我你理解的问题和修复方案"
# → AI 分析后给出方案，确认后执行
claude "运行测试验证修复"
# → AI 运行测试，确认通过

# Codex CLI（更安全的方式）
codex --sandbox=strict chat
> 分析 src/auth.ts 中的登录 bug
> 修复并运行测试验证
```

#### 场景二：代码审查

```bash
# Claude Code - 使用自定义技能
/review --scope changed --focus security

# Claude Code - 手动审查
claude "审查最近的 git diff，关注安全漏洞和性能问题"

# Codex CLI
codex exec "审查最近 3 个 commit 的代码变更，重点关注 SQL 注入和 XSS"
```

#### 场景三：大型重构

```bash
# 步骤化重构（推荐方式）
claude "
把这个 JavaScript 项目迁移到 TypeScript，请按以下步骤执行：
1. 先分析项目结构，列出需要转换的文件
2. 创建 tsconfig.json 和类型定义
3. 按依赖顺序逐个转换文件
4. 每转换一批文件后运行测试
5. 最后更新 package.json 和构建脚本

先制定计划，等我确认后再开始执行。
"
```

#### 场景四：新功能开发

```bash
# 渐进式开发
claude "分析当前项目结构，我要添加一个用户管理模块"
# → AI 分析项目结构，给出建议

claude "
基于项目架构，创建用户管理模块：
- src/api/users.ts - API 路由
- src/components/UserList.tsx - 用户列表组件
- src/hooks/useUsers.ts - 自定义 Hook
- 参考 src/api/ 下的现有接口风格
- 参考 src/components/ 下的现有组件模式
"
# → AI 按项目风格生成代码
```

### 7.5 Prompt 技巧在 CLI 中的运用

#### 原则：文档 + 示例 + 清晰任务

```
好结果 = 文档（有什么） + 示例（怎么写） + 清晰任务（做什么）
```

**差**的 Prompt：

```
帮我写一个用户管理 API
```

**好**的 Prompt：

```
帮我创建用户管理 API，要求：
- 技术栈：Express + TypeScript + Prisma
- 参考现有风格：src/api/products.ts
- 需要 CRUD 四个接口
- 使用 Zod 做参数验证
- 错误处理参考 src/lib/errors.ts 的模式
```

#### 项目级 Prompt 持久化

通过 CLAUDE.md 将项目规范持久化，避免每次重复说明：

```markdown
## CLAUDE.md 中应包含的 Prompt 信息

1. 技术栈和版本（让 AI 知道用什么工具）
2. 项目结构（让 AI 知道文件放哪里）
3. 编码规范（让 AI 知道代码怎么写）
4. 常用命令（让 AI 知道怎么构建和测试）
5. 禁止操作（让 AI 知道什么不能做）
```

### 7.6 多工具协作策略

```bash
# 策略 1：主次搭配
# Claude Code 为主（代码质量最高）
# OpenCode 为辅（GUI 审查 + 多模型对比）

# 策略 2：按场景切换
# 复杂重构/架构设计 → Claude Code Opus（200K 上下文）
# 日常开发 → Claude Code Sonnet（性价比）
# 快速修复/简单任务 → Claude Code Haiku（速度）
# 安全敏感操作 → Codex CLI（沙箱隔离）
# 需要 GUI/多模型 → OpenCode（全栈平台）

# 策略 3：成本优化
# 高价值任务（架构、核心逻辑） → Opus/GPT-4
# 日常任务（CRUD、修复） → Sonnet
# 重复性任务（格式化、文档） → Haiku/本地模型
```

### 7.7 完整 Claude Code settings.json 配置参考

以下是一份经过实践验证的完整配置，适合大多数 TypeScript/React 项目：

```json
// ~/.claude/settings.json
{
  "model": "claude-sonnet-4-6",

  "permissions": {
    "allow": [
      "Read",
      "Bash(npm run:*)",
      "Bash(npm test:*)",
      "Bash(npm install:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(bun run:*)",
      "Bash(bun test:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(wc:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Bash(chmod 777:*)",
      "Bash(curl * | bash:*)",
      "Bash(wget * | bash:*)"
    ]
  },

  "mcpServers": {
    "github": {
      "command": "mcp-github",
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  },

  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.ts)",
        "command": "npx eslint --fix {{file_path}} 2>/dev/null; npx prettier --write {{file_path}} 2>/dev/null"
      },
      {
        "matcher": "Write(*.tsx)",
        "command": "npx eslint --fix {{file_path}} 2>/dev/null; npx prettier --write {{file_path}} 2>/dev/null"
      }
    ]
  }
}
```

### 7.8 常见问题与排错

| 问题 | 原因 | 解决方案 |
|:---|:---|:---|
| 上下文丢失 | 对话过长，超出窗口限制 | 使用 `/compact` 压缩，或 `clear` 重开会话 |
| 工具调用失败 | 权限未配置 | 检查 `settings.json` 的 `permissions.allow` |
| MCP 连接超时 | MCP 服务器未启动或网络问题 | `claude mcp test <name>` 检查连接 |
| 代码格式混乱 | 未配置自动格式化 Hook | 添加 `PostToolUse` Hook |
| 重复犯错 | 项目规范未持久化 | 完善 `CLAUDE.md` 文件 |
| 成本过高 | 全部使用顶级模型 | 按任务复杂度分级使用模型 |
| 修改了不该改的文件 | 权限过于宽松 | 配置 `deny` 规则，保护关键文件 |

---

## 8. 工具选择指南

> 本章提供决策树和场景推荐，帮助在实际工作中快速选择合适的工具。

### 8.1 决策树

```
┌─────────────────────────────────────────────────────────────────┐
│                     工具选择决策树                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  需要最高代码质量？                                             │
│         │                                                       │
│         ├─ 是 ──▶ Claude Code (Opus 4.6)                       │
│         │                                                       │
│         └─ 否                                                   │
│              │                                                  │
│              ├─ 需要最高安全隔离？                               │
│              │      │                                           │
│              │      ├─ 是 ──▶ Codex CLI                         │
│              │      │                                           │
│              │      └─ 否                                       │
│              │           │                                      │
│              │           ├─ 需要 GUI 界面？                      │
│              │           │      │                               │
│              │           │      ├─ 是 ──▶ OpenCode             │
│              │           │      │                               │
│              │           │      └─ 否                          │
│              │           │           │                          │
│              │           │           ├─ 需要多模型切换？        │
│              │           │           │      │                   │
│              │           │           │      ├─ 是 ──▶ OpenCode │
│              │           │           │      │                   │
│              │           │           │      └─ 否              │
│              │           │           │           │              │
│              │           │           │           ▼              │
│              │           │           │    Claude Code           │
│              │           │           │    (日常开发首选)        │
│              │           │                                      │
│              └─ 默认 ──▶ Claude Code (Sonnet 4.6)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 场景推荐表

| 场景 | 推荐工具 | 原因 | 模型建议 |
|:---|:---|:---|:---|
| 日常开发 | Claude Code | 上下文理解最强 | Sonnet 4.6 |
| 复杂重构 | Claude Code | 200K 上下文 + 最强推理 | Opus 4.6 |
| 安全敏感环境 | Codex CLI | 多平台沙箱隔离 | GPT-4o |
| 企业级项目 | Codex CLI | 安全合规 + 审计日志 | o3 |
| 需要 GUI | OpenCode | 唯一支持桌面/Web 界面 | 按需选择 |
| 团队协作 | OpenCode | 共享会话和配置 | 按需选择 |
| 多模型切换 | OpenCode | 原生多模型支持 | 按场景路由 |
| 成本优化 | OpenCode + Haiku | 可选择便宜模型 | Haiku/本地模型 |
| 本地/离线 | OpenCode + Ollama | 支持本地模型 | deepseek-coder |
| 快速修复 | Claude Code | 响应快，质量高 | Haiku 4.5 |
| 代码审查 | Claude Code | 安全意识强 | Opus 4.6 |
| 文档生成 | 任意 | 不涉及代码执行 | 便宜模型即可 |

### 8.3 成本考量

```
┌─────────────────────────────────────────────────────────────────┐
│                     成本优化策略                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  按任务价值分配模型：                                            │
│                                                                 │
│  高价值（架构设计、核心逻辑）                                    │
│    → Claude Opus / GPT-4                                        │
│    → 预算占比：60%                                              │
│                                                                 │
│  中价值（日常开发、Bug 修复）                                    │
│    → Claude Sonnet / GPT-4o                                     │
│    → 预算占比：30%                                              │
│                                                                 │
│  低价值（格式化、文档、简单修改）                                │
│    → Claude Haiku / 本地模型                                    │
│    → 预算占比：10%                                              │
│                                                                 │
│  省钱技巧：                                                     │
│  • 精简 MCP 配置，减少上下文浪费                               │
│  • 使用 /compact 主动压缩历史                                  │
│  • 用 CLAUDE.md 持久化项目知识，避免重复说明                   │
│  • 简单任务用 Haiku/本地模型                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. 参考资料

### 核心工具官方资源

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Claude Code GitHub](https://github.com/anthropic-ai/claude-code)
- [Codex CLI GitHub](https://github.com/openai/codex)
- [OpenCode GitHub](https://github.com/sst/opencode)

### 相关技术

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [Bun Runtime](https://bun.sh)
- [Tauri Desktop](https://tauri.app)
- [Ollama](https://ollama.ai/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Vercel AI SDK](https://sdk.vercel.ai/)

### 本地详细技术文档

> 以下文档位于 `/mnt/c/Users/qq691/Desktop/AICodingCLI/docs/` 目录

- Claude Code 详细文档 (`claude-code.md`)
- Codex CLI 详细文档 (`codex-cli.md`)
- OpenCode 详细文档 (`opencode.md`)
- Claude Code 架构详解 (`claudecode-architecture.md`)
- Codex 源码深度分析 (`codex-source-code-analysis.md`)
- Claude Code 模块详解 (`claudecode-modules.md`)
- Claude Code 安全机制 (`claudecode-security.md`)
- AI 编程工具总览 (`ai-coding-tools-overview.md`)

### 关联阅读

- [AI 编码的提问方式（分享文档）](PROMPT_ENGINEERING_SHARING.md)
- [提示词工程完全指南](PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md)
- [AI Agent 在游戏开发中的应用](AGENT_IN_GAME_DEVELOPMENT_COMPREHENSIVE_GUIDE.md)

---

## 10. 总结

### 核心回顾

编程 CLI Agent 的本质是 **LLM + Agent Loop + 工具系统 + 安全机制**，三个工具各自在这个等式上做出了不同的取舍：

| 工具 | 核心取舍 | 最适合 |
|:---|:---|:---|
| **Claude Code** | 牺牲开源和灵活性，换取最强上下文理解和代码质量 | 日常开发主力 |
| **Codex CLI** | 牺牲易用性，换取最强安全隔离 | 安全敏感环境 |
| **OpenCode** | 牺牲深度优化，换取最广的平台和模型支持 | 多模型/GUI 场景 |

### 行动清单

1. **立即行动**：为你的项目创建 `CLAUDE.md`，写清楚技术栈、规范和禁止操作
2. **本周完成**：配置 `settings.json` 的权限规则和自动格式化 Hook
3. **持续优化**：按任务复杂度分级使用模型，定期精简 MCP 配置
4. **进阶探索**：创建自定义 Skill 技能，搭建团队共享的工作流模板

### 关键公式

```
好结果 = 好的工具选择 + 有效的 Prompt + 合理的配置 + 安全的意识

有效的 Prompt = 文档（有什么） + 示例（怎么写） + 清晰任务（做什么）

工具选择 = 日常 Claude Code + 安全 Codex CLI + 灵活 OpenCode
```
