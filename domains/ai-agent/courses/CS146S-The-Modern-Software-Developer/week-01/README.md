# Week 1: Introduction to Coding LLMs and AI Development

> **第 1 周：大型语言模型编程与 AI 开发导论**
> **日期**: 2025年9月22日 - 9月26日
> **主题**: LLM Prompting Playground - 核心提示词技术
> **作业**: LLM Prompting Playground

---

## 📚 本周概览

第 1 周是 CS146S 的开篇，旨在建立对 AI 辅助开发的基础理解。本周将深入探讨：

1. **LLM 的本质** - 什么是大语言模型，它是如何工作的
2. **有效提示** - 如何设计高质量的提示词
3. **核心提示技术** - 掌握 6 种关键提示方法
4. **实战练习** - 通过动手实验巩固理论

---

## 🎯 学习目标

完成本周学习后，你应该能够：

- ✅ 理解 LLM 的基本工作原理
- ✅ 掌握多种提示工程技术（K-shot、CoT、Tool Calling 等）
- ✅ 能够使用 Ollama 运行本地 LLM
- ✅ 实践 6 种不同的提示模式
- ✅ 理解每种技术的适用场景

---

## 📖 本周内容

### 课程安排

#### Mon 9/22: Introduction and how an LLM is made
- **形式**: 讲座 + Slides
- **内容**: LLM 的基本原理和构建过程
- **核心问题**: "什么是 LLM 真正"

#### Fri 9/26: Power prompting for LLMs
- **形式**: 讲座 + Slides
- **内容**: 高级提示工程技术
- **核心技能**: "如何有效地提示"

---

## 📋 Readings 本周阅读

本周的阅读材料深入探讨 LLM 和提示工程：

### 必读材料

1. **Deep Dive into LLMs** (深入探讨大型语言模型)
   - 文件: `readings/01-deep-dive-into-llms.md`
   - 内容: LLM 的架构、训练过程、能力边界

2. **Prompt Engineering Overview** (提示工程概述)
   - 文件: `readings/02-prompt-engineering-overview.md`
   - 内容: 提示工程的基本原则和最佳实践

3. **Prompt Engineering Guide** (提示工程指南)
   - 文件: `readings/03-prompt-engineering-guide.md`
   - 内容: 实用的提示设计技巧和模板

4. **AI Prompt Engineering: A Deep Dive** (人工智能提示工程：深度解析)
   - 文件: `readings/04-ai-prompt-engineering-deep-dive.md`
   - 内容: 高级提示策略和案例分析

5. **How OpenAI Uses Codex** (OpenAI 如何使用 Codex)
   - 文件: `readings/05-how-openai-uses-codex.md`
   - 内容: OpenAI 在代码生成中的实践经验

### 阅读建议
- 📖 **阅读顺序**: 按编号顺序阅读，逐步深入
- ⏱️ **预计时间**: 6-8 小时
- 💡 **重点**: 在阅读时思考每种技术如何应用于实际编程场景

---

## 💻 本周作业: LLM Prompting Playground

### 作业目标

通过实践 6 种核心提示技术，建立对 LLM 能力的直观理解。

### 技术要求

- **Python 版本**: 3.12
- **本地 LLM**: Ollama
  - 模型: `mistral-nemo:12b` 或 `llama3.1:8b`
- **开发环境**: 任何 Python IDE

### 六大提示技术

#### 1. K-shot Prompting (K 样本提示)
- **文件**: `k_shot_prompting.py`
- **概念**: 通过提供 K 个示例来引导 LLM
- **应用**: 分类、格式转换、模式识别

**示例场景**:
```
示例 1: 输入 "I love this product" → 输出 "Positive"
示例 2: 输入 "This is terrible" → 输出 "Negative"

现在: 输入 "{user_input}" → 输出 ?
```

#### 2. Chain-of-Thought (思维链)
- **文件**: `chain_of_thought.py`
- **概念**: 引导 LLM 展示推理过程
- **应用**: 数学问题、逻辑推理、复杂决策

**示例模板**:
```
请按以下步骤思考：
1. 理解问题的核心
2. 列出关键信息
3. 分析可能的解决方案
4. 选择最优方案并说明理由
5. 给出最终答案
```

#### 3. Tool Calling (工具调用)
- **文件**: `tool_calling.py`
- **概念**: LLM 调用外部工具/API
- **应用**: 查询数据库、调用 API、执行代码

**架构**:
```
LLM 分析请求 → 决定需要调用哪个工具 → 生成工具调用参数
→ 执行工具 → 将结果返回给 LLM → 生成最终响应
```

#### 4. Self-Consistency Prompting (自一致性提示)
- **文件**: `self_consistency_prompting.py`
- **概念**: 多次采样并通过投票选择最一致的答案
- **应用**: 减少幻觉、提高答案可靠性

**流程**:
1. 对同一问题生成多个推理路径
2. 每个路径独立得出答案
3. 通过投票选择最频繁的答案

#### 5. RAG - Retrieval-Augmented Generation (检索增强生成)
- **文件**: `rag.py`
- **概念**: 结合外部知识库增强生成
- **应用**: 问答系统、文档分析、知识检索

**架构**:
```
用户查询 → 检索相关文档 → 将文档作为上下文
→ LLM 基于上下文生成答案 → 返回结果
```

#### 6. Reflexion (反思)
- **文件**: `reflexion.py`
- **概念**: 通过自我反思迭代改进答案
- **应用**: 代码生成、问题求解、写作改进

**循环**:
```
生成答案 → 自我评估 → 识别问题
→ 生成改进建议 → 重新生成 → 循环直到满意
```

### 评分标准

- **总分**: 60 分
- **每项技术**: 10 分
- **评分维度**:
  - 实现正确性 (5 分)
  - 代码质量 (3 分)
  - 文档说明 (2 分)

### 提交要求

1. **代码文件**: 6 个 Python 文件
2. **README.md**: 说明每个技术的实现和使用方法
3. **实验报告**: 记录每种技术的实验结果和观察

---

## 🛠️ 环境设置

### 安装 Ollama

#### macOS / Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Windows
下载安装程序: https://ollama.com/download

### 拉取模型

```bash
# 推荐模型
ollama pull mistral-nemo:12b
ollama pull llama3.1:8b

# 测试运行
ollama run mistral-nemo:12b "Hello, how are you?"
```

### Python 依赖

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install ollama openai anthropic
```

---

## 💡 核心概念

### 什么是 LLM？

**LLM (Large Language Model)** 是基于深度学习的语言模型，通过在大规模文本数据上预训练，学习语言的统计规律和语义关联。

**关键特性**:
- 🧠 **自回归生成**: 基于上下文逐个 token 生成
- 👁️ **注意力机制**: 捕捉长距离依赖关系
- 📦 **上下文窗口**: 能处理的最大输入长度
- 🎯 **零样本/少样本**: 无需或仅需少量示例即可完成任务

### 为什么 Prompt Engineering 重要？

**核心原因**:
1. **LLM 是概率模型** - 同一请求可能产生不同输出
2. **上下文敏感** - 提供的上下文直接影响质量
3. **能力边界** - 需要合理引导才能发挥最大潜力

**提示工程的目标**:
- ✅ 提供清晰指令
- ✅ 给出足够上下文
- ✅ 引导正确推理路径
- ✅ 减少幻觉和错误

---

## 🎓 学习策略

### 推荐学习流程

1. **预习阶段** (2-3 小时)
   - 快速浏览所有 readings
   - 标记不理解的概念
   - 准备问题清单

2. **课堂参与** (2 小时)
   - 周一讲座: LLM 原理
   - 周五讲座: 提示工程
   - 积极提问和讨论

3. **实践阶段** (6-8 小时)
   - 按顺序实现 6 种技术
   - 每种技术都进行充分测试
   - 记录实验结果和观察

4. **反思总结** (1-2 小时)
   - 总结每种技术的适用场景
   - 比较不同技术的优缺点
   - 思考如何应用于实际项目

### 学习技巧

- 🔄 **迭代实验**: 不要期望一次得到完美结果
- 📝 **详细记录**: 记录每次尝试的参数和结果
- 🤔 **对比分析**: 比较不同提示词的效果差异
- 🎯 **场景化**: 思考每种技术在什么场景下最有效

---

## 🔗 资源链接

### 官方资源
- [课程官网](https://themodernsoftware.dev/)
- [作业仓库](https://github.com/mihail911/modern-software-dev-assignments)
- [Ollama 文档](https://ollama.com/docs)

### 推荐阅读
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Anthropic Prompt Library](https://docs.anthropic.com/claude/prompt-library)

### 工具
- [Ollama](https://ollama.com/)
- [OpenAI Playground](https://platform.openai.com/playground)
- [Anthropic Console](https://console.anthropic.com/)

---

## ❓ 常见问题

### Q1: 为什么要用本地 LLM 而不是 API？

**A**: 本地 LLM 提供以下优势：
- 💰 **成本**: 无 API 调用费用
- 🔒 **隐私**: 数据不离开本地机器
- 🎮 **自由**: 可以自由实验和调试
- 📚 **学习**: 更深入理解 LLM 工作原理

### Q2: 如果我的机器性能不足怎么办？

**A**: 几种解决方案：
- 使用更小的模型（如 `llama3.1:8b`）
- 使用云服务（如 Google Colab）
- 借用性能更好的机器
- 与同学组队共享资源

### Q3: 如何判断哪种提示技术最适合我的任务？

**A**: 决策树：
```
需要外部信息？
├─ 是 → RAG
└─ 否
    ├─ 需要多步推理？
    │   ├─ 是 → Chain-of-Thought + Self-Consistency
    │   └─ 否
    │       ├─ 有标准格式？
    │       │   ├─ 是 → K-shot Prompting
    │       │   └─ 否 → Simple Prompt
    └─ 需要执行操作？
        └─ 是 → Tool Calling
    └─ 需要迭代改进？
        └─ 是 → Reflexion
```

### Q4: 提示词需要多长？

**A**: 取决于任务复杂度：
- **简单任务**: 1-2 句话即可
- **中等任务**: 5-10 句话，包含示例
- **复杂任务**: 完整的结构化文档，包含背景、要求、示例、约束

**原则**: 清晰 > 简洁，但也避免冗余

---

## 📊 本周检查清单

### 课前准备
- [ ] 安装 Ollama
- [ ] 拉取至少一个 LLM 模型
- [ ] 设置 Python 开发环境
- [ ] 阅读完所有 readings

### 课后实践
- [ ] 实现 K-shot Prompting
- [ ] 实现 Chain-of-Thought
- [ ] 实现 Tool Calling
- [ ] 实现 Self-Consistency Prompting
- [ ] 实现 RAG
- [ ] 实现 Reflexion
- [ ] 完成 README.md
- [ ] 完成实验报告

### 自我评估
- [ ] 理解 LLM 的基本原理
- [ ] 能够独立选择合适的提示技术
- [ ] 能够设计有效的提示词
- [ ] 能够分析提示效果并进行优化

---

## 🚀 下周预告

**Week 2: The Anatomy of Coding Agents**
- 🤖 探索编码代理的架构
- 🔧 实现一个完整的 LLM 应用
- 🎯 学习如何在实际项目中集成 LLM

**准备工作**:
- 熟悉 FastAPI 框架
- 了解基本的数据库操作
- 复习本周的提示技术

---

**祝学习愉快！记住：实践是掌握提示工程的唯一途径。** 🎉
