"""
基础 Agent 类 - Base Agent
所有游戏开发角色的基类
"""

import time
import random
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from backend.core.memory import MemorySystem
from backend.llm.minimax import LLMClient


@dataclass
class Personality:
    """OCEAN 性格模型"""
    openness: float = 0.7
    conscientiousness: float = 0.7
    extraversion: float = 0.7
    agreeableness: float = 0.7
    neuroticism: float = 0.3


@dataclass
class AgentState:
    """Agent 状态"""
    status: str = "idle"  # idle, thinking, speaking, listening, waiting
    emotion: str = "neutral"  # neutral, excited, concerned, confident, thoughtful
    activity: str = "working"  # working, presenting, reviewing, discussing
    current_topic: Optional[str] = None


class BaseAgent:
    """基础 Agent"""
    
    def __init__(
        self,
        agent_id: str,
        name: str,
        role: str,
        personality: Personality,
        expertise: List[str],
        llm_client: Optional[LLMClient] = None,
        system_prompt: str = ""
    ):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.personality = personality
        self.expertise = expertise
        self.llm_client = llm_client
        self.system_prompt = system_prompt
        
        self.memory = MemorySystem(agent_id)
        self.state = AgentState()
        
        self.decision_weight = 0.25
        self.speak_probability = 0.5
    
    def set_llm_client(self, client: LLMClient) -> None:
        """设置 LLM 客户端"""
        self.llm_client = client
    
    def update_state(
        self,
        status: Optional[str] = None,
        emotion: Optional[str] = None,
        activity: Optional[str] = None,
        topic: Optional[str] = None
    ) -> None:
        """更新状态"""
        if status:
            self.state.status = status
        if emotion:
            self.state.emotion = emotion
        if activity:
            self.state.activity = activity
        if topic:
            self.state.current_topic = topic
    
    def think(self, context: Dict[str, Any]) -> str:
        """思考并生成回复"""
        if not self.llm_client or not self.llm_client.is_available():
            return self._fallback_response(context)
        
        messages = self._build_prompt(context)
        
        response = self.llm_client.chat(
            messages=messages,
            temperature=0.7 + (self.personality.openness * 0.3),
            max_tokens=500
        )
        
        cleaned = self._clean_response(response.content)
        return cleaned
    
    def _clean_response(self, content: str) -> str:
        """清理回复中的思考过程内容"""
        import re
        
        cleaned = content
        
        cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL)
        cleaned = re.sub(r'\[.*?think.*?\]', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\(.*?think.*?\)', '', cleaned, flags=re.IGNORECASE)
        
        lines = cleaned.split('\n')
        non_think_lines = []
        for line in lines:
            line_lower = line.lower().strip()
            if not any(kw in line_lower for kw in ['think', 'inference', 'thought', '思考', '推理', '分析']):
                non_think_lines.append(line)
        
        cleaned = '\n'.join(non_think_lines)
        cleaned = cleaned.strip()
        
        if not cleaned:
            cleaned = f"[{self.name}] 好的，我明白了。"
        
        return cleaned
    
    def _build_prompt(self, context: Dict[str, Any]) -> List[Dict[str, str]]:
        """构建提示词"""
        messages = []
        
        system_msg = self._build_system_prompt()
        messages.append({"role": "system", "content": system_msg})
        
        context_str = self._format_context(context)
        messages.append({"role": "user", "content": context_str})
        
        return messages
    
    def _build_system_prompt(self) -> str:
        """构建系统提示词"""
        return f"""你是一个专业的游戏开发团队成员，名字叫{self.name}，角色是{self.role}。
你正在参加《王者之路》游戏项目的团队会议。

角色特点：
- 根据你的角色身份，用专业且符合角色性格的方式发言
- 制作人：控场、总结、推进会议
- 程序员：务实、技术导向、关注实现
- 策划：创新、关注玩法和体验
- 美术：视觉导向、关注美观和风格

发言要求：
- 根据当前会议讨论的内容，结合自己的专业领域发表意见
- 回应其他成员的发言，形成自然的对流畅
- 每次发言1-2句话即可，保持会议节奏
- 不要输出括号内容、思考过程或推理步骤
- 只输出角色在会议中的原话，不要加任何前缀

请以{self.name}的身份直接发言："""
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """格式化上下文"""
        lines = []
        
        if "project" in context:
            lines.append(f"【项目】{context['project']}")
        
        if "meeting_type" in context:
            meeting_names = {
                "daily_standup": "每日站会",
                "design_review": "设计评审",
                "technical_review": "技术评审",
                "art_review": "美术评审",
                "milestone": "里程碑会议"
            }
            meeting_name = meeting_names.get(context['meeting_type'], context['meeting_type'])
            lines.append(f"【会议类型】{meeting_name}")
        
        if "topic" in context:
            lines.append(f"【当前话题】{context['topic']}")
        
        if "recent_messages" in context and context["recent_messages"]:
            lines.append("\n【会议对话历史】")
            for msg in context["recent_messages"][-5:]:
                content = msg.get('content', '')
                lines.append(f"  {msg.get('speaker', '某人说')}: {content}")
        
        role_guides = {
            "制作人": "关注整体进度、团队协调、风险管理",
            "程序员": "关注技术实现、代码质量、开发进度",
            "游戏策划": "关注玩法设计、用户体验、内容创新",
            "美术设计师": "关注视觉风格、UI美观、特效表现"
        }
        role_guide = role_guides.get(self.role, "结合你的专业领域发言")
        lines.append(f"\n【你的职责】{role_guide}")
        lines.append(f"\n请结合当前会议讨论和你的职责，发表一句专业意见：")
        
        return "\n".join(lines)
    
    def _fallback_response(self, context: Dict[str, Any]) -> str:
        """备用回复 (当 LLM 不可用时)"""
        return f"[{self.name}] 抱歉，我现在无法思考。请检查 LLM 配置。"
    
    def store_memory(self, content: str, importance: float = 0.5) -> None:
        """存储记忆"""
        self.memory.store(
            content=content,
            importance=importance,
            topic=self.state.current_topic
        )
    
    def get_relevant_memories(self, context: Dict[str, Any], limit: int = 5) -> List[str]:
        """获取相关记忆"""
        memories = self.memory.retrieve(context, limit)
        return [m.content for m in memories]
    
    def should_speak(self, context: Dict[str, Any]) -> bool:
        """判断是否应该发言 - 基于角色和话题相关性"""
        topic = context.get("topic", "")
        recent_messages = context.get("recent_messages", [])
        
        # 每次轮次至少让2-3个角色发言
        # 根据角色类型决定是否发言
        
        # 制作人(Producer) - 几乎每次都发言，负责控场
        if self.role == "制作人":
            return True
        
        # 策划 - 讨论设计相关话题时积极发言
        if self.role == "游戏策划" or self.role == "策划":
            if any(x in topic for x in ["设计", "玩法", "系统", "战斗", "关卡", "体验"]):
                return True
            return random.random() < 0.8
        
        # 程序员 - 技术相关话题时发言
        if self.role == "程序员" or self.role == "开发者":
            if any(x in topic for x in ["技术", "实现", "性能", "开发", "接口", "bug"]):
                return True
            return random.random() < 0.7
        
        # 美术 - 美术相关话题时发言
        if self.role == "美术设计师" or self.role == "美术":
            if any(x in topic for x in ["美术", "视觉", "UI", "界面", "风格", "特效"]):
                return True
            return random.random() < 0.7
        
        # 默认较高发言概率，保持对话活跃
        return random.random() < 0.6
    
    def detect_emotion(self, text: str) -> str:
        """检测情绪"""
        text_lower = text.lower()
        
        if any(w in text_lower for w in ["太棒了", "完美", "厉害", "精彩", "期待", "棒", "赞"]):
            return "excited"
        elif any(w in text_lower for w in ["担心", "问题", "风险", "困难", "挑战"]):
            return "concerned"
        elif any(w in text_lower for w in ["确定", "相信", "没问题", "可以做到"]):
            return "confident"
        elif any(w in text_lower for w in ["考虑", "思考", "分析", "评估"]):
            return "thoughtful"
        
        return "neutral"
    
    def get_info(self) -> Dict[str, Any]:
        """获取 Agent 信息"""
        return {
            "id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "personality": {
                "openness": self.personality.openness,
                "conscientiousness": self.personality.conscientiousness,
                "extraversion": self.personality.extraversion,
                "agreeableness": self.personality.agreeableness,
                "neuroticism": self.personality.neuroticism
            },
            "expertise": self.expertise,
            "state": {
                "status": self.state.status,
                "emotion": self.state.emotion,
                "activity": self.state.activity,
                "topic": self.state.current_topic
            }
        }
