"""
会议编排器 - Meeting Orchestrator
负责管理会议流程、角色发言顺序和决策
"""

import time
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field

from backend.agent.base import BaseAgent
from backend.agent.producer import create_all_agents, get_agent_by_role
from backend.core.conversation import ConversationManager, MessageType, MeetingType
from backend.core.decision import DecisionSystem, DecisionType
from backend.core.task import TaskSystem, TaskPriority
from backend.llm.minimax import LLMClient


MEETING_TEMPLATES = {
    MeetingType.DAILY_STANDUP: {
        "duration": 15,
        "opening": "好的，我们开始今天的站会。{name}，你先说说进度？",
        "roles_order": ["producer", "designer", "developer", "artist"],
        "typical_length": 4
    },
    MeetingType.DESIGN_REVIEW: {
        "duration": 60,
        "opening": "好的，我们开始设计评审。{proposer}，请介绍一下你的设计方案。",
        "roles_order": ["producer", "designer", "developer", "artist"],
        "proposer": "designer",
        "typical_length": 8
    },
    MeetingType.TECHNICAL_REVIEW: {
        "duration": 45,
        "opening": "好的，我们开始技术评审。{proposer}，请介绍一下技术方案。",
        "roles_order": ["producer", "developer", "designer", "artist"],
        "proposer": "developer",
        "typical_length": 6
    },
    MeetingType.ART_REVIEW: {
        "duration": 30,
        "opening": "好的，我们开始美术评审。{proposer}，请展示你的设计方案。",
        "roles_order": ["producer", "artist", "designer", "developer"],
        "proposer": "artist",
        "typical_length": 5
    },
    MeetingType.MILESTONE: {
        "duration": 90,
        "opening": "各位，我们来回顾一下这个阶段的里程碑成果。",
        "roles_order": ["producer", "developer", "designer", "artist"],
        "typical_length": 10
    }
}


@dataclass
class MeetingState:
    """会议状态"""
    meeting_id: str
    meeting_type: MeetingType
    topic: str
    status: str = "pending"  # pending, in_progress, paused, completed
    start_time: float = 0
    end_time: float = 0
    round: int = 0
    current_speaker: Optional[str] = None


class MeetingOrchestrator:
    """会议编排器"""
    
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
        self.agents = create_all_agents(llm_client)
        
        for agent in self.agents.values():
            agent.set_llm_client(llm_client)
        
        self.conversation = ConversationManager()
        self.decision_system = DecisionSystem()
        self.task_system = TaskSystem()
        
        self.current_meeting: Optional[MeetingState] = None
    
    def start_meeting(
        self,
        meeting_type: MeetingType,
        topic: str,
        project_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """开始会议"""
        meeting_id = self.conversation.start_meeting(meeting_type, topic)
        
        self.current_meeting = MeetingState(
            meeting_id=meeting_id,
            meeting_type=meeting_type,
            topic=topic,
            status="in_progress",
            start_time=time.time()
        )
        
        template = MEETING_TEMPLATES.get(meeting_type, {})
        opening = template.get("opening", "好的，会议开始。").format(
            name="大家",
            proposer=self._get_proposer_role(meeting_type)
        )
        
        producer = self.agents.get("producer")
        if producer:
            self._add_agent_message(producer, opening)
        
        return meeting_id
    
    def _get_proposer_role(self, meeting_type: MeetingType) -> str:
        """获取提案人角色"""
        template = MEETING_TEMPLATES.get(meeting_type, {})
        proposer = template.get("proposer", "producer")
        return proposer
    
    def _add_agent_message(self, agent: BaseAgent, content: str) -> None:
        """添加 Agent 消息"""
        emotion = agent.detect_emotion(content)
        agent.update_state(status="speaking", emotion=emotion)
        
        self.conversation.add_message(
            speaker=agent.name,
            speaker_role=agent.role,
            content=content,
            topic=self.current_meeting.topic if self.current_meeting else None,
            emotion=emotion
        )
        
        agent.store_memory(content)
    
    def process_round(self) -> Optional[Dict[str, Any]]:
        """处理一轮对话"""
        if not self.current_meeting:
            return None
        
        template = MEETING_TEMPLATES.get(self.current_meeting.meeting_type, {})
        roles_order = template.get("roles_order", ["producer", "designer", "developer", "artist"])
        
        self.current_meeting.round += 1
        
        if self.current_meeting.round > template.get("typical_length", 5):
            return self._maybe_end_meeting()
        
        responses = []
        
        # 按角色顺序，让每个角色都有机会发言
        for role_key in roles_order:
            agent = self.agents.get(role_key)
            if not agent:
                continue
            
            # 检查是否应该发言
            if not agent.should_speak(self._build_context()):
                continue
            
            agent.update_state(status="thinking")
            
            # 为每个角色构建包含最新上下文的提示
            response = agent.think(self._build_context())
            
            # 过滤掉思考过程内容
            response = self._clean_response(response)
            
            if response and len(response.strip()) > 5:
                self._add_agent_message(agent, response)
                responses.append({
                    "speaker": agent.name,
                    "role": agent.role,
                    "content": response,
                    "emotion": agent.state.emotion
                })
            
            agent.update_state(status="listening")
        
        return {
            "round": self.current_meeting.round,
            "responses": responses,
            "meeting_status": self.current_meeting.status
        }
    
    def _build_context(self) -> Dict[str, Any]:
        """构建上下文"""
        context = {
            "project": "王者之路",
            "meeting_type": self.current_meeting.meeting_type.value if self.current_meeting else "",
            "topic": self.current_meeting.topic if self.current_meeting else "",
            "recent_messages": [
                {
                    "speaker": m.speaker,
                    "content": m.content
                }
                for m in self.conversation.get_recent_messages(5)
            ]
        }
        
        task_summary = self.task_system.get_task_summary()
        context["tasks"] = task_summary
        
        return context
    
    def _maybe_end_meeting(self) -> Optional[Dict[str, Any]]:
        """检查是否应该结束会议"""
        if self.current_meeting:
            pending_decisions = self.decision_system.get_pending_decisions()
            if not pending_decisions:
                return self.end_meeting()
        return None
    
    def end_meeting(self) -> Dict[str, Any]:
        """结束会议"""
        if not self.current_meeting:
            return {"status": "no_active_meeting"}
        
        self.current_meeting.status = "completed"
        self.current_meeting.end_time = time.time()
        
        producer = self.agents.get("producer")
        if producer:
            closing = "好的，今天的会议就到这里。感谢大家的参与！"
            self._add_agent_message(producer, closing)
        
        self.conversation.end_meeting()
        
        meeting_summary = {
            "meeting_id": self.current_meeting.meeting_id,
            "meeting_type": self.current_meeting.meeting_type.value,
            "topic": self.current_meeting.topic,
            "duration": self.current_meeting.end_time - self.current_meeting.start_time,
            "rounds": self.current_meeting.round,
            "messages": self.conversation.get_meeting_messages(self.current_meeting.meeting_id),
            "decisions": self.decision_system.get_all_decisions(),
            "tasks": self.task_system.get_task_summary()
        }
        
        self.current_meeting = None
        
        return meeting_summary
    
    def get_meeting_status(self) -> Optional[Dict[str, Any]]:
        """获取会议状态"""
        if not self.current_meeting:
            return None
        
        return {
            "meeting_id": self.current_meeting.meeting_id,
            "meeting_type": self.current_meeting.meeting_type.value,
            "topic": self.current_meeting.topic,
            "status": self.current_meeting.status,
            "round": self.current_meeting.round,
            "current_speaker": self.current_meeting.current_speaker,
            "elapsed_time": time.time() - self.current_meeting.start_time if self.current_meeting.start_time else 0
        }
    
    def get_all_agents_info(self) -> List[Dict[str, Any]]:
        """获取所有 Agent 信息"""
        return [agent.get_info() for agent in self.agents.values()]
    
    def get_recent_messages(self, limit: int = 10) -> List[Dict[str, Any]]:
        """获取最近消息"""
        messages = self.conversation.get_recent_messages(limit)
        return [
            {
                "id": m.id,
                "speaker": m.speaker,
                "speaker_role": m.speaker_role,
                "content": m.content,
                "emotion": m.emotion,
                "timestamp": m.timestamp
            }
            for m in messages
        ]
    
    def create_task(
        self,
        title: str,
        description: str,
        assignee: Optional[str] = None,
        priority: TaskPriority = TaskPriority.MEDIUM
    ):
        """创建任务"""
        return self.task_system.create_task(
            title=title,
            description=description,
            assignee=assignee,
            priority=priority
        )
    
    def get_tasks(self) -> Dict[str, Any]:
        """获取任务"""
        return self.task_system.get_task_summary()
    
    def _clean_response(self, text: str) -> str:
        """清理AI响应，过滤掉思考过程"""
        import re
        # 移除think/inference等标签内容
        text = re.sub(r'\([^)]*think[^)]*\)', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\[[^\]]*think[^\]]*\]', '', text, flags=re.IGNORECASE)
        # 移除思考中、推理中等内容
        text = re.sub(r'思考[中|中产生的|过程].*', '', text)
        text = re.sub(r'推理.*', '', text)
        # 移除多余空白
        text = re.sub(r'\n+', '\n', text)
        text = text.strip()
        return text
