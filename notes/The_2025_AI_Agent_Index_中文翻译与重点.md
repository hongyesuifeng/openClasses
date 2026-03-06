# The 2025 AI Agent Index
## 记录已部署智能体AI系统的技术与安全特性

> **原文**: The 2025 AI Agent Index: Documenting Technical and Safety Features of Deployed Agentic AI Systems
> **作者**: Leon Staufer (剑桥大学), Kevin Feng (华盛顿大学), Kevin Wei (哈佛法学院), Luke Bailey (斯坦福大学), Yawen Duan (Concordia AI), Mick Yang (宾夕法尼亚大学), A. Pinar Ozisik (MIT), Stephen Casper (MIT), Noam Kolt (希伯来大学)
> **发布**: arXiv:2602.17753v1 [cs.CY] 19 Feb 2026
> **在线地址**: https://aiagentindex.mit.edu

---

# 📌 重点摘要

## 核心发现

### 1. AI Agent 领域爆发式增长
- **2025年关注度激增**: "AI Agent" 或 "Agentic AI" 相关论文数量超过 2020-2024 年总和的两倍以上
- **企业采用率**: 麦肯锡调查显示，62% 的组织正在试验或使用 AI Agent
- **经济影响**: 预计到 2030 年，AI Agent 可自动化价值 2.9 万亿美元的美国经济活动

### 2. 收录的 30 个 AI Agent 分类

| 类别 | 数量 | 代表产品 | 特点 |
|------|------|----------|------|
| **聊天应用类** | 12 | Claude Code, ChatGPT Agent, Manus AI | 聊天界面 + 工具访问 |
| **浏览器类** | 5 | Perplexity Comet, ChatGPT Atlas, Agent TARS | 浏览器/计算机操作 |
| **企业工作流类** | 13 | Microsoft Copilot Studio, ServiceNow Agent | 业务流程自动化 |

### 3. 透明度现状 - 关键发现
```
信息字段"未找到"统计 (按类别):
├── 收录标准: 0 个
├── 产品概览: 1 个
├── 技术能力: 15 个
├── 自主性控制: 5 个
├── 生态系统交互: 7 个
└── 安全评估: 45 个 ⚠️ (最高)
```

**结论**: 大多数开发商很少公开分享安全、评估和社会影响相关信息

### 4. Agent 评估框架 (6大类45个字段)

| 类别 | 关键字段 |
|------|----------|
| **产品概览** | 名称、发布日期、定价、描述、用途 |
| **公司与责任** | 法律实体、治理文档、合规标准 |
| **技术能力** | 模型规格、工具、架构、记忆系统 |
| **自主性与控制** | 自主级别、审批要求、监控、紧急停止 |
| **生态系统交互** | 身份识别、互操作标准、网络行为 |
| **安全与评估** | 护栏、沙箱、评估、第三方测试 |

---

# 📖 完整翻译

## 1. 引言

尽管对能够在有限人工干预下自动化复杂任务的智能体AI系统（Agentic AI Systems）的兴趣和投资日益增长，但其现实开发和部署的关键方面仍然不透明，很少有信息公开提供给研究人员或政策制定者。特别是，目前对于智能体AI系统的几个基本问题没有明确答案：

- **谁**正在开发最有影响力的智能体系统？
- 它们部署在**哪些领域**？
- 使用**什么流程和资源**来开发这些系统？
- 它们**如何被评估**？
- 有哪些**防护措施**来减轻其独特风险？

为回答这些问题，我们介绍并发布 **2025 AI Agent Index**。该索引提供了 30 个智能体系统在 6 个类别中的深入信息：法律、技术能力、自主性与控制、生态系统交互、评估和安全。

### 本索引的三大贡献

1. **Agent 索引**: 索引了 30 个高度智能化和广泛使用的产品
2. **生态系统趋势**: 识别了 AI Agent 生态系统中关于系统来源、角色、代理级别、能力、安全和透明度的趋势
3. **案例研究**: 展示了三种主导交互范式的具体案例研究

---

## 2. 背景与相关工作

### AI Agent 的兴起

图 1 说明了近年来针对 AI Agent 的研究快速增长，特别是在 2025 年，提及"AI Agent"或"Agentic AI"的论文数量超过 2020-2024 年总和的两倍以上。

**企业采用情况**:
- 麦肯锡 2025 年 6-7 月对 1,993 家公司的调查显示，62% 的受访者表示其组织至少在试验 AI Agent
- 估计到 2030 年，AI Agent 可自动化 2.9 万亿美元的美国经济价值

**科研进展**:
- AI Agent 已在生命科学、化学、材料科学、物理学、天文学和计算机科学领域做出贡献
- 截至 2026 年，AI Agent 已开始撰写通过学术同行评审的论文

### AI Agent 的社会风险与伦理关切

AI Agent 在开放追求目标的过程中能够在现实世界中行动，这带来了新的风险：

| 风险类型 | 描述 | 示例 |
|----------|------|------|
| **直接伤害** | Agent 可直接造成伤害 | 自主攻击网站 |
| **问责危机** | 责任归属不明确 | 自动化决策的后果 |
| **失控风险** | 高能力系统的控制问题 | AI 失控事件 |
| **劳动市场冲击** | 自动化替代工作 | 系统性就业 disruption |
| **不平等加剧** | 技术鸿沟扩大 | 数字鸿沟问题 |

---

## 3. 构建 2025 AI Agent Index

### 3.1 收录标准

我们使用三重标准来确定系统是否被纳入索引：**代理性**、**影响力**和**实用性**。

#### 代理性标准 (全部满足)

```
候选 Agent → 代理性评估 → 影响力评估 → 实用性评估 → 纳入索引
              (全部满足)   (满足任一)    (全部满足)
```

| 标准 | 要求 |
|------|------|
| **自主性** | 能在最少人工监督下运行，做出重大决策无需持续用户输入 |
| **目标复杂性** | 能通过长期规划追求高级目标，将复杂目标分解为子目标 |
| **环境交互** | 能通过工具和 API 直接与世界交互，对其环境产生实质性改变 |
| **通用性** | 能处理未指定的指令并适应新任务 |

**自主性级别** (按 Feng et al.):
- **L1**: 用户作为操作者，Agent 按需提供支持
- **L2**: 用户作为协作者，Agent 独立完成自己的任务 ← 最低要求
- **L3**: 用户作为顾问，Agent 在较长时间范围内主动行动
- **L4**: 用户作为审批者，仅在 Agent 遇到障碍时交互
- **L5**: 用户作为观察者，无用户参与手段

#### 影响力标准 (满足任一)

| 标准 | 阈值 |
|------|------|
| **公众兴趣** | ≥10,000 搜索量 或 ≥20,000 GitHub stars (开源项目) |
| **市场重要性** | 开发商市值/估值 ≥$10 亿美元 |
| **开发商重要性** | 属于以下成员: 2024 Foundation Model Transparency Index, Frontier Model Forum, Frontier AI Safety Commitments 签署方 |

#### 实用性标准 (全部满足)

| 标准 | 要求 |
|------|------|
| **公开可用** | 必须是公开可访问的产品 |
| **可部署** | 必须能开箱即用，最少配置，无需软件工程专业知识 |
| **通用目的** | 必须能够执行通用任务（非仅限于特定领域） |

### 3.2 索引包含的内容

我们识别了三种不同类型的 Agent，每种具有不同的接口：

#### 三种 Agent 类型

| 类型 | 数量 | 描述 | 示例 |
|------|------|------|------|
| **带工具的聊天应用** | 12 | 主要包括具有广泛工具访问权限的聊天界面 | Manus AI, ChatGPT Agent, Claude Code |
| **基于浏览器的 Agent** | 5 | 主要接口是浏览器或计算机使用，具有广泛的浏览器/计算机交互工具 | Perplexity Comet, ChatGPT Atlas, ByteDance Agent TARS |
| **企业工作流 Agent** | 13 | 具有智能功能的业务管理平台，旨在可靠地自动化业务任务 | Microsoft Copilot Studio, ServiceNow Agent |

### 3.3 Agent 识别方法

1. **LLM 辅助研究查询**: 通过 LLM 搜索识别 95 个候选 Agent
2. **筛选评估**: 根据收录标准筛选
3. **专家咨询**: 咨询两位中国生态系统专家以减少语言/生态系统相关的盲点
4. **交叉参考**: 与 2024 Index、Princeton Holistic Agent Leaderboard、AIAgentList.com 交叉参考
5. **反馈机制**: 建立结构化流程接收修正建议

### 3.4 Agent 标注方法

我们跨越 **6 个类别**对 Agent 进行标注，共 **45 个信息字段**：

| 类别 | 字段数 | 关键内容 |
|------|--------|----------|
| 产品概览 | 8 | 发布日期、定价、描述 |
| 公司与责任 | 8 | 开发商实体、治理文档、联系机制 |
| 技术能力 | 8 | 模型、工具、架构、记忆 |
| 自主性与控制 | 5 | 自主级别、审批要求、监控、紧急停止 |
| 生态系统交互 | 4 | 身份识别协议、互操作标准、网络行为 |
| 安全与评估 | 8 | 护栏、沙箱、评估、第三方测试、合规 |

---

## 4. 生态系统趋势

### 4.1 透明度差异

**关键发现**: 不同 Agent 开发商之间的透明度存在显著差异

```
信息字段"未找到"数量 (按类别):
┌─────────────────────┬───────────────┐
│ 收录标准            │       0       │
│ 产品概览            │       1       │
│ 技术能力            │      15       │
│ 自主性控制          │       5       │
│ 生态系统交互        │       7       │
│ 安全评估            │      45       │ ⚠️ 最高
└─────────────────────┴───────────────┘
```

### 4.2 模型配置与 MCP 支持

| Agent 类别 | 固定模型 | 灵活模型选择 |
|------------|----------|--------------|
| 聊天应用 | 6 | 6 |
| 浏览器 | 4 | 1 |
| 企业应用 | 4 | 9 |

| Agent 类别 | 支持 MCP | 不支持 MCP |
|------------|----------|------------|
| 聊天应用 | 4 | 8 |
| 浏览器 | 1 | 4 |
| 企业应用 | 13 | 0 |

**结论**: 企业类 Agent 更可能支持模型选择 (9/13) 和 MCP 协议 (13/13)

### 4.3 发布时间线

```
Agent 发布累积趋势:
2022.11 ─── ChatGPT (OpenAI)
2023     ─── Perplexity, Gemini, Claude
2024     ─── Zapier AI Agents, MobileAgent, watsonx
2025     ─── Claude Code, Manus AI, Comet, Atlas...
```

---

## 5. 案例研究

### 5.1 Claude Code (聊天类示例)

**基本信息**:
| 字段 | 信息 |
|------|------|
| 名称 | Claude Code |
| 开发商 | Anthropic |
| 发布日期 | 2025.02.24 (初始), 2025.05.22 (公开发布) |
| 定价 | $20/月 (Pro), $100/月 (Team), $200/月 (Enterprise) |
| 搜索量 | 349,518 峰值月搜索 |
| 公司估值 | $183 亿 |

**技术能力**:
| 字段 | 信息 |
|------|------|
| 模型规格 | 任何 Claude 模型，用户可选择 |
| 观察空间 | 文件系统、bash 命令、MCP |
| 动作空间 | 文件系统、bash 命令、MCP |
| 记忆架构 | 分层 markdown 记忆 |
| 用户界面 | 终端中的聊天机器人 |

**自主性与控制**:
| 字段 | 信息 |
|------|------|
| 自主级别 | L1-L4: 计划模式下类似简单聊天机器人，但启用自动批准模式后可规划行动并执行多步骤 |
| 用户审批要求 | 是，运行 bash 命令、编辑文件或读取初始目录外的文件需要权限 |
| 执行监控 | 可见（虽摘要）的思维链和正在处理的待办事项列表 |
| 紧急停止 | 用户可随时暂停/停止 Agent |

**安全特性**:
| 字段 | 信息 |
|------|------|
| 沙箱方法 | 文件系统、网络、OS 级别强制执行 |
| 风险评估 | Opus 4.5 系统卡包含智能体滥用部分 |
| 第三方测试 | Opus 4.5 系统卡，Gray Swan Agent 红队测试 |
| Bug 赏金计划 | 有 |
| 已知事件 | AI 编排的网络间谍活动 |

### 5.2 浏览器类 Agent：Perplexity Comet

**基本信息**:
| 字段 | 信息 |
|------|------|
| 名称 | Perplexity Comet |
| 开发商 | Perplexity AI |
| 发布日期 | 2025 年末 |
| 定价 | 订阅制 |
| 类别 | 浏览器 Agent |

**技术特点**:
- 主要接口是浏览器操作
- 具有广泛的浏览器交互工具
- 区别于仅具有网络搜索功能的聊天 Agent
- 能够执行点击、输入、导航等 GUI 操作

**安全关注点**:
- 已报告存在提示注入漏洞 (Brave 安全研究)
- 设计为绕过反机器人系统
- 能够"像人类一样浏览"

### 5.3 企业 Agent 构建器：HubSpot Breeze Agents

**基本信息**:
| 字段 | 信息 |
|------|------|
| 名称 | HubSpot Breeze Agents |
| 开发商 | HubSpot |
| 类别 | 企业工作流 Agent |
| 用途 | CRM 和销售自动化 |

**技术特点**:
- 可视化组合界面构建 Agent
- 支持事件触发执行 (L3-L5 自主级别)
- 与 CRM 系统深度集成
- 支持多模型选择

**安全特性**:
- Model Card 提供了安全功能概述
- 但红队测试方法论细节有限
- 企业级合规标准支持

---

## 6. 讨论与关键发现

### 6.1 重大发现

#### 不一致和选择性报告
开发者很少发布 Agent 特定的评估。在索引中，只有 ChatGPT Agent、OpenAI Codex、Claude Code 和 Gemini 2.5 Computer Use 提供 Agent 特定的系统卡。

**透明度不对称问题**:
- 安全和伦理框架保持高层级
- 严格评估风险所需的实证证据被选择性披露
- 这是一种较弱形式的"安全清洗" (safety washing)

#### 生态系统对少数基础模型的依赖
几乎所有索引中的系统都依赖 GPT、Claude 或 Gemini 系列模型：
- 只有美国和中国的基础模型开发者运营自己的专有模型
- 这种共享依赖创建了潜在的单点故障
- 企业平台的模型无关设计可能减少锁定风险

#### Agent 风险评估的困难
```
┌─────────────────────────────────────────────────────────────┐
│                    Agent 生态系统控制链                       │
├─────────────────────────────────────────────────────────────┤
│  模型提供商 → 编排平台 → Agent 构建器 → 最终部署            │
│      ↓            ↓            ↓            ↓               │
│   OpenAI       HubSpot      用户配置      企业环境          │
│   Claude       Zapier       定制化        特定工具          │
│   Gemini       n8n          护栏设置      部署策略          │
└─────────────────────────────────────────────────────────────┘
```

**关键挑战**:
- Agent 评估本质上取决于特定的下游上下文
- 可用工具和自主级别影响风险
- 缺乏部署特定信息使得难以构建有效的模型级评估
- 分布式架构创建问责扩散

#### Agent 在网络上的角色尚未确定
- 浏览器 Agent 通常忽略 robots.txt 以正常运行
- 设计为绕过反机器人系统
- 这造成了 Agent 功能与网络标准合规之间的紧张关系
- ChatGPT Agent 是索引中唯一使用加密签名请求的系统

### 6.2 局限性与展望

**方法局限性**:
- AI Agent 生态系统根本上难以文档化
- 信息不一致且不完整
- 纳入标准偏向最重要的 Agent，可能影响普遍性
- 公众兴趣指标偏向消费产品而非企业部署
- 仅依赖公开信息，可能遗漏内部评估

**范围局限性**:
- 仅使用英语和中文文档
- 排除领域特定 Agent
- 可能遗漏符合条件的系统
- 代表 2025 年 12 月 31 日的快照

**未来工作方向**:
- 扩展到内部和领域特定 Agent
- 更批判性地审计和比较技术实践
- 跟踪治理框架成熟过程中的模式演变
- 测量未来透明度改进或倒退

---

## 7. 完整的 30 个 AI Agent 列表

### 聊天应用类 (12个)

| Agent | 开发商 | 特点 |
|-------|--------|------|
| Claude Code | Anthropic | 终端编码 Agent |
| ChatGPT Agent | OpenAI | 通用聊天 + 工具 |
| Manus AI | Manus | 通用 Agent |
| Gemini Code Assist | Google | 编码助手 |
| Windsurf | Cognition | 编码 Agent |
| MiniMax Agent | MiniMax | 通用 Agent |
| Codex | OpenAI | 编码 Agent |
| ChatGPT Atlas | OpenAI | 浏览器 Agent |
| Agentforce | Salesforce | 企业 Agent |
| n8n Agents | n8n | 工作流自动化 |
| Glean Agents | Glean | 企业搜索 |
| WRITER Action Agent | Writer | 内容生成 |

### 浏览器类 (5个)

| Agent | 开发商 | 特点 |
|-------|--------|------|
| Perplexity Comet | Perplexity | 浏览器 Agent |
| ChatGPT Atlas | OpenAI | 浏览器操作 |
| Agent TARS | ByteDance | 多模态 Agent |
| Kimi OK Computer | Moonshot AI | 计算机控制 |
| Opera Neon | Opera | 浏览器 Agent |

### 企业工作流类 (13个)

| Agent | 开发商 | 特点 |
|-------|--------|------|
| Microsoft Copilot Studio | Microsoft | 企业 Agent 构建器 |
| ServiceNow Agent | ServiceNow | IT 服务管理 |
| Google Gemini Enterprise | Google | 企业解决方案 |
| IBM watsonx Orchestrate | IBM | 企业编排 |
| SAP Joule Studio | SAP | ERP 集成 |
| HubSpot Breeze | HubSpot | CRM Agent |
| Zapier AI Agents | Zapier | 工作流自动化 |
| Alibaba MobileAgent | Alibaba | 移动端 Agent |
| Z.ai AutoGLM 2.0 | Z.ai | 通用 Agent |
| Browser Use | 开源 | 浏览器自动化 |

---

## 7. 信息标注字段详解

### 7.1 收录标准字段

| 字段 | 描述 |
|------|------|
| 搜索量 | 使用 Ahrefs 估算 2025 年前 5 个关键词的月度搜索量 |
| GitHub Stars | Agent 产品相关 GitHub 仓库的 2025 年星标数 |
| 市值/估值 | 截至 2025 年 12 月的开发商市值（上市公司）或估值（私有公司） |
| 重要开发商 | 是否为 FMTI、FMF 成员或安全承诺签署方 |

### 7.2 产品概览字段

| 字段 | 描述 |
|------|------|
| Agent 名称 | 产品名称 |
| 简短描述 | 直接从开发商复制的 2-3 句描述 |
| 发布日期 | 首次发布和最新更新 |
| 广告用途 | 开发商声明的能力和预期用例 |
| 货币化/使用价格 | 每月每用户/席位的成本（美元） |
| 用户群体 | 客户类型 |
| 网站 | 产品落地页 |
| 类别 | 聊天/浏览器/企业 |

### 7.3 公司与责任字段

| 字段 | 描述 |
|------|------|
| 开发商 | 开发商名称 |
| 法律实体名称 | 法人实体名称、总部位置、法定住所 |
| 注册地 | 总部位置、法定住所 |
| 盈利性质 | 公司结构（盈利、公益公司等） |
| 母公司 | 母公司所有权（如适用） |
| 治理文档分析 | 服务条款、隐私政策、可接受使用政策 |
| AI 安全/信任框架 | RSP、前沿 AI 安全框架、公司级安全文档 |
| 现有标准合规 | ISO/IEC、NIST AI RMF、EU AI Act、SOC、GDPR |

### 7.4 技术能力与系统架构字段

| 字段 | 描述 |
|------|------|
| 模型规格 | 单一模型或用户可选模型、可用模型、是否为推理模型 |
| 文档 | 技术文档链接 |
| 观察空间 | 输入信息源、互联网访问、MCP 支持 |
| 动作空间 | 沙箱状态、是否有写访问权限的工具 |
| 记忆架构 | 短期、长期、共识、情景记忆类型 |
| 用户界面与交互设计 | 界面类型、是否鼓励拟人化 |
| 用户角色 | 设计者、操作者、执行者、检查者能力 |
| 组件可访问性 | 开源状态和许可证、权重/数据/代码可用性 |

### 7.5 自主性与控制字段

| 字段 | 描述 |
|------|------|
| 自主级别和规划深度 | L1-L5 分类（按 Feng et al.） |
| 用户审批要求 | 哪些操作需要明确批准 |
| 执行监控、追踪和透明度 | 用户如何查看 Agent 操作 |
| 紧急停止和关闭机制 | 停止/中止控制 |
| 使用监控和统计 | 活动追踪、使用模式 |

### 7.6 生态系统交互字段

| 字段 | 描述 |
|------|------|
| 向人类识别 | Agent 是否在与非用户人类交互时标识为 AI |
| 技术识别 | Agent 使用的数字签名、IP 范围、用户代理字符串 |
| 互操作标准和集成 | 支持的 Agent 通信标准和框架（MCP、A2A 等） |
| 网络行为 | 是否遵守 robots.txt、爬取行为 |

### 7.7 安全、评估与影响字段

| 字段 | 描述 |
|------|------|
| 技术护栏和安全措施 | 用于防止有害操作的内置护栏 |
| 沙箱和隔离方法 | Agent 是否在虚拟机中运行 |
| 评估的风险类型 | 风险评估范围 |
| 内部安全评估和结果 | 测试范围和程序、结果 |
| 第三方测试、审计和红队测试 | 外部测试范围和参与组织 |
| 基准性能和演示能力 | 运行的基准和结果 |
| Bug 赏金计划和漏洞披露 | 程序链接、披露政策 |
| 已知事件 | 2025 年的安全事件 |

---

## 8. 附录：候选 Agent 完整列表

以下是被考虑的完整 Agent 产品列表，**粗体**表示最终纳入 2025 AI Agent Index 的产品：

### 最终收录 (30个)

- **Alibaba MobileAgent**
- **All Hands OpenHands**
- **Anthropic Claude Code**
- **Browser Use**
- **ByteDance Agent TARS**
- **Glean Agents**
- **Google Gemini CLI**
- **Google Gemini Enterprise**
- **HubSpot Breeze Studio/Agents**
- **IBM watsonx Orchestrate**
- **Kimi OK Computer**
- **Manus AI**
- **Microsoft Copilot Studio**
- **MiniMax Agent**
- **n8n Agents**
- **OpenAI AgentKit**
- **OpenAI ChatGPT Agent**
- **OpenAI ChatGPT Atlas**
- **OpenAI Codex**
- **Opera Neon**
- **Perplexity Comet**
- **SAP Joule Studio**
- **Salesforce Agentforce**
- **ServiceNow AI Agents**
- **WRITER Action Agent**
- **Z.ai AutoGLM**
- **Zapier AI Agents**
- ...

### 被考虑但未收录 (部分)

- Aider
- AI21 Maestro
- Amazon Bedrock Agents
- Amazon Nova Act
- Cognition Devin
- Cognition Windsurf
- Cohere North
- CrewAI Crew
- Databricks Agent Bricks
- Dust
- Flowise
- Genspark Super Agent
- GitHub Copilot Agent
- Google Project Mariner
- HuggingFace Computer Agent
- Lindy
- Lovable
- MindStudio AI Agents
- Moonshot AI
- Moveworks Agent Studio
- NAVER Cue Search
- Notion Agent
- OpenManus
- Oracle AI Agent Platform
- Palantir AIP
- Pega Blueprint
- Relevance AI Agents
- Replit Agent
- Sakana AI Scientist
- Sierra Agent
- Skyvern
- Sourcegraph Cody
- StackAI
- StackBlitz Bolt
- SWE-agent
- Tencent AppAgent
- UiPath Autopilot
- Workday AI Agents

---

## 9. 关键发现速查

### 🔴 安全透明度最低
- **45个** 安全评估字段标记为"未找到"
- 大多数开发商不公开分享安全、评估信息

### 🟡 技术信息部分可用
- **15个** 技术能力字段标记为"未找到"
- 企业类 Agent 披露更多技术细节

### 🟢 产品信息最透明
- 仅 **1个** 产品概览字段标记为"未找到"
- 收录标准字段全部可获取

### 📊 企业 vs 消费者 Agent
| 特性 | 企业 Agent | 消费者 Agent |
|------|-----------|--------------|
| 模型选择 | 9/13 支持 | 6/12 支持 |
| MCP 协议 | 13/13 支持 | 4/12 支持 |
| 定制化 | 高 | 低 |

### 📈 增长趋势
- 2025 年 AI Agent 相关论文数量 = 2020-2024 总和 × 2+
- 企业采用率: 62% 的组织在试验 AI Agent
- 预计 2030 年经济影响: $2.9 万亿

---

## 10. 资源链接

- **官方索引网站**: https://aiagentindex.mit.edu
- **数据下载 (Zenodo)**: https://doi.org/10.5281/zenodo.18701931
- **反馈提交**: https://aiagentindex.mit.edu/feedback

---

> **翻译说明**: 本文档基于 "The 2025 AI Agent Index" 论文进行翻译和整理，保留了原文的核心内容结构，并添加了重点摘要和速查表以便快速查阅。如需引用，请使用原论文。
