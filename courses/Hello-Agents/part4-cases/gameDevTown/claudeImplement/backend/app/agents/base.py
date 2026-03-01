"""
Game Dev Town - 基础 Agent 类
定义所有 Agent 的通用接口和行为
"""
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from app.core.memory import MemorySystem
from app.core.decision import DecisionSystem, Decision
from app.config import AGENT_ROLES


@dataclass
class AgentState:
    """Agent 状态"""
    is_active: bool = True
    is_speaking: bool = False
    current_task: Optional[str] = None
    mood: str = "neutral"  # neutral, happy, concerned, excited
    energy: int = 100  # 0-100


class BaseAgent(ABC):
    """
    基础 Agent 抽象类
    所有具体 Agent 必须继承此类
    """

    def __init__(self, role_id: str, llm_service=None):
        self.role_id = role_id
        self.role_config = AGENT_ROLES.get(role_id, {})
        self.name = self.role_config.get("name", "Unknown")
        self.role = self.role_config.get("role", "Unknown")
        self.description = self.role_config.get("description", "")
        self.color = self.role_config.get("color", "#FFFFFF")
        self.avatar = self.role_config.get("avatar", "🤖")
        self.expertise = self.role_config.get("expertise", [])
        self.personality = self.role_config.get("personality", "")

        # 核心系统
        self.memory = MemorySystem()
        self.decision_system = DecisionSystem(self.role_config)
        self.llm_service = llm_service

        # 状态
        self.state = AgentState()

        # 对话历史
        self.conversation_history: List[Dict[str, Any]] = []

    def get_system_prompt(self) -> str:
        """获取系统提示词"""
        return f"""你是一个游戏开发团队中的{self.role}，名叫{self.name}。

你的角色描述：{self.description}
你的专业领域：{', '.join(self.expertise)}
你的性格特点：{self.personality}

你正在参与开发一款名为"王者之路"的MOBA手机游戏。
在会议中，你需要：
1. 从{self.role}的角度出发发表意见
2. 与其他团队成员协作讨论
3. 提出专业建议和解决方案
4. 关注项目进度和质量

请保持专业、友善的沟通风格，用中文交流。
发言要简洁有力，每次回复控制在100字以内。"""

    async def generate_response(self, context: str, prompt: str) -> str:
        """生成回复"""
        if not self.llm_service:
            return self._fallback_response(context)

        try:
            system_prompt = self.get_system_prompt()
            full_prompt = f"{context}\n\n{prompt}"

            # 添加记忆上下文
            memory_context = self.memory.get_context_summary()
            if memory_context != "暂无相关历史记忆。":
                full_prompt = f"[记忆上下文]\n{memory_context}\n\n{full_prompt}"

            response = await self.llm_service.generate(
                system_prompt=system_prompt,
                user_message=full_prompt,
            )

            # 存储对话到记忆
            self.memory.add_memory(
                content=f"输入: {prompt[:50]}... 回复: {response[:50]}...",
                importance=0.6,
                category="conversation",
            )

            return response

        except Exception as e:
            print(f"LLM 生成失败: {e}")
            return self._fallback_response(context)

    def _fallback_response(self, context: str) -> str:
        """降级回复（当 LLM 不可用时）- 基于角色特点生成多样化回复"""
        import random

        # 每个角色有多种预设回复，增加多样性
        fallback_responses = {
            "producer": [
                "作为制作人，我需要评估这个提议对项目进度的影响。让我们确保不会影响交付日期。",
                "从项目管理角度，我建议我们先明确这个需求的优先级和资源投入。",
                "这个方案看起来不错，我需要了解预计的开发周期和可能的风险点。",
                "好的，让我来协调一下各方的意见。我们需要确保资源分配合理。",
                "从整体规划来看，我建议我们分阶段实施，先做核心功能。",
            ],
            "developer": [
                "从技术角度看，这个方案的实现复杂度中等，预计需要3-5天完成。",
                "我需要考虑一下性能影响和数据结构设计。可能需要做一些技术预研。",
                "技术上可行，但要注意网络同步和状态管理的问题。",
                "建议使用现有框架来实现，可以节省开发时间。我会先做一个技术方案。",
                "这个功能有一定技术挑战，我建议我们先做个原型验证一下可行性。",
            ],
            "designer": [
                "从玩家体验角度，这个设计需要考虑新手玩家的学习成本。",
                "数值方面需要调整，我会出一个详细的数值方案供大家参考。",
                "建议增加一些引导机制，让玩家更容易理解这个玩法。",
                "从游戏平衡性考虑，我们需要测试一下这个方案对不同水平玩家的影响。",
                "这个设计挺有创意的！我来细化一下具体的玩法规则和奖励机制。",
            ],
            "artist": [
                "从视觉表现角度，我建议采用更鲜明的色彩对比，突出重点信息。",
                "美术风格上要和整体游戏保持一致，我会出几个风格参考方案。",
                "这个特效可能比较消耗性能，我需要和程序同事确认一下优化方案。",
                "UI界面需要简化，当前信息密度太高会影响玩家体验。",
                "角色动画已经有一些想法了，我会尽快出个初稿给大家评审。",
            ],
        }

        responses = fallback_responses.get(self.role_id, ["我需要更多信息来做出判断。"])
        return random.choice(responses)

    def analyze_proposal(self, proposal: str, context: Dict[str, Any]) -> Decision:
        """分析提议并做出决策"""
        return self.decision_system.make_decision(proposal, context)

    def remember(self, content: str, importance: float = 0.5, category: str = "general") -> None:
        """记录记忆"""
        self.memory.add_memory(content, importance, category)

    def recall(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """回忆相关信息"""
        return self.memory.get_relevant_memories(query, top_k)

    def set_mood(self, mood: str) -> None:
        """设置情绪状态"""
        valid_moods = ["neutral", "happy", "concerned", "excited", "thinking"]
        if mood in valid_moods:
            self.state.mood = mood

    def set_speaking(self, is_speaking: bool) -> None:
        """设置发言状态"""
        self.state.is_speaking = is_speaking

    def get_status(self) -> Dict[str, Any]:
        """获取 Agent 状态"""
        return {
            "role_id": self.role_id,
            "name": self.name,
            "role": self.role,
            "avatar": self.avatar,
            "color": self.color,
            "is_active": self.state.is_active,
            "is_speaking": self.state.is_speaking,
            "mood": self.state.mood,
            "energy": self.state.energy,
            "current_task": self.state.current_task,
        }

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "role_id": self.role_id,
            "name": self.name,
            "role": self.role,
            "description": self.description,
            "color": self.color,
            "avatar": self.avatar,
            "expertise": self.expertise,
            "personality": self.personality,
            "status": self.get_status(),
        }

    @abstractmethod
    async def respond_to_agenda(self, agenda_item: str, context: str) -> str:
        """回应会议议程项（子类实现）"""
        pass

    @abstractmethod
    async def react_to_message(self, message: str, speaker: str) -> str:
        """对他人的消息做出反应（子类实现）"""
        pass
