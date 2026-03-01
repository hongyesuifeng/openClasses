# 技术架构文档

## 系统分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层 (UI Layer)                      │
│    - 观察模式: 查看小镇状态                                   │
│    - 交互模式: 玩家可以与角色互动                             │
│    - 配置面板: 设置LLM参数                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  世界管理层 (World Layer)                     │
│    - 时间系统: 模拟游戏时间流逝                               │
│    - 事件系统: 触发和管理事件                                 │
│    - 地点管理: 管理小镇地点                                   │
│    - 状态同步: 同步所有角色和世界状态                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agent 管理层 (Agent Layer)                    │
│    - Agent 创建: 初始化角色                                  │
│    - 生命周期: 管理Agent的创建、更新、移除                    │
│    - 通信协调: Agent之间的消息传递                           │
│    - 关系管理: 管理角色间的关系                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agent 实现层 (Agent Impl)                     │
│    - 感知(Perception): 感知环境和其他角色                     │
│    - 决策(Decision): 决定下一步行动                          │
│    - 记忆(Memory): 存储和检索记忆                            │
│    - 行动(Action): 执行决策                                  │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块设计

### 1. Agent 系统

#### 角色类 (Character)

```python
class Character:
    # 基础属性
    id: str                    # 唯一标识
    name: str                  # 姓名
    age: int                   # 年龄
    personality: Personality   # 性格特征
    
    # 状态属性
    mood: float                # 情绪值 (-1 到 1)
    energy: float              # 能量值 (0 到 1)
    hunger: float              # 饥饿值 (0 到 1)
    social: float              # 社交需求 (0 到 1)
    
    # 关系属性
    relationships: dict        # 与其他角色的关系
    reputation: float          # 声望值
    
    # 记忆和目标
    memories: list             # 记忆列表
    goals: list                # 当前目标
    current_location: str      # 当前位置
```

#### 性格系统 (Personality)

基于大五人格模型:
- **开放性 (openness)**: 好奇心、创造力
- **尽责性 (conscientiousness)**: 自律、组织能力
- **外向性 (extraversion)**: 社交性、活力
- **宜人性 (agreeableness)**: 信任、合作
- **神经质 (neuroticism)**: 情绪稳定性

### 2. 世界系统

#### 时间系统 (TimeSystem)

```python
class TimeSystem:
    current_time: datetime     # 当前游戏时间
    time_scale: int            # 时间流逝速度
    
    def update(delta_time):    # 更新游戏时间
    def get_time_of_day():     # 获取时段 (morning/afternoon/evening/night)
    def is_business_hour():    # 是否营业时间
```

#### 地点系统 (LocationSystem)

```python
class Location:
    name: str                  # 地点名称
    type: str                  # 类型 (home/shop/park/office)
    capacity: int              # 容量
    amenities: list            # 设施
    current_visitors: list     # 当前访客
    
    def can_accommodate():     # 是否可以容纳
    def get_social_opportunity():  # 社交机会值
```

小镇地点:
- **酒馆**: 社交中心，消息传播地
- **咖啡馆**: 休闲社交场所
- **公园**: 放松和偶遇地点
- **商店**: 交易地点
- **住宅**: 休息地点

### 3. 社交系统

#### 关系网络 (Relationship)

```python
class Relationship:
    from_character: str        # 角色A
    to_character: str          # 角色B
    intimacy: float            # 亲密度 (0-1)
    trust: float               # 信任度 (0-1)
    respect: float             # 尊重度 (0-1)
    attraction: float          # 吸引力 (0-1)
    
    def update(interaction):   # 根据互动更新关系
```

#### 事件系统 (Event)

```python
class Event:
    type: str                  # 事件类型
    participants: list         # 参与者
    location: str              # 地点
    timestamp: datetime        # 时间戳
    description: str           # 描述
    impact: dict               # 影响
```

事件类型:
- **conversation**: 对话事件
- **transaction**: 交易事件
- **conflict**: 冲突事件
- **gossip**: 传闻事件

### 4. LLM 集成

使用 MiniMax-M2.5 作为 LLM:

```python
class LLMClient:
    provider: str              # 提供商
    api_key: str               # API密钥
    model: str                  # 模型名称
    
    def chat(messages):         # 对话生成
    def generate(prompt):       # 文本生成
```

## 数据流设计

```
玩家操作
    │
    ▼
┌─────────────────┐
│   前端 (UI)     │
└────────┬────────┘
         │ HTTP请求
         ▼
┌─────────────────┐
│  FastAPI 后端   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ World │ │ Agent │
│ System│ │ System│
└───┬───┘ └───┬───┘
    │         │
    │    ┌────┴────┐
    │    ▼         ▼
    │ ┌───────┐ ┌───────┐
    │ │Memory │ │  LLM  │
    │ │System │ │Client │
    │ └───────┘ └───────┘
    │
    ▼
┌─────────────────┐
│   状态更新      │
└────────┬────────┘
         │ WebSocket/轮询
         ▼
┌─────────────────┐
│   前端渲染      │
└─────────────────┘
```

## 游戏循环

```
┌─────────────────────────────────────────────────────────────┐
│                      游戏主循环 (Game Loop)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 时间推进 (Time Tick)                                    │
│     └── 游戏时间向前推进                                     │
│                                                             │
│  2. 角色感知 (Perception)                                   │
│     ├── 感知周围环境                                        │
│     ├── 感知其他角色                                        │
│     └── 感知时间地点                                        │
│                                                             │
│  3. 行为决策 (Decision Making)                              │
│     ├── 检索相关记忆                                        │
│     ├── 评估当前需求                                        │
│     ├── 考虑当前目标                                        │
│     └── 选择行动                                            │
│                                                             │
│  4. 行动执行 (Action Execution)                            │
│     ├── 执行选择的行动                                       │
│     ├── 更新角色状态                                        │
│     └── 触发事件                                            │
│                                                             │
│  5. 社交互动 (Social Interaction)                          │
│     ├── 角色间对话                                          │
│     ├── 更新关系                                            │
│     └── 传播信息                                            │
│                                                             │
│  6. 记忆存储 (Memory Storage)                              │
│     ├── 存储重要事件                                        │
│     ├── 记忆衰减                                            │
│     └── 遗忘不重要的记忆                                     │
│                                                             │
│  7. 状态同步 (State Synchronization)                       │
│     └── 同步所有状态到前端                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 技术选型理由

### 后端 (Python + FastAPI)

1. **FastAPI**: 现代、高性能的Web框架，易于使用
2. **Python**: 丰富的AI/ML库支持
3. **类型提示**: 更好的代码可维护性

### 前端 (原生 HTML/JS)

1. **简单性**: 无需构建工具，降低学习门槛
2. **可移植性**: 可以在任何浏览器中运行
3. **轻量**: 没有大型框架的 overhead

### LLM (MiniMax-M2.5)

1. **高性能**: 204K 上下文窗口
2. **成本效益**: 性价比高
3. **API兼容**: OpenAI 兼容接口，易于集成

## 扩展性设计

系统设计支持以下扩展:

1. **添加新角色**: 只需创建新的 Character 实例
2. **添加新地点**: 在 LocationSystem 中添加
3. **添加新事件**: 在 EventSystem 中扩展
4. **添加新LLM**: 在 LLMClient 中添加适配器
5. **添加新功能**: 通过插件系统扩展
