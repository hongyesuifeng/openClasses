# 技术原理文档

本文档详细介绍赛博小镇中使用的核心技术原理，适合学习 Agent 相关技术。

## 目录

1. [多智能体系统 (Multi-Agent System)](#1-多智能体系统)
2. [Agent 架构](#2-agent-架构)
3. [记忆系统](#3-记忆系统)
4. [行为决策](#4-行为决策)
5. [关系网络](#5-关系网络)
6. [LLM 集成](#6-llm-集成)

---

## 1. 多智能体系统

### 什么是多智能体系统?

多智能体系统 (Multi-Agent System, MAS) 是由多个相互协作的智能体组成的系统，每个智能体能够:
- 自主决策
- 与环境交互
- 与其他智能体通信
- 适应变化

### 在游戏中的应用

```
┌─────────────────────────────────────────────────────────────┐
│              赛博小镇 - 多智能体架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│   │ Agent 1 │  │ Agent 2 │  │ Agent N │                  │
│   │ (杰克)   │  │ (玛丽)   │  │ (其他)  │                  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│        │             │             │                         │
│        └─────────────┼─────────────┘                         │
│                      │                                       │
│              ┌───────▼───────┐                               │
│              │   世界状态     │                               │
│              │ - 时间        │                               │
│              │ - 地点        │                               │
│              │ - 事件        │                               │
│              └───────────────┘                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心概念

| 概念 | 说明 |
|------|------|
| **智能体 (Agent)** | 具有自主行为的实体 |
| **环境 (Environment)** | 智能体生存的世界 |
| **行动 (Action)** | 智能体执行的操作 |
| **感知 (Perception)** | 智能体获取的环境信息 |
| **目标 (Goal)** | 智能体想要达成的状态 |

---

## 2. Agent 架构

### 经典 Agent 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent 感知-决策-行动 循环                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────┐                                         │
│    │   世界      │                                         │
│    │  Environment│                                         │
│    └──────┬──────┘                                         │
│           │ 感知 (Perceive)                                 │
│           ▼                                                 │
│    ┌─────────────┐                                         │
│    │   感知      │  获取环境信息                             │
│    │ Perception  │  识别其他Agent                           │
│    └──────┬──────┘  记忆检索                               │
│           │                                                  │
│           ▼                                                 │
│    ┌─────────────┐                                         │
│    │   决策      │  评估状态                                │
│    │ Decision    │  选择行动                                │
│    └──────┬──────┘  目标规划                               │
│           │                                                  │
│           ▼                                                 │
│    ┌─────────────┐                                         │
│    │   行动      │  执行决策                                │
│    │   Action   │  更新状态                                │
│    └──────┬──────┘  与世界交互                             │
│           │                                                  │
│           ▼                                                 │
│    ┌─────────────┐                                         │
│    │   世界      │◄────────────────┐                        │
│    └─────────────┘                 │                        │
│                                  │ 反馈 (Feedback)         │
└──────────────────────────────────┘                        │
```

### 本项目的 Agent 实现

```python
class Agent:
    """
    Agent 类的核心结构
    
    感知 -> 思考 -> 行动 循环
    """
    
    def perceive(self, world_state):
        """感知阶段：获取周围环境信息"""
        # 1. 获取当前位置
        # 2. 获取附近的角色
        # 3. 获取时间信息
        
    def think(self, perception):
        """思考阶段：决策下一步行动"""
        # 1. 检索记忆
        # 2. 评估需求
        # 3. 考虑目标
        # 4. 选择行动
        
    def act(self, decision):
        """行动阶段：执行决策"""
        # 1. 执行行动
        # 2. 更新状态
        # 3. 存储记忆
        # 4. 触发事件
```

### 性格系统 (大五人格)

```python
class Personality:
    """
    基于大五人格模型 (Big Five Personality)
    
    OCEAN 模型:
    - Openness (开放性): 好奇心、创造力
    - Conscientiousness (尽责性): 自律、责任意识
    - Extraversion (外向性): 社交性、活力
    - Agreeableness (宜人性): 信任、善良
    - Neuroticism (神经质): 情绪稳定性
    """
    
    def __init__(self):
        self.openness = 0.5      # 0-1
        self.conscientiousness = 0.5  # 0-1
        self.extraversion = 0.5   # 0-1
        self.agreeableness = 0.5  # 0-1
        self.neuroticism = 0.5   # 0-1
```

### 性格如何影响行为

```
┌─────────────────────────────────────────────────────────────┐
│                   性格对行为的影响                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  高外向性 (Extraversion)                                    │
│  └── 更倾向于社交                                           │
│      └── 主动与陌生人交谈                                    │
│      └── 偏好公共场所                                       │
│                                                             │
│  高尽责性 (Conscientiousness)                               │
│  └── 更倾向于完成任务                                        │
│      └── 遵守时间表                                         │
│      └── 提前规划                                           │
│                                                             │
│  高开放性 (Openness)                                        │
│  └── 更倾向于尝试新事物                                     │
│      └── 对新地点感兴趣                                     │
│      └── 接受新观念                                         │
│                                                             │
│  高宜人性 (Agreeableness)                                   │
│  └── 更倾向于合作                                           │
│      └── 避免冲突                                           │
│      └── 乐于助人                                           │
│                                                             │
│  高神经质 (Neuroticism)                                     │
│  └── 情绪波动更大                                           │
│      └── 对负面事件反应更强                                  │
│      └── 更容易感到焦虑                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 记忆系统

### 记忆的类型

```
┌─────────────────────────────────────────────────────────────┐
│                      记忆类型                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  短期记忆 (Short-term Memory)                              │
│  - 当前正在处理的信息                                        │
│  - 容量有限 (7±2 个组块)                                   │
│  - 快速衰减                                                 │
│                                                             │
│  长期记忆 (Long-term Memory)                               │
│  - 经验知识                                                 │
│  - 容量无限                                                 │
│  - 需要巩固                                                 │
│                                                             │
│  在本项目中:                                                │
│  - 记忆列表 = 长期记忆                                       │
│  - 当前感知 = 短期记忆                                       │
│  - 重要事件 = 强化记忆                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 记忆结构

```python
class Memory:
    """
    记忆结构
    """
    def __init__(self, event: str, importance: float):
        self.event = event              # 事件描述
        self.importance = importance    # 重要性 (0-1)
        self.timestamp = datetime.now()  # 创建时间
        self.emotional_impact = 0.0    # 情感影响 (-1到1)
        self.access_count = 0           # 访问次数
        self.associations = []          # 关联记忆
```

### 记忆检索算法

```python
def retrieve_memories(agent, query, context, top_k=5):
    """
    记忆检索算法
    
    相关性评分 = 权重1×关键词匹配 + 权重2×时间近度 
              + 权重3×重要性 + 权重4×情感相关 + 权重5×访问频率
    """
    scores = []
    
    for memory in agent.memories:
        # 1. 关键词匹配分数
        keyword_score = calculate_keyword_match(query, memory.event)
        
        # 2. 时间近度分数 (越近越高)
        time_score = calculate_time_score(memory.timestamp)
        
        # 3. 重要性分数
        importance_score = memory.importance
        
        # 4. 情感相关性分数
        emotion_score = calculate_emotion_match(agent.mood, memory.emotional_impact)
        
        # 5. 访问频率分数
        access_score = min(memory.access_count / 10, 1.0)
        
        # 综合评分
        total_score = (
            0.3 * keyword_score +
            0.2 * time_score +
            0.2 * importance_score +
            0.2 * emotion_score +
            0.1 * access_score
        )
        
        scores.append((memory, total_score))
    
    # 排序并返回 top_k
    scores.sort(key=lambda x: x[1], reverse=True)
    return [m for m, s in scores[:top_k]]
```

### 记忆衰减公式

```
┌─────────────────────────────────────────────────────────────┐
│                     记忆衰减模型                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  公式:                                                      │
│                                                             │
│    importance(t) = importance(0) × e^(-age / decay_rate)  │
│                                                             │
│  参数:                                                      │
│  - age: 记忆经过的时间 (小时)                                │
│  - decay_rate: 衰减率 (默认 24小时)                         │
│                                                             │
│  可视化:                                                    │
│                                                             │
│    重要性                                                    │
│    1.0 ┤●━━━━━━━━━━━━━━━━━                                │
│        │  ╲                                                 │
│        │   ╲                                                │
│    0.5 ┤    ╲                                               │
│        │     ╲                                              │
│    0.0 ┼──────╲───────────▶ 时间                           │
│        0      24     48    72 (小时)                        │
│                                                             │
│  特殊规则:                                                  │
│  - 情感强烈: 衰减率 × 1.5                                  │
│  - 重要性高: 衰减率 × 2.0                                  │
│  - 重复访问: importance += 0.1                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 行为决策

### 决策框架

```
┌─────────────────────────────────────────────────────────────┐
│                   行为决策框架                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  输入阶段:                                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ - 当前状态 (需求满足度)                               │  │
│  │ - 目标列表                                           │  │
│  │ - 环境信息 (时间/地点/其他角色)                      │  │
│  │ - 相关记忆                                           │  │
│  │ - 性格特征                                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  候选行动生成:                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 基于当前状态生成可能的行动:                           │  │
│  │ - 如果饥饿高: 寻找食物、进食                         │  │
│  │ - 如果能量低: 寻找休息地点                           │  │
│  │ - 如果社交需求高: 寻找其他角色                       │  │
│  │ - 如果有目标: 规划通往目标的行动                      │  │
│  │ - 否则: 探索/随机活动                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  行动评估:                                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 对每个候选行动计算得分:                               │  │
│  │                                                     │  │
│  │ score =                                            │  │
│  │   w1 × 需求满足度 +                                 │  │
│  │   w2 × 目标相关性 +                                 │  │
│  │   w3 × 性格匹配度 +                                 │  │
│  │   w4 × 社交影响 +                                   │  │
│  │   w5 × 记忆影响                                     │  │
│  │                                                     │  │
│  │ 其中权重根据角色性格和当前状态动态调整               │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  选择执行:                                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 选择得分最高的行动执行                               │  │
│  │ 如有并列，可加入随机选择                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 需求驱动模型

```python
class NeedsSystem:
    """
    需求驱动模型
    
    核心思想: Agent 的行为由其需求驱动
    当某种需求超过阈值时，Agent 会优先满足该需求
    """
    
    def __init__(self):
        self.hunger = 0.0      # 饥饿 0-1
        self.energy = 1.0      # 能量 0-1
        self.social = 0.3      # 社交需求 0-1
    
    def get_dominant_need(self):
        """获取最强烈的需求"""
        needs = {
            'hunger': self.hunger,
            'energy': 1 - self.energy,  # 能量低 = 需求高
            'social': self.social
        }
        return max(needs, key=needs.get)
    
    def get_priority_actions(self):
        """根据需求获取优先级行动"""
        dominant = self.get_dominant_need()
        
        if dominant == 'hunger' and self.hunger > 0.7:
            return ['find_food', 'go_to_restaurant', 'eat']
        
        if dominant == 'energy' and self.energy < 0.3:
            return ['find_home', 'rest', 'sleep']
        
        if dominant == 'social' and self.social > 0.6:
            return ['find_people', 'go_to_pub', 'start_conversation']
        
        return ['explore', 'observe']
```

---

## 5. 关系网络

### 关系模型

```
┌─────────────────────────────────────────────────────────────┐
│                      关系属性                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  每对角色之间的关系包含四个维度:                              │
│                                                             │
│  ┌─────────────┐                                           │
│  │  亲密度     │  Intimacy (0-1)                         │
│  │  熟悉程度   │  认识的深度、分享隐私的程度               │
│  └─────────────┘                                           │
│                                                             │
│  ┌─────────────┐                                           │
│  │  信任度     │  Trust (0-1)                             │
│  │  可靠程度   │  相信对方会帮助自己的能力                 │
│  └─────────────┘                                           │
│                                                             │
│  ┌─────────────┐                                           │
│  │  尊重度     │  Respect (0-1)                          │
│  │  认可程度   │  尊重对方的能力和价值观                   │
│  └─────────────┘                                           │
│                                                             │
│  ┌─────────────┐                                           │
│  │  吸引力     │  Attraction (0-1)                       │
│  │  魅力程度   │  对对方 romantically 吸引                │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 关系更新算法

```python
def update_relationship(relationship, interaction):
    """
    根据互动更新关系
    
    互动类型对关系的影响:
    """
    
    # 对话类型
    if interaction.type == 'friendly_conversation':
        relationship.intimacy += 0.1
        relationship.trust += 0.05
        relationship.respect += 0.02
    
    # 帮助行为
    if interaction.type == 'help':
        relationship.trust += 0.15
        relationship.respect += 0.1
    
    # 冲突
    if interaction.type == 'conflict':
        relationship.intimacy -= 0.1
        relationship.trust -= 0.15
        relationship.respect -= 0.1
    
    #  gossip (背后议论)
    if interaction.type == 'gossip':
        if interaction.is_positive:
            relationship.intimacy += 0.05
        else:
            relationship.trust -= 0.1
    
    # 确保值在 0-1 范围内
    relationship.intimacy = clamp(relationship.intimacy, 0, 1)
    relationship.trust = clamp(relationship.trust, 0, 1)
    relationship.respect = clamp(relationship.respect, 0, 1)
```

### 社交网络图

```
┌─────────────────────────────────────────────────────────────┐
│                   社交网络示例                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      杰克                                    │
│                     / │ \                                   │
│                    /  │  \                                  │
│               0.8 /   │   \ 0.6                             │
│                  /    │    \                                │
│                 /     │     \                              │
│               玛丽 ────┼────── 汤姆                           │
│              0.7 ↖    │    ↙ 0.5                            │
│                 /     │     \                               │
│                /      │      \                              │
│           0.4 /       │       \ 0.3                         │
│              /  0.5   │        \                            │
│             /    ↘    │         ↙                          │
│           艾伦 ────────┼────────── 莎拉                       │
│                     0.6                                     │
│                                                             │
│  节点: 角色                                                  │
│  边: 关系 (粗细表示亲密度)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. LLM 集成

### 为什么使用 LLM?

在赛博小镇中，LLM (Large Language Model) 用于:

1. **对话生成**: 角色之间的自然对话
2. **行为推理**: 决策下一步行动的理由
3. **情节生成**: 创造有趣的故事
4. **角色扮演**: 保持角色一致性

### MiniMax M2.5 集成

```python
from openai import OpenAI

class LLMClient:
    """
    LLM 客户端 - 使用 MiniMax M2.5
    """
    
    def __init__(self, api_key: str, model: str = "MiniMax-M2.5"):
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.minimax.com/v1"
        )
        self.model = model
    
    def chat(self, messages: list, system_prompt: str = None):
        """
        对话生成
        
        messages 格式:
        [
            {"role": "system", "content": "系统提示"},
            {"role": "user", "content": "用户消息"},
            {"role": "assistant", "content": "助手回复"}
        ]
        """
        # 构建完整的消息列表
        full_messages = []
        
        if system_prompt:
            full_messages.append({
                "role": "system", 
                "content": system_prompt
            })
        
        full_messages.extend(messages)
        
        # 调用 API
        response = self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            temperature=0.8,
            max_tokens=500
        )
        
        return response.choices[0].message.content
```

### 对话生成示例

```python
def generate_conversation(agent1, agent2, context):
    """
    生成两个角色之间的对话
    """
    
    # 构建系统提示
    system_prompt = f"""你是一个名为 {agent1.name} 的角色。
    性格: {agent1.personality_description}
    当前情绪: {agent1.get_mood_description()}
    你正在{agent1.current_location}。
    
    请用符合角色性格的方式回答。"""
    
    # 构建对话上下文
    messages = [
        {"role": "user", "content": f"你是{agent1.name}，{agent2.name}向你打招呼。"}
    ]
    
    # 调用 LLM
    response = llm_client.chat(messages, system_prompt)
    
    return response
```

### 思维链 (Chain of Thought)

```python
def decision_reasoning(agent, world_state):
    """
    使用 LLM 进行决策推理
    
    展示思考过程，使决策更透明
    """
    
    system_prompt = f"""你是一个角色的内部思考过程。
    角色信息:
    - 名字: {agent.name}
    - 性格: {agent.personality_description}
    - 当前状态: 饥饿={agent.hunger}, 能量={agent.energy}, 社交={agent.social}
    - 当前地点: {agent.current_location}
    
    请分析当前情况，选择下一步行动，并解释理由。
    输出格式: [行动]:[理由]"""
    
    messages = [
        {"role": "user", "content": f"当前世界状态: {world_state.describe()}"}
    ]
    
    reasoning = llm_client.chat(messages, system_prompt)
    return reasoning
```

---

## 总结

本文档介绍了赛博小镇中使用的核心 Agent 技术:

| 技术 | 说明 |
|------|------|
| **多智能体系统** | 多个自主Agent组成的社会 |
| **Agent架构** | 感知-决策-行动循环 |
| **记忆系统** | 存储、检索、衰减机制 |
| **行为决策** | 需求驱动+目标导向 |
| **关系网络** | 动态关系建模 |
| **LLM集成** | 自然语言生成 |

这些技术可以应用于:
- 游戏开发 (NPC、对话系统)
- 虚拟社交模拟
- 教育培训
- 社会科学研究

---

## 参考资料

1. [Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442) - Stanford University
2. [Big Five Personality Model](https://en.wikipedia.org/wiki/Big_Five_personality_traits)
3. [MiniMax API Documentation](https://platform.minimaxi.com/docs/)
4. [Cognitive Architecture for Agents](https://arxiv.org/)
