# 第十七讲：AI Agent 记忆系统

> 进阶专题：记忆系统设计

## 本章概要

本章将介绍 AI Agent 的记忆系统设计，包括短期记忆、长期记忆、向量存储等关键技术。

---

## 1. 为什么需要记忆系统？

### 1.1 问题背景

```
LLM 的记忆局限
────────────────────────────────────────────────────────

问题 1：上下文窗口有限
• GPT-4: 128K tokens
• Claude 3: 200K tokens
• 超出限制：早期对话被截断

问题 2：无法跨会话记忆
• 每次对话都是"新"的
• 无法记住用户偏好
• 无法利用历史信息

问题 3：知识更新困难
• 模型知识有截止日期
• 无法学习新信息

解决：记忆系统
```

### 1.2 记忆系统的作用

```
记忆系统功能
────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│  短期记忆 (Working Memory)                          │
│  ─────────────────────                              │
│  • 当前对话上下文                                   │
│  • 临时任务状态                                     │
│  • 最近几轮对话                                     │
│                                                     │
│  长期记忆 (Long-term Memory)                        │
│  ──────────────────────                             │
│  • 用户偏好和设置                                   │
│  • 历史对话摘要                                     │
│  • 重要信息提取                                     │
│  • 知识库                                           │
│                                                     │
│  语义记忆 (Semantic Memory)                         │
│  ───────────────────────                            │
│  • 向量数据库存储                                   │
│  • 相似性检索                                       │
│  • 知识图谱                                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. 记忆架构设计

### 2.1 整体架构

```
OpenClaw 记忆系统架构
────────────────────────────────────────────────────────

                    ┌─────────────┐
                    │   用户请求   │
                    └──────┬──────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────┐
│                   记忆管理器                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │  1. 检索相关记忆                                 │ │
│  │  2. 构建上下文                                   │ │
│  │  3. 调用 LLM                                     │ │
│  │  4. 存储新记忆                                   │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
         │              │              │
         ↓              ↓              ↓
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ 短期记忆  │   │ 长期记忆  │   │ 向量存储  │
   │ (Redis)  │   │ (SQLite) │   │(Milvus)  │
   └──────────┘   └──────────┘   └──────────┘
```

### 2.2 记忆类型

```python
# memory_types.py

from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

class MemoryType(Enum):
    """记忆类型"""
    CONVERSATION = "conversation"  # 对话记忆
    FACT = "fact"                  # 事实记忆
    PREFERENCE = "preference"      # 用户偏好
    SUMMARY = "summary"            # 摘要记忆
    EPISODIC = "episodic"          # 情景记忆

@dataclass
class Memory:
    """记忆条目"""
    id: str
    type: MemoryType
    content: str
    embedding: Optional[list] = None
    metadata: Dict[str, Any] = None
    created_at: datetime = None
    expires_at: Optional[datetime] = None
    importance: float = 0.5

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "content": self.content,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "importance": self.importance
        }
```

---

## 3. 短期记忆实现

### 3.1 滑动窗口

```python
# short_term_memory.py

from collections import deque
from typing import List, Dict

class ShortTermMemory:
    """短期记忆：滑动窗口实现"""

    def __init__(self, max_turns: int = 10):
        self.max_turns = max_turns
        self.messages = deque(maxlen=max_turns)

    def add(self, role: str, content: str):
        """添加消息"""
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

    def get_context(self) -> List[Dict]:
        """获取上下文"""
        return list(self.messages)

    def clear(self):
        """清空记忆"""
        self.messages.clear()

    def get_token_count(self, tokenizer) -> int:
        """估算 token 数量"""
        text = " ".join([m["content"] for m in self.messages])
        return len(tokenizer.encode(text))
```

### 3.2 摘要压缩

```python
# memory_summarizer.py

class MemorySummarizer:
    """记忆摘要器"""

    def __init__(self, llm_client):
        self.llm = llm_client

    async def summarize(self, messages: List[Dict]) -> str:
        """将多轮对话压缩为摘要"""
        prompt = f"""
请将以下对话压缩为一个简洁的摘要，保留关键信息：

对话内容：
{self._format_messages(messages)}

摘要：
"""
        response = await self.llm.generate(prompt)
        return response.strip()

    def _format_messages(self, messages: List[Dict]) -> str:
        lines = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            lines.append(f"{role}: {content}")
        return "\n".join(lines)

# 使用
async def compress_memory(stm: ShortTermMemory, summarizer: MemorySummarizer):
    """压缩记忆"""
    if len(stm.messages) > 20:
        # 取出较早的 10 条
        old_messages = [stm.messages.popleft() for _ in range(10)]

        # 生成摘要
        summary = await summarizer.summarize(old_messages)

        # 存储摘要
        stm.messages.appendleft({
            "role": "system",
            "content": f"[历史摘要] {summary}"
        })
```

---

## 4. 长期记忆实现

### 4.1 持久化存储

```python
# long_term_memory.py

import sqlite3
import json
from datetime import datetime
from typing import List, Optional

class LongTermMemory:
    """长期记忆：SQLite 实现"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                embedding BLOB,
                metadata TEXT,
                importance REAL DEFAULT 0.5,
                created_at TEXT,
                accessed_at TEXT,
                access_count INTEGER DEFAULT 0
            )
        ''')

        c.execute('''
            CREATE INDEX IF NOT EXISTS idx_user_type
            ON memories(user_id, type)
        ''')

        conn.commit()
        conn.close()

    def store(self, user_id: str, memory: Memory):
        """存储记忆"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''
            INSERT OR REPLACE INTO memories
            (id, user_id, type, content, embedding, metadata, importance, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            memory.id,
            user_id,
            memory.type.value,
            memory.content,
            json.dumps(memory.embedding) if memory.embedding else None,
            json.dumps(memory.metadata) if memory.metadata else None,
            memory.importance,
            datetime.now().isoformat()
        ))

        conn.commit()
        conn.close()

    def retrieve(self, user_id: str, memory_type: Optional[MemoryType] = None,
                 limit: int = 10) -> List[Memory]:
        """检索记忆"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        if memory_type:
            c.execute('''
                SELECT id, type, content, metadata, importance, created_at
                FROM memories
                WHERE user_id = ? AND type = ?
                ORDER BY importance DESC, created_at DESC
                LIMIT ?
            ''', (user_id, memory_type.value, limit))
        else:
            c.execute('''
                SELECT id, type, content, metadata, importance, created_at
                FROM memories
                WHERE user_id = ?
                ORDER BY importance DESC, created_at DESC
                LIMIT ?
            ''', (user_id, limit))

        rows = c.fetchall()
        conn.close()

        return [
            Memory(
                id=row[0],
                type=MemoryType(row[1]),
                content=row[2],
                metadata=json.loads(row[3]) if row[3] else None,
                importance=row[4],
                created_at=datetime.fromisoformat(row[5])
            )
            for row in rows
        ]

    def forget(self, memory_id: str):
        """遗忘（删除）记忆"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('DELETE FROM memories WHERE id = ?', (memory_id,))
        conn.commit()
        conn.close()
```

### 4.2 用户偏好管理

```python
# user_preferences.py

class UserPreferences:
    """用户偏好管理"""

    def __init__(self, ltm: LongTermMemory):
        self.ltm = ltm

    def set_preference(self, user_id: str, key: str, value: Any):
        """设置偏好"""
        memory = Memory(
            id=f"pref_{user_id}_{key}",
            type=MemoryType.PREFERENCE,
            content=json.dumps({"key": key, "value": value}),
            metadata={"key": key},
            importance=1.0
        )
        self.ltm.store(user_id, memory)

    def get_preference(self, user_id: str, key: str, default: Any = None) -> Any:
        """获取偏好"""
        memories = self.ltm.retrieve(user_id, MemoryType.PREFERENCE)

        for memory in memories:
            data = json.loads(memory.content)
            if data.get("key") == key:
                return data.get("value")

        return default

    def get_all_preferences(self, user_id: str) -> Dict[str, Any]:
        """获取所有偏好"""
        memories = self.ltm.retrieve(user_id, MemoryType.PREFERENCE)
        prefs = {}

        for memory in memories:
            data = json.loads(memory.content)
            prefs[data["key"]] = data["value"]

        return prefs
```

---

## 5. 向量存储与检索

### 5.1 向量化

```python
# embedding.py

import numpy as np
from typing import List

class EmbeddingService:
    """文本向量化服务"""

    def __init__(self, model_name: str = "text-embedding-3-small"):
        self.model_name = model_name
        # 实际实现中连接 OpenAI 或其他 embedding 服务

    async def embed(self, text: str) -> List[float]:
        """将文本转换为向量"""
        # 实际实现
        pass

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """批量向量化"""
        # 实际实现
        pass

    @staticmethod
    def cosine_similarity(a: List[float], b: List[float]) -> float:
        """计算余弦相似度"""
        a_np = np.array(a)
        b_np = np.array(b)
        return np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np))
```

### 5.2 向量数据库

```python
# vector_store.py

from typing import List, Tuple
import chromadb
from chromadb.config import Settings

class VectorStore:
    """向量存储"""

    def __init__(self, persist_dir: str):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="memories",
            metadata={"hnsw:space": "cosine"}
        )

    async def add(self, ids: List[str], embeddings: List[List[float]],
                  documents: List[str], metadatas: List[dict] = None):
        """添加向量"""
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    async def search(self, query_embedding: List[float],
                     n_results: int = 10,
                     where: dict = None) -> List[Tuple[str, float, dict]]:
        """相似性搜索"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where
        )

        return list(zip(
            results["ids"][0],
            results["distances"][0],
            results["metadatas"][0]
        ))

    def delete(self, ids: List[str]):
        """删除向量"""
        self.collection.delete(ids=ids)
```

### 5.3 记忆检索

```python
# memory_retriever.py

class MemoryRetriever:
    """记忆检索器"""

    def __init__(self, embedding_service: EmbeddingService,
                 vector_store: VectorStore,
                 ltm: LongTermMemory):
        self.embedding = embedding_service
        self.vector_store = vector_store
        self.ltm = ltm

    async def retrieve_relevant(self, user_id: str, query: str,
                                n_results: int = 5) -> List[Memory]:
        """检索相关记忆"""
        # 向量化查询
        query_embedding = await self.embedding.embed(query)

        # 向量搜索
        results = await self.vector_store.search(
            query_embedding,
            n_results=n_results,
            where={"user_id": user_id}
        )

        # 获取完整记忆
        memories = []
        for memory_id, distance, metadata in results:
            memory = await self.ltm.get(memory_id)
            if memory:
                memory.relevance_score = 1 - distance
                memories.append(memory)

        return memories

    async def retrieve_with_reranking(self, user_id: str, query: str,
                                      n_results: int = 5) -> List[Memory]:
        """检索并重排序"""
        # 先获取更多结果
        memories = await self.retrieve_relevant(user_id, query, n_results * 2)

        # 重排序（可以考虑时间衰减、重要性等）
        scored_memories = []
        now = datetime.now()

        for memory in memories:
            # 综合评分
            recency = self._recency_score(memory.created_at, now)
            importance = memory.importance
            relevance = memory.relevance_score

            score = 0.4 * relevance + 0.3 * importance + 0.3 * recency
            scored_memories.append((memory, score))

        # 排序并返回
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        return [m for m, s in scored_memories[:n_results]]

    def _recency_score(self, created_at: datetime, now: datetime) -> float:
        """计算时间衰减分数"""
        days_ago = (now - created_at).days
        return max(0, 1 - days_ago / 365)  # 一年后归零
```

---

## 6. 记忆管理策略

### 6.1 记忆巩固

```python
# memory_consolidation.py

class MemoryConsolidation:
    """记忆巩固：将短期记忆转化为长期记忆"""

    def __init__(self, llm, ltm: LongTermMemory, vector_store: VectorStore):
        self.llm = llm
        self.ltm = ltm
        self.vector_store = vector_store

    async def consolidate(self, user_id: str, messages: List[Dict]):
        """巩固记忆"""
        # 提取关键信息
        facts = await self._extract_facts(messages)

        for fact in facts:
            # 检查是否已存在相似记忆
            existing = await self._find_similar(user_id, fact["content"])

            if existing:
                # 更新现有记忆
                await self._update_memory(existing, fact)
            else:
                # 创建新记忆
                await self._create_memory(user_id, fact)

    async def _extract_facts(self, messages: List[Dict]) -> List[dict]:
        """从对话中提取事实"""
        prompt = f"""
从以下对话中提取重要的事实和信息：

对话：
{json.dumps(messages, ensure_ascii=False, indent=2)}

请以 JSON 格式返回事实列表，每个事实包含：
- content: 事实内容
- type: 类型 (fact/preference/event)
- importance: 重要性 (0-1)
"""
        response = await self.llm.generate(prompt)
        return json.loads(response)
```

### 6.2 遗忘机制

```python
# forgetting.py

class ForgettingMechanism:
    """遗忘机制"""

    def __init__(self, ltm: LongTermMemory, vector_store: VectorStore):
        self.ltm = ltm
        self.vector_store = vector_store

    async def apply_decay(self, user_id: str, decay_rate: float = 0.1):
        """应用记忆衰减"""
        memories = self.ltm.retrieve(user_id, limit=1000)

        for memory in memories:
            # 降低重要性
            memory.importance *= (1 - decay_rate)

            # 如果重要性太低，删除
            if memory.importance < 0.1:
                await self.forget(memory.id)

    async def forget(self, memory_id: str):
        """遗忘记忆"""
        self.ltm.forget(memory_id)
        self.vector_store.delete([memory_id])

    async def cleanup_old_memories(self, user_id: str, days: int = 365):
        """清理旧记忆"""
        # 实现清理逻辑
        pass
```

---

## 关键要点总结

1. **记忆类型**：短期记忆、长期记忆、语义记忆
2. **短期记忆**：滑动窗口 + 摘要压缩
3. **长期记忆**：持久化存储 + 用户偏好
4. **向量存储**：相似性检索 + RAG
5. **记忆管理**：巩固、衰减、遗忘

---

## 扩展阅读

- [MemGPT](https://memgpt.readthedocs.io/)
- [Generative Agents](https://arxiv.org/abs/2304.03442)
- [ChromaDB](https://www.trychroma.com/)

---

*下一阶段：[实战项目](../06-projects/01-personal-assistant.md)*
