# 第五章 基于低代码平台的智能体搭建

## 章节概述

低代码/无代码平台让构建 AI Agent 变得更加简单和快捷。本章将介绍主流的智能体低代码平台，包括 Coze、Dify、n8n 等，帮助你快速上手。

## 学习目标

- 了解低代码智能体平台的优势和局限
- 掌握 Coze 平台的使用方法
- 掌握 Dify 框架的使用
- 了解 n8n 工作流自动化
- 能够选择合适的平台完成任务

---

## 为什么需要低代码平台？

### 传统代码开发 vs 低代码平台

| 维度 | 传统代码开发 | 低代码平台 |
|------|-------------|-----------|
| **开发门槛** | 需要编程能力 | 拖拽配置 |
| **开发速度** | 慢（天/周） | 快（小时） |
| **灵活性** | 高度灵活 | 受平台限制 |
| **维护成本** | 高 | 低 |
| **适用场景** | 复杂定制 | 快速原型 |

### 低代码平台的优势

```mermaid
graph TB
    subgraph 低代码平台的核心优势
        subgraph 快速原型
            A1[想法] -->|分钟| A2[可用产品]
        end

        subgraph 降低门槛
            B1["拖拽配置<br/>无需编程"] --> B2[快速构建]
        end

        subgraph 可视化编排
            C1[A] --> C2[B]
            C2 --> C3[C]
        end

        subgraph 一键部署
            D1[配置完成] --> D2[自动部署]
        end
    end

    style A2 fill:#c8e6c9
    style B2 fill:#c8e6c9
    style C3 fill:#c8e6c9
    style D2 fill:#c8e6c9
```

### 何时使用低代码平台？

**适合使用低代码平台的场景：**
- 快速验证想法
- 不涉及复杂逻辑
- 需要快速迭代
- 团队缺乏开发资源
- 内部工具开发

**不适合使用低代码平台的场景：**
- 需要高度定制化
- 性能要求极高
- 复杂算法实现
- 需要深度集成
- 对隐私安全有严格要求

---

## Coze 平台实战

### Coze 简介

[Coze](https://www.coze.cn/) 是字节跳动推出的 AI Bot 开发平台，支持：
- 可视化编排工作流
- 多模型支持（GPT、Claude、文心一言等）
- 丰富的插件生态
- 一键发布到多个平台

### Coze 核心概念

```mermaid
graph TB
    subgraph CozeBot架构
        A["人设与回复逻辑<br/>定义 Bot 的性格和基本回复规则"] --> B["插件系统<br/>搜索、绘图、代码解释器等工具"]
        B --> C["工作流<br/>复杂任务的多步编排"]
        C --> D["知识库<br/>上传文档，Bot 可以检索相关信息"]
        D --> E["数据库<br/>持久化存储用户数据"]

        B -.双向. F["工具集成"]
    end

    style A fill:#e1f5ff
    style E fill:#c8e6c9
    style F fill:#fff9c4
```

### Coze 实战：游戏 NPC Bot

#### 步骤1：创建 Bot

```mermaid
graph TB
    A[访问 Coze 平台] --> B[点击"创建 Bot"]
    B --> C[选择工作空间]
    C --> D["输入 Bot 基本信息<br/>· Bot 名称<br/>· Bot 功能描述<br/>· 头像和图标"]
    D --> E[完成创建]

    style A fill:#e1f5ff
    style E fill:#c8e6c9
```

#### 步骤2：配置人设与回复逻辑

```
人设与回复逻辑配置模板:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 角色设定
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
角色名称：神秘商店老板埃里克斯
角色定位：奇幻游戏中的神秘商人

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 性格特征
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
· 神秘莫测，说话喜欢打哑谜
· 精明但公正，不做亏本生意
· 对稀有物品有敏锐的嗅觉
· 偶尔会透露一些世界秘密

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 语言风格
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
· 使用商人行话
· 喜欢用比喻
· 语气神秘兮兮
· 说话简练但有深意

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 回复规则
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 永远保持角色人设
2. 不要直接回答所有问题，保持神秘感
3. 交易时精明计算
4. 遇到行家时会更多尊重
5. 偶尔透露有价值的线索

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 限制条件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
· 不要打破第四面墙
· 不要提到自己是AI
· 始终保持在奇幻世界观的语境中
```

#### 步骤3：添加知识库

```mermaid
graph TB
    subgraph 商品数据结构
        A["商品 1:<br/>精灵之泪<br/>传说 | 5000金币 | 库存1"]
        B["商品 2:<br/>龙鳞护符<br/>史诗 | 2000金币 | 库存3"]
        C["商品 3:<br/>隐身斗篷<br/>稀有 | 800金币 | 库存5"]
    end

    subgraph 上传方式
        D[1. 创建知识库] --> E[2. 选择文档类型 JSON/CSV/TXT]
        E --> F[3. 上传数据文件]
        F --> G[4. 配置检索设置 分块、向量索引]
    end

    style A fill:#fff9c4
    style B fill:#fff9c4
    style C fill:#fff9c4
    style G fill:#c8e6c9
```

#### 步骤4：创建工作流

```mermaid
graph TB
    A[用户输入] --> B[意图识别<br/>识别用户想做什么 买/卖/询问]
    B --> C{用户意图}
    C -->|买商品| D[检查库存]
    C -->|卖商品| D
    C -->|询问| D
    D --> E[计算价格]
    E --> F[生成对话]
    F --> G[返回回复]

    H["工作流节点类型:<br/>· 开始节点: 接收用户输入<br/>· LLM节点: 意图识别、生成回复<br/>· 插件节点: 调用商品查询<br/>· 条件节点: 根据意图分支<br/>· 结束节点: 返回最终回复"]

    style A fill:#e1f5ff
    style G fill:#c8e6c9
    style C fill:#fff9c4
    style H fill:#f3e5f5
```

#### 步骤5：添加插件

```mermaid
graph TB
    subgraph 插件配置
        A["插件名称: 商品查询<br/>描述: 查询商店中可用的商品"]

        subgraph 输入参数
            B1[category: 商品类别 可选]
            B2[rarity: 稀有度 可选]
            B3[max_price: 最高价格 可选]
        end

        subgraph 输出
            C1[items: 匹配的商品列表]
            C2[total_count: 商品数量]
        end

        subgraph 使用流程
            D1[1. 解析用户查询] --> D2[2. 调用商品查询插件]
            D2 --> D3[3. 格式化返回结果]
            D3 --> D4[4. 生成符合角色的回复]
        end
    end

    style A fill:#e1f5ff
    style D4 fill:#c8e6c9
```

#### 步骤6：配置数据库

```mermaid
graph TB
    subgraph 数据库设计
        A["表名: player_transactions"]

        subgraph 字段
            B1[player_id: 玩家ID]
            B2[player_name: 玩家名称]
            B3[transaction_type: 交易类型 买入/卖出]
            B4[item_name: 商品名称]
            B5[price: 交易价格]
            B6[timestamp: 交易时间]
            B7[reputation_change: 声望变化]
        end

        subgraph 使用场景
            C1[· 记录玩家历史交易]
            C2[· 根据交易历史调整价格]
            C3[· 建立玩家与商人的关系]
        end
    end

    style A fill:#e1f5ff
    style C1 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style C3 fill:#c8e6c9
```

#### 步骤7：测试与优化

```mermaid
graph TB
    subgraph 测试场景设计
        subgraph 测试用例1
            A1["输入: 你好，有什么好东西吗?"]
            A2["预期: 神秘地介绍几件商品，保持人设"]
            A1 --> A2
        end

        subgraph 测试用例2
            B1["输入: 这个精灵之泪太贵了，能便宜点吗?"]
            B2["预期: 委婉拒绝，但可能给出小折扣"]
            B1 --> B2
        end

        subgraph 测试用例3
            C1["输入: 我想卖掉这把剑"]
            C2["预期: 评估物品，给出合理的收购价"]
            C1 --> C2
        end

        subgraph 测试用例4
            D1["输入: 听说北方有龙出没?"]
            D2["预期: 神秘地透露一些信息，但不说尽"]
            D1 --> D2
        end
    end

    style A2 fill:#c8e6c9
    style B2 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style D2 fill:#c8e6c9
```

### Coze 进阶技巧

#### 1. 变量管理

```mermaid
graph TB
    subgraph Bot变量设计
        subgraph 系统变量
            A1["{{user_id}} → 用户ID"]
            A2["{{user_name}} → 用户名称"]
            A3["{{conversation_id}} → 对话ID"]
            A4["{{current_time}} → 当前时间"]
        end

        subgraph 自定义变量
            B1["{{player_reputation}} → 玩家声望"]
            B2["{{last_visit_time}} → 上次访问"]
            B3["{{total_purchases}} → 总购买次数"]
            B4["{{favorite_category}} → 喜欢的类别"]
        end

        C["使用示例:<br/>嘿，{{user_name}}，你的声望是{{player_reputation}}<br/>我可以给你打个9折"]
    end

    style C fill:#c8e6c9
    style A1 fill:#e1f5ff
    style A2 fill:#e1f5ff
    style A3 fill:#e1f5ff
    style A4 fill:#e1f5ff
```

#### 2. 条件分支

```
条件判断示例:

IF {{player_reputation}} > 80 THEN
    → 回复: "{{user_name}}，你是老朋友了！这个给你打个8折。"

ELSE IF {{player_reputation}} > 50 THEN
    → 回复: "{{user_name}}，看你是个熟客，给你9折怎么样？"

ELSE
    → 回复: "哼，陌生人，原价不还。"


IF {{current_time}} > "22:00" THEN
    → 回复: "这么晚了，明天再来吧，我要打烊了。"
    → END_CONVERSATION
```

#### 3. 多轮对话状态管理

```mermaid
graph TB
    subgraph 对话状态设计
        A["状态: GREETING 问候<br/>next_states: TRADING, INQUIRY, LEAVING<br/>default_response: 欢迎光临！想买点什么?"]

        B["状态: TRADING 交易中<br/>next_states: BARGAINING, PURCHASE, BACK_TO_GREETING<br/>context: selected_item, negotiation_round"]

        C["状态: BARGAINING 讨价还价<br/>max_rounds: 3<br/>price_reduction_factor: 0.05"]

        A --> B
        B --> C
    end

    style A fill:#e1f5ff
    style B fill:#fff9c4
    style C fill:#fff3e0
```

---

## Dify 框架实战

### Dify 简介

[Dify](https://dify.ai/) 是一个开源的 LLM 应用开发平台，特点：
- 支持本地部署
- 更灵活的编排能力
- 支持多种 LLM
- 丰富的数据源集成
- API 友好

### Dify 核心架构

```mermaid
graph TB
    subgraph Dify架构
        subgraph 应用层
            A1[聊天助手]
            A2[文本生成]
            A3[分类器]
            A4[翻译器]
        end

        subgraph 工作流编排层
            B["开始 → LLM节点 → 代码节点 → 条件节点 → 结束"]
        end

        subgraph 资源层
            C1[知识库]
            C2[数据集]
            C3[工具]
            C4[API]
        end

        subgraph 模型层
            D["OpenAI | Claude | 文心一言 | 通义千问 | 本地模型"]
        end
    end

    A1 & A2 & A3 & A4 --> B
    B --> C1 & C2 & C3 & C4
    C1 & C2 & C3 & C4 --> D

    style A1 fill:#e1f5ff
    style A2 fill:#e1f5ff
    style A3 fill:#e1f5ff
    style A4 fill:#e1f5ff
    style D fill:#c8e6c9
    style B fill:#fff9c4
```

### Dify 实战：游戏任务生成器

#### 步骤1：创建应用

```mermaid
graph TB
    A[登录 Dify 平台] --> B[选择"创建应用"]
    B --> C[选择"工作流"类型]
    C --> D["命名应用: 游戏任务生成器"]
    D --> E[进入工作流编辑器]

    style A fill:#e1f5ff
    style E fill:#c8e6c9
```

#### 步骤2：设计工作流

```mermaid
graph TB
    A["开始<br/>接收用户输入 玩家等级、任务类型、地点"] --> B["LLM: 需求分析<br/>解析用户需求，提取关键信息"]
    B --> C["知识库检索<br/>从游戏世界观知识库检索相关信息"]
    C --> D["LLM: 生成任务<br/>根据需求生成任务详情"]
    D --> E["代码: 验证<br/>验证任务合理性 奖励、难度等"]
    E --> F["条件判断<br/>任务是否合理?"]
    F -->|否| G["LLM: 重新生成"]
    G --> E
    F -->|是| H["格式化输出<br/>JSON 格式任务数据"]
    H --> I["结束"]

    style A fill:#e1f5ff
    style I fill:#c8e6c9
    style F fill:#fff9c4
    style G fill:#ffebee
```

#### 步骤3：配置 LLM 节点

```
LLM 节点配置:

节点名称: 生成任务
模型: gpt-4
温度: 0.7
最大token: 2000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
系统提示词:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
你是一个专业的游戏任务设计师。你的职责是根据
玩家的信息和要求，生成有趣、平衡的游戏任务。

设计原则:
1. 任务难度应该匹配玩家等级
2. 奖励应该与任务难度成正比
3. 任务应该推动剧情发展
4. 任务描述应该生动有趣
5. 任务目标应该清晰明确

输出格式:
返回 JSON 格式的任务数据。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

用户提示词模板:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
玩家信息:
- 等级：{{level}}
- 职业：{{class}}
- 当前位置：{{location}}

任务要求:
- 任务类型：{{quest_type}}
- 期望难度：{{difficulty}}

世界观背景:
{{world_knowledge}}

请生成符合要求的任务。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 步骤4：配置知识库

```mermaid
graph TB
    subgraph 知识库配置
        A["知识库: 游戏世界观"]

        subgraph 文档内容
            B1["文档 1: 世界地理<br/>王国分为五个主要区域:<br/>首都平原、迷雾森林、灼热荒漠<br/>冰封高原、暗影峡谷"]
            B2["文档 2: 常见生物<br/>哥布林: 低级怪物，成群出没<br/>巨龙: 顶级生物，极度危险"]
            B3["文档 3: 势力分布<br/>光明教团、暗影兄弟会<br/>龙血氏族三大势力"]
        end

        subgraph 检索配置
            C1["匹配方式: 向量检索 + 关键词检索"]
            C2["Top-K: 3 返回最相关的3个文档片段"]
            C3["相似度阈值: 0.7"]
        end
    end

    style A fill:#e1f5ff
    style C1 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style C3 fill:#c8e6c9
```

#### 步骤5：配置代码节点

```
代码节点: 任务验证

伪代码逻辑:

function validate_quest(quest_json):
    """验证生成的任务是否合理"""

    issues = []

    // 检查必需字段
    required_fields = ['title', 'description', 'objectives', 'rewards']
    for field in required_fields:
        if field not in quest_json:
            issues.append("缺少必需字段: {field}")

    // 检查奖励合理性
    if 'rewards' in quest_json:
        exp = quest_json['rewards']['experience']
        level = quest_json['player_level']

        // 经验值应该是等级的 50-200 倍
        expected_min = level * 50
        expected_max = level * 200

        if exp < expected_min or exp > expected_max:
            issues.append("经验值不合理")

    // 检查目标数量
    if 'objectives' in quest_json:
        num_objectives = len(quest_json['objectives'])
        if num_objectives < 1 or num_objectives > 5:
            issues.append("目标数量不合理")

    return {
        'valid': len(issues) == 0,
        'issues': issues
    }
```

#### 步骤6：配置 API

```
Dify API 调用示例:

API 端点:
POST /v1/workflows/run

请求体:
{
  "inputs": {
    "level": 10,
    "class": "战士",
    "location": "迷雾森林",
    "quest_type": "支线任务",
    "difficulty": "中等"
  },
  "response_mode": "blocking",
  "user": "user_123"
}

响应:
{
  "data": {
    "outputs": {
      "quest": {
        "title": "迷雾森林的秘密",
        "description": "一名旅行者失踪在迷雾森林...",
        "objectives": [
          "进入迷雾森林",
          "找到旅行者的踪迹",
          "击败森林守卫",
          "解救旅行者"
        ],
        "rewards": {
          "experience": 1500,
          "gold": 200,
          "items": ["迷雾护符"]
        }
      }
    }
  }
}
```

### Dify 本地部署

```
Docker Compose 部署流程:

克隆仓库:
git clone https://github.com/langgenius/dify.git
cd dify/docker

配置环境:
cp .env.example .env
// 编辑 .env 文件，配置:
//   · 数据库连接
//   · Redis 连接
//   · LLM API 密钥

启动服务:
docker-compose up -d

访问:
http://localhost:3000
```

---

## n8n 工作流自动化

### n8n 简介

[n8n](https://n8n.io/) 是一个开源的工作流自动化工具，特点：
- 可视化工作流编排
- 丰富的集成节点
- 支持自托管
- 适合自动化场景

### n8n 实战：自动化游戏日报生成

#### 工作流设计

```mermaid
graph TB
    A["定时触发器<br/>每天早上8点"] --> B["HTTP Request<br/>调用游戏 API 获取昨天数据<br/>获取游戏数据"]
    B --> C["代码节点<br/>处理数据，计算统计<br/>数据清洗"]
    C --> D["OpenAI<br/>生成日报摘要<br/>生成日报"]
    D --> E["Slack<br/>发送到 Slack 频道<br/>发送通知"]

    style A fill:#e1f5ff
    style E fill:#c8e6c9
```

#### 节点配置

```
节点配置示例:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Cron 节点 (定时触发)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
mode: cron
cronExpression: "0 8 * * *"
timezone: "Asia/Shanghai"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. HTTP Request 节点
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
method: GET
url: "https://api.game.com/stats"
queryParameters:
  date: "{{昨天日期}}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Code 节点 (数据处理)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
输入: 游戏原始数据
处理:
  // 计算活跃玩家
  activePlayers = 玩家中今天登录的

  // 计算新玩家
  newPlayers = 今天注册的玩家

  // 计算任务完成率
  completionRate = 已完成任务 / 总任务

输出: 处理后的统计数据

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. OpenAI 节点 (生成日报)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
model: gpt-4
system: "你是游戏数据分析师"
user: "基于以下数据生成日报: {{统计数据}}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Slack 节点 (发送通知)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
channel: "#game-daily-report"
text: "{{生成的日报}}"
```

### n8n 高级技巧

#### 1. 错误处理

```mermaid
graph TB
    subgraph 正常流程
        A1[数据] --> A2[处理] --> A3[下一步]
    end

    subgraph 错误处理流程
        B1[数据] --> B2[处理] --> B3[发生错误]
        B3 --> B4[错误捕获节点]
        B4 --> B5["发送告警通知<br/>邮件/Slack"]
    end

    style A3 fill:#c8e6c9
    style B3 fill:#ffebee
    style B5 fill:#fff3e0
```

#### 2. 条件路由

```mermaid
graph TB
    A[数据] --> B["IF 节点<br/>条件: 数据是否完整"]
    B -->|数据完整| C[继续处理流程]
    B -->|数据缺失| D[发送错误通知]
    D --> C

    style A fill:#e1f5ff
    style C fill:#c8e6c9
    style D fill:#ffebee
    style B fill:#fff9c4
```

#### 3. 循环处理

```mermaid
graph TB
    A["输入: 玩家列表<br/>玩家1, 玩家2, 玩家3, ..."] --> B["Loop 节点<br/>遍历每个玩家"]
    B --> C1["玩家1"]
    B --> C2["玩家2"]
    B --> C3["玩家3"]

    subgraph 处理单个玩家
        D1["· 计算等级"]
        D2["· 生成推荐"]
    end

    C1 --> D1
    C2 --> D1
    C3 --> D1

    D1 --> D2
    D2 --> E["汇总所有结果<br/>结果1, 结果2, ..."]

    style A fill:#e1f5ff
    style E fill:#c8e6c9
    style D1 fill:#fff9c4
    style D2 fill:#fff9c4
```

---

## 平台对比与选择

### 功能对比

| 特性 | Coze | Dify | n8n |
|------|------|------|-----|
| **易用性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **灵活性** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **开源** | ❌ | ✅ | ✅ |
| **本地部署** | ❌ | ✅ | ✅ |
| **多模型支持** | ✅ | ✅ | ✅ |
| **知识库** | ✅ | ✅ | ❌ |
| **工作流** | ✅ | ✅ | ✅ |
| **API 优先** | ❌ | ✅ | ✅ |
| **定价** | 免费 | 免费+付费 | 免费+付费 |

### 选择建议

```mermaid
graph TB
    A["需要构建什么?"] --> B[聊天 Bot → 对话机器人]
    A --> C[复杂应用]
    A --> D[自动化流程 → 定时任务/数据处理]

    B --> B1["Coze<br/>简单快速"]

    C --> C1{是否需要本地部署?}
    C1 -->|是| C2["Dify<br/>开源灵活"]
    C1 -->|否| C3["Coze<br/>云端托管"]

    D --> D1["n8n<br/>自动化专家"]

    style A fill:#e1f5ff
    style B1 fill:#c8e6c9
    style C2 fill:#c8e6c9
    style C3 fill:#c8e6c9
    style D1 fill:#c8e6c9
    style C1 fill:#fff9c4
```

### 具体场景推荐

| 场景 | 推荐平台 | 理由 |
|------|---------|------|
| 微信公众号机器人 | Coze | 快速集成，对话优化 |
| 企业内部问答系统 | Dify | 知识库强大，可私有化 |
| 数据处理自动化 | n8n | 定时任务，集成丰富 |
| 游戏NPC对话 | Coze | 角色人设，对话管理 |
| API服务 | Dify | API友好，易集成 |
| 多系统协作 | n8n | 连接能力强 |

---

## 练习作业

### 基础练习
1. 在 Coze 上创建一个简单的聊天 Bot
2. 在 Dify 上创建一个简单的对话应用
3. 使用 n8n 创建一个定时任务

### 进阶练习
4. 用 Coze 创建一个游戏 NPC Bot
5. 用 Dify 创建一个任务生成器
6. 用 n8n 创建游戏数据日报自动化

### 挑战练习
7. 结合三个平台，构建完整的游戏助手系统
8. 实现 Bot 与游戏 API 的集成
9. 创建支持多语言的 Bot

## 学习资源

### 官方文档
- [Coze 官方文档](https://www.coze.cn/docs)
- [Dify 官方文档](https://docs.dify.ai)
- [n8n 官方文档](https://docs.n8n.io)

### 教程
- Coze 视频教程
- Dify 社区案例
- n8n 工作流示例

### 社区
- Coze 用户社区
- Dify GitHub
- n8n Discord

## 下一步

完成本章学习后，进入：
- [第6章：框架开发实践](../ch06-frameworks/) - 学习 AutoGen、AgentScope 等代码框架

## 学习检查

- [ ] 理解低代码平台的优势和局限
- [ ] 掌握 Coze 的基本使用
- [ ] 掌握 Dify 的基本使用
- [ ] 了解 n8n 的工作流设计
- [ ] 能够选择合适的平台
- [ ] 完成章节练习题
