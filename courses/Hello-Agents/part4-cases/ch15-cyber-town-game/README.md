# 第15章：构建赛博小镇（游戏开发重点章节）

## 章节概述

这是课程中**最重要和最有趣的游戏开发相关章节**！我们将构建一个由多个智能体组成的虚拟社会，模拟真实的社会动态和角色交互。这是 Agent 与游戏结合的经典案例。

## 学习目标

- 理解多智能体系统的架构设计
- 掌握角色行为系统的实现
- 学习动态事件生成机制
- 实现社交网络和关系系统
- 掌握世界状态管理

## 项目介绍

### 什么是赛博小镇？

赛博小镇是一个由 AI Agent 驱动的虚拟社会模拟系统，其中：
- 每个角色都是一个独立的智能体
- 角色有自己的性格、记忆、目标和关系
- 角色之间会自主交互，形成动态故事
- 整个小镇会自动演化，产生意想不到的情节

### 核心特点

1. **自主性**：角色自主决定行为
2. **社交性**：角色之间形成社交网络
3. **记忆性**：角色记得过去发生的事情
4. **目标性**：角色有自己的目标和动机
5. **动态性**：故事线实时生成

## 技术架构

### 系统分层

```
┌─────────────────────────────────────┐
│         用户界面层 (UI Layer)         │
│    - 观察模式    - 交互模式           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       世界管理层 (World Layer)        │
│    - 时间系统    - 事件系统           │
│    - 地点管理    - 状态同步           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Agent 管理层 (Agent Layer)      │
│    - Agent 创建  - 生命周期          │
│    - 通信协调    - 关系管理           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Agent 实现层 (Agent Impl)        │
│    - 感知      - 决策                │
│    - 记忆      - 行动                │
└─────────────────────────────────────┘
```

### 核心模块

#### 1. Agent 系统
- **角色创建**：定义角色属性
- **行为系统**：实现角色行为
- **记忆系统**：存储和检索记忆
- **目标系统**：管理角色目标

#### 2. 世界系统
- **时间系统**：模拟时间流逝
- **地点系统**：管理小镇地点
- **事件系统**：触发和管理事件
- **状态管理**：同步世界状态

#### 3. 社交系统
- **关系网络**：角色间关系
- **通信系统**：角色间对话
- **影响力系统**：角色影响力
- **群体行为**：群体动态

## 详细设计

### Agent 设计

#### 角色属性
```python
class Character:
    # 基础属性
    name: str              # 姓名
    age: int               # 年龄
    personality: dict      # 性格特征
                          # - openness: 开放性
                          # - conscientiousness: 尽责性
                          # - extraversion: 外向性
                          # - agreeableness: 亲和性
                          # - neuroticism: 神经质

    # 状态属性
    mood: float            # 情绪值 (-1 到 1)
    energy: float          # 能量值 (0 到 1)
    hunger: float          # 饥饿值 (0 到 1)
    social: float          # 社交需求 (0 到 1)

    # 关系属性
    relationships: dict    # 与其他角色的关系
    reputation: float      # 声望值

    # 记忆和目标
    memories: list         # 记忆列表
    goals: list            # 当前目标
    current_location: str  # 当前位置
```

#### 行为系统
```python
class BehaviorSystem:
    def decide_action(self, character: Character, context: Context):
        """
        决策下一个行动

        1. 评估当前状态
        2. 检索相关记忆
        3. 考虑当前目标
        4. 权衡各种因素
        5. 选择最优行动
        """
        # 获取可能的行动
        possible_actions = self.get_possible_actions(character, context)

        # 评估每个行动
        scored_actions = []
        for action in possible_actions:
            score = self.evaluate_action(character, action, context)
            scored_actions.append((action, score))

        # 选择最高分的行动
        return max(scored_actions, key=lambda x: x[1])[0]

    def evaluate_action(self, character, action, context):
        """
        评估行动的得分

        考虑因素：
        - 需求满足度（饥饿、能量等）
        - 目标相关性
        - 性格匹配度
        - 社会关系影响
        - 过去经验（记忆）
        """
        score = 0

        # 需求满足
        if action.satisfies_need(character.hunger, 'food'):
            score += character.hunger * 10

        # 目标相关
        for goal in character.goals:
            if action.advances_goal(goal):
                score += goal.importance * 5

        # 性格匹配
        if matches_personality(action, character.personality):
            score += 3

        # 社交影响
        social_impact = self.evaluate_social_impact(character, action, context)
        score += social_impact

        # 记忆影响
        memory_bias = self.get_memory_bias(character, action)
        score += memory_bias

        return score
```

#### 记忆系统
```python
class Memory:
    def __init__(self, event, importance, emotional_impact, timestamp):
        self.event = event                    # 事件内容
        self.importance = importance          # 重要性 (0-1)
        self.emotional_impact = emotional_impact  # 情感影响 (-1到1)
        self.timestamp = timestamp            # 时间戳
        self.associations = []                # 关联记忆
        self.access_count = 0                 # 访问次数

    def decay(self):
        """
        记忆衰减：时间越久，记忆越模糊
        """
        age = current_time - self.timestamp
        decay_factor = math.exp(-age / MEMORY_DECAY_RATE)
        self.importance *= decay_factor

class MemorySystem:
    def retrieve_memories(self, character, query, context):
        """
        检索相关记忆

        1. 关键词匹配
        2. 重要性排序
        3. 情感相关性
        4. 时间近度
        """
        relevant_memories = []

        for memory in character.memories:
            relevance = self.calculate_relevance(query, memory, context)
            if relevance > THRESHOLD:
                relevant_memories.append((memory, relevance))

        # 排序并返回最相关的
        relevant_memories.sort(key=lambda x: x[1], reverse=True)
        return [m[0] for m in relevant_memories[:TOP_K]]

    def store_memory(self, character, event, importance, emotion):
        """
        存储新记忆

        - 与现有记忆建立关联
        - 如果记忆太多，删除不重要的
        """
        memory = Memory(event, importance, emotion, current_time())

        # 建立关联
        for existing_memory in character.memories:
            if self.are_related(memory, existing_memory):
                memory.associations.append(existing_memory)
                existing_memory.associations.append(memory)

        character.memories.append(memory)

        # 记忆管理：删除不重要的记忆
        if len(character.memories) > MAX_MEMORIES:
            self.prune_memories(character)
```

### 世界系统设计

#### 时间系统
```python
class TimeSystem:
    def __init__(self):
        self.current_time = datetime(2024, 1, 1, 8, 0)  # 起始时间
        self.time_scale = 1  # 时间流逝速度（1秒现实时间 = 1分钟游戏时间）

    def update(self, delta_time):
        """更新游戏时间"""
        game_delta = timedelta(minutes=delta_time * self.time_scale)
        self.current_time += game_delta

    def get_time_of_day(self):
        """获取一天中的时段"""
        hour = self.current_time.hour
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 18:
            return "afternoon"
        elif 18 <= hour < 22:
            return "evening"
        else:
            return "night"

    def is_business_hour(self):
        """是否营业时间"""
        return 9 <= self.current_time.hour < 18
```

#### 地点系统
```python
class Location:
    def __init__(self, name, location_type, capacity, amenities):
        self.name = name
        self.type = location_type  # 'home', 'shop', 'park', 'office'
        self.capacity = capacity
        self.amenities = amenities  # ['food', 'rest', 'social', 'entertainment']
        self.current_visitors = []  # 当前在场的角色

    def can_accommodate(self):
        """是否还能容纳更多人"""
        return len(self.current_visitors) < self.capacity

    def get_social_opportunity(self):
        """获取社交机会值"""
        return len(self.current_visitors) / self.capacity

class World:
    def __init__(self):
        self.locations = {}
        self.time_system = TimeSystem()
        self.event_queue = []

    def add_location(self, location):
        self.locations[location.name] = location

    def get_location(self, name):
        return self.locations.get(name)

    def get_available_locations(self, character, need):
        """获取能满足需求的地点"""
        available = []
        for location in self.locations.values():
            if need in location.amenities and location.can_accommodate():
                available.append(location)
        return available
```

#### 事件系统
```python
class Event:
    def __init__(self, event_type, participants, location, timestamp):
        self.type = event_type  # 'conversation', 'transaction', 'conflict', etc.
        self.participants = participants  # 参与的角色列表
        self.location = location
        self.timestamp = timestamp
        self.description = ""
        self.impact = {}  # 对各角色的影响

class EventSystem:
    def __init__(self, world):
        self.world = world
        self.pending_events = []

    def trigger_event(self, event_type, participants, location):
        """触发事件"""
        event = Event(event_type, participants, location, self.world.time_system.current_time)

        # 生成事件描述
        event.description = self.generate_description(event)

        # 计算事件影响
        event.impact = self.calculate_impact(event)

        # 通知参与者
        for character in participants:
            character.observe_event(event)

        # 存储到记忆
        for character in participants:
            importance = self.calculate_importance(character, event)
            emotion = self.calculate_emotion(character, event)
            character.memory_system.store_memory(
                event.description, importance, emotion
            )

        return event

    def generate_description(self, event):
        """生成事件的自然语言描述"""
        if event.type == 'conversation':
            participants = ", ".join([c.name for c in event.participants])
            return f"{participants} 在 {event.location.name} 进行了交谈"
        # ... 其他事件类型

    def calculate_impact(self, event):
        """计算事件对各角色的影响"""
        impact = {}
        for character in event.participants:
            # 根据性格和事件类型计算影响
            if event.type == 'conversation':
                if character.personality['extraversion'] > 0.5:
                    impact[character] = {'mood': 0.2, 'energy': -0.1, 'social': 0.3}
                else:
                    impact[character] = {'mood': 0.1, 'energy': -0.2, 'social': 0.2}
            # ... 其他影响计算
        return impact
```

### 社交系统设计

#### 关系网络
```python
class Relationship:
    def __init__(self, from_character, to_character):
        self.from_character = from_character
        self.to_character = to_character
        self.intimacy = 0.5      # 亲密程度 (0-1)
        self.trust = 0.5         # 信任度 (0-1)
        self.respect = 0.5       # 尊重度 (0-1)
        self.attraction = 0.5    # 好感度 (0-1)
        self.interaction_history = []  # 互动历史

    def update(self, interaction):
        """根据互动更新关系"""
        impact = interaction.impact

        # 更新各项指标
        self.intimacy = clamp(self.intimacy + impact.get('intimacy', 0), 0, 1)
        self.trust = clamp(self.trust + impact.get('trust', 0), 0, 1)
        self.respect = clamp(self.respect + impact.get('respect', 0), 0, 1)
        self.attraction = clamp(self.attraction + impact.get('attraction', 0), 0, 1)

        # 记录互动
        self.interaction_history.append(interaction)

class SocialNetwork:
    def __init__(self):
        self.relationships = {}  # {(char1, char2): Relationship}

    def get_relationship(self, char1, char2):
        """获取两个角色之间的关系"""
        key = tuple(sorted([char1.name, char2.name]))
        if key not in self.relationships:
            self.relationships[key] = Relationship(char1, char2)
        return self.relationships[key]

    def get_social_circle(self, character):
        """获取角色的社交圈"""
        relationships = []
        for key, rel in self.relationships.items():
            if character.name in key:
                other = rel.to_character if rel.from_character == character else rel.from_character
                relationships.append((other, rel))
        return relationships
```

#### 对话系统
```python
class Conversation:
    def __init__(self, participants, topic, location):
        self.participants = participants
        self.topic = topic
        self.location = location
        self.messages = []
        self.turn = 0

    def next_turn(self):
        """下一轮对话"""
        speaker = self.participants[self.turn % len(self.participants)]

        # 决定说什么
        context = self.build_context(speaker)
        response = speaker.generate_response(context)

        self.messages.append({
            'speaker': speaker.name,
            'content': response,
            'timestamp': current_time()
        })

        self.turn += 1

    def build_context(self, speaker):
        """构建对话上下文"""
        context = {
            'topic': self.topic,
            'location': self.location,
            'recent_messages': self.messages[-5:],  # 最近5条消息
            'participants': self.participants,
            'relationships': {}
        }

        # 添加与参与者的关系
        for other in self.participants:
            if other != speaker:
                rel = social_network.get_relationship(speaker, other)
                context['relationships'][other.name] = {
                    'intimacy': rel.intimacy,
                    'trust': rel.trust
                }

        return context
```

## 实现步骤

### 第一步：基础框架（1-2天）

1. **创建角色类**
   - 定义角色属性
   - 实现基本状态管理

2. **创建世界系统**
   - 实现时间系统
   - 创建基础地点

3. **实现主循环**
   - 时间推进
   - Agent 行动触发

### 第二步：行为系统（2-3天）

1. **实现决策系统**
   - 行动评估
   - 决策逻辑

2. **实现基础行为**
   - 移动
   - 进食
   - 休息
   - 社交

3. **实现需求系统**
   - 饥饿、能量、社交需求
   - 需求影响行为

### 第三步：记忆系统（2-3天）

1. **实现记忆存储**
   - 记忆结构
   - 记忆创建

2. **实现记忆检索**
   - 相关性计算
   - 记忆排序

3. **实现记忆衰减**
   - 时间衰减
   - 遗忘机制

### 第四步：社交系统（3-4天）

1. **实现关系系统**
   - 关系属性
   - 关系更新

2. **实现对话系统**
   - 对话触发
   - 对话生成

3. **实现社交网络**
   - 关系图谱
   - 社交圈

### 第五步：事件系统（2-3天）

1. **实现事件触发**
   - 随机事件
   - 条件事件

2. **实现事件处理**
   - 事件影响
   - 记忆存储

3. **实现事件传播**
   - 传闻系统
   - 信息传播

### 第六步：高级功能（可选）

1. **经济系统**
   - 货物交易
   - 价格变化

2. **政治系统**
   - 权力结构
   - 决策机制

3. **文化系统**
   - 习俗传统
   - 文化传播

## 扩展方向

### 🎮 游戏化扩展

1. **可视化界面**
   - 2D/3D 渲染
   - 角色动画
   - 环境表现

2. **玩家交互**
   - 玩家角色
   - 交互选项
   - 影响世界

3. **任务系统**
   - 动态任务
   - 任务链
   - 奖励机制

4. **存档系统**
   - 世界保存
   - 世界读取
   - 回放功能

### 🔬 研究方向

1. **涌现行为研究**
   - 观察群体行为
   - 分析社会现象
   - 研究传播模式

2. **心理学模拟**
   - 更复杂的性格模型
   - 情感模拟
   - 认知偏差

3. **社会学模拟**
   - 社会分层
   - 群体动力学
   - 文化演化

## 技术栈建议

### 后端
- **Python**：核心逻辑
- **LangChain/LangGraph**：Agent 框架
- **OpenAI API**：LLM 调用
- **Vector Database**：记忆存储（ChromaDB/Pinecone）

### 前端（可选）
- **Unity**：游戏引擎
- **Unreal**：3D 引擎
- **Pygame**：简单 2D
- **Web**：React + Three.js

### 数据存储
- **SQLite**：本地存储
- **PostgreSQL**：生产环境
- **Redis**：缓存

## 学习资源

### 经典项目
- **Stanford's Smallville**：论文和代码
- **Generative Agents**：原始研究

### 推荐阅读
- 《The Society of Mind》- Marvin Minsky
- 《Growing Artificial Societies》- Epstein & Axtell

### 相关技术
- Unity ML-Agents
- Unity DOTS
- Entity Component System

## 练习作业

### 基础作业
1. 创建一个包含 5 个角色的简单小镇
2. 实现基础的移动和交互
3. 让角色能够进行简单对话

### 进阶作业
4. 实现完整的记忆系统
5. 实现关系网络和社交系统
6. 添加事件系统和动态情节

### 挑战作业
7. 创建可视化界面
8. 添加玩家参与
9. 实现复杂的社会模拟（经济、政治）

## 项目展示

完成项目后，你应该能够展示：
1. 角色的自主行为
2. 角色间的社交互动
3. 动态生成的故事情节
4. 角色的记忆和关系网络
5. 有趣的涌现行为

## 下一步

完成本章后，你将掌握：
- ✅ 多智能体系统设计
- ✅ 游戏中的 AI 实现
- ✅ 社交模拟技术
- ✅ 动态内容生成

这些技能可以应用于：
- 游戏开发（NPC、对话系统）
- 虚拟社交平台
- 教育模拟
- 社会科学研究

进入：[第16章：毕业设计](../../part5-graduation/ch16-project/) - 构建你自己的完整项目！
