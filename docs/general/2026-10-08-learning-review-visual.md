# openClasses 学习内容图解

先看图理解关系，再按资料入口查细节。新的学习计划等确定新目标后制定。

## 一 六个领域怎样连接

![openClasses 六领域知识地图](images/openclasses-learning-map.png)

箭头表示一种学习与验证流程；论文也为 Agent、引擎和工程方法提供参考。

| 当前记录 | 依据 |
| --- | --- |
| CS146S、Hello-Agents、Prompt 课程已完成 | 既有学习档案记录 |
| OpenClaw 学习中 | 具体章节待补记 |
| 引擎源码、论文、软件工程与用户研究 | 有资料与样例，掌握程度按具体成果判断 |
| slayDemo | 保留学习资料；实际工程在独立 cocosProjects 项目 |

## 二 三门 Agent 课程的视角

```mermaid
flowchart TB
    A[AI Agent 学习] --> B[CS146S]
    A --> C[Hello-Agents]
    A --> D[OpenClaw 资料]
    B --> B1[开发流程<br/>编码 → 测试 → 评审 → 维护]
    C --> C1[内部机制<br/>规划 · 工具 · 记忆 · 协作 · 评估]
    D --> D1[应用扩展<br/>部署 · 技能 · 工具接入]
```

资料：[CS146S](../../domains/ai-agent/courses/CS146S-The-Modern-Software-Developer/README.md) · [Hello-Agents](../../domains/ai-agent/courses/Hello-Agents/README.md) · [OpenClaw](../../domains/ai-agent/courses/OpenClaw/README.md)

## 三 提示词负责把任务说明白

```mermaid
flowchart LR
    A[任务<br/>要做什么] --> P[明确的任务描述]
    B[上下文<br/>已知什么] --> P
    C[约束与示例<br/>允许什么] --> P
    D[输出与判定<br/>怎样检查] --> P
    P --> E[模型输出]
    E --> F[结构校验]
    F --> G[规则校验]
    G --> H[任务效果检查]
```

**记住：JSON 正确、动作合法、任务成功需要分别检查。**

资料：[提示工程综合指南](PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md)

## 四 Agent 怎样执行任务

```mermaid
flowchart TB
    A[目标与约束] --> B[选择当前上下文]
    M[记忆与检索] --> B
    B --> C[计划或选择动作]
    C --> D[校验工具与参数]
    D --> E[执行工具]
    E --> F[观察结果]
    F --> G{任务完成了吗}
    G -->|否| B
    G -->|是或达到限制| H[输出结果与记录]
    F -.保存相关信息.-> M
```

| 方法 | 图中的重点 |
| --- | --- |
| ReAct | 行动后读反馈，调整下一步 |
| Plan-and-Solve | 先拆出计划，再执行和修订 |
| Reflection | 根据评价修改结果，外部证据帮助纠错 |

资料：[行动模式](../../domains/ai-agent/courses/Hello-Agents/part2-building-agents/ch04-patterns/README.md) · [记忆](../../domains/ai-agent/courses/Hello-Agents/part3-advanced/ch08-memory/README.md) · [上下文](../../domains/ai-agent/courses/Hello-Agents/part3-advanced/ch09-context/README.md)

## 五 记忆 工具与协议的边界

```mermaid
flowchart LR
    M[持久记忆与文档] -->|检索并筛选| C[当前上下文]
    C --> L[模型选择]
    L --> A[Agent 应用<br/>控制流程与检查结果]
    A --> H[MCP Host / Client]
    H <-->|连接与能力交换| S[MCP Server]
    S --> T[工具 · 资源 · 提示模板]
```

**记忆存下后还要取用；MCP 连接能力，应用负责决策流程。**

资料：[通信协议](../../domains/ai-agent/courses/Hello-Agents/part3-advanced/ch10-protocols/README.md) · [MCP 官方架构](https://modelcontextprotocol.io/docs/learn/architecture)

## 六 引擎把状态变成可交互的世界

以下是概念流程，实际调度顺序随引擎与项目实现变化。

```mermaid
flowchart TB
    I[输入与时间] --> U[更新游戏状态]
    U --> S[场景中的对象与数据]
    R[资源加载与缓存] --> S
    S --> P[渲染 · 音频 · UI]
    P --> V[玩家看到反馈]
    V --> I
    C[Cocos 观察重点<br/>Node · Component · 调度 · GFX] -.源码视角.-> S
    G[Godot 观察重点<br/>Node · SceneTree · 信号 · 渲染服务] -.源码视角.-> S
```

资料：[Cocos 源码指南](../../domains/game-engine/guides/cocos-source-learning/README.md) · [Godot 源码指南](../../domains/game-engine/guides/godot-source-learning/README.md)

## 七 slayDemo 的五层架构

```mermaid
flowchart TB
    UI[表现层<br/>显示状态 · 接收操作] -->|请求动作| APP[应用服务<br/>组织出牌等用例]
    APP --> FLOW[流程层<br/>地图 · 战斗 · 奖励等阶段]
    FLOW --> RULE[规则层<br/>资源 · 伤害 · 状态 · 效果]
    DATA[数据层<br/>JSON 定义 · 加载 · 校验] -->|提供定义| RULE
    RULE -.结果与事件.-> APP
    APP -.通知刷新.-> UI
```

**静态卡牌定义与战斗临时状态分开；规则结果由程序计算，UI 负责展示。**

资料：[项目复盘](../../domains/game-engine/godotProjects/slayDemo/docs/project-retrospective.md) · [JSON 数据源 ADR](../../domains/game-engine/godotProjects/slayDemo/docs/adr/0001-use-json-as-source-data.md) · [状态效果设计](../../domains/game-engine/godotProjects/slayDemo/docs/design/06-status-and-buff-system.md)

## 八 工程验证覆盖三个层次

```mermaid
flowchart TB
    A[明确需求与验收条件] --> B[实现或修改]
    B --> C[逻辑检查<br/>规则 · 数值 · 状态变化]
    B --> D[结构检查<br/>节点 · 资源 · 接口约定]
    B --> E[运行与视觉检查<br/>操作 · 布局 · 遮挡 · 动态状态]
    C --> F[判断结果与覆盖范围]
    D --> F
    E --> F
    F -->|发现问题| B
    F -->|满足要求| G[记录结论与适用条件]
```

**截图相似不代表交互正确；测试通过只支持其覆盖的判定条件。**

归档前的 Godot 检查记录：864 项断言、5 项失败、3 条脚本错误。它不代表迁移后的 cocosProjects 工程状态。

资料：[软件工程](../../domains/software-engineering/README.md) · [UI 还原复盘](../../domains/game-engine/godotProjects/slayDemo/docs/tech/17-ui-restoration-lessons.md)

## 九 论文阅读要看机制与证据

```mermaid
flowchart LR
    A[解决什么问题] --> B[改变什么机制]
    B --> C[与基线比较<br/>指标 · 消融]
    C --> D[条件与局限]
    D --> E[对当前学习的启发]
```

| 容易混淆的方法 | 改变的环节 |
| --- | --- |
| LoRA 等微调方法 | 模型参数的适配方式 |
| RAG | 外部知识获取与生成 |
| ReAct | 行动与反馈的组织方式 |

资料：[经典论文目录](../../domains/ai-papers/guides/classic-papers-learning/README.md) · [OpenGame](../../domains/ai-agent/papers/OpenGame_Analysis_Summary.md) · [GameDevBench](../../domains/game-engine/papers/GameDevBench/GameDevBenchSummary.md)

## 十 用户研究要区分事实 解释与方案

```mermaid
flowchart LR
    A[原始反馈<br/>经常找不到弃牌堆] --> B[问题解释<br/>入口或信息层级不清楚]
    B --> C[候选方案<br/>调整入口或提示]
    C --> D[观察或验证]
    D -->|反馈| B
```

### Steam 历史样例的分类

```mermaid
pie showData
    title 2026 年 5 月 14 日样例 465 条讨论
    "中性" : 403
    "负面" : 62
```

正面分类为 0。**非正面 100% ≠ 负面约 13.3%。** 标题关键词分类与板块采样也不代表全部玩家。

资料：[用户研究](../../domains/product-management/core-competencies/user-insight/user-research.md) · [Steam 历史报告](../../steam_data/user_insights_report.md)

## 十一 看图自测

| 看哪张图 | 能否独立解释 |
| --- | --- |
| 提示与校验 | 为什么格式正确仍可能执行失败？ |
| Agent 循环 | 如何停止，如何从错误反馈调整行动？ |
| 记忆与协议 | 存储、检索、上下文、工具分别做什么？ |
| 引擎与分层 | 点击如何改变状态，谁决定规则结果？ |
| 工程验证 | 逻辑、结构、视觉分别能发现什么问题？ |
| 论文与研究 | 方法的证据支持到哪里，数据结论是否成立？ |

[详细解释与 18 道自测题答案](2026-10-08-learning-review.md)
