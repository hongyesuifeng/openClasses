# OpenClaw（小龙虾）学习课程资料

> 基于 [李宏毅教授 OpenClaw 原理拆解教程](https://www.bilibili.com/video/BV1rAPfzFEYi/) 整理

## 课程概述

**OpenClaw**（代号"小龙虾"）是 2026 年最火的开源 AI Agent 框架，由奥地利开发者 Peter Steinberger 发起。它是一个**本地优先的 AI 执行框架**，让 AI 能够"看见"屏幕、"操作"电脑，完成各种复杂任务。

### 为什么学习 OpenClaw？

| 特性 | 描述 |
|-----|------|
| 🔓 **开源免费** | MIT 协议，可自行部署和二次开发 |
| 🏠 **本地优先** | 数据安全可控，保护隐私 |
| 🔧 **真执行能力** | 不仅是对话工具，能直接执行实际任务 |
| 🔌 **多平台接入** | 微信、QQ、钉钉、飞书、Telegram、Discord 等 |
| 🤖 **多模型支持** | Claude、GPT、DeepSeek、Ollama 等 |

---

## 课程结构

```
OpenClaw/
├── README.md                 # 课程总览（本文件）
├── 01-foundation/           # 第一阶段：基础入门
│   ├── 01-ai-agent-overview.md
│   ├── 02-openclaw-intro.md
│   └── 03-llm-basics.md
├── 02-principles/           # 第二阶段：核心原理
│   ├── 01-transformer.md
│   ├── 02-training-methods.md
│   ├── 03-inference-process.md
│   └── 04-tool-calling.md
├── 03-deployment/           # 第三阶段：部署实践
│   ├── 01-local-deployment.md
│   ├── 02-cloud-deployment.md
│   └── 03-platform-integration.md
├── 04-skill-development/    # 第四阶段：Skill 开发
│   ├── 01-skill-basics.md
│   ├── 02-skill-advanced.md
│   └── 03-skill-examples.md
├── 05-advanced/             # 第五阶段：进阶专题
│   ├── 01-model-editing.md
│   ├── 02-model-merging.md
│   ├── 03-deepseek-reasoning.md
│   └── 04-memory-system.md
├── 06-projects/             # 第六阶段：实战项目
│   ├── 01-personal-assistant.md
│   └── 02-business-scenarios.md
└── resources/               # 资源汇总
    ├── references.md
    └── faq.md
```

---

## 学习路线图

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenClaw 学习路线图                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  阶段一：基础入门（1-2 周）                                        │
│  ├── AI Agent 概念与发展                                         │
│  ├── OpenClaw 项目介绍                                           │
│  └── 大语言模型基础                                               │
│              ↓                                                  │
│  阶段二：核心原理（2-3 周）                                        │
│  ├── Transformer 架构详解                                        │
│  ├── 模型训练方法（预训练-对齐）                                    │
│  ├── 推理过程与后训练                                             │
│  └── 工具调用机制（ReAct 范式）                                    │
│              ↓                                                  │
│  阶段三：部署实践（1-2 周）                                        │
│  ├── 本地环境搭建                                                │
│  ├── 云服务器部署                                                │
│  └── 多平台接入（微信/飞书/钉钉）                                   │
│              ↓                                                  │
│  阶段四：Skill 开发（2-3 周）                                      │
│  ├── Skill 基础概念                                              │
│  ├── SKILL.md 编写规范                                           │
│  └── 实战：开发自定义 Skill                                       │
│              ↓                                                  │
│  阶段五：进阶专题（2 周）                                          │
│  ├── Model Editing 技术                                          │
│  ├── Model Merging 技术                                          │
│  ├── DeepSeek 深度思考原理                                        │
│  └── 记忆系统设计                                                │
│              ↓                                                  │
│  阶段六：实战项目（持续）                                          │
│  ├── 个人 AI 助手搭建                                             │
│  └── 企业场景应用                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 课程章节对应

| 章节 | 视频内容 | 时长 | 学习文档 |
|------|---------|------|---------|
| 第一讲 | 小龙虾（OpenClaw）原理拆解 | 01:23:14 | [01-foundation/02-openclaw-intro.md](01-foundation/02-openclaw-intro.md) |
| 第二讲 | 生成式人工智能的技术突破与未来发展 | 01:24:21 | [01-foundation/01-ai-agent-overview.md](01-foundation/01-ai-agent-overview.md) |
| 第三讲 | AI Agent 的原理 | 01:42:00 | [02-principles/04-tool-calling.md](02-principles/04-tool-calling.md) |
| 第四讲 | 语言模型内部运作机制剖析 | 01:49:52 | [02-principles/01-transformer.md](02-principles/01-transformer.md) |
| 第五讲 | Transformer 架构详解 | 01:22:42 | [02-principles/01-transformer.md](02-principles/01-transformer.md) |
| 第六讲 | 大型语言模型训练方法「预训练–对齐」 | 01:19:55 | [02-principles/02-training-methods.md](02-principles/02-training-methods.md) |
| 第七讲 | 生成式人工智能的后训练与遗忘问题 | 01:15:32 | [02-principles/02-training-methods.md](02-principles/02-training-methods.md) |
| 第八讲 | DeepSeek 深度思考原理 | 01:18:30 | [05-advanced/03-deepseek-reasoning.md](05-advanced/03-deepseek-reasoning.md) |
| 第九讲 | 大型语言模型的推理过程 | 24:22 | [02-principles/03-inference-process.md](02-principles/03-inference-process.md) |
| 第十讲 | 大型语言模型评估 | 24:03 | [02-principles/03-inference-process.md](02-principles/03-inference-process.md) |
| 第十一讲 | Model Editing | 44:56 | [05-advanced/01-model-editing.md](05-advanced/01-model-editing.md) |
| 第十二讲 | Model Merging 技术 | 34:20 | [05-advanced/02-model-merging.md](05-advanced/02-model-merging.md) |
| 第十三讲 | 语言模型如何学会说话 | 01:31:19 | [01-foundation/03-llm-basics.md](01-foundation/03-llm-basics.md) |

---

## 学习建议

### 适合人群
- 对 AI Agent 感兴趣的开发者
- 想搭建个人 AI 助手的技术爱好者
- 企业智能化转型负责人
- AI 产品经理

### 前置知识
- 基础编程能力（Python/JavaScript）
- 了解基本的机器学习概念
- 熟悉命令行操作

### 学习时间规划
- **快速入门**：2-3 周（阶段一 + 阶段三）
- **深入理解**：4-6 周（阶段二 + 阶段四）
- **精通掌握**：8-12 周（全部阶段 + 实战项目）

---

## 快速开始

```bash
# 1. 克隆 OpenClaw 项目
git clone https://github.com/clawdbot/openclaw.git

# 2. 安装依赖
cd openclaw
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key

# 4. 启动服务
npm start
```

---

## 相关资源

- 📺 [B站视频教程](https://www.bilibili.com/video/BV1rAPfzFEYi/)
- 📚 [OpenClaw 中文文档](https://github.com/yeuxuan/openclaw-docs)
- 🎓 [DataWhale 学习教程](https://github.com/datawhalechina/hello-claw)
- 💬 [GitHub Discussions](https://github.com/clawdbot/openclaw/discussions)

---

## 快速导航

| 需求 | 文档 |
|------|------|
| 📊 追踪学习进度 | [PROGRESS.md](PROGRESS.md) |
| ⚡ 速查表 | [resources/cheatsheet.md](resources/cheatsheet.md) |
| ❓ 常见问题 | [resources/faq.md](resources/faq.md) |
| 📚 资源汇总 | [resources/references.md](resources/references.md) |

---

## 学习目标

完成本课程后，你将能够：

1. **理解核心原理**
   - 大语言模型的工作机制
   - AI Agent 的设计理念
   - 工具调用和 ReAct 范式

2. **掌握实践技能**
   - 本地/云端部署 OpenClaw
   - 开发自定义 Skill
   - 多平台接入配置

3. **独立完成项目**
   - 搭建个人 AI 助手
   - 设计企业级应用
   - 甚至构建自己的开源 Agent 项目

---

## 贡献

本课程资料持续更新中，欢迎提交 Issue 和 PR 完善内容。

---

*最后更新：2026年4月*
