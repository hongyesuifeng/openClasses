"""
对话管理系统 - Conversation Management
负责管理对话历史、上下文和消息处理
"""

import time
import uuid
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum


class MessageType(Enum):
    """消息类型"""
    NORMAL = "normal"
    DECISION = "decision"
    ACTION_ITEM = "action_item"
    SYSTEM = "system"
    QUESTION = "question"


class MeetingType(Enum):
    """会议类型"""
    DAILY_STANDUP = "daily_standup"
    DESIGN_REVIEW = "design_review"
    TECHNICAL_REVIEW = "technical_review"
    ART_REVIEW = "art_review"
    MILESTONE = "milestone"


@dataclass
class Message:
    """消息"""
    id: str
    speaker: str
    speaker_role: str
    content: str
    message_type: MessageType = MessageType.NORMAL
    timestamp: float = field(default_factory=time.time)
    meeting: Optional[str] = None
    topic: Optional[str] = None
    emotion: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class ConversationManager:
    """对话管理器"""
    
    def __init__(self):
        self.messages: List[Message] = []
        self.current_topic: Optional[str] = None
        self.active_meeting: Optional[str] = None
        self.message_handlers: List[Callable] = []
    
    def add_message(
        self,
        speaker: str,
        speaker_role: str,
        content: str,
        message_type: MessageType = MessageType.NORMAL,
        topic: Optional[str] = None,
        emotion: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Message:
        """添加消息"""
        message_id = f"msg_{uuid.uuid4().hex[:8]}"
        
        message = Message(
            id=message_id,
            speaker=speaker,
            speaker_role=speaker_role,
            content=content,
            message_type=message_type,
            topic=topic or self.current_topic,
            meeting=self.active_meeting,
            emotion=emotion,
            metadata=metadata or {}
        )
        
        self.messages.append(message)
        
        for handler in self.message_handlers:
            try:
                handler(message)
            except Exception as e:
                print(f"[Conversation] Handler error: {e}")
        
        return message
    
    def get_context(self, window_size: int = 10) -> List[Message]:
        """获取上下文"""
        return self.messages[-window_size:]
    
    def get_meeting_messages(self, meeting_id: str) -> List[Message]:
        """获取指定会议的 messages"""
        return [m for m in self.messages if m.meeting == meeting_id]
    
    def get_recent_messages(self, limit: int = 5) -> List[Message]:
        """获取最近的消息"""
        return self.messages[-limit:]
    
    def set_topic(self, topic: str) -> None:
        """设置当前话题"""
        self.current_topic = topic
    
    def start_meeting(self, meeting_type: MeetingType, topic: Optional[str] = None) -> str:
        """开始会议"""
        meeting_id = f"meeting_{meeting_type.value}_{int(time.time())}"
        self.active_meeting = meeting_id
        self.current_topic = topic or meeting_type.value
        
        self.add_message(
            speaker="System",
            speaker_role="system",
            content=f"会议开始: {meeting_type.value}",
            message_type=MessageType.SYSTEM,
            topic=self.current_topic
        )
        
        return meeting_id
    
    def end_meeting(self) -> None:
        """结束会议"""
        if self.active_meeting:
            self.add_message(
                speaker="System",
                speaker_role="system",
                content="会议结束",
                message_type=MessageType.SYSTEM,
                topic=self.current_topic
            )
            self.active_meeting = None
    
    def extract_action_items(self, messages: Optional[List[Message]] = None) -> List[Dict[str, Any]]:
        """提取行动项"""
        if messages is None:
            messages = self.messages
        
        items = []
        for msg in messages:
            if msg.message_type == MessageType.ACTION_ITEM:
                items.append({
                    "speaker": msg.speaker,
                    "content": msg.content,
                    "timestamp": msg.timestamp
                })
        
        return items
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """获取对话摘要"""
        if not self.messages:
            return {"total": 0, "by_role": {}}
        
        by_role = {}
        for msg in self.messages:
            role = msg.speaker_role
            if role not in by_role:
                by_role[role] = 0
            by_role[role] += 1
        
        return {
            "total": len(self.messages),
            "by_role": by_role,
            "topics": list(set(m.topic for m in self.messages if m.topic)),
            "current_topic": self.current_topic,
            "active_meeting": self.active_meeting
        }
    
    def export_messages(self) -> List[Dict[str, Any]]:
        """导出消息"""
        return [
            {
                "id": m.id,
                "speaker": m.speaker,
                "speaker_role": m.speaker_role,
                "content": m.content,
                "message_type": m.message_type.value,
                "timestamp": m.timestamp,
                "meeting": m.meeting,
                "topic": m.topic,
                "emotion": m.emotion,
                "metadata": m.metadata
            }
            for m in self.messages
        ]
    
    def clear(self) -> None:
        """清空对话"""
        self.messages.clear()
        self.current_topic = None
        self.active_meeting = None
