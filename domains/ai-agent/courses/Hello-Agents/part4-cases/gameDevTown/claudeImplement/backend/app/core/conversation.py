"""
Game Dev Town - 对话管理系统
管理 Agent 之间的对话和会议记录
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class MessageType(Enum):
    """消息类型"""
    SPEECH = "speech"         # 发言
    QUESTION = "question"     # 提问
    ANSWER = "answer"         # 回答
    PROPOSAL = "proposal"     # 提议
    VOTE = "vote"             # 投票
    DECISION = "decision"     # 决策
    SUMMARY = "summary"       # 总结
    SYSTEM = "system"         # 系统消息


@dataclass
class Message:
    """对话消息"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    speaker: str = ""          # 发言者角色
    speaker_name: str = ""     # 发言者名称
    content: str = ""          # 消息内容
    message_type: MessageType = MessageType.SPEECH
    timestamp: datetime = field(default_factory=datetime.now)
    reply_to: Optional[str] = None  # 回复的消息ID
    mentions: List[str] = field(default_factory=list)  # 提及的人
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "speaker": self.speaker,
            "speaker_name": self.speaker_name,
            "content": self.content,
            "type": self.message_type.value,
            "timestamp": self.timestamp.isoformat(),
            "reply_to": self.reply_to,
            "mentions": self.mentions,
            "metadata": self.metadata,
        }


class MeetingType(Enum):
    """会议类型"""
    DAILY = "daily"           # 日常站会
    PLANNING = "planning"      # 计划会议
    REVIEW = "review"          # 评审会议
    BRAINSTORM = "brainstorm"  # 头脑风暴
    DECISION = "decision"      # 决策会议
    RETROSPECTIVE = "retrospective"  # 复盘会议


@dataclass
class Meeting:
    """会议记录"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str = ""
    meeting_type: MeetingType = MeetingType.DAILY
    participants: List[str] = field(default_factory=list)
    messages: List[Message] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    agenda: List[str] = field(default_factory=list)
    conclusions: List[str] = field(default_factory=list)
    action_items: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.meeting_type.value,
            "participants": self.participants,
            "messages": [m.to_dict() for m in self.messages],
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "agenda": self.agenda,
            "conclusions": self.conclusions,
            "action_items": self.action_items,
        }


class ConversationManager:
    """
    对话管理器
    管理 Agent 之间的对话流程
    """

    def __init__(self):
        self.current_meeting: Optional[Meeting] = None
        self.meeting_history: List[Meeting] = []
        self.speaker_queue: List[str] = []
        self.turn_count = 0
        self.max_turns_per_meeting = 20

    def start_meeting(
        self,
        title: str,
        meeting_type: MeetingType,
        participants: List[str],
        agenda: Optional[List[str]] = None,
    ) -> Meeting:
        """开始新会议"""
        self.current_meeting = Meeting(
            title=title,
            meeting_type=meeting_type,
            participants=participants,
            agenda=agenda or [],
        )
        self.speaker_queue = participants.copy()
        self.turn_count = 0
        return self.current_meeting

    def add_message(
        self,
        speaker: str,
        speaker_name: str,
        content: str,
        message_type: MessageType = MessageType.SPEECH,
        reply_to: Optional[str] = None,
        mentions: Optional[List[str]] = None,
    ) -> Optional[Message]:
        """添加消息"""
        if not self.current_meeting:
            return None

        message = Message(
            speaker=speaker,
            speaker_name=speaker_name,
            content=content,
            message_type=message_type,
            reply_to=reply_to,
            mentions=mentions or [],
        )

        self.current_meeting.messages.append(message)
        self.turn_count += 1

        return message

    def get_next_speaker(self) -> Optional[str]:
        """获取下一个发言者"""
        if not self.speaker_queue:
            return None

        # 轮流发言
        speaker = self.speaker_queue.pop(0)
        self.speaker_queue.append(speaker)
        return speaker

    def set_speaker_order(self, order: List[str]) -> None:
        """设置发言顺序"""
        self.speaker_queue = order.copy()

    def add_conclusion(self, conclusion: str) -> None:
        """添加会议结论"""
        if self.current_meeting:
            self.current_meeting.conclusions.append(conclusion)

    def add_action_item(self, task: str, assignee: str, deadline: Optional[str] = None) -> None:
        """添加行动项"""
        if self.current_meeting:
            self.current_meeting.action_items.append({
                "task": task,
                "assignee": assignee,
                "deadline": deadline,
                "status": "pending",
            })

    def end_meeting(self) -> Optional[Meeting]:
        """结束当前会议"""
        if not self.current_meeting:
            return None

        self.current_meeting.end_time = datetime.now()
        ended_meeting = self.current_meeting
        self.meeting_history.append(ended_meeting)
        self.current_meeting = None
        self.speaker_queue = []
        self.turn_count = 0

        return ended_meeting

    def is_meeting_active(self) -> bool:
        """检查会议是否活跃"""
        return self.current_meeting is not None

    def should_end_meeting(self) -> bool:
        """检查是否应该结束会议"""
        return self.turn_count >= self.max_turns_per_meeting

    def get_meeting_context(self, last_n_messages: int = 5) -> str:
        """获取会议上下文"""
        if not self.current_meeting:
            return ""

        messages = self.current_meeting.messages[-last_n_messages:]
        context_parts = []

        for msg in messages:
            context_parts.append(f"{msg.speaker_name}: {msg.content}")

        return "\n".join(context_parts)

    def get_conversation_summary(self) -> Dict[str, Any]:
        """获取对话摘要"""
        if not self.current_meeting:
            return {"active": False}

        return {
            "active": True,
            "meeting_id": self.current_meeting.id,
            "title": self.current_meeting.title,
            "type": self.current_meeting.meeting_type.value,
            "turn_count": self.turn_count,
            "message_count": len(self.current_meeting.messages),
            "participants": self.current_meeting.participants,
        }

    def export_meeting(self) -> Optional[Dict[str, Any]]:
        """导出当前会议"""
        if self.current_meeting:
            return self.current_meeting.to_dict()
        return None
