# 第8章：记忆与检索

## 章节概述

记忆系统是智能体的关键组件，使 Agent 能够记住过去的经验、对话和知识。本章将深入学习如何实现和管理智能体的记忆。

## 学习目标

- 理解记忆的类型和层次
- 实现短期记忆系统
- 实现长期记忆存储
- 掌握 RAG（检索增强生成）技术
- 学习向量数据库的使用

---

## 记忆的类型

### 记忆层次结构

```
┌─────────────────────────────────────────┐
│         感知记忆 (Sensory Memory)         │
│         持续时间: < 1 秒                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         工作记忆 (Working Memory)         │
│         持续时间: 15-30 秒               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         短期记忆 (Short-term Memory)      │
│         持续时间: 几分钟到几小时          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         长期记忆 (Long-term Memory)       │
│         持续时间: 永久                   │
│    ┌─────────────────────────────────┐  │
│    │  显性记忆 (Explicit)            │  │
│    │  - 语义记忆 (知识)              │  │
│    │  - 情景记忆 (事件)              │  │
│    └─────────────────────────────────┘  │
│    ┌─────────────────────────────────┐  │
│    │  隐性记忆 (Implicit)            │  │
│    │  - 程序记忆 (技能)              │  │
│    │  - 启动效应                     │  │
│    └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 在智能体中的应用

| 记忆类型 | 智能体对应 | 应用场景 |
|---------|----------|---------|
| 感知记忆 | 输入缓冲 | 实时感知信息 |
| 工作记忆 | 上下文窗口 | 当前对话、任务 |
| 短期记忆 | 会话记忆 | 当前会话内容 |
| 语义记忆 | 知识库 | 通用知识、事实 |
| 情景记忆 | 事件记忆 | 过去的经历、对话 |
| 程序记忆 | 技能记忆 | 如何使用工具 |

---

## 短期记忆实现

### 基础实现

```python
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import json


@dataclass
class MemoryItem:
    """记忆项"""
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    importance: float = 0.5  # 0-1
    memory_type: str = "general"  # 'conversation', 'event', 'knowledge'
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            'content': self.content,
            'timestamp': self.timestamp.isoformat(),
            'importance': self.importance,
            'type': self.memory_type,
            'metadata': self.metadata
        }


class ShortTermMemory:
    """
    短期记忆系统

    特点：
    - 容量有限
    - 时间衰减
    - LRU 淘汰
    """

    def __init__(self, max_items: int = 100, decay_hours: int = 24):
        self.memories: List[MemoryItem] = []
        self.max_items = max_items
        self.decay_hours = decay_hours

    def add(self, content: str, importance: float = 0.5,
            memory_type: str = "general", metadata: Dict = None) -> MemoryItem:
        """添加记忆"""
        memory = MemoryItem(
            content=content,
            importance=importance,
            memory_type=memory_type,
            metadata=metadata or {}
        )

        self.memories.append(memory)

        # 清理过期和不重要的记忆
        self._cleanup()

        return memory

    def get_recent(self, n: int = 10) -> List[MemoryItem]:
        """获取最近的记忆"""
        return self.memories[-n:]

    def search(self, query: str, top_k: int = 5) -> List[MemoryItem]:
        """
        搜索记忆（关键词匹配）

        TODO: 可以改用向量搜索
        """
        query_lower = query.lower()
        scored_memories = []

        for memory in self.memories:
            # 简单的关键词匹配
            score = 0
            if query_lower in memory.content.lower():
                score += 1.0

            # 时间加权：最近的记忆权重更高
            time_diff = datetime.now() - memory.timestamp
            time_weight = max(0, 1 - time_diff.total_seconds() / (3600 * self.decay_hours))
            score *= time_weight * memory.importance

            if score > 0:
                scored_memories.append((memory, score))

        # 排序并返回 top_k
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        return [m[0] for m in scored_memories[:top_k]]

    def _cleanup(self):
        """清理记忆"""
        now = datetime.now()

        # 1. 删除过期的记忆
        self.memories = [
            m for m in self.memories
            if (now - m.timestamp).total_seconds() < (self.decay_hours * 3600)
        ]

        # 2. 如果仍然超过容量，删除最旧且不重要的
        if len(self.memories) > self.max_items:
            # 按重要性和时间排序
            self.memories.sort(
                key=lambda m: (m.importance, m.timestamp),
                reverse=True
            )
            self.memories = self.memories[:self.max_items]

    def summarize(self) -> str:
        """总结记忆内容"""
        if not self.memories:
            return "没有记忆"

        summary = f"共有 {len(self.memories)} 条记忆\n"
        summary += f"时间范围: {self.memories[0].timestamp} 到 {self.memories[-1].timestamp}\n"

        # 按类型统计
        type_count = {}
        for memory in self.memories:
            type_count[memory.memory_type] = type_count.get(memory.memory_type, 0) + 1

        summary += f"类型分布: {json.dumps(type_count, ensure_ascii=False)}"

        return summary
```

### 游戏开发应用：NPC 会话记忆

```python
class ConversationMemory(ShortTermMemory):
    """
    对话记忆系统

    用于 NPC 记住与玩家的对话
    """

    def add_conversation(self, speaker: str, message: str, emotion: str = "neutral"):
        """添加对话"""
        content = f"{speaker}: {message}"

        return self.add(
            content=content,
            importance=self._calculate_importance(emotion),
            memory_type="conversation",
            metadata={
                "speaker": speaker,
                "emotion": emotion
            }
        )

    def get_conversation_with(self, speaker: str) -> List[MemoryItem]:
        """获取与特定角色的对话"""
        return [
            m for m in self.memories
            if m.memory_type == "conversation" and
            m.metadata.get("speaker") == speaker
        ]

    def _calculate_importance(self, emotion: str) -> float:
        """根据情感计算重要性"""
        emotion_importance = {
            "angry": 0.9,
            "sad": 0.8,
            "happy": 0.6,
            "excited": 0.7,
            "neutral": 0.4
        }
        return emotion_importance.get(emotion, 0.5)

    def get_emotional_summary(self, speaker: str) -> Dict[str, int]:
        """获取情感统计"""
        conversations = self.get_conversation_with(speaker)

        emotion_count = {}
        for conv in conversations:
            emotion = conv.metadata.get("emotion", "neutral")
            emotion_count[emotion] = emotion_count.get(emotion, 0) + 1

        return emotion_count
```

---

## 长期记忆实现

### 向量存储与检索

```python
import numpy as np
from typing import List, Optional
import chromadb  # 或使用其他向量数据库


class LongTermMemory:
    """
    长期记忆系统

    特点：
    - 容量几乎无限
    - 向量检索
    - 持久化存储
    """

    def __init__(self, collection_name: str = "long_term_memory"):
        # 初始化向量数据库
        self.client = chromadb.PersistentClient(path="./memory_db")
        self.collection = self.client.get_or_create_collection(
            name=collection_name
        )

    def add(self, content: str, metadata: Dict[str, Any] = None,
            embedding: Optional[List[float]] = None) -> str:
        """
        添加长期记忆

        Args:
            content: 记忆内容
            metadata: 元数据
            embedding: 向量（如果为 None，需要生成）

        Returns:
            记忆 ID
        """
        memory_id = f"mem_{datetime.now().timestamp()}"

        # 如果没有提供 embedding，需要生成
        if embedding is None:
            # 这里应该调用 embedding 模型
            embedding = self._generate_embedding(content)

        # 存储到向量数据库
        self.collection.add(
            ids=[memory_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata or {}]
        )

        return memory_id

    def search(self, query: str, top_k: int = 5,
               filter_metadata: Dict = None) -> List[Dict]:
        """
        搜索长期记忆

        Args:
            query: 查询文本
            top_k: 返回结果数量
            filter_metadata: 元数据过滤条件

        Returns:
            相关记忆列表
        """
        # 生成查询向量
        query_embedding = self._generate_embedding(query)

        # 搜索
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_metadata
        )

        # 格式化结果
        memories = []
        for i, memory_id in enumerate(results['ids'][0]):
            memories.append({
                'id': memory_id,
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i]
            })

        return memories

    def _generate_embedding(self, text: str) -> List[float]:
        """
        生成文本的向量表示

        实际实现中应该使用：
        - OpenAI Embedding API
        - Sentence Transformers
        - 或其他 embedding 模型
        """
        # 这里使用简单的随机向量作为示例
        return np.random.rand(768).tolist()
```

### 完整的记忆系统

```python
class UnifiedMemorySystem:
    """
    统一的记忆系统

    整合短期和长期记忆
    """

    def __init__(self):
        self.short_term = ShortTermMemory(max_items=100)
        self.long_term = LongTermMemory()

    def remember(self, content: str, importance: float = 0.5,
                 memory_type: str = "general", metadata: Dict = None):
        """
        记住内容

        自动决定存储到短期还是长期
        """
        # 重要记忆存入长期
        if importance > 0.7:
            self.long_term.add(content, metadata)

        # 所有记忆都存入短期
        self.short_term.add(content, importance, memory_type, metadata)

    def recall(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        回忆相关内容

        从短期和长期记忆中检索
        """
        # 从短期记忆检索
        short_results = self.short_term.search(query, top_k)

        # 从长期记忆检索
        long_results = self.long_term.search(query, top_k)

        # 合并结果
        all_results = []

        for memory in short_results:
            all_results.append({
                'content': memory.content,
                'source': 'short_term',
                'timestamp': memory.timestamp,
                'importance': memory.importance
            })

        for memory in long_results:
            all_results.append({
                'content': memory['content'],
                'source': 'long_term',
                'timestamp': memory['metadata'].get('timestamp'),
                'distance': memory['distance']
            })

        # 排序（可以根据相关性或其他标准）
        return all_results[:top_k]
```

---

## RAG（检索增强生成）

### 什么是 RAG？

RAG = **R**etrieval-**A**ugmented **G**eneration

将外部知识检索与 LLM 生成结合，使模型能够访问和利用私有知识。

### RAG 工作流程

```
用户问题
    │
    ├─→ 向量化
    │       │
    │       ▼
    │   检索相关文档 (向量数据库)
    │       │
    │       ▼
    │   Top-K 文档
    │
    ├─→ 构建增强提示
    │   (问题 + 检索的文档)
    │       │
    │       ▼
    └─→ LLM 生成答案
```

### RAG 实现

```python
class RAGSystem:
    """
    检索增强生成系统
    """

    def __init__(self, llm_client, knowledge_base_path: str):
        self.llm = llm_client
        self.knowledge_base = LongTermMemory()
        self._load_knowledge_base(knowledge_base_path)

    def _load_knowledge_base(self, path: str):
        """加载知识库"""
        # 从文件或数据库加载文档
        # 这里简化处理
        pass

    def query(self, question: str, top_k: int = 3) -> str:
        """
        使用 RAG 回答问题
        """
        # 1. 检索相关文档
        relevant_docs = self.knowledge_base.search(question, top_k)

        # 2. 构建增强提示
        prompt = self._build_rag_prompt(question, relevant_docs)

        # 3. LLM 生成答案
        answer = self.llm.generate(prompt)

        return answer

    def _build_rag_prompt(self, question: str, docs: List[Dict]) -> str:
        """构建 RAG 提示"""
        context = "\n\n".join([
            f"文档 {i+1}:\n{doc['content']}"
            for i, doc in enumerate(docs)
        ])

        prompt = f"""基于以下文档回答问题。

文档:
{context}

问题: {question}

请仅使用文档中的信息回答问题。如果文档中没有相关信息，请说明。
"""

        return prompt

    def add_document(self, content: str, metadata: Dict = None):
        """添加文档到知识库"""
        self.knowledge_base.add(content, metadata)
```

### 游戏开发应用：世界知识库

```python
class GameWorldKnowledge(RAGSystem):
    """
    游戏世界知识库

    用于 NPC 了解世界信息
    """

    def answer_about_world(self, question: str, character_context: str = "") -> str:
        """
        回答关于游戏世界的问题

        Args:
            question: 问题
            character_context: 角色上下文（影响回答风格）

        Returns:
            符合角色性格的回答
        """
        # 检索世界知识
        world_knowledge = self.knowledge_base.search(question, top_k=2)

        # 构建提示
        prompt = f"""你是一个游戏角色。

角色背景: {character_context}

世界知识:
{self._format_knowledge(world_knowledge)}

问题: {question}

请基于世界知识，以角色的口吻回答问题。
"""

        return self.llm.generate(prompt)

    def _format_knowledge(self, docs: List[Dict]) -> str:
        """格式化知识"""
        return "\n\n".join([
            f"- {doc['content']}"
            for doc in docs
        ])
```

---

## 记忆的管理策略

### 1. 记忆重要性评分

```python
def calculate_importance(memory: MemoryItem) -> float:
    """
    计算记忆重要性

    因素：
    - 情感强度
    - 新奇性
    - 相关性
    - 最近访问
    """
    score = 0.5  # 基础分数

    # 情感加权
    emotion = memory.metadata.get('emotion', 'neutral')
    emotion_weights = {
        'surprised': 0.3,
        'fearful': 0.3,
        'angry': 0.25,
        'sad': 0.2,
        'happy': 0.15
    }
    score += emotion_weights.get(emotion, 0)

    # 新奇性（重复的内容重要性降低）
    repetition_count = memory.metadata.get('repetition', 0)
    score -= repetition_count * 0.1

    # 最近访问（经常访问的更重要）
    access_count = memory.metadata.get('access_count', 0)
    score += min(access_count * 0.05, 0.3)

    return max(0, min(1, score))
```

### 2. 记忆衰减

```python
def apply_decay(memory: MemoryItem, decay_rate: float = 0.1):
    """
    应用记忆衰减

    根据时间降低记忆的重要性
    """
    age_hours = (datetime.now() - memory.timestamp).total_seconds() / 3600

    # 指数衰减
    decay_factor = math.exp(-decay_rate * age_hours / 24)  # 每天衰减

    memory.importance *= decay_factor
```

### 3. 记忆巩固

```python
def consolidate_memories(short_term: ShortTermMemory,
                        long_term: LongTermMemory,
                        threshold: float = 0.7):
    """
    记忆巩固

    将重要的短期记忆转移到长期记忆
    """
    for memory in short_term.memories:
        if memory.importance >= threshold:
            # 转移到长期记忆
            long_term.add(
                content=memory.content,
                metadata={
                    **memory.metadata,
                    'original_timestamp': memory.timestamp.isoformat(),
                    'consolidated_at': datetime.now().isoformat()
                }
            )
```

---

## 练习作业

### 基础练习
1. 实现一个简单的短期记忆系统
2. 实现关键词搜索功能
3. 实现记忆重要性评分

### 进阶练习
4. 集成向量数据库（ChromaDB/Pinecone）
5. 实现 RAG 系统
6. 为 NPC 实现对话记忆

### 挑战练习
7. 实现完整的记忆系统（短期+长期）
8. 实现记忆衰减和巩固机制
9. 构建游戏世界知识库

## 下一步

完成本章后，进入：
- [第9章：上下文工程](../ch09-context/) - 学习如何管理对话上下文
