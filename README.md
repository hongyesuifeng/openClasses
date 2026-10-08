# Perry 的综合学习项目

> 个性化学习框架 | AI Agent | 游戏引擎 | 论文研究

## 🎯 项目简介

这是一个系统化的个人学习项目，整合了课程学习、论文研究、源码分析和实践开发。项目采用个性化学习框架，支持智能学习路线推荐、进度追踪和知识管理。

仓库中的游戏 Demo 用于验证核心玩法、理解关键技术和总结开发方法。实验以回答具体学习问题为完成标准，成果以笔记、实验代码和可复用结论沉淀。实际游戏项目的开发、产品化和整合由其他项目承担。

slayDemo 的实际工程已迁移至独立 cocosProjects 仓库。本仓库保留[学习资料与项目复盘](domains/game-engine/godotProjects/slayDemo/README.md)，旧 Godot 运行工程已移出学习目录。

### 核心特色

- **🤖 Agent-Native 学习** - 将 AI Agent 作为学习第一公民
- **🗺️ 智能学习路线** - 基于个人画像的个性化学习路径
- **📊 进度可视化** - 完整的技能矩阵和进度追踪
- **🔗 知识网络** - 跨领域知识关联和应用

## 📚 学习领域

| 领域 | 学习情况 | 核心内容 |
|------|----------|----------|
| **AI Agent** | 档案记录基础课程已完成，进阶按实验验证 | CS146S、Hello-Agents、OpenClaw |
| **游戏引擎** | 原理学习与玩法复盘 | Cocos、Godot 源码与 slayDemo 学习资料 |
| **提示工程** | 档案记录已掌握，继续实践复核 | Prompt 设计与优化 |
| **论文研究** | 已有阅读材料与分析笔记，个人进度待登记 | AI Agent、游戏开发 AI |
| **软件工程** | 已有方法资料与实践样例 | 设计模式、架构、重构、评审与 AI 辅助开发 |
| **产品与用户洞察** | 已有研究方法与历史分析样例 | 用户研究、访谈、画像与 Steam 讨论分析 |

当前先进行[已有学习内容的系统复习](docs/general/2026-10-08-learning-review.md)，包含知识联系、实践经验、概念辨析及自测题。新学习计划将在明确新的学习目标后制定；此前的方案保留在[项目进展与候选计划](user-profile/progress/2026-10-08-project-review-and-next-plan.md)。

## 🗂️ 项目结构

```
openClasses/
├── 📁 README.md                        # 本文件 - 项目总览
├── 📁 PROJECT_STRUCTURE.md              # 详细结构规划
│
├── 📁 user-profile/                     # 用户学习画像系统
│   ├── learning-profile.md             # 个人学习档案
│   ├── skill-matrix.json              # 技能矩阵
│   └── progress/                      # 进度追踪
│
├── 📁 learning-routes/                 # 学习路线推荐系统
│   ├── topic-index/                   # 主题学习路线
│   │   ├── ai-agents.md              # AI Agent路线
│   │   ├── game-engine.md            # 游戏引擎路线
│   │   └── ...
│   ├── cross-domain/                  # 跨领域组合路线
│   └── README.md                      # 使用指南
│
├── 📁 courses/                         # 课程学习
│   ├── CS146S-The-Modern-Software-Developer/  # 档案记录已完成
│   ├── Hello-Agents/                  # 档案记录已完成
│   ├── OpenClaw/                      # AI Agent课程
│   ├── cocos-engine/                  # Cocos源码
│   └── godot/                         # Godot源码
│
├── 📁 docs/                            # 综合指南文档
│   ├── INDEX.md                       # 文档快速索引
│   ├── LEARNING_OPTIMIZATION_PRINCIPLES.md  # 学习优化准则
│   ├── cocos-source-learning/         # Cocos源码学习
│   ├── godot-source-learning/         # Godot源码学习
│   └── ...
│
├── 📁 papers/                          # 论文研究
│   ├── 2025_AI_Agent_Index/           # AI Agent索引
│   └── GameDevBench/                  # 游戏开发AI基准
│
├── 📁 templates/                       # 模板系统
│   ├── course-template.md             # 课程模板
│   └── weekly-template.md             # 周计划模板
│
└── 📁 .claude/                         # Claude Code 配置
    ├── commands/                      # 自定义命令
    └── skills/                        # 自定义技能
```

> 📖 详见：[完整项目结构规划](PROJECT_STRUCTURE.md)

## 🚀 快速开始

### 获取学习路线

使用 Claude Code 命令快速获取个性化学习路线：

```bash
# 获取 AI Agent 学习路线
/topic-route AI Agent

# 获取游戏引擎学习路线
/topic-route 游戏引擎

# 获取跨领域组合路线
/topic-route 游戏AI
```

### 生成学习计划

```bash
# 生成本月学习计划
/learning-plan medium

# 生成本周学习计划
/learning-plan short
```

### 优化学习方法

```bash
# 获取学习优化建议
/learning-optimizer
```

## 📖 推荐学习路径

### 路径1: AI Agent 开发者

```
CS146S → Hello-Agents → OpenClaw → 实践项目
   ↓           ↓            ↓
LLM基础    Agent架构    Agent应用
```

**预计时长**: 12周 | **难度**: ⭐⭐⭐⭐

### 路径2: 游戏引擎工程师

```
Cocos架构 → 源码阅读 → Godot对比 → 实践项目
     ↓          ↓         ↓
  核心系统    渲染管线   引擎扩展
```

**预计时长**: 16周 | **难度**: ⭐⭐⭐⭐⭐

### 路径3: 游戏 AI 创作者

```
游戏引擎基础 + AI Agent技术 → 游戏 AI 项目
            ↓
      智能NPC系统
```

**预计时长**: 20周 | **难度**: ⭐⭐⭐⭐⭐

## 🛠️ Claude Code 集成

本项目深度集成 Claude Code，提供以下能力：

### 自定义命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `/topic-route` | 主题学习路线生成 | `/topic-rule 提示工程` |
| `/learning-plan` | 个性化学习计划 | `/learning-plan medium` |
| `/course-summary` | 课程内容总结 | 自动生成 |

### 自定义技能

| 技能 | 功能 |
|------|------|
| `learning-path-generator` | 智能学习路径生成 |
| `learning-optimizer` | 学习方法优化建议 |

### MCP 服务器集成

已配置 5 个免 API 密钥的 MCP 服务器：
- 📁 **Filesystem** - 文件操作管理
- 🌐 **Fetch** - 网页内容抓取
- 🧠 **Memory** - 知识图谱管理
- ⏰ **Time** - 时间工具
- 📄 **PDF Reader** - PDF 文档读取

## 📊 学习进度

### 技能矩阵

以下评分沿用 2026-04-17 的技能档案，尚未通过新的实验重新评定。

| 技能 | 当前水平 | 目标水平 |
|------|----------|----------|
| 提示工程 | ⭐⭐⭐⭐⭐ (5/5) | ⭐⭐⭐⭐⭐ (5/5) |
| Python | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐⭐ (5/5) |
| TypeScript | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐ (4/5) |
| LLM 基础 | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐ (4/5) |
| Agent 架构 | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐ (4/5) |
| 游戏引擎 | ⭐⭐ (2/5) | ⭐⭐⭐⭐ (4/5) |

### 课程与实验记录

- **CS146S、Hello-Agents、Prompt 设计与优化**：学习档案记录已完成。
- **OpenClaw**：档案记录进行中，具体章节与实践结果待补记。
- **Cocos / Godot 源码学习**：已有学习指南，按选定主题补充阅读与验证记录。
- **slayDemo**：保留核心玩法、技术方法和项目复盘；实际游戏工程已迁移到独立 cocosProjects 仓库。

## 🎯 学习目标

### 短期目标 (1-2月)
- [ ] 盘点已完成课程的知识与验证依据
- [ ] 完成一个围绕具体问题的最小学习实验
- [ ] 记录实验结果、局限与下一步问题

### 中期目标 (3-6月)
- [ ] 深入理解渲染管线
- [ ] 研究智能 NPC 的决策、记忆和评估机制
- [ ] 完成一篇论文的复现

### 长期目标 (6月+)
- [ ] 成为游戏 AI 领域的专家
- [ ] 将经过验证的学习成果供独立游戏项目采用
- [ ] 贡献开源项目

## 📚 核心资源

### 必读文档
- [文档快速索引](docs/INDEX.md) - 快速定位任何资源
- [学习优化准则](docs/general/LEARNING_OPTIMIZATION_PRINCIPLES.md) - 基于 DeepTutor 的学习方法论
- [项目结构规划](PROJECT_STRUCTURE.md) - 完整的项目组织说明

### 学习框架
- [个性化学习框架指南](learning-routes/README.md)
- [用户学习档案](user-profile/learning-profile.md)

## 💡 学习原则

基于 [DeepTutor](https://github.com/HKUDS/DeepTutor) 项目提炼的优化原则：

1. **Agent-Native 学习** - 将 AI Agent 作为学习的第一公民
2. **统一上下文管理** - 所有学习活动共享统一上下文
3. **多模式学习流** - 根据目标灵活切换学习模式
4. **持久化记忆系统** - 维护学习摘要和画像
5. **工具与工作流解耦** - 自由组合学习工具

## 📝 笔记规范

- 使用 Markdown 格式
- 代码块标注语言
- 重点内容用引用块标记
- 定期整理和回顾

## 🔗 相关链接

- [Claude Code](https://code.anthropic.com) - AI 编程助手
- [DeepTutor](https://github.com/HKUDS/DeepTutor) - 学习优化参考项目

---

**开始时间**: 2025-12-30
**最后更新**: 2026-10-08
**维护者**: Perry

**📊 数据统计**:
- 课程数量: 5+
- 论文数量: 2+
- 文档数量: 100+
- 学习时长: ~100小时
