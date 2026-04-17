"""
Game Dev Town - 制作人 Agent
负责项目整体规划、进度管理和团队协调
"""
from typing import Dict, Any
from app.agents.base import BaseAgent


class ProducerAgent(BaseAgent):
    """
    制作人 Agent
    角色：项目管理、资源调配、风险评估、里程碑规划
    """

    def __init__(self, llm_service=None):
        super().__init__("producer", llm_service)
        self.managed_tasks: list = []
        self.project_risks: list = []
        self.milestones: list = []

    def get_system_prompt(self) -> str:
        base_prompt = super().get_system_prompt()
        return f"""{base_prompt}

作为制作人，你的职责包括：
1. 统筹项目进度，确保按时交付
2. 平衡资源分配，协调各部门工作
3. 识别和管理项目风险
4. 做出关键决策，推动项目前进
5. 保持团队士气，解决冲突

在讨论中，你应该：
- 关注整体进度和里程碑
- 评估提议对项目的影响
- 协调不同部门的意见
- 做出明确的决策和任务分配

你的口头禅：'让我们确保这不会影响交付日期'、'我们需要评估一下风险'"""

    async def respond_to_agenda(self, agenda_item: str, context: str) -> str:
        """回应会议议程"""
        prompt = f"""会议议程：{agenda_item}

当前讨论上下文：
{context}

作为制作人，请从项目管理角度发表你的看法，关注进度、资源和风险。"""

        return await self.generate_response(context, prompt)

    async def react_to_message(self, message: str, speaker: str) -> str:
        """对他人的消息做出反应"""
        prompt = f"""{speaker}说：{message}

作为制作人，请对你的团队成员的发言做出回应。你可以：
- 表示同意或不同意
- 提出问题或建议
- 做出决策或分配任务
- 协调不同意见"""

        return await self.generate_response(message, prompt)

    async def summarize_discussion(self, messages: list) -> str:
        """总结讨论"""
        discussion_text = "\n".join([
            f"{m.get('speaker_name', 'Unknown')}: {m.get('content', '')}"
            for m in messages
        ])

        prompt = f"""以下是团队的讨论记录：

{discussion_text}

请作为制作人总结这次讨论的要点，并明确下一步行动项。"""

        return await self.generate_response(discussion_text, prompt)

    def add_milestone(self, name: str, deadline: str, tasks: list) -> None:
        """添加里程碑"""
        self.milestones.append({
            "name": name,
            "deadline": deadline,
            "tasks": tasks,
            "status": "pending",
        })
        self.remember(f"新增里程碑: {name}, 截止日期: {deadline}", importance=0.8, category="milestone")

    def identify_risk(self, risk: str, level: str = "medium") -> None:
        """识别风险"""
        self.project_risks.append({
            "description": risk,
            "level": level,
            "status": "active",
        })
        self.remember(f"风险识别: {risk} (级别: {level})", importance=0.7, category="risk")

    def get_project_overview(self) -> Dict[str, Any]:
        """获取项目概览"""
        return {
            "milestones": self.milestones,
            "active_risks": [r for r in self.project_risks if r["status"] == "active"],
            "managed_tasks": len(self.managed_tasks),
        }
