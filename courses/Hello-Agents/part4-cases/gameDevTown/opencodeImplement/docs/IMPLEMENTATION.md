# 游戏小镇 (Game Dev Town) - 技术实现文档

## 一、项目整体技术架构

### 1.1 系统架构概览

游戏小镇采用 **Flask + Vue 3 风格前端** 的 B/S 架构，整体系统分为四个层次：

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer (表现层)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   办公室场景  │  │   实时对话   │  │   项目看板   │     │
│  │   (HTML/CSS) │  │   (Chat UI) │  │  (TaskBoard) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (API 层)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ /meeting/start│  │ /meeting/next│  │   /messages  │     │
│  │  会议管理API  │  │  对话轮次API │  │   消息API    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Business Logic Layer (业务逻辑层)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MeetingOrchestrator (会议编排器)        │   │
│  │   • 协调多个 Agent 参与会议                          │   │
│  │   • 管理对话流程和轮次                               │   │
│  │   • 整合记忆、决策、任务系统                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Agent系统  │  │ 记忆系统   │  │ 决策系统   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐                            │
│  │ 任务系统   │  │ 对话管理   │                            │
│  └────────────┘  └────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data/AI Layer (数据/AI 层)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              LLMClient (MiniMax API 客户端)          │   │
│  │   • OpenAI 兼容接口                                   │   │
│  │   • 流式/非流式响应                                   │   │
│  │   • 多模型支持                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 后端框架 | Flask | 3.1.3 |
| 前端框架 | 原生 HTML/CSS/JS | - |
| LLM 客户端 | OpenAI SDK | 2.24.0 |
| 配置管理 | PyYAML | 6.0.3 |
| 环境变量 | python-dotenv | 1.0.0 |
| 跨域支持 | Flask-CORS | 6.0.2 |
| LLM 提供商 | MiniMax | M2.5 |

### 1.3 模块依赖关系

```
main.py (入口)
  │
  ├── Flask 应用
  │     │
  │     ├── API 路由
  │     │     │
  │     │     └── MeetingOrchestrator (会议编排器)
  │     │           │
  │     │           ├── AgentSystem (4个Agent)
  │     │           │     │
  │     │           │     ├── ProducerAgent (Alex)
  │     │           │     ├── DeveloperAgent (Cody)
  │     │           │     ├── DesignerAgent (Diana)
  │     │           │     └── ArtistAgent (Arty)
  │     │           │
  │     │           ├── ConversationManager (对话管理)
  │     │           │     └── Message (消息)
  │     │           │
  │     │           ├── DecisionSystem (决策系统)
  │     │           │     ├── Decision (决策)
  │     │           │     └── Vote (投票)
  │     │           │
  │     │           └── TaskSystem (任务系统)
  │     │                 └── Task (任务)
  │     │
  │     └── LLMClient (MiniMax)
  │           └── ChatResponse (响应)
  │
  └── 前端静态文件
        ├── index.html
        ├── css/style.css
        └── js/
              ├── api.js
              └── app.js
```

---

## 二、技术原理详解

### 2.1 多 Agent 系统 (Multi-Agent System)

#### 2.1.1 Agent 架构

本项目采用 **基于角色的 Agent 架构**，每个 Agent 包含以下核心组件：

```
Agent
  │
  ├── 身份属性
  │     ├── agent_id: 唯一标识
  │     ├── name: 名称
  │     └── role: 角色类型
  │
  ├── 性格模型 (OCEAN)
  │     ├── openness: 开放性
  │     ├── conscientiousness: 尽责性
  │     ├── extraversion: 外向性
  │     ├── agreeableness: 宜人性
  │     └── neuroticism: 神经质
  │
  ├── 专业领域 (Expertise)
  │     └── 角色特定技能列表
  │
  ├── 记忆系统 (Memory)
  │     ├── 短期记忆 (近10轮对话)
  │     └── 长期记忆 (重要决策)
  │
  └── 状态机 (State)
        ├── status: 当前状态
        ├── emotion: 情绪
        └── activity: 活动
```

#### 2.1.2 角色定义

| 角色 | Agent | 决策权重 | 核心职责 |
|------|-------|---------|---------|
| 制作人 | Alex | 25% | 项目管理、资源协调、最终决策 |
| 程序员 | Cody | 20% | 技术评估、方案实现、性能优化 |
| 策划 | Diana | 40% | 玩法设计、数值平衡、系统规则 |
| 美术 | Arty | 15% | 视觉风格、资源管理、表现效果 |

#### 2.1.3 Agent 交互流程

```
用户请求
    │
    ▼
MeetingOrchestrator.start_meeting()
    │
    ├── 初始化会议
    │     └── 创建 MeetingState
    │
    └── 循环处理对话轮次
          │
          ▼
    process_round()
          │
          ├── 对每个 Agent 决策是否发言
          │     └── BaseAgent.should_speak()
          │
          ├── 构建上下文
          │     └── MeetingOrchestrator._build_context()
          │
          ├── 调用 LLM 生成回复
          │     └── BaseAgent.think()
          │
          ├── 检测情绪
          │     └── BaseAgent.detect_emotion()
          │
          └── 存储记忆
                └── BaseAgent.store_memory()
```

### 2.2 记忆系统 (Memory System)

#### 2.2.1 记忆分类

采用 **双层记忆架构**：

```
MemorySystem
  │
  ├── 短期记忆 (Short-term)
  │     ├── 存储内容: 最近对话
  │     ├── 容量限制: 10条
  │     ├── 淘汰策略: FIFO (先进先出)
  │     └── 用途: 维持对话连贯性
  │
  ├── 长期记忆 (Long-term)
  │     ├── 存储内容: 重要决策、关键事件
  │     ├── 触发条件: importance >= 0.7
  │     └── 用途: 跨会话知识保留
  │
  └── 项目记忆 (Project)
        ├── 存储内容: 项目相关信息
        └── 用途: 项目状态追踪
```

#### 2.2.2 记忆存储机制

```python
def store(self, content, memory_type="short", importance=0.5, ...):
    entry = MemoryEntry(
        content=content,
        timestamp=time.time(),
        importance=importance,
        memory_type=memory_type,
        ...
    )
    
    # 自动分类到长期或短期记忆
    if memory_type == "long" or importance >= threshold:
        self.long_term.append(entry)
    else:
        self.short_term.append(entry)
        if len(self.short_term) > limit:
            self.short_term.pop(0)  # 淘汰最旧记忆
```

### 2.3 决策系统 (Decision System)

#### 2.3.1 决策权重机制

基于 **加权投票** 的决策模型，不同决策类型有不同的权重分配：

```
决策类型权重矩阵:

| 决策类型 | 制作人 | 程序员 | 策划 | 美术 |
|---------|-------|-------|-----|-----|
| 设计类   | 0.25  | 0.20  | 0.40| 0.15|
| 技术类   | 0.25  | 0.50  | 0.15| 0.10|
| 美术类   | 0.25  | 0.10  | 0.20| 0.45|
| 资源类   | 0.50  | 0.20  | 0.15| 0.15|
```

#### 2.3.2 决策计算公式

```python
def calculate_result(self, decision_id):
    weights = DECISION_WEIGHTS[decision_type]
    scores = {option_id: 0.0 for option_id in options}
    
    for role, vote in votes.items():
        if vote.choice == "abstain":
            continue
        
        weight = weights[role]  # 获取角色权重
        score = weight * vote.confidence  # 加权置信度
        scores[vote.choice] += score
    
    # 得分最高的选项获胜
    result = max(scores.items(), key=lambda x: x[1])
    return result[0]
```

### 2.4 会议系统 (Meeting System)

#### 2.4.1 会议类型

| 会议类型 | 时长 | 发起者 | 典型场景 |
|---------|------|--------|---------|
| 每日站会 | 15分钟 | 制作人 | 进度同步 |
| 设计评审 | 60分钟 | 策划 | 玩法提案 |
| 技术评审 | 45分钟 | 程序员 | 方案评估 |
| 美术评审 | 30分钟 | 美术 | 风格确认 |
| 里程碑会议 | 90分钟 | 制作人 | 阶段总结 |

#### 2.4.2 会议流程 (优化版)

```
会议生命周期 (自动多轮):

start_meeting()
    │
    ├── 创建 MeetingState
    │     └── 设置状态为 "in_progress"
    │
    ├── 生成开场白
    │     └── 使用 MeetingTemplate
    │
    └── 自动循环处理对话轮次
          │  (默认 auto_rounds=3)
          ▼
    process_round()  ←── 循环 ──→  达到轮次上限
          │
          ├── 按角色顺序依次发言
          │     └── Agent.should_speak() 决策
          │
          ├── 构建上下文
          │     ├── 项目信息
          │     ├── 会议类型
          │     ├── 当前话题
          │     └── 历史消息
          │
          ├── 调用 LLM
          │     └── 生成个性化回复 (角色化Prompt)
          │
          └── 存储对话到记忆

end_meeting()
    │
    ├── 添加结束消息
    │
    └── 生成会议纪要
```

### 2.5 LLM 集成 (MiniMax API)

#### 2.5.1 客户端架构

```python
class LLMClient:
    def __init__(self, api_key, base_url, model):
        self.client = OpenAI(  # OpenAI 兼容接口
            api_key=api_key,
            base_url=base_url  # MiniMax API 端点
        )
    
    def chat(self, messages, temperature, max_tokens):
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return ChatResponse(content=response.choices[0].message.content)
```

#### 2.5.2 Prompt 工程 (优化版本)

每个 Agent 使用 **角色化 Prompt**，结合上下文形成自然对话：

```
System Prompt:
你是一个专业的游戏开发团队成员，名字叫{name}，角色是{role}。
你正在参加《王者之路》游戏项目的团队会议。

角色特点：
- 根据你的角色身份，用专业且符合角色性格的方式发言
- 制作人：控场、总结、推进会议
- 程序员：务实、技术导向、关注实现
- 策划：创新、关注玩法和体验
- 美术：视觉导向、关注美观和风格

发言要求：
- 根据当前会议讨论的内容，结合自己的专业领域发表意见
- 回应其他成员的发言，形成自然的对流畅
- 每次发言1-2句话即可，保持会议节奏
- 不要输出括号内容、思考过程或推理步骤
- 只输出角色在会议中的原话，不要加任何前缀
```

```
User Context 格式:
【项目】王者之路
【会议类型】每日站会
【当前话题】日常进度同步
【会议对话历史】
  Alex: 好的，我们开始今天的站会。大家，你先说说进度？
  Cody: 我这边装备系统核心逻辑已经写完了...
【你的职责】关注技术实现、代码质量、开发进度

请结合当前会议讨论和你的职责，发表一句专业意见：
```

### 2.6 情绪检测 (Emotion Detection)

基于关键词的情绪分类系统：

```python
EMOTION_PATTERNS = {
    "excited": ["太棒了", "完美", "厉害", "精彩", "期待"],
    "concerned": ["担心", "问题", "风险", "困难", "挑战"],
    "confident": ["确定", "相信", "没问题", "可以做到"],
    "thoughtful": ["考虑", "思考", "分析", "评估"]
}

def detect_emotion(self, text):
    for emotion, patterns in EMOTION_PATTERNS.items():
        if any(p in text for p in patterns):
            return emotion
    return "neutral"
```

---

## 三、前端技术原理

### 3.1 页面结构

```
index.html
  │
  ├── Header (头部)
  │     ├── 项目名称
  │     └── 状态指示器
  │
  ├── Office Panel (侧边栏)
  │     ├── 办公室场景 (4个角色)
  │     ├── 项目看板 (任务统计)
  │     └── 当前会议信息
  │
  └── Chat Panel (主聊天区)
        └── 消息列表 (无下一轮按钮)
```

### 3.2 自动对话机制

前端点击"开始会议"后自动进行多轮对话：

```javascript
async function startMeeting() {
    // 1. 调用后端 API，后端自动完成多轮对话
    const result = await api.startMeeting(meetingType, topic, 3);
    
    // 2. 逐条显示对话，每条间隔 0.5 秒
    if (result.responses) {
        await showResponsesOneByOne(result.responses, 500);
    }
    
    // 3. 如果会议未结束，继续获取下一轮对话
    if (result.meeting_status !== 'completed') {
        await continueMeeting(result.meeting);
    }
}
```

### 3.3 对话逐条显示

```javascript
async function showResponsesOneByOne(responses, delay = 500) {
    for (const response of responses) {
        addMessage(response);  // 添加消息到界面
        await sleep(delay);   // 等待后再显示下一条
    }
}
```

---

## 四、数据流总结

```
用户操作 (点击"开始会议")
    │
    ▼
HTTP POST /api/meeting/start
    │
    ▼
Flask 路由处理
    │
    ▼
MeetingOrchestrator.start_meeting()
    │
    ├── 初始化会议状态
    ├── 生成开场白
    │
    └── 循环处理多轮对话 (默认3轮)
          │
          ▼
    process_round()
          │
          ├── 遍历 4 个 Agent
          │     │
          │     ├── should_speak() 决策
          │     │
          │     └── think() 调用 LLM
          │           │
          │           ├── 构建角色化 Prompt
          │           ├── 发送 MiniMax API
          │           └── 返回智能响应
          │
          ├── 添加消息到 ConversationManager
          │
          ├── 存储记忆到 MemorySystem
          │
          └── 返回对话响应列表
    │
    ▼
返回所有对话响应到前端
    │
    ▼
前端逐条显示对话 (每条间隔0.5秒)
    │
    ▼
如果会议未结束，继续调用 /api/meeting/next
    │
    ▼
渲染到页面
```

---

## 五、API 接口更新

### 5.1 会议启动 API (自动多轮对话)

```bash
POST /api/meeting/start
Content-Type: application/json

Request:
{
    "meeting_type": "daily_standup",  // 会议类型
    "topic": "日常进度同步",           // 话题
    "auto_rounds": 3                  // 自动轮数(可选，默认3)
}

Response:
{
    "success": true,
    "meeting_id": "meeting_xxx",
    "meeting": {
        "meeting_type": "daily_standup",
        "topic": "日常进度同步",
        "round": 3
    },
    "responses": [                     // 所有对话响应
        {
            "speaker": "Alex",
            "speaker_role": "制作人",
            "content": "好的，我们开始今天的站会...",
            "emotion": "neutral"
        },
        ...
    ],
    "meeting_status": "in_progress"   // 或 "completed"
}
```

### 5.2 继续对话 API

```bash
POST /api/meeting/next

Response:
{
    "success": true,
    "round": 4,
    "responses": [...],
    "meeting_status": "completed"     // 会议结束
}
```

---

## 六、最新优化

### 6.1 自动会议流程
- 点击"开始会议"后自动进行多轮对话
- 默认3轮对话，可配置
- 移除"下一轮"按钮，减少用户操作

### 6.2 对话节奏优化
- 对话逐条显示，每条间隔0.5秒
- 让用户有时间阅读和理解对话内容
- 模拟真实会议中发言的节奏

### 6.3 对话智能提升
- 角色化 Prompt：根据角色身份专业发言
- 上下文感知：结合历史对话形成自然回应
- 职责导向：每个角色根据自身职责发表意见

### 6.4 其他优化
- 添加 favicon 支持
- 修复中文 JSON 解析问题
- 优化错误处理

---

## 七、扩展方向

### 7.1 短期扩展
- 添加更多会议类型（头脑风暴、代码审查）
- 完善任务系统（依赖管理、优先级调度）
- 增强记忆系统（向量检索）

### 7.2 中期扩展
- 添加 WebSocket 支持（实时推送）
- 接入更多 LLM 提供商
- 增加数据持久化（SQLite/文件）

### 7.3 长期愿景
- 可视化 3D 办公室场景
- 真实游戏引擎集成
- 多项目并行模拟
