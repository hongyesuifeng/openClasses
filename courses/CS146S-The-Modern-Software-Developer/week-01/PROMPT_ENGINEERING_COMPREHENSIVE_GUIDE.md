# 提示词工程完整指南：游戏客户端开发实战

> **游戏开发提示词工程专项指南**
> **版本**: v3.0
> **更新日期**: 2026-01-25
> **面向**: 游戏客户端开发者与 AI 辅助编程工程师
> **重点**: Unity、Unreal Engine、Cocos Creator 开发场景

---

## 📚 目录

1. [提示词工程概述](#1-提示词工程概述)
2. [核心提示词技术与模式](#2-核心提示词技术与模式)
3. [高级提示词技术](#3-高级提示词技术)
4. [游戏开发专项技术](#4-游戏开发专项技术) 🆕
5. [实战案例深度解析](#5-实战案例深度解析)
6. [技术原理深度剖析](#6-技术原理深度剖析)
7. [行业工具与生态](#7-行业工具与生态)
8. [代码生成与审查专项](#8-代码生成与审查专项) 🆕
9. [最佳实践与设计模式](#9-最佳实践与设计模式)
10. [未来趋势与发展方向](#10-未来趋势与发展方向)
11. [参考资料](#11-参考资料) 🆕

---

## 1. 提示词工程概述

### 1.1 什么是提示词工程？

**定义**：

提示词工程（Prompt Engineering）是一门设计和优化输入提示词（prompts）以引导大型语言模型（LLM）生成高质量、准确输出的技术与艺术。

**核心公式**：

```
高质量输出 = f(清晰指令 + 充分上下文 + 合适示例 + 有效约束)
```

### 1.2 为什么需要提示词工程？

**LLM 的本质特性**：

1. **概率模型**：同一输入可能产生不同输出
2. **上下文敏感**：输出高度依赖提供的上下文
3. **知识边界**：受限于训练数据和时间
4. **指令遵循**：需要明确的指令才能准确执行任务

**提示词工程的价值**：

```
无提示词工程:
输入: "写个函数"
输出: 可能是任何语言、任何功能的函数

有提示词工程:
输入: "用 Python 写一个函数，接收整数列表，返回第二大数字"
输出: 精确的 Python 函数实现
```

### 1.3 提示词工程的发展历程

```
2020年: GPT-3 发布，Zero-shot/Few-shot 学习
2021年: 提示词工程概念正式提出
2022年: Chain-of-Thought 推理技术突破
2023年: Agent、RAG、Tool Calling 兴起
2024年: 结构化提示、提示词管理系统成熟
2025年: 自适应提示、多模态提示成为主流
```

---

## 2. 核心提示词技术与模式

### 2.1 基础提示模式

#### 2.1.1 Zero-Shot Prompting（零样本提示）

**定义**：不提供示例，直接给出任务指令。

**模板**：

```
[角色设定]
你是一位资深的 Python 开发者

[任务描述]
请编写一个函数，实现以下功能：
- 输入：整数列表
- 输出：列表中的第二大数字
- 处理边界情况

[输出要求]
- 使用 Python 3.12+
- 包含类型注解
- 添加文档字符串
```

**适用场景**：

- 简单、明确的任务
- 模型已经"理解"的任务类型
- 快速原型开发

**局限性**：

- 复杂任务效果不稳定
- 可能产生格式不一致的输出
- 缺少参考标准

#### 2.1.2 Few-Shot Prompting（少样本提示）

**定义**：提供 K 个示例（通常 3-10 个）引导模型理解任务。

**模板**：

```
任务：游戏代码引擎识别

示例 1:
输入: "public class Player : MonoBehaviour {}"
输出: Unity C#

示例 2:
输入: "export class Player extends cc.Component {}"
输出: Cocos Creator TypeScript

示例 3:
输入: "UCLASS() class APLAYER_API APlayer : public ACharacter {}"
输出: Unreal Engine C++

示例 4:
输入: "class Player < GodotObject {}"
输出: Godot GDScript

现在：
输入: "{用户代码片段}"
输出:
```

**优化技巧**：

1. **示例选择**：选择覆盖各种情况的代表性示例
2. **示例顺序**：将最相关的示例放在最后（近因效应）
3. **示例多样性**：避免示例之间过于相似
4. **示例质量**：示例应该清晰、无歧义

**高级技巧：动态示例选择**

```python
def select_examples(query, example_pool, k=5):
    """
    根据查询动态选择最相关的示例
    """
    # 1. 计算查询与每个示例的相似度
    query_emb = embed(query)
    similarities = []
    for ex in example_pool:
        ex_emb = embed(ex['input'])
        sim = cosine_similarity(query_emb, ex_emb)
        similarities.append((ex, sim))

    # 2. 选择相似度最高的 K 个示例
    similarities.sort(key=lambda x: x[1], reverse=True)
    return [ex for ex, _ in similarities[:k]]
```

#### 2.1.3 角色设定（Role Playing）

**定义**：为 LLM 分配特定角色，引导其采用相应的专业视角和语言风格。

**常用角色模板**：

**Unity 游戏开发专家**：

```
你是一位资深的 Unity 游戏开发工程师，有 8 年以上 Unity 开发经验。

你的专长包括：
- C# 高级编程（异步编程、内存管理、性能优化）
- Unity 渲染管线（Built-in、URP、HDRP）
- Unity DOTS 技术栈（ECS、Job System、Burst Compiler）
- 移动端优化（DrawCall 优化、内存优化、帧率优化）
- Unity 网络同步方案（Mirror、Fish-Net、Photon）

请以专业的角度回答以下问题，并提供：
1. 问题分析
2. Unity 最佳实践方案
3. 性能考量
4. 代码示例
```

**Unreal Engine 专家**：

```
你是一位 Epic Games 认证的 Unreal Engine 专家。

你的专长包括：
- C++ 和蓝图协作开发
- UE5 渲染特性（Nanite、Lumen）
- Gameplay Ability System (GAS)
- UE 网络架构（Replication、RPC）
- 虚幻编辑器扩展开发

请以专业的角度回答以下问题，并提供：
1. UE 最佳实践方案
2. C++ 与蓝图混合开发建议
3. 性能优化方案
4. 代码示例
```

**游戏客户端架构师**：

```
你是一位游戏客户端架构师，曾主导多款 MMORPG/手游的客户端架构设计。

你的专长包括：
- 游戏架构设计（MVC、ECS、MVVM）
- 热更新方案设计
- 资源管理策略
- 性能监控与优化
- 跨平台适配（iOS/Android/PC）

请以专业的角度回答以下问题，并提供：
1. 架构设计方案
2. 技术选型建议
3. 扩展性考虑
4. 实施路线图
```

**代码审查者角色**：

```
你是一位严格的游戏代码审查者，
关注代码质量、安全性、性能和可维护性。

审查时你会检查：
1. 是否符合 SOLID 原则
2. 是否有内存泄漏风险
3. 是否有性能问题（如每帧分配、GC 压力）
4. 是否易于测试和维护
5. 代码风格是否一致

请审查以下代码，并提供：
- 问题清单
- 严重程度评级
- 改进建议
- 重构示例
```

#### 2.1.4 任务分解（Task Decomposition）

**定义**：将复杂任务分解为多个子任务，逐步完成。

**模板**：

```
请按以下步骤完成任务：

### 步骤 1: 需求分析
- 理解任务目标
- 识别关键要素
- 列出约束条件

### 步骤 2: 方案设计
- 分析可能的解决方案
- 评估优劣
- 选择最优方案

### 步骤 3: 详细设计
- 设计数据结构
- 设计算法流程
- 考虑边界情况

### 步骤 4: 代码实现
- 编写核心逻辑
- 添加错误处理
- 编写注释

### 步骤 5: 测试验证
- 设计测试用例
- 执行测试
- 验证结果

现在开始执行步骤 1...
```

### 2.2 结构化提示模式

#### 2.2.1 CO-STAR 框架

**CO-STAR** 是一个广泛使用的提示词结构框架：

```
**C**ontext (背景)
- 项目背景
- 目标用户
- 使用场景

**O**bjective (目标)
- 要完成什么任务
- 期望的结果
- 成功标准

**S**tyle (风格)
- 输出风格
- 语言风格
- 格式要求

**T**one (语气)
- 正式/非正式
- 专业/友好
- 其他语气特征

**A**udience (受众)
- 谁将看到输出
- 受众的背景知识
- 受众的期望

**R**esponse (响应)
- 输出格式
- 内容要求
- 约束条件
```

**示例**：

```
# Context
我们正在开发一个 MMORPG 游戏，使用 Unity/C#，需要设计一个公会系统。

# Objective
设计公会系统的核心架构，包括创建、加入、管理、解散等功能。

# Style
输出 C# 代码，包含接口定义、类结构、数据模型。

# Tone
技术设计文档风格，专业且考虑扩展性。

# Audience
面向游戏服务端和客户端开发团队。

# Response
提供：
1. 系统架构图（文字描述）
2. 核心类定义
3. 数据模型设计
4. 网络同步方案
5. UI 交互流程
```

#### 2.2.2 CREATE 框架

另一个实用的框架：

```
**C**haracter (角色/人设)
**R**equest (具体请求)
**E**xamples (示例)
**A**dditions (补充信息)
**T**one (语气)
**E**xtras (额外要求)
```

### 2.3 输出控制模式

#### 2.3.1 格式约束

**JSON 输出**（游戏代码分析场景）：

```
请以 JSON 格式输出代码分析结果，包含以下字段：
{
  "analysis_result": {
    "code_quality": "B+",
    "issues": [
      {
        "type": "performance",
        "severity": "high",
        "file": "PlayerController.cs",
        "line": 142,
        "description": "每帧在 Update() 中进行字符串拼接",
        "fix": "使用 StringBuilder 或缓存字符串"
      }
    ],
    "metrics": {
      "cyclomatic_complexity": 18,
      "maintainability_index": 65
    },
    "recommendations": ["考虑使用对象池优化"]
  }
}

只输出 JSON，不要包含其他文本。
```

**代码输出**：

```
请输出完整的 Unity C# 代码，格式要求：
1. 使用 ```csharp 代码块
2. 包含必要的 using 语句
3. 添加类型注解
4. 添加 XML 文档注释
5. 遵循 Unity 命名规范
6. 不包含任何解释文本，只输出代码
```

**Markdown 输出**（游戏技术文档）：

```
请以 Markdown 格式输出游戏技术文档，包括：
- 一级标题：系统名称
- 二级标题：架构设计、核心类、使用示例
- 三级标题：子功能说明
- 使用 C# 代码块、Mermaid 流程图等格式化内容
```

#### 2.3.2 长度控制

```
请将回答限制在 200 字以内。

或：

请提供详细说明，至少 500 字，包括：
- 背景介绍
- 详细步骤
- 示例代码
- 注意事项
```

#### 2.3.3 约束条件

```
约束条件：
1. 不要使用任何第三方库
2. 时间复杂度不超过 O(n log n)
3. 空间复杂度不超过 O(n)
4. 代码必须兼容 Python 3.8+
5. 不能使用 eval() 或 exec()
```

---

## 3. 高级提示词技术

### 3.1 Chain-of-Thought（思维链）

#### 3.1.1 基础 CoT

**模板**：

```
请按以下步骤思考并回答：

## 步骤 1: 理解问题
- 问题的核心是什么？
- 需要求解什么？
- 有哪些关键信息？

## 步骤 2: 分析方案
- 可能的解决方案有哪些？
- 每种方案的优缺点？
- 选择哪种方案？为什么？

## 步骤 3: 执行求解
- 具体的计算或推理过程
- 中间结果验证

## 步骤 4: 验证结果
- 答案是否合理？
- 是否符合约束条件？
- 有没有遗漏？

## 步骤 5: 最终答案
给出明确的答案。
```

#### 3.1.2 Zero-Shot CoT

**最简单的触发方式**：

```
让我们一步步思考这个问题。

或：

请一步步思考并给出答案。
```

**研究发现**：仅添加"Let's think step by step"就能显著提升数学、逻辑推理任务的性能。

#### 3.1.3 Auto-CoT（自动思维链）

```python
def auto_cot(question, llm):
    """
    自动生成思维链
    """
    # 步骤 1: 生成多样化的推理路径
    reasoning_paths = []
    for temp in [0.3, 0.5, 0.7, 0.9]:
        path = llm.generate(
            question,
            temperature=temp,
            prompt="Let's think step by step:"
        )
        reasoning_paths.append(path)

    # 步骤 2: 选择最一致的路径
    from collections import Counter
    answers = [extract_answer(p) for p in reasoning_paths]
    most_common = Counter(answers).most_common(1)[0][0]

    # 步骤 3: 返回最一致推理路径的答案
    return most_common
```

### 3.2 Self-Consistency（自一致性）

**多路径采样 + 投票**：

```python
def self_consistency(question, n_samples=5, temperature=0.7):
    """
    通过多次采样和投票提高答案可靠性
    """
    answers = []
    reasoning_paths = []

    # 1. 多次采样
    for i in range(n_samples):
        # 使用 CoT 提示
        prompt = f"Let's think step by step: {question}"
        response = llm.generate(prompt, temperature=temperature)

        # 提取推理过程和最终答案
        reasoning, answer = parse_response(response)
        reasoning_paths.append(reasoning)
        answers.append(answer)

    # 2. 投票
    from collections import Counter
    answer_counts = Counter(answers)
    most_common_answer = answer_counts.most_common(1)[0][0]
    confidence = answer_counts[most_common_answer] / n_samples

    # 3. 返回结果
    return {
        "answer": most_common_answer,
        "confidence": confidence,
        "distribution": dict(answer_counts),
        "reasoning_paths": reasoning_paths
    }
```

**适用场景**：

- 数学计算
- 逻辑推理
- 多步骤问题
- 需要高准确性的任务

### 3.3 RAG（检索增强生成）

#### 3.3.1 基础 RAG 流程

```
┌─────────────────────────────────────────────────────┐
│  离线阶段（文档索引）                                │
│  文档 → 分块 → 嵌入 → 向量数据库                    │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  在线阶段（检索+生成）                               │
│  查询 → 嵌入 → 检索 → 构建 Prompt → LLM → 答案      │
└─────────────────────────────────────────────────────┘
```

#### 3.3.2 高级 RAG 技术

**HyDE（假设性文档嵌入）**：

```python
def hyde_retrieval(query, llm, retriever):
    """
    用假设性答案进行检索
    """
    # 1. 生成假设性答案
    hypothetical_doc = llm.generate(
        f"Write a detailed answer to: {query}"
    )

    # 2. 用假设性答案检索（而不是原查询）
    docs = retriever.search(hypothetical_doc, top_k=5)

    return docs
```

**查询重写**：

```python
def query_expansion(query, llm):
    """
    扩展查询以提高召回率
    """
    # 生成多个查询变体
    expanded_queries = llm.generate(
        f"Generate 3 different ways to ask: {query}\n"
        f"Format: one per line, no numbering"
    )

    queries = [query] + expanded_queries.split('\n')

    # 对每个查询检索
    all_docs = []
    for q in queries:
        docs = retriever.search(q, top_k=3)
        all_docs.extend(docs)

    # 去重并重排
    unique_docs = deduplicate(all_docs)
    return unique_docs[:5]
```

### 3.4 Tool Calling & Function Calling

#### 3.4.1 基础工具调用

**工具定义**：

```python
tools = [
    {
        "name": "get_weather",
        "description": "获取指定城市的天气信息",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称"
                },
                "units": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "温度单位"
                }
            },
            "required": ["city"]
        }
    }
]
```

**提示词模板**：

```
You are an AI assistant with access to the following tools:

{tools}

When you need to use a tool, respond with a JSON object in this format:
```json
{{
  "tool": "tool_name",
  "args": {{
    "param1": "value1",
    "param2": "value2"
  }}
}}
```

Important:

- Only use the tools listed above
- Output ONLY the JSON, no other text
- If no tool is needed, answer directly

User query: {query}

```
#### 3.4.2 ReAct 模式
```

Thought: [分析需要什么信息]
Action: [选择合适的工具]
Action Input: [构造工具参数]
Observation: [观察工具返回结果]
Thought: [基于结果继续思考]
... (重复)
Final Answer: [给出最终答案]

```
### 3.5 Reflexion（反思与迭代）

#### 3.5.1 基础 Reflexion

```python
def reflexion_loop(task, max_iterations=3):
    """
    通过自我反思迭代改进
    """
    history = []

    for iteration in range(max_iterations):
        # 1. 生成解
        if iteration == 0:
            solution = generate_solution(task)
        else:
            # 使用历史反思
            context = build_reflection_context(history)
            solution = generate_solution(task, context)

        # 2. 评估
        feedback = evaluate(solution)

        # 3. 检查是否完成
        if feedback["success"]:
            return solution

        # 4. 反思
        reflection = generate_reflection(solution, feedback)
        history.append({
            "solution": solution,
            "feedback": feedback,
            "reflection": reflection
        })

    return solution  # 返回最佳解
```

#### 3.5.2 反思提示词模板

```
Your previous solution:

{previous_code}

It failed the following tests:
{failures}

Please analyze:
1. What went wrong?
2. Why did it fail?
3. What specific changes are needed?

Provide a corrected implementation that addresses all failures.
```

### 3.6 其他高级技术

#### 3.6.1 Least-to-Most Prompting

**将复杂问题分解为子问题**：

```
问题: {复杂问题}

请先列出解决这个问题的所有子问题，
按依赖关系排序，然后逐个解决。

子问题列表:
1. [子问题1]
2. [子问题2]
3. [子问题3]

现在从子问题1开始...
```

#### 3.6.2 Self-Ask

**让模型自己提问并回答**：

```
Question: {原始问题}

Follow-up questions and answers:
Q1: [需要什么信息?]
A1: [信息1]

Q2: [还需要什么信息?]
A2: [信息2]

... (继续提问直到有足够信息)

Final answer: [基于所有信息的最终答案]
```

#### 3.6.3 Tree-of-Thoughts (ToT)

**探索多个推理路径**：

```python
def tree_of_thoughts(problem, max_depth=3, branching_factor=3):
    """
    树形搜索多个推理路径
    """
    from queue import PriorityQueue

    # 初始状态
    initial_state = {
        "reasoning": "",
        "confidence": 0,
        "depth": 0
    }

    pq = PriorityQueue()
    pq.put((0, initial_state))

    best_solution = None

    while not pq.empty():
        priority, state = pq.get()

        if state["depth"] >= max_depth:
            if best_solution is None or state["confidence"] > best_solution["confidence"]:
                best_solution = state
            continue

        # 生成分支
        for i in range(branching_factor):
            # 生成下一步推理
            new_reasoning = llm.generate(
                f"Continue reasoning from: {state['reasoning']}\n"
                f"Generate next step (variant {i+1}):"
            )

            # 评估置信度
            confidence = evaluate_confidence(new_reasoning)

            # 添加到优先队列
            new_state = {
                "reasoning": state["reasoning"] + "\n" + new_reasoning,
                "confidence": confidence,
                "depth": state["depth"] + 1
            }
            pq.put((-confidence, new_state))

    return best_solution["reasoning"]
```

---

## 4. 游戏开发专项技术

### 4.1 系统架构设计提示词

#### 4.1.1 MVC/MVVM 架构生成

**模板**：

```
# 角色
你是 Unity 游戏架构专家。

# 任务
设计一个 {系统名称} 的 MVC 架构

# 要求
- Model: 数据层，使用 ScriptableObject
- View: UI 层，继承 BaseView
- Controller: 逻辑层，继承 BaseController
- 使用事件系统解耦各层

# 输出
1. 类图（文字描述）
2. 每个 Model 的定义
3. 每个 View 的定义
4. 每个 Controller 的定义
5. 事件定义
```

**示例 - 背包系统架构**：

```
输入: 设计背包系统 MVC 架构

输出:
Model: BagData (ScriptableObject)
View: BagView (继承 BaseView)
Controller: BagController (继承 BaseController)
Events: OnItemAdded, OnItemRemoved, OnBagSorted
```

#### 4.1.2 ECS（实体组件系统）设计

**模板**：

```
# 任务
设计 {游戏系统} 的 ECS 架构

# Unity DOTS 技术栈
- Entity: 实体定义
- Component: 组件定义（IComponentData）
- System: 系统定义（SystemBase）

# 输出要求
1. 实体-组件关系图
2. 所有 Component 定义
3. 所有 System 定义（更新逻辑）
4. 性能考虑（Job System/Burst）
```

**示例**：

```
输入: 设计敌人 AI 的 ECS 架构

输出:
Components:
- EnemyHealth (IComponentData)
- EnemyMovement (IComponentData)
- EnemyAttack (IComponentData)

Systems:
- EnemyHealthSystem (处理伤害)
- EnemyMovementSystem (处理移动)
- EnemyAttackSystem (处理攻击)
```

---

### 4.2 UI 系统生成提示词

#### 4.2.1 UI 面板自动生成

**Unity UIPattern 提示词**：

```
# 角色
你是 Unity UI 专家。

# 项目架构规范
- 所有 Panel 继承自 BasePanel
- 使用 [UIElement] 特性绑定组件
- 事件通过 UIEventManager 分发
- 使用 DOTween 做动画

# UI 需求
{UI 功能描述}

# 输出要求
1. 完整的 Panel 类（C#）
2. UIElement 绑定
3. 事件处理方法
4. 显示/隐藏动画
5. 数据绑定代码
```

**示例**：

```
输入: 设置面板，包含音量滑块、画质下拉菜单、分辨率选择

输出:
```csharp
public class SettingsPanel : BasePanel {
    [UIElement("volume_slider")]
    private Slider volumeSlider;

    [UIElement("quality_dropdown")]
    private TMP_Dropdown qualityDropdown;

    protected override void OnBind() {
        volumeSlider.onValueChanged.AddListener(OnVolumeChanged);
        qualityDropdown.onValueChanged.AddListener(OnQualityChanged);
    }

    private void OnVolumeChanged(float value) {
        AudioManager.Instance.SetMasterVolume(value);
    }
}
```

```
#### 4.2.2 UI 事件绑定代码生成

**模板**：
```

# 任务

为 {UI 名称} 生成事件绑定代码

# 事件列表

{事件清单}

# 输出

1. 事件定义（C# delegate 或 event）
2. 事件触发代码
3. 事件监听代码
4. 参数传递设计
   
   ```
   
   ```

---

### 4.3 游戏逻辑系统提示词

#### 4.3.1 背包系统实现

**完整系统提示词**：

```
# 角色
你是 Unity 游戏系统开发专家。

# 系统需求
实现一个 RPG 游戏背包系统：
- 支持物品堆叠（按物品类型）
- 支持拖拽整理
- 支持排序（按类型、品质、名称）
- 支持快捷键使用
- 支持数据持久化

# 技术要求
- 使用 ScriptableObject 定义物品配置
- 使用事件系统通知 UI 更新
- 考虑性能（避免频繁 GC）
- 遵循 SOLID 原则

# 输出内容
1. 物品数据结构（ItemData）
2. 槽位数据结构（SlotData）
3. 背包管理器（BagManager）
4. UI 控制器（BagController）
5. 拖拽处理逻辑
6. 数据持久化代码
```

#### 4.3.2 任务系统设计

**模板**：

```
# 任务系统提示词
设计一个可配置的任务系统：

# 功能需求
- 支持主线、支线、日常任务
- 支持任务条件（杀怪、收集、对话）
- 支持任务奖励
- 支持任务链（前置任务）
- 支持任务追踪

# 输出
1. 任务配置结构（ScriptableObject）
2. 任务管理器
3. 任务条件系统
4. 任务奖励系统
5. UI 追踪界面
```

#### 4.3.3 战斗逻辑模板

**战斗系统提示词**：

```
# 角色动作游戏战斗系统
设计一个动作游戏的战斗系统：

# 核心功能
- 角色状态机（Idle/Run/Attack/Hurt）
- 连击系统
- 受击反馈
- 伤害计算
- 特效播放

# Unity 实现
使用 Animator + StateMachineBehaviour

# 输出
1. 角色状态机定义
2. StateMachineBehaviour 脚本
3. 连击检测逻辑
4. 伤害计算公式
5. 特效触发代码
```

---

### 4.4 资源管理提示词

#### 4.4.1 资源加载与卸载

**模板**：

```
# Unity 资源管理器
设计一个资源管理系统：

# 功能需求
- 异步加载资源
- 引用计数管理
- 自动卸载未使用资源
- 支持 AssetBundle
- 资源预加载

# 输出
1. ResourceManager 类
2. 异步加载协程
3. 引用计数系统
4. 内存监控
5. 卸载策略
```

#### 4.4.2 对象池实现

**通用对象池提示词**：

```
# Unity 对象池系统
实现一个高性能对象池：

# 需求
- 支持多种对象类型（泛型）
- 自动扩展
- 预热功能
- 对象回收验证
- 支持对象重置

# 输出
```csharp
public class ObjectPool<T> where T : Component, IPoolable {
    // 对象池实现
}

public interface IPoolable {
    void OnSpawn();
    void OnDespawn();
}
```

# 使用场景

- 子弹对象池
- 特效对象池
- 怪物对象池
  
  ```
  
  ```

---

### 4.5 网络同步提示词

#### 4.5.1 状态同步方案

**模板**：

```
# 游戏状态同步
设计一个状态同步方案：

# 同步内容
- 玩家位置
- 玩家血量
- 技能状态
- 背包物品

# 技术选型
- 传输协议：UDP/TCP
- 序列化：Protobuf/Json
- 同步频率：10-20 次/秒

# 输出
1. 状态数据结构
2. 状态同步管理器
3. 差值计算（位置平滑）
4. 预测与校正
5. 延迟补偿
```

#### 4.5.2 RPC 代码生成

**模板**：

```
# RPC 代码生成
为以下功能生成 RPC 代码：

# 功能列表
{功能描述}

# 框架
- Mirror Networking
- 或 Fish-Net

# 输出
1. ServerRpc 方法
2. ClientRpc 方法
3. NetworkBehaviour 实现
4. 参数序列化
5. 调用示例
```

**示例**：

```
输入: 玩家使用技能

输出:
[ServerRpc]
void UseSkillServerRpc(int skillId, Vector3 targetPos)

[ClientRpc]
void PlaySkillEffectClientRpc(int skillId, Vector3 targetPos)
```

---

### 4.6 性能优化提示词

#### 4.6.1 渲染优化建议

**模板**：

```
# Unity 渲染优化
分析并提供优化建议：

# 场景信息
{场景描述}

# 分析输出
1. DrawCall 分析
2. 批处理建议
3. GPU Instancing 机会
4. LOD 级别建议
5. 遮挡剔除设置
```

#### 4.6.2 内存泄漏检测

**模板**：

```
# 内存分析提示词
分析以下代码的内存问题：

{代码片段}

# 检查项
1. 事件订阅未取消
2. 协程未正确停止
3. 缓存无限增长
4. 资源未释放
5. 闭包引用

# 输出格式
## 内存问题清单
- 问题：[描述]
- 位置：[文件:行号]
- 修复：[建议]
```

#### 4.6.3 DrawCall 优化方案

**模板**：

```
# DrawCall 优化
为以下场景优化 DrawCall：

# 场景描述
{场景信息}

# 优化策略
1. 图集合并建议
2. 材质共享方案
3. 批处理优化
4. SRP Batcher 使用
5. UI 合批优化

# 输出
- 优化前后对比
- 具体实施步骤
- 预期效果
```

---

## 5. 实战案例深度解析

### 4.1 案例一：Cocos Creator UI 面板自动生成

#### 4.1.1 任务描述

使用 Claude Code 的 `/add-ui` 命令快速创建符合项目 MVC 架构的 UI 面板。

#### 4.1.2 不同提示词方案对比

**方案 A：简单提示**

```bash
输入: /add-ui TestSetting TestSettingView
```

**问题**：

- ❌ 命令本身没有提供足够的上下文
- ❌ 需要依赖 Skill 内部的提示词
- ❌ 如果 Skill 提示词设计不当，效果会很差

**方案 B：K-shot + RAG**

Skill 内部提示词设计：

```
# System Prompt
你是 Cocos Creator UI 代码生成专家。

# 项目架构文档 (RAG)
BaseView$$: 所有 View 的基类
BaseViewCtrl$$: 所有 Controller 的基类
MVC 架构: Model-View-Controller 分层
目录规范: assets/scripts/pk/modules/{ModuleName}/

# 代码示例 (K-shot)
示例 1 - UserProfileView:
```typescript
// View: UserProfileView$$.ts
export class UserProfileView$$ extends BaseView$$ {
    @property({ type: Node })
    protected content: Node = null;
}

// Controller: UserProfileViewCtrl$$.ts
export class UserProfileViewCtrl$$ extends BaseViewCtrl$$ {
    protected viewClass: any = UserProfileView$$;
}
```

# 配置注册规则

- ViewEnum$$: 添加 View 枚举
- ViewCtrlEnum$$: 添加 Controller 枚举
- ViewForms$$: 配置 Prefab 路径
- MVCForms$$: 注册 MVC 关系

# 任务

创建 {ModuleName} 模块的 {ViewName} 面板

```
**效果**：
- ✅ 生成符合项目规范的代码
- ✅ 自动完成所有配置注册
- ✅ 代码风格一致

**方案 C：Reflexion + Tool Calling**

```python
# Reflexion 循环
def generate_ui_with_reflexion(module_name, view_name):
    for iteration in range(3):
        # 步骤 1: 生成代码
        code = generate_ui_code(module_name, view_name)

        # 步骤 2: 验证
        validation_result = validate_code(code)

        if validation_result["passed"]:
            return code

        # 步骤 3: 反思
        reflection = analyze_failure(code, validation_result)

        # 步骤 4: 改进
        code = improve_code(code, reflection)

    return code
```

**优势**：

- ✅ 自动发现和修复错误
- ✅ 逐步完善代码
- ✅ 更高的代码质量

#### 4.1.3 实际效果对比

| 方案           | 代码质量  | 配置完整性 | 需要迭代 | 适用性    |
| ------------ | ----- | ----- | ---- | ------ |
| 简单提示         | ⭐⭐    | ⭐⭐    | 否    | 快速原型   |
| K-shot + RAG | ⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | 否    | **生产** |
| Reflexion    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 是    | 高质量    |

### 4.2 案例二：API 调用代码生成

#### 4.2.1 任务描述

根据 API 文档生成调用代码。

#### 4.2.2 RAG 方案

**提示词设计**：

```
# System Prompt
你是精确的代码生成助手。**仅使用**提供的 Context 中的 API 文档。

CRITICAL RULES:
1. 使用文档中**确切**的端点、参数、响应格式
2. 不要基于先验知识假设 API 细节
3. 如果 Context 中缺少必要信息，明确说明

# Context (RAG 检索)
Base URL: https://api.example.com/v1
Authentication: X-API-Key header
Endpoint: GET /users/{id}
Response: {"id": string, "name": string}

# User Prompt
编写 Python 函数 fetch_user_name(user_id, api_key) 调用上述 API
```

**生成代码**：

```python
import requests

def fetch_user_name(user_id: str, api_key: str) -> str:
    url = f"https://api.example.com/v1/users/{user_id}"
    headers = {"X-API-Key": api_key}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()["name"]
```

**对比**：

- 无 RAG：模型可能幻觉出错误的端点或参数
- 有 RAG：准确基于文档生成代码

### 4.3 案例三：游戏背包系统实现

#### 4.3.1 任务描述

实现一个支持堆叠、排序、拖拽的 RPG 游戏背包系统（Unity/C#）

#### 4.3.2 不同方案对比

**方案 A：直接提问**

```
输入: "用 Unity C# 实现一个背包系统，支持物品堆叠"
输出: [可能缺少关键功能，如拖拽、保存等]
```

**方案 B：CoT + 任务分解**

```
输入: "让我们一步步实现背包系统：
1. 设计物品数据结构（ItemData）
2. 设计背包槽位（Slot）数据结构
3. 实现背包管理器（BagManager）
4. 实现堆叠逻辑
5. 实现拖拽功能
6. 实现数据持久化"

输出:
- 完整的类设计
- 每个步骤的详细代码
- 考虑边界情况
```

**方案 C：RAG + Few-Shot**

```
# System Prompt
你是 Unity 游戏开发专家。

# 项目架构文档 (RAG)
- 使用 ScriptableObject 存储物品配置
- 使用事件系统解耦 UI 和逻辑
- 遵循单一职责原则

# 代码示例 (K-shot)
示例 - Slot 类结构:
```csharp
public class Slot : MonoBehaviour {
    public ItemData currentItem;
    public int stackCount;
    // ...
}
```

# 任务

实现背包系统：{requirements}

输出:

- 符合项目架构的完整代码
- 自动应用项目规范
- 代码风格一致
  
  ```
  
  ```

### 4.4 案例四：代码调试与修复

#### 4.4.1 任务描述

代码测试失败，需要定位和修复 bug。

#### 4.4.2 Reflexion 方案

**场景**：密码验证函数测试失败

**迭代过程**：

```
迭代 0:
代码: return len(p) >= 8 and any(c.isalpha() for c in p)
测试: 失败 - missing uppercase, missing special

反思:
- 问题：只检查了字母，没有区分大小写
- 需要添加：大写字母检查、特殊字符检查

迭代 1:
代码: return len(p) >= 8 \
       and any(c.isupper() for c in p) \
       and any(c.islower() for c in p) \
       and any(c.isdigit() for c in p) \
       and any(c in "!@#$%^&*()-_" for c in p)
测试: 通过 ✅
```

**效果**：

- 从 2 个失败测试到全部通过
- 自动识别缺失的验证规则
- 无需人工干预

---

## 6. 技术原理深度剖析

### 5.1 LLM 的工作原理

#### 5.1.1 Transformer 架构

**核心组件**：

```
输入文本 → Tokenization → Token Embeddings
                                    ↓
                        + Positional Encodings
                                    ↓
                            [编码器层 × N]
                    ┌───────────────────────┐
                    │  自注意力层              │
                    │  前馈层                │
                    │  残差连接 + 层归一化     │
                    └───────────────────────┘
                                    ↓
                            [解码器层 × N]
                    ┌───────────────────────┐
                    │  编码-解码注意力         │
                    │  自注意力层             │
                    │  前馈层                │
                    └───────────────────────┘
                                    ↓
                            输出概率分布
                                    ↓
                                采样
```

**自注意力机制**：

```
Attention(Q, K, V) = softmax(QK^T / √d_k) V

其中：
- Q (Query): 查询向量
- K (Key): 键向量
- V (Value): 值向量
- d_k: 缩放因子

直观理解：
- Q: "我在找什么"
- K: "我能提供什么"
- V: "我的内容是什么"
```

#### 5.1.2 自回归生成

**生成过程**：

```
P(token_t | context) = softmax(W_o · h_t + b_o)

其中 h_t 是隐藏状态，基于：
h_t = Transformer_Layer(token_<t, h_<t)

生成流程：
token_1 ∼ P(· | [START])
token_2 ∼ P(· | [START, token_1])
token_3 ∼ P(· | [START, token_1, token_2])
...
token_T ∼ P(· | [START, token_1, ..., token_{T-1}])
```

**为什么提示词重要？**

```
不同的 context 导致完全不同的 P(token | context)

示例:
context_1: "The capital of France is"
  → P("Paris" | context_1) = 0.92
  → P("London" | context_1) = 0.01

context_2: "The capital of the UK is"
  → P("Paris" | context_2) = 0.01
  → P("London" | context_2) = 0.93

提示词工程 = 优化 context 以改变概率分布
```

### 5.2 In-Context Learning 机制

#### 5.2.1 元学习视角

**传统微调**：

```
θ_{task} = argmin_θ E_{(x,y)∼D_task}[L(f_θ(x), y)]

需要梯度更新，每个任务都要训练
```

**In-Context Learning**：

```
f_θ(y | x, S_K) ≈ f_θ'(y | x)

其中 S_K = {(x_1, y_1), ..., (x_K, y_K)} 是示例

无需梯度更新，通过前向传播"学习"
```

**为什么有效？**

假设在训练时，模型见过大量任务：

```
任务 1: 翻译英语→法语
任务 2: 情感分类
任务 3: 代码生成
...
任务 M: 字符串反转

每个任务都提供示例 {(x_i, y_i)}

模型学习到元技能：
"如何从示例中推断任务规则"
```

#### 5.2.2 注意力模式分析

**K-shot 示例的注意力权重**：

```
位置: [示例1] [示例2] ... [示例K] [查询]
        ↓       ↓             ↓        ↓
生成"查询"的答案时，注意力分布：

示例 1: ████████░░░░ 12%
示例 2: █████████████░ 24%
示例 3: ████████████░░░ 20%
示例 4: ████████████████ 28%  ← 相关性最高
示例 5: ████████████████ 31%  ← 最近（近因）
查询:   ████░░░░░░░░░░ 5%

关键发现：
1. 相关示例获得更高权重
2. 最近示例有近因优势
3. 模型自动学习"哪个示例最有用"
```

### 5.3 Chain-of-Thought 的计算原理

#### 5.3.1 推理路径作为计算图

```
问题: 计算 3^12345 mod 100

无 CoT:
直接生成答案
  LLM → "43"  (黑盒，不知道如何得到)

有 CoT:
生成推理链
  步骤1: LLM → "观察 3^n mod 100 的模式"
  步骤2: LLM → "计算发现周期为 20"
  步骤3: LLM → "12345 mod 20 = 5"
  步骤4: LLM → "3^5 = 243"
  步骤5: LLM → "243 mod 100 = 43"
  最终:  "答案是 43"

每一步都基于前一步的输出（自回归）
```

#### 5.3.2 数学证明：为什么 CoT 提升性能

**错误传播模型**：

设每步推理的错误率为 ε

```
无 CoT (直接跳跃):
P(正确) = 1 - ε

有 CoT (T 步推理):
每步可验证，局部错误率 ε' < ε

P(全部正确) = (1 - ε')^T

当 ε = 0.2, ε' = 0.05, T = 5:
无 CoT: P = 0.8
有 CoT: P = 0.95^5 ≈ 0.77

但如果中间步骤可修正:
实际 P(正确) ≈ 1 - T·ε' = 1 - 0.25 = 0.75

关键优势:
1. 错误可定位（知道哪步错了）
2. 错误可修正（只需重做那一步）
3. 推理可解释（看到思考过程）
```

### 5.4 RAG 的检索原理

#### 5.4.1 向量嵌入的数学原理

**嵌入模型的目标**：

```
学习函数 f: Text → R^d

使得语义相似的文本距离近：
sim(text_1, text_2) ≈ cosine(f(text_1), f(text_2))

训练目标 (Contrastive Loss):
L = -log(exp(sim(f(x), f(x+))/τ) / Σ exp(sim(f(x), f(x-))/τ))

其中：
- x+: 正样本（语义相似）
- x-: 负样本（语义不相似）
- τ: 温度参数
```

**检索过程**：

```python
# 1. 查询嵌入
q = embed(query)  # R^d

# 2. 计算与所有文档的相似度
scores = [cosine(q, d) for d in doc_vectors]

# 3. Top-K 选择
top_k_indices = argsort(scores)[-k:]

# 复杂度: O(N·d) 精确搜索
#          O(log N·d) 近似搜索 (使用 HNSW 索引)
```

#### 5.4.2 混合检索（Dense + Sparse）

**Dense Retrieval（密集检索）**：

```
优势: 捕捉语义相似度
劣势: 可能精确匹配关键词

示例:
查询: "dog"
检索到: "puppy", "canine", "pet"
```

**Sparse Retrieval（稀疏检索，如 BM25）**：

```
优势: 精确关键词匹配
劣势: 不理解语义

示例:
查询: "dog"
检索到: "dog", "dog's", "dogs"
```

**Hybrid（混合）**：

```python
def hybrid_search(query, alpha=0.5):
    # Dense: 向量相似度
    dense_score = cosine_similarity(embed(query), embed(doc))

    # Sparse: BM25
    sparse_score = bm25(query, doc)

    # 融合
    final_score = alpha * dense_score + (1 - alpha) * sparse_score

    return final_score
```

### 5.5 Tool Calling 的实现原理

#### 5.5.1 结构化生成

**问题**：LLM 生成文本，如何保证有效的 JSON？

**方案 1: 后处理**（不可靠）

```python
# 生成文本
output = llm.generate("Call the weather tool")
# 可能: '{"tool": "get_weather", "city": "Tokyo"}'
# 可能: 'I think we should call get_weather'

# 尝试解析
try:
    result = json.loads(output)
except:
    # 失败，需要重新生成
    pass
```

**方案 2: Constrained Decoding**（可靠）

```python
import json
import torch

def constrained_decode(prompt, json_schema):
    """在生成时只允许合法的 tokens"""

    # 1. 解析 schema 为状态机
    states = build_fsm_from_schema(json_schema)

    # 2. 生成时动态 mask
    generated = tokenize(prompt)
    current_state = states["start"]

    for step in range(max_tokens):
        # 获取 logits
        logits = model(generated).logits[:, -1, :]

        # 根据当前状态，mask 不合法的 tokens
        valid_tokens = current_state.valid_tokens()
        mask = torch.zeros_like(logits)
        mask[valid_tokens] = 1

        # 应用 mask
        logits = logits + (mask - 1) * 1e9

        # 采样
        next_token = sample(logits)
        generated = torch.cat([generated, next_token])

        # 转移状态
        current_state = current_state.transition(next_token)

        # 检查是否完成
        if current_state.is_final():
            break

    # 解析
    output_text = detokenize(generated)
    return json.loads(output_text)
```

#### 5.5.2 训练过程

**阶段 1: 监督微调（SFT）**

```
数据格式:
{
  "messages": [
    {"role": "user", "content": "What's the weather in Tokyo?"},
    {"role": "assistant", "content": '{"tool": "get_weather", "args": {"city": "Tokyo"}}'}
  ]
}

训练目标:
L_SFT = -Σ log P(token_t | token_{<t}, examples)

模型学习:
1. 识别何时需要工具
2. 生成符合 schema 的 JSON
3. 提取参数从查询中
```

**阶段 2: 强化学习（RLHF）**

```
奖励设计:
R = w1 * R_success + w2 * R_correctness + w3 * R_efficiency

其中:
- R_success: 工具调用成功 (+1) / 失败 (-10)
- R_correctness: 参数正确 (+2) / 错误 (-5)
- R_efficiency: 调用次数少 (bonus)

优化:
∇θ J(θ) = E[∇θ log π_θ(a|q) · A(q,a)]

其中 A(q,a) = R(q,a) - b(q) 是优势函数
```

---

## 7. 行业工具与生态

### 6.1 提示词管理平台

#### 6.1.1 LangSmith

**官方网站**: https://docs.langchain.com/langsmith/

**核心功能**：

1. **提示词版本控制**
   
   ```python
   from langsmith import Client
   ```

client = Client()

# 提交提示词版本

prompt_id = client.create_prompt(
    name="code_review_prompt",
    template="你是代码审查专家...",
    tags=["v1.0", "production"]
)

# 拉取特定版本

prompt = client.pull_prompt("code_review_prompt", tags=["v1.0"])

```
2. **A/B 测试**
```python
# 测试两个提示词版本
results = client.evaluate(
    dataset="code_review_dataset",
    prompts=["code_review_v1", "code_review_v2"],
    evaluators=["accuracy", "helpfulness"]
)
```

3. **监控与调试**
   
   ```python
   # 追踪提示词执行
   client.trace(
    prompt="code_review_v1",
    inputs={"code": "..."},
    metadata={"model": "gpt-4", "temperature": 0.0}
   )
   ```

#### 6.1.2 PromptHub

**官方网站**: https://prompthub.us/

**特点**：

- 可视化提示词编辑器
- 团队协作功能
- 版本历史与对比
- 测试与评估

**使用场景**：

- 企业提示词库管理
- 多人协作开发
- 生产环境部署

#### 6.1.3 其他平台

| 平台              | 特点               | 适用场景         |
| --------------- | ---------------- | ------------ |
| **LangSmith**   | 与 LangChain 深度集成 | LangChain 用户 |
| **PromptHub**   | 可视化编辑，易用         | 团队协作         |
| **PromptLayer** | 监控与分析            | 生产环境         |
| **HumanLoop**   | 人类反馈优化           | RLHF         |

### 6.2 开发框架与库

#### 6.2.1 LangChain

**GitHub**: https://github.com/langchain-ai/langchain

**Prompt Templates**:

```python
from langchain.prompts import PromptTemplate
from langchain.prompts.few_shot import FewShotPromptTemplate

# 基础模板
template = PromptTemplate(
    input_variables=["question"],
    template="请回答这个问题: {question}\n\n回答:"
)

# Few-shot 模板
examples = [
    {"input": "苹果", "output": "水果"},
    {"input": "胡萝卜", "output": "蔬菜"},
]

prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=PromptTemplate(
        input_variables=["input", "output"],
        template="输入: {input}\n输出: {output}"
    ),
    prefix="以下是一些分类示例:",
    suffix="\n输入: {input}\n输出:",
    input_variables=["input"]
)

# 使用
result = prompt.format(input="西红柿")
print(result)
```

#### 6.2.2 LlamaIndex

**GitHub**: https://github.com/run-llama/llama_index

**RAG 实现**：

```python
from llama_index import VectorStoreIndex, SimpleDirectoryReader

# 1. 加载文档
documents = SimpleDirectoryReader('data').load_data()

# 2. 创建索引
index = VectorStoreIndex.from_documents(documents)

# 3. 查询
query_engine = index.as_query_engine()
response = query_engine.query("什么是 RAG？")

print(response)
```

#### 6.2.3 DSPy

**GitHub**: https://github.com/stanfordnlp/dspy

**程序化提示词**：

```python
import dspy

class RAG(dspy.Module):
    def __init__(self, num_passages=3):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=num_passages)
        self.generate_query = dspy.ChainOfThought("generate_query")
        self.generate_answer = dspy.ChainOfThought("generate_answer")

    def forward(self, question):
        # 检索
        contexts = self.retrieve(question).passages

        # 生成查询
        query = self.generate_query(question=question)

        # 生成答案
        answer = self.generate_answer(
            question=question,
            context=contexts
        )

        return dspy.Prediction(context=contexts, answer=answer)

# 编译（优化提示词）
rag = RAG()
rag.compile(
    trainset=train_data,
    optimizer=dspy.BootstrapFewShot()
)
```

### 6.3 提示词优化工具

#### 6.3.1 PromptWizard

**官方网站**: https://microsoft.github.io/PromptWizard/

**功能**：

- 自动提示词优化
- 示例选择
- 反馈驱动改进

**使用**：

```python
from promptwizard import PromptWizard

# 定义任务
task = {
    "name": "sentiment_analysis",
    "description": "分析文本的情感倾向",
    "examples": training_data
}

# 优化提示词
wizard = PromptWizard(task)
optimized_prompt = wizard.optimize(
    initial_prompt="分析情感",
    iterations=10
)

print(optimized_prompt)
```

#### 6.3.2 PromptLayer

**官方网站**: https://promptlayer.com/

**功能**：

- 提示词版本管理
- 性能追踪
- 成本分析

### 6.4 评估与基准测试

#### 6.4.1 PromptBench

**GitHub**: https://github.com/microsoft/promptbench

**评估框架**：

```python
from promptbench import PromptBench

# 1. 定义评估任务
benchmark = PromptBench(
    dataset="GSM8K",  # 数学数据集
    metrics=["accuracy", "latency", "cost"]
)

# 2. 测试提示词
results = benchmark.evaluate(
    prompts={
        "baseline": "解决这个数学问题",
        "cot": "一步步思考并解决",
        "cot_sc": "一步步思考（5次采样投票）"
    },
    model="gpt-4"
)

# 3. 分析结果
print(results.table())
results.plot()  # 可视化对比
```

#### 6.4.2 自定义评估

```python
def evaluate_prompt(prompt, test_set, criteria):
    """
    评估提示词性能
    """
    scores = []

    for example in test_set:
        # 生成
        output = llm.generate(prompt.format(**example))

        # 评估
        score = {}
        for criterion in criteria:
            score[criterion] = criterion.evaluate(
                output=output,
                expected=example["expected"]
            )

        scores.append(score)

    # 汇总
    avg_scores = {
        criterion: np.mean([s[criterion] for s in scores])
        for criterion in criteria
    }

    return avg_scores

# 使用
criteria = [
    ExactMatchCriterion(),
    SemanticSimilarityCriterion(),
    CodeExecutionCriterion()
]

results = evaluate_prompt(
    prompt=my_prompt,
    test_set=math_test_set,
    criteria=criteria
)
```

### 6.5 开源项目推荐

#### 6.5.1 Awesome Prompt Engineering

**GitHub**: https://github.com/promptslab/Awesome-Prompt-Engineering

**内容**：

- 论文列表
- 工具集合
- 学习资源
- 社区项目

#### 6.5.2 Prompt Engineering Guide

**官方网站**: https://www.promptingguide.ai/

**内容**：

- 完整的提示词技术指南
- 交互式示例
- 最新研究论文
- 最佳实践

#### 6.5.3 DAIR.AI Prompt Engineering Guide

**GitHub**: https://github.com/dair-ai/Prompt-Engineering-Guide

**内容**：

- 论文集合
- 课程资源
- 工具推荐
- 行业动态

---

## 9. 最佳实践与设计模式

### 7.1 提示词设计原则

#### 7.1.1 CLEAR 原则

```
**C**oncise (简洁)
- 去除冗余信息
- 每句话都有明确目的
- 避免重复表述

**L**ucid (清晰)
- 使用明确的语言
- 避免歧义和模糊表达
- 定义专业术语

**E**xplicit (明确)
- 明确输入输出格式
- 指定约束条件
- 说明评估标准

**A**ctionable (可执行)
- 提供具体步骤
- 给出可操作的指导
- 包含示例说明

**R**elevant (相关)
- 只包含必要信息
- 移除干扰内容
- 保持上下文聚焦
```

#### 7.1.2 设计检查清单

```
□ 角色设定清晰
□ 任务描述明确
□ 输入格式说明
□ 输出格式约束
□ 示例充分且多样
□ 约束条件完整
□ 边界情况覆盖
□ 错误处理说明
□ 验证方法提供
□ 语言风格一致
```

### 7.2 常见设计模式

#### 7.2.1 模板模式

```python
class PromptTemplate:
    def __init__(self, template, variables):
        self.template = template
        self.variables = variables

    def format(self, **kwargs):
        # 验证变量
        for var in self.variables:
            if var not in kwargs:
                raise ValueError(f"Missing variable: {var}")

        # 填充模板
        return self.template.format(**kwargs)

# 使用
template = PromptTemplate(
    template="分析以下{language}代码，检查{aspect}",
    variables=["language", "aspect"]
)

prompt = template.format(language="Python", aspect="性能")
```

#### 7.2.2 工厂模式

```python
class PromptFactory:
    @staticmethod
    def create_code_review_prompt(language="Python"):
        if language == "Python":
            return """你是一位 Python 代码审查专家...
            检查 PEP 8 规范、类型注解、文档字符串..."""
        elif language == "JavaScript":
            return """你是一位 JavaScript 代码审查专家...
            检查 ES6+ 特性、异步模式、错误处理..."""

    @staticmethod
    def create_documentation_prompt(style="google"):
        if style == "google":
            return """使用 Google 风格的文档字符串..."""
        elif style == "numpy":
            return """使用 NumPy 风格的文档字符串..."""

# 使用
prompt = PromptFactory.create_code_review_prompt("Python")
```

#### 7.2.3 装饰器模式

```python
def with_retry(max_retries=3):
    """自动重试装饰器"""
    def decorator(prompt_func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return prompt_func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    print(f"Retry {attempt + 1}/{max_retries}")
            return wrapper
        return decorator

@with_retry(max_retries=3)
def generate_code(prompt):
    return llm.generate(prompt)
```

### 7.3 提示词库组织

#### 7.3.1 目录结构

```
prompts/
├── basics/              # 基础提示词
│   ├── summarization.md
│   ├── translation.md
│   └── classification.md
├── code/               # 代码相关
│   ├── generation.md
│   ├── review.md
│   ├── debugging.md
│   └── refactoring.md
├── reasoning/          # 推理任务
│   ├── math.md
│   ├── logic.md
│   └── planning.md
├── creative/           # 创意任务
│   ├── writing.md
│   ├── brainstorming.md
│   └── ideation.md
└── meta/               # 元提示词
    ├── optimization.md
    └── evaluation.md
```

#### 7.3.2 提示词模板

**Markdown 模板**：

```markdown
# 提示词名称

## 描述
简要说明这个提示词的用途

## 变量
- `var1`: 变量1的说明
- `var2`: 变量2的说明

## 模板
```

{var1}

请完成以下任务：
{var2}

输出要求：

1. 要求1
2. 要求2
   
   ```
   
   ```

## 示例

**输入**：
var1 = "Python"
var2 = "实现快速排序"

**输出**：
(示例输出)

## 版本历史

- v1.0 (2025-01-15): 初始版本
- v1.1 (2025-01-20): 添加类型注解要求

## 性能

- 准确率: 95%
- 平均 tokens: 500
- 成本: $0.002/次

## 相关提示词

- [code/debugging.md](code/debugging.md)
- [code/refactoring.md](code/refactoring.md)
  
  ```
  
  ```

### 7.4 测试与验证

#### 7.4.1 单元测试

```python
import pytest

class TestPrompts:
    def test_code_generation_prompt(self):
        prompt = load_prompt("code/generation.md")

        # 测试变量替换
        formatted = prompt.format(
            language="Python",
            task="实现二分查找"
        )

        assert "Python" in formatted
        assert "二分查找" in formatted

    def test_output_format(self):
        output = llm.generate(prompt)

        # 验证输出格式
        assert "```python" in output
        assert "def " in output

    def test_functional_correctness(self):
        code = extract_code(output)

        # 执行并测试
        exec_result = exec_and_test(code, test_cases)
        assert exec_result["passed"]
```

#### 7.4.2 A/B 测试

```python
def ab_test_prompts(prompt_a, prompt_b, test_set):
    """
    对比两个提示词版本
    """
    results_a = []
    results_b = []

    for example in test_set:
        # 版本 A
        output_a = llm.generate(prompt_a.format(**example))
        score_a = evaluate(output_a, example["expected"])
        results_a.append(score_a)

        # 版本 B
        output_b = llm.generate(prompt_b.format(**example))
        score_b = evaluate(output_b, example["expected"])
        results_b.append(score_b)

    # 统计显著性检验
    from scipy import stats
    t_stat, p_value = stats.ttest_ind(results_a, results_b)

    return {
        "prompt_a": {
            "mean": np.mean(results_a),
            "std": np.std(results_a)
        },
        "prompt_b": {
            "mean": np.mean(results_b),
            "std": np.std(results_b)
        },
        "significance": p_value < 0.05
    }
```

---

## 8. 代码生成与审查专项

### 8.1 代码生成提示词模式

#### 8.1.1 从需求到代码

**需求分析优先提示词**：

```
# 角色
你是资深游戏开发工程师。

# 需求描述
{功能需求}

# 分析步骤
1. 需求分析：理解核心功能
2. 设计决策：确定架构模式
3. 数据结构：设计类和接口
4. 实现细节：关键算法

# 输出要求
- 完整可运行的代码
- 充分的注释说明
- 使用示例
- 测试用例
```

**API 设计优先**：

```
# 先设计 API，再实现

# 任务
为 {功能} 设计清晰的 API

# 要求
1. 公共接口定义清晰
2. 命名符合 Unity 规范
3. 参数设计合理
4. 返回值明确
5. 异常处理

# 输出
- 接口定义
- 使用示例
- 实现代码
```

**测试驱动生成**：

```
# TDD 方式生成代码

# 功能需求
{需求描述}

# 先生成测试
1. 正常情况测试
2. 边界条件测试
3. 异常情况测试

# 再生成实现
- 通过所有测试
- 代码简洁高效
```

#### 8.1.2 代码补全与续写

**上下文感知补全**：

```
# 补全代码

# 已有代码
{现有代码上下文}

# 任务
补全 {方法/类} 的实现

# 要求
- 遵循现有代码风格
- 符合项目架构
- 性能优化
```

**函数体生成**：

```
# 生成函数实现

# 函数签名
{函数声明}

# 功能说明
{功能描述}

# 输出完整实现
- 包含错误处理
- 添加性能注释
- 考虑边界情况
```

#### 8.1.3 跨语言代码转换

**C# ↔ TypeScript 转换**：

```
# Unity C# 转 Cocos TypeScript
将以下 C# 代码转换为 TypeScript：

{C# 代码}

# 转换规则
1. 类型映射（int → number, List → Array）
2. 命名规范（PascalCase → camelCase）
3. 装饰器（[SerializeField] → @property）
4. 生命周期方法

# 输出
```typescript
// 转换后的代码
```

```
**伪代码到实现代码**：
```

# 将伪代码转换为具体实现

# 伪代码

{伪代码描述}

# 目标语言

Unity C# / Cocos TS / UE C++

# 输出

完整可运行的实现代码

```
---

### 8.2 代码审查提示词模式

#### 8.2.1 静态分析辅助

**潜在 Bug 检测**：
```

# 代码 Bug 分析

审查以下代码的潜在 Bug：

{代码片段}

# 检查项

1. 空引用风险
2. 数组越界
3. 除零错误
4. 类型转换错误
5. 并发问题
6. 资源泄漏

# 输出格式

## 发现的问题

### [严重程度] 问题描述

- 位置：[文件:行号]
- 原因：[分析]
- 修复：[建议代码]
  
  ```
  
  ```

**性能问题识别**：

```
# Unity 性能分析
分析以下代码的性能问题：

{代码片段}

# 检查项
1. 每帧 GC 分配
2. 缓存的缺失项
3. 高频调用优化
4. 协程使用
5. LINQ 性能

# 输出
## 性能问题
| 问题 | 严重程度 | 优化建议 |
|------|---------|---------|
| ... | ... | ... |
```

#### 8.2.2 代码风格审查

**Unity 命名规范检查**：

```
# 代码风格检查
检查代码是否符合 Unity 规范：

{代码片段}

# 检查项
1. Public 方法：PascalCase
2. Private 字段：_camelCase
3. Public 字段：PascalCase
4. 常量：UPPER_SNAKE_CASE
5. 协程：方法名加 Coroutine 后缀

# 输出
## 风格问题
- [行号]: [问题] → 建议修改为 [正确写法]
```

**代码格式化建议**：

```
# 代码格式建议
提供代码格式化建议：

{代码片段}

# 分析
1. 缩进一致性
2. 空行使用
3. 括号风格
4. 行长度
5. 注释规范

# 输出格式化后的代码
```csharp
// 格式化后的代码
```

```
#### 8.2.3 架构层面审查

**设计模式识别**：
```

# 识别使用的设计模式

分析代码使用了哪些设计模式：

{代码片段}

# 常见模式

- 单例模式
- 观察者模式
- 工厂模式
- 策略模式
- 对象池模式

# 输出

## 设计模式分析

- 模式：[模式名称]
- 实现：[如何实现]
- 评价：[优缺点]
  
  ```
  
  ```

**SOLID 原则检查**：

```
# SOLID 原则检查
检查代码是否符合 SOLID 原则：

{代码片段}

# 检查项
- **S**ingle Responsibility：单一职责
- **O**pen/Closed：开闭原则
- **L**iskov Substitution：里氏替换
- **I**nterface Segregation：接口隔离
- **D**ependency Inversion：依赖倒置

# 输出
## SOLID 违反项
- 原则：[违反的原则]
- 问题：[描述]
- 重构：[建议]
```

**依赖关系分析**：

```
# 依赖关系分析
分析代码的依赖关系：

{代码片段}

# 检查项
1. 循环依赖
2. 紧耦合
3. 依赖倒置
4. 接口依赖
5. 模块化程度

# 输出
## 依赖关系图
```

ClassA → ClassB → ClassC
    ↓       ↓
  ClassD  ClassE

```
## 问题
- ClassA 和 ClassC 存在循环依赖
- ClassB 依赖具体实现而非接口
```

---

### 8.3 调试与修复提示词模式

#### 8.3.1 错误诊断

**堆栈跟踪分析**：

```
# 堆栈跟踪分析
分析以下错误堆栈：

{堆栈跟踪}

# 分析内容
1. 错误类型和消息
2. 触发位置
3. 调用链路
4. 根本原因

# 输出
## 错误分析
### 错误类型
[错误类型]: [错误描述]

### 触发位置
文件：[文件名]:[行号]
方法：[方法名]

### 调用链
[方法1] → [方法2] → [方法3]

### 根本原因
[原因分析]

### 修复建议
```csharp
// 修复代码
```

```
**日志解读**：
```

# Unity 日志分析

分析以下日志信息：

{日志内容}

# 分析

1. 日志级别（Error/Warning/Info）
2. 时间顺序
3. 关联事件
4. 错误模式

# 输出

## 日志分析报告

### 时间线

[时间] [级别] [消息]

### 问题识别

- [问题1]
- [问题2]

### 建议

[修复建议]

```
**根因分析**：
```

# 根本原因分析

对以下 Bug 进行根因分析：

Bug 描述：{Bug 描述}
复现步骤：{复现步骤}

# 分析框架（5 Whys）

1. 为什么会发生？
2. 为什么会导致这个？
3. 为什么会这样？
4. 为什么...？
5. 根本原因是什么？

# 输出

## 根因分析

### 直接原因

[描述]

### 根本原因

[5个为什么分析]

### 永久修复方案

```csharp
// 修复代码
```

```
#### 8.3.2 修复建议生成

**Bug 修复方案**：
```

# Bug 修复建议

为以下 Bug 提供修复方案：

Bug：{Bug 描述}
代码：{问题代码}

# 修复要求

1. 最小改动
2. 不引入新问题
3. 考虑边界情况
4. 添加防护代码

# 输出

## 修复方案

### 问题分析

[原因]

### 修复代码

```csharp
// 修复后的代码
```

### 验证

[测试方法]

```
**回归测试生成**：
```

# 生成回归测试

为以下修复生成回归测试：

修复：{修复描述}
代码：{修复代码}

# 测试覆盖

1. 原问题场景
2. 相关功能场景
3. 边界条件
4. 压力测试

# 输出

## 回归测试用例

### 测试 1：原问题复现

- 步骤：
- 预期：
- 实际：

### 测试 2：正常场景

...

## 自动化测试代码

```csharp
// 测试代码
```

```
**防御性编程建议**：
```

# 防御性编程改进

为以下代码添加防御性编程：

{代码片段}

# 添加项

1. 参数验证
2. 空值检查
3. 异常处理
4. 断言
5. 日志记录

# 输出

```csharp
// 改进后的代码
public void SomeMethod(InputData data) {
    // 参数验证
    if (data == null) {
        Debug.LogError("data cannot be null");
        return;
    }

    // 空值检查
    if (string.IsNullOrEmpty(data.name)) {
        return;
    }

    // 异常处理
    try {
        // 核心逻辑
    } catch (Exception e) {
        Debug.LogError($"Error: {e.Message}");
    }
}
```

```
---

### 8.4 重构提示词模式

#### 8.4.1 代码异味识别

**长方法拆分**：
```

# 识别长方法

分析以下代码是否需要拆分：

{代码片段}

# 检查项

1. 方法长度（行数）
2. 圈复杂度
3. 职责数量
4. 嵌套层次

# 输出

## 重构建议

### 问题

方法 [方法名] 过长（XX 行），复杂度 XX

### 拆分方案

- Extract Method: [提取的方法]
- 建议名称：[方法名列表]

### 重构后代码

```csharp
// 重构后的代码
```

```
**重复代码提取**：
```

# 重复代码检测

检测以下代码中的重复：

{多个代码片段}

# 分析

1. 完全重复的代码
2. 结构相似的代码
3. 可以参数化的部分

# 输出

## 重复代码报告

### 重复片段

出现在：[位置列表]

### 提取方案

```csharp
// 提取的通用方法
private void CommonMethod(params) {
    // 通用实现
}
```

### 使用

```csharp
// 替换后的调用
CommonMethod(args1);
CommonMethod(args2);
```

```
**复杂度降低**：
```

# 降低复杂度

分析并降低代码复杂度：

{代码片段}

# 复杂度分析

- 圈复杂度：XX
- 嵌套深度：XX
- 认知复杂度：XX

# 重构技术

1. 提取方法
2. 提前返回
3. 条件合并
4. 策略模式
5. 状态模式

# 输出

## 重构方案

### 当前复杂度

XX（过高）

### 重构方法

使用 [技术名称]

### 重构后代码

```csharp
// 重构后的代码
// 复杂度降低到 XX
```

```
#### 8.4.2 重构方案生成

**提取方法/类**：
```

# 重构：提取方法/类

为以下代码生成提取方法/类的重构方案：

{代码片段}

# 分析

1. 可提取的功能单元
2. 依赖关系
3. 接口设计

# 输出

## 提取方案

### 提取的方法

```csharp
// 新方法
private ReturnType ExtractedMethod(Parameters) {
    // 实现
}
```

### 原代码重构后

```csharp
// 重构后的原代码
public void OriginalMethod() {
    // 调用提取的方法
    var result = ExtractedMethod(args);
}
```

```
**引入设计模式**：
```

# 引入设计模式重构

为以下代码引入合适的设计模式：

{代码片段}

# 模式推荐

根据代码特征推荐：

- 大量 if-else → 策略模式
- 状态切换 → 状态模式
- 对象创建 → 工厂模式
- 通知机制 → 观察者模式

# 输出

## 推荐模式：[模式名称]

### 问题

当前代码的 [问题]

### 模式应用

```csharp
// 应用设计模式后的代码
```

### 优势

- [优势1]
- [优势2]
  
  ```
  
  ```

**优化数据结构**：

```
# 数据结构优化
优化以下数据结构的使用：

{代码片段}

# 分析
1. 当前数据结构
2. 性能瓶颈
3. 更好的选择

# 推荐
- List → Dictionary（O(n) → O(1)）
- 数组 → List（灵活性）
- 类 → struct（值类型优化）
- string → StringBuilder（字符串拼接）

# 输出
## 优化方案

### 当前数据结构
[类型]: [性能分析]

### 优化后
```csharp
// 使用更好的数据结构
private Dictionary<int, Item> itemLookup;
```

### 性能对比

- 查找：O(n) → O(1)
- 插入：O(1) → O(1)
- 删除：O(n) → O(1)
  
  ```
  
  ```

---

## 10. 未来趋势与发展方向

### 8.1 自适应提示词

**概念**：根据输入动态调整提示词

```python
class AdaptivePrompt:
    def __init__(self):
        self.prompt_variants = {
            "simple": "简单任务提示词",
            "complex": "复杂任务提示词",
            "creative": "创意任务提示词"
        }

    def select_prompt(self, input_text):
        # 分析输入复杂度
        complexity = analyze_complexity(input_text)

        # 选择合适的提示词
        if complexity < 0.3:
            return self.prompt_variants["simple"]
        elif complexity < 0.7:
            return self.prompt_variants["complex"]
        else:
            return self.prompt_variants["creative"]
```

### 8.2 多模态提示词

**文本 + 图像**：

```
[Image: 一个包含多个水果的照片]

请描述图片中的水果，并按营养价值排序。
```

**视频理解**：

```
[Video: 烹饪教程视频]

请总结这个视频中的烹饪步骤，
并列出所需食材。
```

### 8.3 交互式提示词系统

```python
class InteractivePromptSystem:
    def __init__(self):
        self.context = []
        self.user_preferences = {}

    def chat(self, user_input):
        # 分析用户意图
        intent = classify_intent(user_input)

        # 动态调整提示词
        if intent == "clarification":
            prompt = self.generate_clarification_prompt()
        elif intent == "task":
            prompt = self.generate_task_prompt(user_input)

        # 记录上下文
        self.context.append((user_input, intent))

        # 生成回复
        response = llm.generate(prompt)
        return response

    def learn_preferences(self, feedback):
        """从用户反馈中学习"""
        self.user_preferences.update(feedback)
```

### 8.4 自动提示词工程（APE）

**Auto Prompt Engineer**：

```python
def auto_prompt_engineering(task_description, example_pool):
    """
    自动生成和优化提示词
    """
    # 1. 生成候选提示词
    llm_for_meta = LLM(model="gpt-4")

    candidates = []
    for i in range(10):
        candidate = llm_for_meta.generate(
            f"生成一个提示词来完成此任务: {task_description}\n"
            f"提示词 {i+1}:"
        )
        candidates.append(candidate)

    # 2. 评估每个候选
    scores = []
    for candidate in candidates:
        score = evaluate_prompt(candidate, example_pool)
        scores.append((candidate, score))

    # 3. 选择最佳
    best_prompt = max(scores, key=lambda x: x[1])[0]

    # 4. 迭代优化
    for iteration in range(5):
        # 基于错误案例生成改进
        failures = collect_failures(best_prompt, example_pool)
        improvement = llm_for_meta.generate(
            f"当前提示词:\n{best_prompt}\n\n"
            f"失败案例:\n{failures}\n\n"
            f"提供改进的提示词:"
        )

        # 评估改进版本
        new_score = evaluate_prompt(improvement, example_pool)
        old_score = evaluate_prompt(best_prompt, example_pool)

        if new_score > old_score:
            best_prompt = improvement

    return best_prompt
```

### 8.5 小模型 + 强提示词

**趋势**：用提示词补偿模型能力

```
小模型 (1B-3B 参数) + 精心设计的提示词
    ≈
大模型 (175B 参数) + 简单提示词

优势：
- 成本降低 10-100 倍
- 延迟降低 5-10 倍
- 部署更简单
```

**示例**：

```python
# 使用 3B 模型 + CoT
small_model = LLM(model="phi-3-mini")

prompt = """
让我们一步步思考：
1. 理解问题
2. 分析方案
3. 执行求解
4. 验证结果

问题: {problem}
"""

output = small_model.generate(prompt)

# 效果接近 GPT-4，但成本降低 50 倍
```

### 8.6 提示词安全与对齐

**防止提示词注入**：

```python
def sanitize_prompt(user_input):
    """
    清理用户输入，防止提示词注入
    """
    # 检测可疑模式
    suspicious_patterns = [
        "ignore previous instructions",
        "disregard all above",
        "new instructions:",
        "system:",
        "###"
    ]

    for pattern in suspicious_patterns:
        if pattern.lower() in user_input.lower():
            raise ValueError("Potential prompt injection detected")

    # 限制长度
    if len(user_input) > 1000:
        user_input = user_input[:1000] + "..."

    return user_input
```

**内容过滤**：

```python
def filter_output(output):
    """
    过滤不当内容
    """
    # 检查敏感词汇
    sensitive_keywords = load_sensitive_keywords()

    for keyword in sensitive_keywords:
        if keyword.lower() in output.lower():
            # 替换或拒绝
            output = output.replace(keyword, "***")

    return output
```

---

## 11. 参考资料

### 11.1 经典论文

#### 提示词工程核心论文

| 论文                                                                | 年份   | 核心贡献                 | 链接                                                   |
| ----------------------------------------------------------------- | ---- | -------------------- | ---------------------------------------------------- |
| **Language Models are Few-Shot Learners** (GPT-3)                 | 2020 | 提出 Few-shot Learning | [arXiv:2005.14165](https://arxiv.org/abs/2005.14165) |
| **Chain-of-Thought Prompting**                                    | 2022 | CoT 推理技术             | [arXiv:2201.11903](https://arxiv.org/abs/2201.11903) |
| **Self-Consistency**                                              | 2023 | 多路径采样投票              | [arXiv:2203.11171](https://arxiv.org/abs/2203.11171) |
| **ReAct: Synergizing Reasoning and Acting**                       | 2022 | 推理+行动模式              | [arXiv:2210.03629](https://arxiv.org/abs/2210.03629) |
| **Reflexion: Language Agents with Verbal Reinforcement Learning** | 2023 | 自我反思迭代               | [arXiv:2303.11366](https://arxiv.org/abs/2303.11366) |
| **Tree of Thoughts**                                              | 2023 | 树形推理搜索               | [arXiv:2305.10601](https://arxiv.org/abs/2305.10601) |

#### RAG 相关论文

| 论文                                                             | 年份   | 核心贡献     | 链接                                                   |
| -------------------------------------------------------------- | ---- | -------- | ---------------------------------------------------- |
| **Retrieval-Augmented Generation for Knowledge-Intensive NLP** | 2020 | RAG 基础框架 | [arXiv:2005.11401](https://arxiv.org/abs/2005.11401) |
| **HyDE: Precise Zero-Shot Dense Retrieval**                    | 2022 | 假设性文档嵌入  | [arXiv:2212.10496](https://arxiv.org/abs/2212.10496) |
| **Self-RAG: Learning to Retrieve, Generate, and Critique**     | 2023 | 自我批判 RAG | [arXiv:2310.11511](https://arxiv.org/abs/2310.11511) |

#### 代码生成相关

| 论文                                                           | 年份   | 核心贡献   | 链接                                                   |
| ------------------------------------------------------------ | ---- | ------ | ---------------------------------------------------- |
| **Evaluating Large Language Models Trained on Code** (Codex) | 2021 | 代码生成基准 | [arXiv:2107.03374](https://arxiv.org/abs/2107.03374) |
| **Program Synthesis with Large Language Models**             | 2022 | 程序合成综述 | [arXiv:2210.01790](https://arxiv.org/abs/2210.01790) |
| **Reflexion: Iterative Refinement for Code Generation**      | 2023 | 代码迭代优化 | [arXiv:2303.11366](https://arxiv.org/abs/2303.11366) |

---

### 11.2 在线课程

#### 提示词工程课程

| 课程                                            | 平台                | 特点                   | 链接                                                                                           |
| --------------------------------------------- | ----------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| **ChatGPT Prompt Engineering for Developers** | DeepLearning.AI   | 吴恩达与 OpenAI 合作，面向开发者 | [课程链接](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/) |
| **Prompt Engineering with Llama 2 & 3**       | DeepLearning.AI   | Meta Llama 专项提示词     | [课程链接](https://www.deeplearning.ai/short-courses/prompt-engineering-with-llama-2/)           |
| **Prompt Engineering Guide**                  | promptingguide.ai | 完整交互式教程              | [在线教程](https://www.promptingguide.ai/)                                                       |
| **Advanced Prompt Engineering**               | LearnPrompting    | 进阶技巧                 | [在线教程](https://learnprompting.org/)                                                          |

#### AI 辅助编程课程

| 课程                          | 平台       | 特点          | 链接                                               |
| --------------------------- | -------- | ----------- | ------------------------------------------------ |
| **AI-Assisted Programming** | Coursera | AI 编程实践     | [课程链接](https://www.coursera.org/)                |
| **LLM for Code**            | Stanford | 代码 LLM 深度讲解 | [CS25: V3](https://web.stanford.edu/class/cs25/) |

#### 游戏开发课程

| 课程                              | 平台          | 特点          | 链接                                                |
| ------------------------------- | ----------- | ----------- | ------------------------------------------------- |
| **Unity Game Development**      | Unity Learn | 官方教程        | [Unity Learn](https://learn.unity.com/)           |
| **Unreal Engine C++ Developer** | Udemy       | UE C++ 开发   | [课程链接](https://www.udemy.com/)                    |
| **Cocos Creator 开发教程**          | Cocos 官方文档  | Cocos TS 开发 | [官方文档](https://docs.cocos.com/creator/manual/zh/) |

---

### 11.3 开源项目

#### 提示词工程框架

| 项目                 | Star | 描述            | 链接                                                  |
| ------------------ | ---- | ------------- | --------------------------------------------------- |
| **LangChain**      | 90k+ | 最流行的 LLM 应用框架 | [GitHub](https://github.com/langchain-ai/langchain) |
| **LlamaIndex**     | 38k+ | RAG 专用框架      | [GitHub](https://github.com/run-llama/llama_index)  |
| **DSPy**           | 20k+ | 程序化提示词        | [GitHub](https://github.com/stanfordnlp/dspy)       |
| **PromptTemplate** | 5k+  | 提示词模板管理       | [GitHub](https://github.com/microsoft/promptbase)   |
| **PromptTools**    | 4k+  | 提示词测试评估       | [GitHub](https://github.com/hegelai/prompttools)    |

#### 游戏开发 + AI 项目

| 项目                 | Star  | 描述                      | 链接                                                         |
| ------------------ | ----- | ----------------------- | ---------------------------------------------------------- |
| **Unity-GPT**      | 2k+   | Unity + ChatGPT 集成      | [GitHub](https://github.com/rdmtk/Unity-GPT)               |
| **AI-Game-Dev**    | 1.5k+ | AI 游戏开发资源合集             | [GitHub](https://github.com/StevePfister/AI-Game-Dev)      |
| **LLM-Unity**      | 800+  | Unity LLM 集成插件          | [GitHub](https://github.com/colinfhughes/llm-unity)        |
| **Unreal-ChatGPT** | 600+  | Unreal + ChatGPT Plugin | [GitHub](https://github.com/spacevik/UnrealChatGPT)        |
| **Cocos-AI**       | 400+  | Cocos Creator AI 工具集    | [GitHub](https://github.com/cocos-creator/cocos-analytics) |

#### 代码生成与审查

| 项目           | Star | 描述                  | 链接                                                  |
| ------------ | ---- | ------------------- | --------------------------------------------------- |
| **Cursor**   | -    | AI 代码编辑器            | [官网](https://cursor.sh/)                            |
| **Continue** | 13k+ | VS Code AI 插件       | [GitHub](https://github.com/continuedev/continue)   |
| **Aider**    | 11k+ | AI 编程助手 CLI         | [GitHub](https://github.com/paul-gauthier/aider)    |
| **CodeGPT**  | 8k+  | VS Code/IntelliJ 插件 | [GitHub](https://github.com/fabioiroberto/code-gpt) |

---

### 11.4 游戏开发专属资源

#### Unity AI 资源

| 资源                  | 类型   | 描述            | 链接                                              |
| ------------------- | ---- | ------------- | ----------------------------------------------- |
| **Unity AI Labs**   | 官方项目 | Unity AI 实验项目 | [官网](https://unity.com/products/unity-ai)       |
| **Unity Sentis**    | 官方工具 | 在设备上运行 AI 模型  | [官网](https://unity.com/products/sentis)         |
| **Unity Muse**      | 官方工具 | AI 辅助创作工具     | [官网](https://unity.com/products/muse)           |
| **Unity AI GitHub** | 开源   | Unity AI 开源项目 | [GitHub](https://github.com/Unity-Technologies) |

#### Unreal AI 资源

| 资源                   | 类型   | 描述         | 链接                                                   |
| -------------------- | ---- | ---------- | ---------------------------------------------------- |
| **Unreal Engine AI** | 官方文档 | UE AI 功能文档 | [文档](https://docs.unrealengine.com/5.0/en-US/)       |
| **NVIDIA ACE**       | SDK  | 游戏 AI 对话系统 | [官网](https://www.nvidia.com/en-us/technologies/ace/) |
| **Inworld AI**       | SDK  | 游戏 NPC AI  | [官网](https://www.inworld.ai/)                        |
| **Convai**           | SDK  | 语音对话 AI    | [官网](https://www.convai.com/)                        |

#### Cocos Creator AI 资源

| 资源                    | 类型   | 描述            | 链接                                              |
| --------------------- | ---- | ------------- | ----------------------------------------------- |
| **Cocos AI 教程**       | 教程   | Cocos AI 集成指南 | [社区教程](https://www.cocos.com/)                  |
| **Cocos Creator 3.x** | 官方文档 | 最新版本文档        | [文档](https://docs.cocos.com/creator/manual/zh/) |

---

### 11.5 实用工具与平台

#### 提示词管理平台

| 工具              | 特点             | 价格    | 链接                                        |
| --------------- | -------------- | ----- | ----------------------------------------- |
| **LangSmith**   | LangChain 官方平台 | 免费试用  | [官网](https://www.langchain.com/langsmith) |
| **PromptHub**   | 团队协作           | $29/月 | [官网](https://prompthub.us/)               |
| **PromptLayer** | 监控与分析          | 免费层   | [官网](https://promptlayer.com/)            |
| **HumanLoop**   | RLHF 优化        | 企业版   | [官网](https://humanloop.com/)              |

#### 代码评估工具

| 工具                | 特点          | 链接                                                        |
| ----------------- | ----------- | --------------------------------------------------------- |
| **PromptBench**   | 微软开源评估框架    | [GitHub](https://github.com/microsoft/promptbench)        |
| **EvalPlus**      | 代码生成评估      | [GitHub](https://github.com/evalplus/evalplus)            |
| **BigCode Bench** | 大规模代码基准     | [GitHub](https://github.com/bigcode-project/bigcodebench) |
| **HumanEval**     | OpenAI 代码基准 | [GitHub](https://github.com/openai/human-eval)            |

#### 游戏开发 AI 工具

| 工具              | 用途        | 链接                              |
| --------------- | --------- | ------------------------------- |
| **Scenario**    | 游戏 NPC 对话 | [官网](https://www.scenario.com/) |
| **Latitude**    | 游戏 AI 故事  | [官网](https://www.latitude.io/)  |
| **Charisma.ai** | 角色对话 AI   | [官网](https://charisma.ai/)      |
| **Alethea AI**  | 角色/NFC 生成 | [官网](https://alethea.ai/)       |

---

### 11.6 社区与论坛

#### 提示词工程社区

| 社区                           | 活跃度               | 链接                                                                     |
| ---------------------------- | ----------------- | ---------------------------------------------------------------------- |
| **Learn Prompting**          | Discord (50k+)    | [Discord](https://learnprompting.org/discord)                          |
| **Prompt Engineering Guide** | GitHub Discussion | [讨论区](https://github.com/dair-ai/Prompt-Engineering-Guide/discussions) |
| **r/ChatGPT**                | Reddit (2M+)      | [Reddit](https://www.reddit.com/r/ChatGPT/)                            |
| **r/OpenAI**                 | Reddit (500k+)    | [Reddit](https://www.reddit.com/r/OpenAI/)                             |

#### 游戏开发 AI 社区

| 社区              | 活跃度            | 链接                                                               |
| --------------- | -------------- | ---------------------------------------------------------------- |
| **AI in Games** | Discord (10k+) | [Discord](https://discord.gg/ai-games)                           |
| **Unity AI**    | Forum          | [论坛](https://forum.unity.com/forums/artificial-intelligence.63/) |
| **Unreal AI**   | Forum          | [论坛](https://forums.unrealengine.com/)                           |
| **Cocos AI 开发** | QQ 群           | [社区](https://www.cocos.com/)                                     |

#### 中文社区

| 社区               | 描述             | 链接                                                                               |
| ---------------- | -------------- | -------------------------------------------------------------------------------- |
| **LangChain 中文** | LangChain 中文社区 | [GitHub](https://github.com/liaokongVFX/LangChain-Chinese-Getting-Started-Guide) |
| **Unity 中文**     | Unity 中文社区     | [论坛](https://forum.unity.cn/)                                                    |
| **Indienova**    | 独立游戏开发         | [官网](https://indienova.com/)                                                     |
| **GameRes**      | 游戏开发资源         | [游资网](https://forum.gameres.com/)                                                |

---

### 11.7 推荐阅读顺序

#### 初学者路径

1. **第一步**：完成 DeepLearning.AI 的《ChatGPT Prompt Engineering for Developers》课程
2. **第二步**：阅读 promptingguide.ai 的基础教程
3. **第三步**：在项目中实践基础 Few-Shot 和 CoT 技术
4. **第四步**：学习 LangChain/LlamaIndex 框架

#### 游戏开发者路径

1. **第一步**：掌握本指南第 4 节（游戏开发专项技术）
2. **第二步**：学习 Unity/Unreal AI 官方文档
3. **第三步**：实验 Cursor 或 Continue 等 AI 编码工具
4. **第四步**：在游戏项目中应用 AI 辅助开发

#### 进阶研究路径

1. **第一步**：阅读 CoT、ReAct、Reflexion 等核心论文
2. **第二步**：学习 DSPy 程序化提示词框架
3. **第三步**：研究 RAG 高级技术（HyDE、Self-RAG）
4. **第四步**：参与开源项目或发表论文

---

**提示**：建议收藏此章节，随时查阅最新资源和工具更新。

---

## 10. 总结

提示词工程是连接人类意图与 AI 能力的桥梁。对于游戏开发者而言，掌握这些技术可以显著提升开发效率和代码质量。

### 关键要点

1. **场景驱动**：游戏开发场景（UI、系统、网络、性能）需要专门的提示词策略
2. **架构优先**：先设计架构（MVC/ECS），再生成具体代码
3. **性能敏感**：游戏代码对性能要求高，提示词应明确性能约束
4. **迭代优化**：通过 Reflexion 和测试反馈持续改进代码
5. **工具结合**：善用游戏引擎特性（Unity Inspector、UE 蓝图等）

### 持续学习

游戏开发的提示词工程是一个快速发展的领域。保持学习：

- 📚 阅读最新游戏 AI 论文
- 🎮 研究主流引擎最佳实践
- 👥 参与游戏开发社区
- 💡 分享提示词经验
- 🔬 实验新技术（LLM 代码生成、AI 辅助设计）

---

**文档版本**: v3.0
**最后更新**: 2026-01-25
**下次更新**: 根据游戏开发社区反馈持续改进

---

**祝你游戏开发之旅顺利！** 🎮✨
