"""
记忆系统 - Memory System
负责存储和管理 Agent 的记忆，包括短期记忆和长期记忆
"""

import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class MemoryEntry:
    """记忆条目"""
    content: str
    timestamp: float
    importance: float
    memory_type: str = "short"  # short, long, project
    context: Optional[Dict[str, Any]] = None
    speaker: Optional[str] = None
    topic: Optional[str] = None


class MemorySystem:
    """记忆系统"""
    
    def __init__(self, agent_id: str, short_term_limit: int = 10, importance_threshold: float = 0.7):
        self.agent_id = agent_id
        self.short_term_limit = short_term_limit
        self.importance_threshold = importance_threshold
        self.short_term: List[MemoryEntry] = []
        self.long_term: List[MemoryEntry] = []
        self.project_memories: Dict[str, Any] = {}
    
    def store(
        self,
        content: str,
        memory_type: str = "short",
        importance: float = 0.5,
        context: Optional[Dict[str, Any]] = None,
        speaker: Optional[str] = None,
        topic: Optional[str] = None
    ) -> None:
        """存储记忆"""
        entry = MemoryEntry(
            content=content,
            timestamp=time.time(),
            importance=importance,
            memory_type=memory_type,
            context=context or {},
            speaker=speaker,
            topic=topic
        )
        
        if memory_type == "long" or importance >= self.importance_threshold:
            self.long_term.append(entry)
        else:
            self.short_term.append(entry)
            if len(self.short_term) > self.short_term_limit:
                self.short_term.pop(0)
    
    def store_conversation(self, speaker: str, content: str, importance: float = 0.5) -> None:
        """存储对话记忆"""
        self.store(
            content=f"[{speaker}]: {content}",
            memory_type="short",
            importance=importance,
            speaker=speaker,
            topic="conversation"
        )
    
    def store_decision(self, decision: str, details: Dict[str, Any]) -> None:
        """存储决策记忆"""
        self.store(
            content=decision,
            memory_type="long",
            importance=0.9,
            context=details,
            topic="decision"
        )
    
    def retrieve(self, context: Optional[Dict[str, Any]] = None, limit: int = 10) -> List[MemoryEntry]:
        """检索相关记忆"""
        memories = list(self.short_term)
        
        if context:
            relevant_long_term = [
                m for m in self.long_term
                if self._is_relevant(m, context)
            ]
            memories.extend(relevant_long_term)
        else:
            memories.extend(self.long_term[-5:])
        
        memories.sort(key=lambda x: (x.importance, x.timestamp), reverse=True)
        return memories[:limit]
    
    def _is_relevant(self, memory: MemoryEntry, context: Dict[str, Any]) -> bool:
        """检查记忆是否与上下文相关"""
        if not context:
            return True
        
        topic = context.get("topic", "")
        speaker = context.get("speaker", "")
        
        if topic and memory.topic == topic:
            return True
        if speaker and memory.speaker == speaker:
            return True
        
        return False
    
    def get_recent_conversations(self, limit: int = 5) -> List[str]:
        """获取最近的对话"""
        conversations = [
            m.content for m in self.short_term
            if m.topic == "conversation"
        ]
        return conversations[-limit:]
    
    def get_decisions(self) -> List[Dict[str, Any]]:
        """获取所有决策"""
        return [
            {
                "content": m.content,
                "timestamp": m.timestamp,
                "context": m.context
            }
            for m in self.long_term
            if m.topic == "decision"
        ]
    
    def clear_short_term(self) -> None:
        """清空短期记忆"""
        self.short_term.clear()
    
    def export(self) -> Dict[str, Any]:
        """导出记忆数据"""
        return {
            "agent_id": self.agent_id,
            "short_term": [
                {
                    "content": m.content,
                    "timestamp": m.timestamp,
                    "importance": m.importance,
                    "memory_type": m.memory_type,
                    "speaker": m.speaker,
                    "topic": m.topic
                }
                for m in self.short_term
            ],
            "long_term": [
                {
                    "content": m.content,
                    "timestamp": m.timestamp,
                    "importance": m.importance,
                    "memory_type": m.memory_type,
                    "speaker": m.speaker,
                    "topic": m.topic
                }
                for m in self.long_term
            ],
            "project_memories": self.project_memories
        }
    
    def import_data(self, data: Dict[str, Any]) -> None:
        """导入记忆数据"""
        self.short_term = [
            MemoryEntry(
                content=m["content"],
                timestamp=m["timestamp"],
                importance=m["importance"],
                memory_type=m.get("memory_type", "short"),
                speaker=m.get("speaker"),
                topic=m.get("topic")
            )
            for m in data.get("short_term", [])
        ]
        self.long_term = [
            MemoryEntry(
                content=m["content"],
                timestamp=m["timestamp"],
                importance=m["importance"],
                memory_type=m.get("memory_type", "long"),
                speaker=m.get("speaker"),
                topic=m.get("topic")
            )
            for m in data.get("long_term", [])
        ]
        self.project_memories = data.get("project_memories", {})
