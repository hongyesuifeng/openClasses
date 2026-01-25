# CS146S: The Modern Software Developer - 课程文档索引

> 斯坦福大学 2025 年秋季课程 | 讲师: Mihail Eric
> 课程官网: https://themodernsoftware.dev/

---

## 📚 文档导航

### 🗂️ 新结构: 按周组织

课程已重新组织为**每周独立文件夹**,便于系统学习:

#### 📚 Week 1-2: AI 基础
- **[Week 1: LLM 基础](./week-01/SUMMARY.md)** - 大型语言模型与提示工程入门 ✨
- **[Week 2: Agent 架构](./week-02/SUMMARY.md)** - 编码代理、MCP 协议与工具调用

#### 🛠️ Week 3-4: AI IDE 与实战
- **[Week 3: AI IDE](./week-03/SUMMARY.md)** - AI 集成开发环境与 MCP 协议
- **[Week 4: 自动化 Agent](./week-04/SUMMARY.md)** - Claude Code 实战与多 Agent 协作

#### 🔧 Week 5-8: 现代工具链
- **[Week 5: Warp 终端](./week-05/SUMMARY.md)** - AI 增强命令行与多代理工作流
- **[Week 6: 安全扫描](./week-06/SUMMARY.md)** - Semgrep 静态代码分析与 AI 安全
- **[Week 7: AI 审查](./week-07/SUMMARY.md)** - Graphite 代码审查与智能文档
- **[Week 8: 多栈构建](./week-08/SUMMARY.md)** - 使用 AI 快速构建 Web 应用

#### 🚀 Week 9-10: 未来展望
- **[Week 9: 部署后 Agent](./week-09/SUMMARY.md)** - 监控、可观测性与自动化运维
- **[Week 10: 未来趋势](./week-10/SUMMARY.md)** - AI 软件工程的未来与个人发展 🎓

📋 **查看完整重组进度**: [REORGANIZATION_PROGRESS.md](./REORGANIZATION_PROGRESS.md)

---

### 📖 原有文档: 合并版本

保留原有的详细课程文档,内容完整:

- **[00-课程概览](./00-课程概览.md)** - 课程总体介绍和核心知识点
- **[Week 1-2: LLM基础与Agent架构](./01-Week1-2-LLM基础与Agent架构.md)** - 理论基础
- **[Week 3-4: AI IDE与Agent管理](./02-Week3-4-AI-IDE与Agent管理.md)** - 工具与实践
- **[Week 5-8: 现代终端测试与UI](./03-Week5-8-现代终端测试与UI构建.md)** - 开发工具链
- **[Week 9-10: 部署后Agent与未来](./04-Week9-10-部署后Agent与未来.md)** - 运维与展望

---

### 📦 课程作业

**[作业说明](./homework/作业说明.md)** - 完整作业代码和说明（Week 1-8）

- Week 1: LLM Prompting Playground
- Week 2: Action Item Extractor
- Week 3: Build a Custom MCP Server
- Week 4: Claude Code Automations
- Week 5: Warp Agent Development
- Week 6: Scan and Fix Vulnerabilities
- Week 7: AI Code Review with Graphite
- Week 8: Multi-Stack Web App Build

---

### [01-Week 1-2: LLM基础与Agent架构](./01-Week1-2-LLM基础与Agent架构.md)
**第一至二周：建立AI辅助开发的理论基础**

**主要内容**：
- LLM 工作原理
- Prompt Engineering（提示工程）
- Agent 架构核心组件
- 工具调用与函数调用
- Model Context Protocol (MCP)
- Coding Agent 实战构建

**核心技能**：
- ✅ 设计高质量提示词
- ✅ 理解 Agent 工作原理
- ✅ 构建 MCP Server
- ✅ 开发简单的 Coding Agent

**作业**：
- Week 1: LLM Prompting Playground
- Week 2: Build a Custom MCP Server

---

### [02-Week 3-4: AI IDE与Agent管理](./02-Week3-4-AI-IDE与Agent管理.md)
**第三至四周：掌握AI工具和协作模式**

**主要内容**：
- AI IDE 深度解析（Claude Code、Cursor）
- 上下文管理策略
- AI 原生 PRD 撰写
- Agent 管理策略
- 人机协作平衡

**核心技能**：
- ✅ 熟练使用 Claude Code
- ✅ 管理项目上下文
- ✅ 撰写 AI 原生需求文档
- ✅ 设计多 Agent 协作系统

**嘉宾分享**：
- Boris Cherney (Anthropic) - Claude Code 的创造者

**作业**：
- Week 4: Coding with Claude Code

---

### [03-Week 5-8: 现代终端、测试与UI构建](./03-Week5-8-现代终端测试与UI构建.md)
**第五至八周：现代开发工具链与全栈开发**

**第五周：现代终端**
- AI 增强命令行工具（Warp）
- 终端自动化
- CLI 工具开发

**第六周：测试与安全**
- SAST/DAST 工具
- AI 生成测试用例
- Semgrep 安全扫描
- 安全编码最佳实践

**第七周：软件支持**
- AI 代码审查（Graphite）
- 智能文档生成
- 调试辅助
- 建立对 AI 代码的信任机制

**第八周：UI 构建**
- 从 Prompt 到完整应用
- Vercel AI SDK
- 快速原型开发

**核心技能**：
- ✅ 使用 AI 增强终端
- ✅ 编写安全的 AI 代码
- ✅ 建立代码审查流程
- ✅ 快速构建 Web 应用

**嘉宾分享**：
- Zach Lloyd (Warp)
- Isaac Evans (Semgrep)
- Tomas Reimers (Graphite)
- Gaspar Garcia (Vercel)

**作业**：
- Week 5: Agentic Development with Warp
- Week 6: Writing Secure AI Code
- Week 7: Code Review Reps
- Week 8: Multi-stack Web App Builds

---

### [04-Week 9-10: 部署后Agent与未来](./04-Week9-10-部署后Agent与未来.md)
**第九至十周：运维智能与未来展望**

**第九周：部署后的 Agent**
- 监控与可观测性
- 自动化事件响应
- AI 驱动的运维
- Resolve 平台

**第十周：AI 软件工程的未来**
- 软件开发者角色演变
- 未来十年的开发模式
- 行业趋势与投资方向
- 个人发展建议

**核心技能**：
- ✅ 设计部署后 Agent 系统
- ✅ 建立监控和告警机制
- ✅ 理解 AI 开发的未来趋势
- ✅ 规划个人职业发展

**嘉宾分享**：
- Mayank Agarwal & Milind Ganjoo (Resolve)
- Martin Casado (a16z)

---

## 🎯 课程核心知识点

### 技术技能
1. **Prompt Engineering** - 提示词设计与优化
2. **Agent Architecture** - 智能体架构设计
3. **MCP Protocol** - 模型上下文协议
4. **AI IDE** - AI 集成开发环境
5. **Security** - AI 时代的安全实践
6. **Testing** - AI 辅助测试策略
7. **DevOps** - AI 驱动的运维
8. **UI Generation** - 自动化界面构建

### 核心思想
1. **Human-Agent Engineering** - 人机协作工程，而非氛围式编程
2. **Context is King** - 上下文决定 AI 效果
3. **Trust but Verify** - 信任但验证
4. **Iterative Refinement** - 持续迭代优化

### 工具生态
- **开发**: Claude Code, Cursor, GitHub Copilot
- **终端**: Warp, Fig
- **安全**: Semgrep, Snyk
- **监控**: Prometheus, Grafana, Datadog
- **部署**: Vercel, Railway, Render

---

## 📖 学习路径建议

### 入门路径（适合初学者）
1. 阅读 `00-课程概览.md` 了解全局
2. 学习 `01-Week1-2` 掌握基础概念
3. 完成 Week 1-2 的作业
4. 逐步学习后续内容

### 实践路径（适合有经验的开发者）
1. 快速浏览所有文档了解知识点
2. 选择与自己工作相关的重点深入学习
3. 立即在真实项目中应用
4. 根据遇到的问题针对性学习

### 深度学习路径（适合研究者）
1. 系统学习所有文档
2. 完成所有作业和项目
3. 阅读推荐论文
4. 参与开源社区
5. 贡献新工具和框架

---

## 🔗 外部资源

### 官方资源
- **课程官网**: https://themodernsoftware.dev
- **作业仓库**: https://github.com/mihail911/modern-software-dev-assignments
- **斯坦福课程页**: https://bulletin.stanford.edu/courses/2274401

### 技术文档
- **MCP 协议**: https://modelcontextprotocol.io
- **Claude API**: https://docs.anthropic.com
- **Claude Code**: https://claude.ai/code

### 社区
- **GitHub**: https://github.com/topics/ai-development
- **Discord**: AI 开发者服务器
- **Reddit**: r/LocalLLaMA, r/artificial

---

## 💡 学习建议

### 学习原则
1. **动手实践** - 不要只读，要实际操作
2. **循序渐进** - 从简单任务开始
3. **持续迭代** - 不断优化和改进
4. **分享交流** - 与他人讨论和分享

### 学习工具
1. **建立 Prompt 库** - 积累有效提示词
2. **记录学习日志** - 追踪进度和心得
3. **创建作品集** - 展示项目成果
4. **参与社区** - 加入讨论和贡献

### 常见陷阱
- ❌ 只看不做
- ❌ 期望一次完美
- ❌ 忽视安全
- ❌ 过度依赖 AI
- ❌ 不验证结果

---

## 📊 课程统计

- **总周数**: 10 周
- **核心主题**: 8 大主题
- **实战作业**: 8 个项目
- **嘉宾分享**: 8 位行业专家
- **核心文档**: 5 份详细文档
- **总字数**: 约 50,000 字

---

## 🎓 学习成果

完成本课程后，你将能够：

1. ✅ 熟练使用 AI 辅助开发工具
2. ✅ 设计和构建 Coding Agent
3. ✅ 编写高质量的 Prompt
4. ✅ 建立安全的 AI 开发流程
5. ✅ 实现自动化测试和审查
6. ✅ 快速构建和部署应用
7. ✅ 理解 AI 开发的未来趋势
8. ✅ 规划个人职业发展路径

---

## 📝 反馈与贡献

如果你在学习过程中有任何问题、建议或想要贡献内容，欢迎：

1. 提交 Issue
2. 发起 Pull Request
3. 分享学习笔记
4. 推荐给其他学习者

---

## 📜 许可

本课程文档基于原课程内容整理，仅供学习交流使用。

---

**祝你在 AI 软件开发的旅程中取得成功！** 🚀
