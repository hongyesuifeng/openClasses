# AI 编程 CLI Agent 实战心得

每天都在用 AI 写代码，试了好几个编程 CLI 工具，来聊聊各家的设计思路和使用感受。

═══════════════════════════════════════════════════════════
【三个工具一句话定位】

| 工具 | 一句话定位 | 开源 |
|------|-----------|------|
| **Claude Code** | 上下文理解最强，代码质量最高的终端编程助手 | 闭源 |
| **Codex CLI** | 安全沙箱最硬，企业级安全隔离的编程代理 | Apache 2.0 |
| **OpenCode** | 多模型多客户端，全栈 AI 开发平台 | 开源 |

═══════════════════════════════════════════════════════════
【核心技术原理对照】

```
Agent Loop（思考-行动循环）
───────────────────────────────────────────────────────────────
Claude Code  →  QueryEngine 驱动，200K 上下文，流式处理
Codex CLI    →  CodexThread 管理，Rust 核心引擎，128K 上下文
OpenCode     →  Agent 模块统一管理，多模型 Provider，上下文视模型而定

工具系统
───────────────────────────────────────────────────────────────
Claude Code  →  Read/Edit/Write/Bash/Glob/Grep/Agent 7大原生工具
Codex CLI    →  Shell/Read/Edit + MCP 扩展 + Python 技能
OpenCode     →  Zod 类型安全工具 + 插件市场 + MCP 支持

沙箱安全
───────────────────────────────────────────────────────────────
Claude Code  →  权限系统（allow/deny/ask 三级控制）
Codex CLI    →  原生多平台沙箱（Landlock/Seatbelt/Windows Sandbox）
OpenCode     →  策略配置驱动（文件系统/网络/执行隔离）

扩展机制
───────────────────────────────────────────────────────────────
Claude Code  →  CLAUDE.md + Hooks + Skills + MCP
Codex CLI    →  Python Skills + Hooks + MCP
OpenCode     →  插件市场 + 多模型路由 + MCP
```

═══════════════════════════════════════════════════════════
【实际使用经验对比】

开发游戏小镇（Multi-Agent 协作系统）时的感受：

**Claude Code + GLM**：编码能力强，发散思维不错，最后版本用的这个。
**OpenCode + MiniMax**：开始还行，改具体逻辑时经常写不对，放弃了。
**Codex**：交互体验偏保守，初始文档写得不够完善时输出太保守。而且 Codex 挺贵的。

**核心体感差异：**
- **上下文理解**：Claude Code >> Codex > OpenCode
- **安全隔离**：Codex > Claude Code > OpenCode
- **灵活性**：OpenCode > Claude Code > Codex
- **响应速度**：OpenCode > Codex > Claude Code

═══════════════════════════════════════════════════════════
【记住这个公式】

好结果 = 好的工具选择 + 有效的 Prompt + 合理的配置 + 安全的意识

日常开发：Claude Code Sonnet（性价比最高）
复杂重构：Claude Code Opus（上下文理解最强）
安全敏感：Codex CLI（沙箱隔离最硬）
多模型/GUI：OpenCode（灵活性最好）

═══════════════════════════════════════════════════════════
【日常最佳实践 5 条】

1. **写好 CLAUDE.md / AGENTS.md**：项目上下文、技术栈、编码规范、注意事项，相当于给 AI 一份入职文档
2. **精简 MCP 配置**：每个 MCP 工具都吃上下文，只加载当前项目需要的，避免 40%+ 上下文浪费
3. **善用 Hook 自动化**：PostToolUse 钩子自动格式化、lint，让 AI 输出的代码自动符合规范
4. **模型分级使用**：Opus 做架构、Sonnet 做日常、Haiku 做快速修复，别用大炮打蚊子
5. **安全意识别丢**：配置权限白名单（allow/deny），生产环境用 Codex 沙箱，别让 AI 碰 .env 和凭证

═══════════════════════════════════════════════════════════

想进一步了解？

[编程 CLI Agent 综合指南](CLI_AGENT_COMPREHENSIVE_GUIDE.md)
包含三大工具架构深度解析、Agent Loop 技术原理、实战最佳实践（含完整代码示例）、工具选择决策树。
