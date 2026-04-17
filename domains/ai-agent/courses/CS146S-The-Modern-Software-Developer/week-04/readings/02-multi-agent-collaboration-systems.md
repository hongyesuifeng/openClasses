# Reading 2: Multi-Agent Collaboration Systems Design
# 多 Agent 协作系统设计

> **Week 4 Reading #2**
> **主题**: 深入理解多 Agent 协作系统的架构、通信和协调策略
> **预计阅读时间**: 60-90 分钟

---

## 📚 导读

随着 AI Agent 能力的增强,单 Agent 已经难以应对复杂任务的需求。多 Agent 协作系统通过专业分工和协作,能够处理更加复杂的场景。本文深入探讨多 Agent 系统的设计,帮助你:

1. **理解多 Agent 架构** - 层次结构、协作网络、流水线等模式
2. **掌握通信协议** - Agent 间的消息格式和通信机制
3. **学习协调策略** - 任务分配、冲突解决、同步机制
4. **实战应用** - 构建真实的多 Agent 系统

---

## 🎯 学习目标

阅读完本文后,你应该能够:

- ✅ 理解多 Agent 系统的优势和挑战
- ✅ 掌握主流的多 Agent 架构模式
- ✅ 设计有效的 Agent 通信协议
- ✅ 实现任务分配和冲突解决机制
- ✅ 能够构建实用的多 Agent 协作系统

---

## 第一部分:单 Agent vs 多 Agent

### 单 Agent 的局限

#### 能力边界
```
┌─────────────────────┐
│   Single Agent      │
│                     │
│  ├─ 通用能力        │  ← 懂很多,但不精通
│  ├─ 串行执行        │  ← 无法并行
│  ├─ 有限上下文      │  ← 容易遗忘
│  └─ 单一视角        │  ← 思维局限
└─────────────────────┘

问题:
- 复杂任务难以分解
- 专业知识不足
- 效率瓶颈
- 容易陷入局部最优
```

#### 适用场景
- ✅ 简单任务: "修复这个 bug"
- ✅ 快速原型: "创建一个演示"
- ✅ 个人项目: "优化我的代码"
- ❌ 复杂系统: "构建完整的应用"
- ❌ 团队协作: "多人开发流程"

### 多 Agent 的优势

#### 核心价值
```
┌──────────────────────────────────────┐
│      Multi-Agent System              │
│                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ Agent  │  │ Agent  │  │ Agent  │ │
│  │   A    │  │   B    │  │   C    │ │
│  │        │  │        │  │        │ │
│  │ Expert │  │ Expert │  │ Expert │ │
│  │   in   │  │   in   │  │   in   │ │
│  │   X    │  │   Y    │  │   Z    │ │
│  └────────┘  └────────┘  └────────┘ │
│       │          │          │       │
│       └──────────┼──────────┘       │
│                  │                  │
│            ┌─────▼─────┐            │
│            │Orchestrator│           │
│            └───────────┘            │
└──────────────────────────────────────┘

优势:
✓ 专业分工 - 每个 Agent 专注特定领域
✓ 并行执行 - 同时处理多个任务
✓ 视角多样 - 避免思维盲区
✓ 容错能力 - 单点故障不影响整体
✓ 可扩展性 - 容易添加新能力
```

#### 适用场景
- ✅ 复杂开发: "构建完整的电商系统"
- ✅ 代码审查: "全面审查代码质量"
- ✅ 测试生成: "生成多层次测试"
- ✅ 文档编写: "生成完整项目文档"
- ✅ 性能优化: "系统性性能优化"

---

## 第二部分:架构模式

### 模式 1:层次结构 (Hierarchical)

#### 架构设计

```
┌─────────────────────────────────┐
│      Orchestrator Agent         │  ← 协调者
│  (任务分解、分配、结果整合)      │
└──────────┬──────────────────────┘
           │
     ┌─────┼─────┬─────┬─────┐
     │     │     │     │     │
     ▼     ▼     ▼     ▼     ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Coder   │ │ Tester  │ │Reviewer │
│ Agent   │ │ Agent   │ │ Agent   │
└─────────┘ └─────────┘ └─────────┘
```

#### 工作流程

**Phase 1: 任务分解**
```python
class OrchestratorAgent:
    def decompose_task(self, task: str) -> List[Subtask]:
        """将复杂任务分解为子任务"""
        prompt = f"""
        任务: {task}

        请分解为具体的子任务,每个子任务包含:
        1. 任务描述
        2. 负责的 Agent 类型
        3. 依赖关系
        4. 优先级

        输出 JSON 格式。
        """

        return self.llm.generate(prompt, format="json")
```

**Phase 2: 任务分配**
```python
def allocate_tasks(self, subtasks: List[Subtask]) -> Dict:
    """分配任务给合适的 Agent"""
    allocation = {}

    for subtask in subtasks:
        # 选择 Agent
        agent_type = self.select_agent(subtask)
        agent = self.agents[agent_type]

        # 分配任务
        allocation[subtask.id] = {
            "agent": agent,
            "task": subtask,
            "status": "pending"
        }

    return allocation
```

**Phase 3: 执行协调**
```python
def coordinate_execution(self, allocation: Dict) -> Dict:
    """协调执行顺序"""
    results = {}

    # 拓扑排序,处理依赖
    sorted_tasks = self.topological_sort(allocation)

    for task_id in sorted_tasks:
        task = allocation[task_id]

        # 等待依赖完成
        self.wait_for_dependencies(task, results)

        # 执行任务
        result = task["agent"].execute(task["task"])
        results[task_id] = result

    return results
```

**Phase 4: 结果整合**
```python
def integrate_results(self, results: Dict) -> Any:
    """整合所有结果"""
    prompt = f"""
    子任务结果:
    {json.dumps(results, indent=2)}

    请整合以上结果,生成最终输出。
    """

    return self.llm.generate(prompt)
```

#### 完整示例

**场景**: 实现用户认证功能

```python
orchestrator = OrchestratorAgent()

# Step 1: 分解任务
task = "实现用户认证功能,包括注册、登录、登出"
subtasks = orchestrator.decompose_task(task)

# 输出:
[
  {
    "id": 1,
    "description": "创建 User 模型",
    "agent_type": "coder",
    "dependencies": [],
    "priority": "high"
  },
  {
    "id": 2,
    "description": "创建认证服务",
    "agent_type": "coder",
    "dependencies": [1],
    "priority": "high"
  },
  {
    "id": 3,
    "description": "编写单元测试",
    "agent_type": "tester",
    "dependencies": [1, 2],
    "priority": "medium"
  },
  {
    "id": 4,
    "description": "代码审查",
    "agent_type": "reviewer",
    "dependencies": [1, 2, 3],
    "priority": "medium"
  }
]

# Step 2-4: 自动执行
result = orchestrator.process_task(task)
```

#### 优缺点

**优势**:
- ✅ 清晰的层级关系
- ✅ 易于理解和调试
- ✅ 适合有明确流程的任务
- ✅ 结果整合简单

**劣势**:
- ❌ Orchestrator 成为瓶颈
- ❌ 单点故障风险
- ❌ 灵活性较差

### 模式 2:协作网络 (Collaborative Network)

#### 架构设计

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Agent   │◄───────►│ Agent   │◄───────►│ Agent   │
│    A    │         │    B    │         │    C    │
└─────────┘         └─────────┘         └─────────┘
     ▲                   ▲                   ▲
     │                   │                   │
     └───────────────────┴───────────────────┘
                     共享上下文
               (Shared Context / Memory)
```

#### 通信机制

**消息传递**
```python
@dataclass
class AgentMessage:
    id: str
    sender: str
    receiver: str
    type: MessageType  # REQUEST, RESPONSE, NOTIFICATION
    content: dict
    timestamp: datetime
    context_id: str  # 关联到共享上下文
```

**共享上下文**
```python
class SharedContext:
    def __init__(self):
        self.data = {}
        self.history = []
        self.lock = Lock()

    def update(self, agent_id: str, key: str, value: Any):
        """Agent 更新上下文"""
        with self.lock:
            self.data[key] = value
            self.history.append({
                "agent": agent_id,
                "action": "update",
                "key": key,
                "value": value,
                "timestamp": datetime.now()
            })

    def read(self, agent_id: str, keys: List[str]) -> dict:
        """Agent 读取上下文"""
        with self.lock:
            return {k: self.data[k] for k in keys if k in self.data}
```

#### 协作示例

**场景**: 代码审查

```python
# 初始化
context = SharedContext()
coder = CoderAgent("coder-1", context)
tester = TesterAgent("tester-1", context)
reviewer = ReviewerAgent("reviewer-1", context)

# Coder 实现功能
coder.execute("实现登录功能")
# context.data = {"login_code": "...", "login_tests": "..."}

# Tester 并行测试
tester.execute("测试登录功能")
# context.data += {"test_results": "..."}

# Reviewer 综合审查
reviewer.execute("审查登录功能")
# 读取 context 中的代码、测试、结果
```

#### 优缺点

**优势**:
- ✅ Agent 间平等协作
- ✅ 信息共享高效
- ✅ 可以并行执行
- ✅ 容错性好

**劣势**:
- ❌ 协调复杂
- ❌ 可能产生冲突
- ❌ 难以保证一致性

### 模式 3:流水线 (Pipeline)

#### 架构设计

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Design  │──▶│  Code   │──▶│  Test   │──▶│ Deploy  │
│ Agent   │   │ Agent   │   │ Agent   │   │ Agent   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
     │             │             │             │
     ▼             ▼             ▼             ▼
  设计方案      代码实现      测试验证      部署上线
```

#### 工作流程

```python
class PipelineAgent:
    def __init__(self, name: str, next_agent=None):
        self.name = name
        self.next_agent = next_agent
        self.queue = Queue()

    def process(self, input_data: Any):
        """处理数据并传递给下一个 Agent"""
        # 处理
        output = self.execute(input_data)

        # 传递
        if self.next_agent:
            return self.next_agent.process(output)

        return output
```

**构建流水线**
```python
# 创建流水线
pipeline = PipelineAgent("design",
    next_agent=PipelineAgent("code",
        next_agent=PipelineAgent("test",
            next_agent=PipelineAgent("deploy")
        )
    )
)

# 执行
result = pipeline.process(requirements)
```

#### 优缺点

**优势**:
- ✅ 流程清晰
- ✅ 易于管理
- ✅ 每个阶段职责明确
- ✅ 易于并行化(不同任务)

**劣势**:
- ❌ 缺乏灵活性
- ❌ 前端阻塞后端
- ❌ 难以回溯

### 模式 4:混合模式 (Hybrid)

#### 架构设计

```
                ┌──────────────┐
                │ Orchestrator │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐   ┌────▼───┐   ┌────▼─────┐
    │ Team A │   │ Team B │   │  Team C  │
    │(Network│   │(Network│   │(Pipeline)│
    │ Style) │   │ Style) │   │          │
    └────────┘   └────────┘   └──────────┘
```

**适用场景**: 复杂系统,不同部分适合不同模式

---

## 第三部分:通信协议

### 消息格式

#### 标准消息结构

```python
@dataclass
class AgentMessage:
    """Agent 间通信的标准消息格式"""

    # 消息标识
    id: str                          # 唯一 ID
    conversation_id: str             # 会话 ID
    parent_id: Optional[str]         # 父消息 ID (用于回复)

    # 参与者
    sender: str                      # 发送者 Agent ID
    receiver: str                    # 接收者 Agent ID

    # 消息类型
    type: MessageType                # 消息类型
    priority: int = 5                # 优先级 (1-10)

    # 内容
    content: dict                    # 消息内容
    metadata: dict = field(default_factory=dict)  # 元数据

    # 时间
    timestamp: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None  # 过期时间

    # 状态
    status: MessageStatus = MessageStatus.PENDING

class MessageType(Enum):
    REQUEST = "request"              # 请求
    RESPONSE = "response"            # 响应
    NOTIFICATION = "notification"    # 通知
    ERROR = "error"                  # 错误
    COMPLETION = "completion"        # 完成通知
    CANCELLATION = "cancellation"    # 取消

class MessageStatus(Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    PROCESSED = "processed"
    FAILED = "failed"
    EXPIRED = "expired"
```

#### 消息示例

**请求消息**
```python
message = AgentMessage(
    id="msg-001",
    conversation_id="conv-001",
    sender="coder-agent-1",
    receiver="tester-agent-1",
    type=MessageType.REQUEST,
    priority=7,
    content={
        "task": "为以下代码生成测试用例",
        "code": """
def login(username, password):
    user = db.find_user(username)
    if user and user.verify_password(password):
        return generate_token(user)
    return None
        """,
        "requirements": {
            "framework": "pytest",
            "coverage_target": 0.9,
            "test_cases": [
                "正常登录",
                "密码错误",
                "用户不存在",
                "空输入"
            ]
        }
    },
    metadata={
        "file": "src/auth/login.py",
        "line_range": [1, 7],
        "related_tickets": ["TICKET-123"]
    }
)
```

**响应消息**
```python
response = AgentMessage(
    id="msg-002",
    conversation_id="conv-001",
    parent_id="msg-001",
    sender="tester-agent-1",
    receiver="coder-agent-1",
    type=MessageType.RESPONSE,
    content={
        "status": "success",
        "test_code": """
import pytest
from auth import login

def test_login_success():
    result = login("admin", "password123")
    assert result is not None

def test_login_wrong_password():
    result = login("admin", "wrong")
    assert result is None

# ... more tests
        """,
        "coverage": 0.92,
        "all_passed": True
    }
)
```

### 通信模式

#### 1. 同步通信 (Request-Response)

```python
class SynchronousCommunication:
    def send_request(self, message: AgentMessage) -> AgentMessage:
        """发送请求并等待响应"""
        # 发送
        self.message_bus.send(message)

        # 等待响应
        response = self.wait_for_response(
            message_id=message.id,
            timeout=30
        )

        return response
```

#### 2. 异步通信 (Fire-and-Forget)

```python
class AsynchronousCommunication:
    def send_notification(self, message: AgentMessage):
        """发送通知,不等待响应"""
        self.message_bus.send(message)
        # 立即返回
```

#### 3. 发布-订阅 (Pub-Sub)

```python
class PubSubCommunication:
    def __init__(self):
        self.topics = {}

    def subscribe(self, agent_id: str, topic: str):
        """订阅主题"""
        if topic not in self.topics:
            self.topics[topic] = []
        self.topics[topic].append(agent_id)

    def publish(self, topic: str, message: AgentMessage):
        """发布消息到主题"""
        if topic in self.topics:
            for agent_id in self.topics[topic]:
                self.send_to_agent(agent_id, message)
```

**示例**
```python
# Agent 订阅事件
event_bus.subscribe("code-committed", "tester-agent")
event_bus.subscribe("test-failed", "debugger-agent")

# 发布事件
event_bus.publish("code-committed", AgentMessage(
    sender="git-agent",
    content={"file": "login.py", "commit": "abc123"}
))

# Tester Agent 自动收到通知
```

### 消息总线

```python
class MessageBus:
    def __init__(self):
        self.agents = {}
        self.message_queue = PriorityQueue()
        self.message_history = []

    def register_agent(self, agent_id: str, agent):
        """注册 Agent"""
        self.agents[agent_id] = agent

    def send(self, message: AgentMessage):
        """发送消息"""
        # 添加到队列
        self.message_queue.put(
            (message.priority, message.timestamp, message)
        )

        # 记录历史
        self.message_history.append(message)

    def process_messages(self):
        """处理消息队列"""
        while not self.message_queue.empty():
            priority, timestamp, message = self.message_queue.get()

            # 检查过期
            if message.expires_at and datetime.now() > message.expires_at:
                message.status = MessageStatus.EXPIRED
                continue

            # 投递消息
            receiver = self.agents.get(message.receiver)
            if receiver:
                receiver.receive(message)
                message.status = MessageStatus.DELIVERED
```

---

## 第四部分:协调策略

### 1. 任务分配

#### 负载均衡

```python
class LoadBalancer:
    def __init__(self, agents: List[Agent]):
        self.agents = agents
        self.agent_load = {agent.id: 0 for agent in agents}

    def select_agent(self, task: Task) -> Agent:
        """选择负载最轻的 Agent"""
        # 找到负载最小的
        min_load = min(self.agent_load.values())
        available_agents = [
            agent for agent, load in self.agent_load.items()
            if load == min_load
        ]

        # 随机选择一个
        selected = random.choice(available_agents)

        # 更新负载
        self.agent_load[selected] += 1

        return self.agents[selected]
```

#### 能力匹配

```python
class CapabilityMatcher:
    def __init__(self, agents: List[Agent]):
        self.agents = agents
        self.capabilities = self.build_capability_matrix()

    def build_capability_matrix(self) -> dict:
        """构建能力矩阵"""
        matrix = {}
        for agent in self.agents:
            matrix[agent.id] = {
                "python": agent.skill_level("python"),
                "javascript": agent.skill_level("javascript"),
                "testing": agent.skill_level("testing"),
                "debugging": agent.skill_level("debugging"),
                # ...
            }
        return matrix

    def select_agent(self, task: Task) -> Agent:
        """根据能力选择最合适的 Agent"""
        required_skills = task.required_skills

        # 计算匹配度
        scores = {}
        for agent_id, capabilities in self.capabilities.items():
            score = sum(
                capabilities.get(skill, 0) * weight
                for skill, weight in required_skills.items()
            )
            scores[agent_id] = score

        # 选择最高分
        best_agent_id = max(scores, key=scores.get)
        return self.agents[best_agent_id]
```

### 2. 冲突解决

#### 资源冲突

```python
class ResourceManager:
    def __init__(self):
        self.resources = {}
        self.locks = {}

    def acquire(self, agent_id: str, resource: str) -> bool:
        """获取资源锁"""
        if resource not in self.locks:
            self.locks[resource] = agent_id
            return True

        # 资源已被锁定
        if self.locks[resource] == agent_id:
            return True  # 同一 Agent 重入

        return False  # 其他 Agent 持有锁

    def release(self, agent_id: str, resource: str):
        """释放资源锁"""
        if self.locks.get(resource) == agent_id:
            del self.locks[resource]
```

**使用示例**
```python
# Coder Agent 想修改文件
if resource_manager.acquire("coder-1", "login.py"):
    # 修改文件
    modify_file("login.py")
    # 释放锁
    resource_manager.release("coder-1", "login.py")
else:
    # 等待或放弃
    wait_or_skip()
```

#### 决策冲突

```python
class VotingSystem:
    def __init__(self, agents: List[Agent]):
        self.agents = agents

    def resolve_conflict(self, options: List[Any]) -> Any:
        """通过投票解决冲突"""
        votes = {}

        # 收集投票
        for agent in self.agents:
            vote = agent.vote(options)
            votes[vote] = votes.get(vote, 0) + 1

        # 返回得票最多的
        return max(votes, key=votes.get)
```

### 3. 同步机制

#### 屏障同步 (Barrier)

```python
class Barrier:
    def __init__(self, num_agents: int):
        self.num_agents = num_agents
        self.count = 0
        self.condition = Condition()

    def wait(self):
        """等待所有 Agent 到达"""
        with self.condition:
            self.count += 1

            if self.count == self.num_agents:
                # 最后一个到达,唤醒所有
                self.condition.notify_all()
                self.count = 0
            else:
                # 等待其他 Agent
                self.condition.wait()
```

**使用示例**
```python
# 创建屏障
barrier = Barrier(num_agents=3)

# 每个 Agent 执行
def agent_task(agent, barrier):
    # 阶段 1
    agent.execute_phase1()
    barrier.wait()  # 等待其他 Agent

    # 阶段 2
    agent.execute_phase2()
```

### 4. 错误处理

```python
class ErrorHandler:
    def __init__(self):
        self.retry_policy = {
            "network": RetryPolicy(max_retries=3, backoff=exponential),
            "timeout": RetryPolicy(max_retries=2, backoff=linear),
            "logic": RetryPolicy(max_retries=0, backoff=none)
        }

    def handle_error(self, error: Exception, context: dict):
        """处理错误"""
        error_type = type(error).__name__
        policy = self.retry_policy.get(error_type)

        if policy and context["retry_count"] < policy.max_retries:
            # 重试
            wait_time = policy.backoff(context["retry_count"])
            time.sleep(wait_time)
            return retry(context["task"])

        # 重试失败,降级处理
        return self.degrade(context)
```

---

## 第五部分:实战案例

### 案例:代码审查系统

#### 系统架构

```
┌─────────────────────────────────────┐
│       Orchestrator Agent            │
│  (协调审查流程)                      │
└──────────┬──────────────────────────┘
           │
    ┌──────┼──────┬──────┬──────┐
    │      │      │      │      │
    ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Security│Style│Logic│Test │Doc  │
│Agent  │Agent│Agent│Agent│Agent│
└──────┘└──────┘└──────┘└──────┘└──────┘
```

#### Agent 实现

**安全审查 Agent**
```python
class SecurityReviewerAgent:
    def review(self, code: str) -> ReviewResult:
        """审查代码安全性"""
        issues = []

        # SQL 注入检查
        if self.detect_sql_injection(code):
            issues.append(Issue(
                type="SQL Injection",
                severity="critical",
                description="检测到 SQL 注入风险",
                fix="使用参数化查询"
            ))

        # XSS 检查
        if self.detect_xss(code):
            issues.append(Issue(
                type="XSS",
                severity="high",
                description="检测到 XSS 漏洞",
                fix="对所有用户输入进行转义"
            ))

        # ... 更多检查

        return ReviewResult(
            agent="security-reviewer",
            issues=issues,
            score=self.calculate_score(issues)
        )
```

**风格审查 Agent**
```python
class StyleReviewerAgent:
    def review(self, code: str) -> ReviewResult:
        """审查代码风格"""
        issues = []

        # 命名规范
        if not self.check_naming_convention(code):
            issues.append(Issue(
                type="Naming Convention",
                severity="low",
                description="变量命名不符合规范"
            ))

        # 代码复杂度
        if self.check_complexity(code) > 10:
            issues.append(Issue(
                type="Complexity",
                severity="medium",
                description="圈复杂度过高",
                fix="拆分函数"
            ))

        return ReviewResult(
            agent="style-reviewer",
            issues=issues,
            score=self.calculate_score(issues)
        )
```

#### Orchestrator

```python
class CodeReviewOrchestrator:
    def __init__(self):
        self.reviewers = [
            SecurityReviewerAgent(),
            StyleReviewerAgent(),
            LogicReviewerAgent(),
            TestCoverageAgent(),
            DocumentationAgent()
        ]

    def review_code(self, code: str, file_path: str) -> dict:
        """协调所有审查 Agent"""
        results = {}

        # 并行执行审查
        with ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(reviewer.review, code): reviewer
                for reviewer in self.reviewers
            }

            for future in as_completed(futures):
                reviewer = futures[future]
                try:
                    result = future.result()
                    results[reviewer.name] = result
                except Exception as e:
                    results[reviewer.name] = ReviewResult(
                        agent=reviewer.name,
                        error=str(e)
                    )

        # 整合结果
        return self.consolidate_results(results)

    def consolidate_results(self, results: dict) -> dict:
        """整合所有审查结果"""
        all_issues = []
        total_score = 0

        for agent, result in results.items():
            all_issues.extend(result.issues)
            total_score += result.score

        # 按严重程度排序
        all_issues.sort(key=lambda x: x.severity, reverse=True)

        return {
            "overall_score": total_score / len(results),
            "total_issues": len(all_issues),
            "critical_issues": [i for i in all_issues if i.severity == "critical"],
            "high_issues": [i for i in all_issues if i.severity == "high"],
            "medium_issues": [i for i in all_issues if i.severity == "medium"],
            "low_issues": [i for i in all_issues if i.severity == "low"],
            "by_agent": results
        }
```

#### 使用示例

```python
orchestrator = CodeReviewOrchestrator()

# 审查代码
code = """
def login(username, password):
    query = f"SELECT * FROM users WHERE username='{username}'"
    user = db.execute(query)
    if user and user.password == password:
        return user
"""

result = orchestrator.review_code(code, "auth/login.py")

# 输出
{
  "overall_score": 65,
  "total_issues": 5,
  "critical_issues": [
    {
      "type": "SQL Injection",
      "severity": "critical",
      "description": "检测到 SQL 注入风险",
      "fix": "使用参数化查询",
      "line": 2
    }
  ],
  "high_issues": [
    {
      "type": "Password Security",
      "severity": "high",
      "description": "明文存储密码",
      "fix": "使用 bcrypt 加密"
    }
  ],
  # ...
}
```

---

## 📊 知识检查

### 自我评估

1. **多 Agent 系统相比单 Agent 有哪些优势?适用于哪些场景?**

2. **层次结构、协作网络、流水线三种架构模式各有什么特点?如何选择?**

3. **如何设计有效的 Agent 通信协议?需要包含哪些要素?**

4. **在多 Agent 系统中如何处理任务分配和冲突解决?**

5. **如何实现 Agent 间的同步和协调?**

6. **在实际项目中如何应用多 Agent 协作系统?**

---

## 🎯 实践建议

### 设计原则

**1. 简单开始**
- 从 2-3 个 Agent 开始
- 使用简单的架构模式
- 逐步增加复杂度

**2. 清晰分工**
- 每个 Agent 有明确职责
- 避免功能重叠
- 定义清晰的接口

**3. 松耦合**
- Agent 间通过消息通信
- 避免直接依赖
- 使用标准协议

**4. 可观测性**
- 记录所有消息
- 追踪决策过程
- 可视化系统状态

### 调试技巧

**1. 消息日志**
```python
class LoggingMiddleware:
    def before_send(self, message: AgentMessage):
        log.info(f"Sending: {message.sender} -> {message.receiver}")

    def after_receive(self, message: AgentMessage):
        log.info(f"Received: {message.receiver} <- {message.sender}")
```

**2. 可视化**
- 使用图形展示 Agent 间通信
- 实时显示系统状态
- 追踪消息流转

**3. 单步执行**
- 调试模式下暂停 Agent
- 手动触发下一步
- 检查中间状态

---

## 📚 延伸阅读

### 论文

1. **"Communicative Agents for Software Development"** (Chen et al., 2023)
   - Multi-Agent 在软件开发中的应用

2. **"MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework"** (2023)
   - 多 Agent 协作框架

3. **"Camel: Communicative Agents for Mind Exploration of Large Scale Language Model"** (2023)
   - Agent 通信机制

### 工具和框架

1. **LangChain Agents** - 多 Agent 框架
2. **AutoGen** (Microsoft) - Multi-Agent 编程框架
3. **CrewAI** - 协作 Agent 框架

### 实践项目

1. 构建代码审查 Multi-Agent 系统
2. 实现自动化测试生成系统
3. 创建文档编写 Agent 团队
4. 开发性能优化 Agent 群

---

**下一阅读**: [人机协作最佳实践](./03-human-ai-collaboration-best-practices.md)
