"""
Game Dev Town - 记忆系统
实现 Agent 的短期和长期记忆管理
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from collections import deque
import json


@dataclass
class MemoryItem:
    """记忆条目"""
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    importance: float = 0.5  # 0-1 重要性评分
    category: str = "general"  # 记忆类别
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "importance": self.importance,
            "category": self.category,
            "metadata": self.metadata,
        }


class MemorySystem:
    """
    Agent 记忆系统
    管理短期记忆（最近对话）和长期记忆（重要决策）
    """

    def __init__(self, max_short_term: int = 20, max_long_term: int = 100):
        self.short_term_memory: deque = deque(maxlen=max_short_term)
        self.long_term_memory: List[MemoryItem] = []
        self.max_long_term = max_long_term
        self.working_context: Dict[str, Any] = {}

    def add_memory(
        self,
        content: str,
        importance: float = 0.5,
        category: str = "general",
        metadata: Optional[Dict] = None,
    ) -> None:
        """添加新记忆"""
        item = MemoryItem(
            content=content,
            importance=importance,
            category=category,
            metadata=metadata or {},
        )

        # 添加到短期记忆
        self.short_term_memory.append(item)

        # 重要性高的同时存入长期记忆
        if importance >= 0.7:
            self.long_term_memory.append(item)
            # 限制长期记忆大小
            if len(self.long_term_memory) > self.max_long_term:
                self._consolidate_long_term()

    def _consolidate_long_term(self) -> None:
        """整理长期记忆，移除不重要的旧记忆"""
        # 按重要性和时间排序，保留重要记忆
        self.long_term_memory.sort(key=lambda x: (x.importance, x.timestamp), reverse=True)
        self.long_term_memory = self.long_term_memory[: self.max_long_term]

    def get_recent_memories(self, count: int = 5) -> List[Dict[str, Any]]:
        """获取最近的记忆"""
        recent = list(self.short_term_memory)[-count:]
        return [m.to_dict() for m in recent]

    def get_relevant_memories(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """获取与查询相关的记忆（简化版：关键词匹配）"""
        query_words = set(query.lower().split())
        scored_memories = []

        for memory in list(self.short_term_memory) + self.long_term_memory:
            memory_words = set(memory.content.lower().split())
            overlap = len(query_words & memory_words)
            if overlap > 0:
                scored_memories.append((overlap * memory.importance, memory))

        # 排序并返回 top_k
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [m.to_dict() for _, m in scored_memories[:top_k]]

    def get_context_summary(self) -> str:
        """生成上下文摘要供 LLM 使用"""
        recent = self.get_recent_memories(10)
        if not recent:
            return "暂无相关历史记忆。"

        summary_parts = ["最近的工作进展:"]
        for i, mem in enumerate(recent, 1):
            summary_parts.append(f"{i}. {mem['content']}")

        return "\n".join(summary_parts)

    def set_working_context(self, key: str, value: Any) -> None:
        """设置工作上下文"""
        self.working_context[key] = value

    def get_working_context(self, key: str) -> Optional[Any]:
        """获取工作上下文"""
        return self.working_context.get(key)

    def clear_working_context(self) -> None:
        """清空工作上下文"""
        self.working_context.clear()

    def export_memories(self) -> Dict[str, Any]:
        """导出所有记忆"""
        return {
            "short_term": [m.to_dict() for m in self.short_term_memory],
            "long_term": [m.to_dict() for m in self.long_term_memory],
            "working_context": self.working_context,
        }

    def import_memories(self, data: Dict[str, Any]) -> None:
        """导入记忆"""
        self.short_term_memory.clear()
        self.long_term_memory.clear()

        for item_data in data.get("short_term", []):
            item = MemoryItem(
                content=item_data["content"],
                importance=item_data.get("importance", 0.5),
                category=item_data.get("category", "general"),
                metadata=item_data.get("metadata", {}),
            )
            self.short_term_memory.append(item)

        for item_data in data.get("long_term", []):
            item = MemoryItem(
                content=item_data["content"],
                importance=item_data.get("importance", 0.5),
                category=item_data.get("category", "general"),
                metadata=item_data.get("metadata", {}),
            )
            self.long_term_memory.append(item)

        self.working_context = data.get("working_context", {})
