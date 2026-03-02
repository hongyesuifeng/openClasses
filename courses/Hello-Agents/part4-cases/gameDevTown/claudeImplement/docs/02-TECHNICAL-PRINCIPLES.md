# 游戏小镇 (Game Dev Town) - 技术原理文档

## 1. Multi-Agent 系统原理

### 1.1 什么是 Multi-Agent 系统

Multi-Agent System (MAS) 是由多个智能代理（Agent）组成的分布式系统，每个 Agent 具有自主性、社交性、反应性和主动性。

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Agent System                        │
│                                                              │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│  │ Agent 1 │◄───►│ Agent 2 │◄───►│ Agent 3 │              │
│  └────┬────┘     └────┬────┘     └────┬────┘              │
│       │               │               │                     │
│       └───────────────┼───────────────┘                     │
│                       ▼                                     │
│              ┌─────────────────┐                            │
│              │  共享环境/上下文  │                            │
│              └─────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Agent 的核心特性

| 特性 | 说明 | 本项目实现 |
|------|------|------------|
| **自主性** | Agent 能独立运作，不需外部直接控制 | 每个 Agent 独立生成回复 |
| **社交性** | Agent 能与其他 Agent 通信和协作 | 通过会议系统进行对话 |
| **反应性** | Agent 能感知环境并做出响应 | 根据上下文生成针对性回复 |
| **主动性** | Agent 能主动采取行动实现目标 | 主动提出建议和决策 |

### 1.3 本项目的 Agent 协作模式

本项目采用**中心化协调模式**：

```
                    ┌─────────────────┐
                    │ Meeting         │
                    │ Orchestrator    │
                    │ (协调者)         │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   David       │    │   Alex        │    │   Emma        │
│   Producer    │    │   Developer   │    │   Designer    │
└───────────────┘    └───────────────┘    └───────────────┘
```

协调者负责：
- 控制发言顺序
- 广播消息
- 汇总决策
- 管理会议状态
- 生成会议总结文档

---

## 2. 大语言模型 (LLM) 集成原理

### 2.1 Prompt Engineering

#### 系统提示词设计

系统提示词是引导 LLM 扮演特定角色的关键技术：

```python
def get_system_prompt(self) -> str:
    return f"""你是一个游戏开发团队中的{self.role}，名叫{self.name}。

你的角色描述：{self.description}
你的专业领域：{', '.join(self.expertise)}
你的性格特点：{self.personality}

你正在参与开发一款名为"九十九亿大战"的游戏。
在会议中，你需要：
1. 从{self.role}的角度出发发表意见
2. 与其他团队成员协作讨论
3. 提出专业建议和解决方案
4. 关注项目进度和质量

请保持专业、友善的沟通风格，用中文交流。
发言要简洁有力，每次回复控制在100字以内。"""
```

**设计要点**：
1. **角色定义**：明确 Agent 的身份和专业背景
2. **上下文设定**：提供游戏开发的场景背景
3. **行为指导**：明确 Agent 应该如何行动
4. **输出约束**：限制回复长度，保持对话流畅

### 2.2 Anthropic 兼容模式

MiniMax API 使用 Anthropic 兼容的消息格式：

```python
# 请求格式
{
    "model": "MiniMax-M2.5",
    "max_tokens": 2048,
    "temperature": 0.7,
    "system": "你是一个游戏制作人...",
    "messages": [
        {"role": "user", "content": "请讨论新英雄设计方案..."}
    ]
}

# 响应格式
{
    "content": [
        {"type": "text", "text": "作为制作人，我认为..."}
    ],
    "model": "MiniMax-M2.5",
    "usage": {"input_tokens": 100, "output_tokens": 50}
}
```

### 2.3 降级机制

当 LLM 服务不可用时，系统自动切换到降级模式：

```python
def _fallback_generate(self, prompt: str) -> str:
    """降级生成（无 API 时使用）"""
    fallback_responses = {
        "进度": "作为团队成员，我认为当前进度符合预期...",
        "问题": "这个问题需要进一步讨论...",
        "建议": "我的建议是先进行小范围测试...",
    }

    for keyword, response in fallback_responses.items():
        if keyword in prompt:
            return response

    return "好的，我了解了。让我从我的专业角度来分析..."
```

**降级策略**：
- 基于关键词匹配返回预设回复
- 确保系统在无 LLM 时仍可演示
- 保持角色一致性

### 2.4 Think 标签过滤

MiniMax 模型会输出 `<think＞... Ellis` 格式的思考过程，需要在显示给用户前过滤：

```python
import re

def remove_think_tags(content: str) -> str:
    """移除 LLM 输出中的思考过程标签"""
    # 移除 <think＞...</think＞ 标签及其内容（支持多行）
    content = re.sub(r'<think＞.*?</think＞', '', content, flags=re.DOTALL)
    # 清理多余的空行
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    return content.strip()
```

**处理前后对比**：
```
原始输出：
Ellipsis
用户让我作为制作人回应...需要分析技术可行性...
 Ellis

作为制作人，我认为这个方案可行，建议先做原型验证。

过滤后：
作为制作人，我认为这个方案可行，建议先做原型验证。
```

---

## 3. 记忆系统原理

### 3.1 记忆模型设计

借鉴人类记忆模型，实现双层记忆结构：

```
┌─────────────────────────────────────────────────────────────┐
│                       Memory System                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              短期记忆 (Short-term)                    │    │
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐        │    │
│  │  │ M │ M │ M │ M │ M │ M │ M │ M │ M │ M │  deque  │    │
│  │  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘        │    │
│  │          滑动窗口，保留最近 N 条记忆                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                     重要性 >= 0.7                            │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              长期记忆 (Long-term)                     │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │  • 重要决策    • 关键事件    • 核心结论      │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │              按重要性持久化存储                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              工作上下文 (Working Context)             │    │
│  │         当前任务相关的临时数据存储                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 记忆的重要性评分

```python
@dataclass
class MemoryItem:
    content: str           # 记忆内容
    importance: float      # 重要性评分 (0-1)
    category: str          # 记忆类别
    timestamp: datetime    # 时间戳
```

**重要性评分规则**：
| 分数范围 | 类型 | 示例 |
|----------|------|------|
| 0.9-1.0 | 关键决策 | 项目方向变更、技术选型确定 |
| 0.7-0.9 | 重要结论 | 会议结论、任务分配 |
| 0.5-0.7 | 普通对话 | 日常讨论、意见交换 |
| 0.3-0.5 | 参考信息 | 背景资料、上下文 |
| 0.0-0.3 | 临时信息 | 问候、过渡语句 |

### 3.3 记忆检索策略

```python
def get_relevant_memories(self, query: str, top_k: int = 5) -> List[Dict]:
    """基于关键词匹配的记忆检索"""
    query_words = set(query.lower().split())
    scored_memories = []

    for memory in self.short_term_memory + self.long_term_memory:
        memory_words = set(memory.content.lower().split())
        # 计算词重叠度
        overlap = len(query_words & memory_words)
        if overlap > 0:
            # 综合评分 = 重叠度 × 重要性
            score = overlap * memory.importance
            scored_memories.append((score, memory))

    # 返回评分最高的 top_k 条记忆
    scored_memories.sort(key=lambda x: x[0], reverse=True)
    return [m for _, m in scored_memories[:top_k]]
```

---

## 4. 决策系统原理

### 4.1 决策类型

```python
class DecisionType(Enum):
    AGREE = "agree"           # 同意
    DISAGREE = "disagree"     # 不同意
    PROPOSE = "propose"       # 提议
    QUESTION = "question"     # 提问
    CLARIFY = "clarify"       # 澄清
    COMPROMISE = "compromise" # 妥协
    DEFER = "defer"           # 推迟
```

### 4.2 决策偏好因子

每个 Agent 基于角色特征有不同的决策偏好：

```python
def _init_bias_factors(self) -> Dict[str, float]:
    factors = {
        "technical": 0.5,    # 技术倾向
        "creative": 0.5,     # 创意倾向
        "practical": 0.5,    # 实用倾向
        "risk_taking": 0.5,  # 冒险倾向
    }

    # 根据角色调整偏好
    role = self.role_config.get("role", "")
    if role == "程序员":
        factors["technical"] = 0.8   # 更关注技术
        factors["practical"] = 0.7   # 更务实
        factors["risk_taking"] = 0.3 # 更保守
    elif role == "美术":
        factors["creative"] = 0.9    # 更有创意
        factors["risk_taking"] = 0.6 # 更愿冒险

    return factors
```

### 4.3 决策分析流程

```
提案输入
    │
    ▼
┌─────────────────┐
│  可行性评估      │ ← 技术复杂度分析
│  (feasibility)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  影响评估        │ ← 对进度/质量/资源的影响
│  (impact)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  风险识别        │ ← 潜在问题检测
│  (risks)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  一致性检查      │ ← 与项目目标的匹配度
│  (alignment)    │
└────────┬────────┘
         │
         ▼
    决策输出
```

---

## 5. 实时通信原理

### 5.1 WebSocket 协议

WebSocket 提供全双工通信通道，适合实时消息推送：

```
客户端                              服务器
   │                                  │
   │  1. HTTP 握手请求                 │
   │  GET /ws/meeting                 │
   │  Upgrade: websocket              │
   ├─────────────────────────────────►│
   │                                  │
   │  2. 握手响应                      │
   │  101 Switching Protocols         │
   │◄─────────────────────────────────┤
   │                                  │
   │  3. WebSocket 连接建立            │
   │  ════════════════════════════════│
   │                                  │
   │  4. 双向消息传输                  │
   │◄─────────────────────────────────┤
   │─────────────────────────────────►│
   │◄─────────────────────────────────┤
   │─────────────────────────────────►│
   │                                  │
```

### 5.2 连接管理

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict):
        """广播消息到所有连接"""
        for connection in self.active_connections:
            await connection.send_json(message)
```

### 5.3 消息类型分发

使用消息类型模式处理不同类型的 WebSocket 消息：

```python
async def handle_websocket_message(websocket, message):
    msg_type = message.get("type", "")

    handlers = {
        "start_meeting": handle_start_meeting,
        "run_discussion": handle_run_discussion,
        "send_message": handle_send_message,
        "end_meeting": handle_end_meeting,
    }

    handler = handlers.get(msg_type)
    if handler:
        await handler(websocket, message.get("data", {}))
```

### 5.4 任务中断机制

当用户点击"结束会议"时，需要能够立即中断正在进行的讨论：

**问题**：场景讨论是长时间运行的异步任务，如果直接 `await`，会阻塞 WebSocket 消息循环，导致无法响应"结束会议"请求。

**解决方案**：使用 `asyncio.create_task()` 在后台运行，保存任务引用：

```python
# 全局任务引用
current_scenario_task = None

async def handle_run_scenario(websocket, data):
    global current_scenario_task

    async def run_discussion_background():
        try:
            await orchestrator.run_interactive_discussion(rounds=rounds)
            # 讨论完成后自动结束会议（orchestrator 会广播 meeting_ended）
            if orchestrator.meeting_active:
                await orchestrator.end_meeting()
        except asyncio.CancelledError:
            # 任务被取消时的清理
            print("场景任务被用户中断")

    # 创建后台任务（非阻塞）
    current_scenario_task = asyncio.create_task(run_discussion_background())
    # 立即返回，不等待任务完成

async def handle_end_meeting(websocket, data):
    global current_scenario_task

    # 取消正在运行的后台任务
    if current_scenario_task and not current_scenario_task.done():
        current_scenario_task.cancel()
        try:
            await current_scenario_task  # 等待任务响应取消
        except asyncio.CancelledError:
            pass
        current_scenario_task = None

    # 执行正常的会议结束流程（orchestrator 会广播 meeting_ended）
    await orchestrator.end_meeting()
```

**流程图**：
```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   用户界面   │                    │  WebSocket  │                    │  会议编排器  │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │  1. 开始会议                      │                                  │
       ├─────────────────────────────────►│                                  │
       │                                  │  2. 创建后台任务                   │
       │                                  ├─────────────────────────────────►│
       │                                  │  3. 任务开始运行                   │
       │                                  │◄─────────────────────────────────┤
       │                                  │                                  │
       │  4. 会议进行中（消息推送）          │                                  │
       │◄─────────────────────────────────┤◄────────────────────────────────┤
       │                                  │                                  │
       │  5. 用户点击结束                   │                                  │
       ├─────────────────────────────────►│                                  │
       │                                  │  6. task.cancel()                 │
       │                                  ├─────────────────────────────────►│
       │                                  │  7. CancelledError 抛出           │
       │                                  │◄─────────────────────────────────┤
       │  8. meeting_ended 消息            │  8. end_meeting()                 │
       │     (含 summary_document)         │                                  │
       │◄─────────────────────────────────┤◄─────────────────────────────────┤
```

---

## 6. 会议总结生成原理

### 6.1 总结文档生成流程

会议结束时，`MeetingOrchestrator` 自动生成总结文档：

```python
async def end_meeting(self) -> Dict[str, Any]:
    """结束会议并生成总结文档"""
    meeting = self.conversation_manager.end_meeting()

    if meeting:
        # 提取行动项
        action_items = self._extract_action_items(meeting)

        # 生成会议总结文档
        summary_document = self._generate_summary_document(meeting, action_items)

        summary = {
            "meeting_id": meeting.id,
            "title": meeting.title,
            "duration": str(meeting.end_time - meeting.start_time),
            "participants": meeting.participants,
            "message_count": len(meeting.messages),
            "conclusions": meeting.conclusions,
            "action_items": action_items,
            "task_stats": self.task_system.get_project_progress(),
            "summary_document": summary_document,  # 新增
        }

        await self.broadcast_message({
            "type": "meeting_ended",
            "data": summary,
        })

        return summary
```

### 6.2 关键信息提取

```python
def _extract_key_points(self, meeting) -> Dict[str, Any]:
    """从会议中提取关键讨论点"""
    points = []

    # 分析消息，提取关键点
    for msg in meeting.messages[-10:]:  # 取最后10条消息
        if hasattr(msg, 'content') and msg.content:
            content = msg.content.strip()
            if len(content) > 20:  # 忽略太短的消息
                speaker_name = msg.speaker_name if hasattr(msg, 'speaker_name') else "未知"
                points.append({
                    "speaker": speaker_name,
                    "point": content[:200] + "..." if len(content) > 200 else content,
                })

    return {
        "summary": f"本次会议围绕「{meeting.title}」展开讨论，共 {len(meeting.messages)} 条发言。",
        "points": points[-5:] if points else [],
    }
```

### 6.3 开发排期生成

```python
def _generate_schedule(self, action_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """生成开发排期"""
    from datetime import datetime, timedelta

    schedule = []
    base_date = datetime.now()

    for i, item in enumerate(action_items):
        # 简单排期：每个任务间隔2天
        start_date = base_date + timedelta(days=i * 2)
        end_date = start_date + timedelta(days=3)

        schedule.append({
            "task": item["task"][:50],
            "assignee": item.get("assignee", "待分配"),
            "start_date": start_date.strftime("%m-%d"),
            "end_date": end_date.strftime("%m-%d"),
            "status": "待开始",
        })

    return schedule
```

### 6.4 前端弹框实现

会议结束后，前端自动弹出总结弹框：

```javascript
function handleMeetingEnded(data) {
    // ... 更新 UI 状态 ...

    // 显示会议总结弹框
    if (data.summary_document) {
        showMeetingSummaryModal(data.summary_document);
    }
}

function showMeetingSummaryModal(document) {
    // 创建模态弹框
    const modal = document.createElement('div');
    modal.className = 'summary-modal';

    // 弹框内容包含：会议概述、关键讨论点、结论、行动项、开发排期
    modal.innerHTML = `...`;

    // 添加到页面
    document.body.appendChild(modal);

    // 只有点击关闭按钮才能关闭（不会自动关闭）
}

function closeSummaryModal() {
    const modal = document.querySelector('.summary-modal');
    if (modal) {
        modal.remove();
    }
}
```

---

## 7. 异步编程原理

### 7.1 Python async/await

本项目大量使用 Python 的异步编程特性：

```python
async def run_discussion_round(self, topic: str):
    """运行一轮讨论"""
    for role_id in self.agents.keys():
        agent = self.agents[role_id]

        # 异步生成回复
        response = await agent.generate_response(context, prompt)

        # 异步广播消息
        await self.broadcast_message({
            "type": "new_message",
            "data": {"content": response}
        })

        # 异步等待（模拟思考时间）
        await asyncio.sleep(2.0)
```

### 7.2 异步优势

| 特性 | 同步模式 | 异步模式 |
|------|----------|----------|
| LLM 调用 | 阻塞等待 | 并发处理 |
| 消息广播 | 串行发送 | 并行发送 |
| 资源利用 | 低效 | 高效 |
| 响应延迟 | 高 | 低 |

---

## 8. 前端架构原理

### 8.1 模块化设计

前端采用 ES6 模块化设计，每个模块职责单一：

```
app.js (主控制器)
   │
   ├── api.js (通信层)
   │      ├── REST API 调用
   │      └── WebSocket 管理
   │
   ├── chat.js (聊天组件)
   │      ├── 消息渲染
   │      └── 打字动画
   │
   ├── characters.js (角色组件)
   │      ├── 状态显示
   │      ├── 情绪指示
   │      └── 角色详情弹框
   │
   └── dashboard.js (看板组件)
          ├── 进度显示
          └── 活动记录
```

### 8.2 状态管理

```javascript
// 全局状态
const appState = {
    connected: false,      // 连接状态
    meetingActive: false,  // 会议状态
    currentScenario: null, // 当前场景
};

// 状态更新触发 UI 刷新
function updateConnectionStatus(connected) {
    appState.connected = connected;
    // 更新 DOM
    statusEl.textContent = connected ? '已连接' : '未连接';
}
```

### 8.3 事件驱动

```javascript
// WebSocket 消息驱动 UI 更新
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'new_message':
            chatManager.addMessage(data.data);
            break;
        case 'agent_status':
            charactersManager.updateStatus(data.data);
            break;
        case 'meeting_ended':
            handleMeetingEnded(data.data);
            break;
    }
}
```

---

## 9. 设计模式应用

### 9.1 工厂模式

用于创建不同类型的 Agent：

```python
def create_agent(role_id: str, llm_service=None):
    """工厂函数：创建 Agent 实例"""
    agents = {
        "producer": ProducerAgent,
        "developer": DeveloperAgent,
        "designer": DesignerAgent,
        "artist": ArtistAgent,
    }

    agent_class = agents.get(role_id)
    if agent_class:
        return agent_class(llm_service)

    raise ValueError(f"Unknown agent role: {role_id}")
```

### 9.2 模板方法模式

BaseAgent 定义算法骨架，子类实现具体步骤：

```python
class BaseAgent(ABC):
    @abstractmethod
    async def respond_to_agenda(self, agenda_item: str, context: str) -> str:
        """子类实现：回应会议议程"""
        pass

    @abstractmethod
    async def react_to_message(self, message: str, speaker: str) -> str:
        """子类实现：对消息做出反应"""
        pass
```

### 9.3 观察者模式

WebSocket 广播机制实现观察者模式：

```python
# 被观察者 (Subject)
class ConnectionManager:
    def __init__(self):
        self.observers = []  # WebSocket 连接列表

    async def notify_all(self, message):
        for observer in self.observers:
            await observer.send_json(message)
```

### 9.4 策略模式

不同场景使用不同的对话策略：

```python
SCENARIO_PROMPTS = {
    "game_fun_evaluation": {
        "topic": "游戏是否好玩 - 核心乐趣评估",
        "context": "我们需要评估当前游戏的核心乐趣...",
        "expected_responses": {
            "producer": "关注整体体验",
            "developer": "分析技术实现",
            "designer": "分析核心玩法",
            "artist": "讨论视觉反馈",
        }
    },
    "prototype_demo": {
        "topic": "原型Demo节点 - 核心展示内容讨论",
        # ...
    }
}
```

---

## 10. 关键技术要点总结

### 10.1 LLM 角色扮演
- 通过精心设计的 System Prompt 引导 LLM 扮演特定角色
- 结合专业背景和性格特征，使回复更具个性

### 10.2 多 Agent 协调
- 中心化协调模式确保对话有序进行
- 轮询发言机制保证每个 Agent 参与机会均等

### 10.3 记忆与上下文
- 双层记忆结构平衡效率和容量
- 重要性评分机制筛选关键信息

### 10.4 实时通信
- WebSocket 提供低延迟的双向通信
- 消息类型分发实现松耦合的请求处理

### 10.5 容错设计
- LLM 服务降级机制确保系统可用性
- 模块化设计便于定位和修复问题

### 10.6 会议总结生成
- 自动提取关键讨论点和结论
- 生成行动项和开发排期
- 前端弹框强制用户阅读后关闭

---

## 11. 参考资料

1. **Multi-Agent Systems**: Wooldridge, M. (2009). An Introduction to MultiAgent Systems.
2. **Prompt Engineering**: OpenAI Prompt Engineering Guide
3. **FastAPI**: https://fastapi.tiangolo.com/
4. **WebSocket Protocol**: RFC 6455
5. **Anthropic API**: https://docs.anthropic.com/
6. **MiniMax API**: https://www.minimaxi.com/
