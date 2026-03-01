"""
Game Dev Town - 策划 Agent
负责游戏玩法设计、数值平衡和系统设计
"""
from typing import Dict, Any, List
from app.agents.base import BaseAgent


class DesignerAgent(BaseAgent):
    """
    策划 Agent
    角色：玩法设计、数值平衡、经济系统、社交系统
    """

    def __init__(self, llm_service=None):
        super().__init__("designer", llm_service)
        self.design_docs: List[Dict] = []
        self.game_systems: List[Dict] = []
        self.balance_issues: List[Dict] = []

    def get_system_prompt(self) -> str:
        base_prompt = super().get_system_prompt()
        return f"""{base_prompt}

作为策划，你的职责包括：
1. 设计游戏核心玩法和系统
2. 平衡游戏数值，确保游戏公平性
3. 规划游戏经济系统和进度曲线
4. 设计社交功能和玩家互动
5. 收集和分析玩家反馈

在讨论中，你应该：
- 从玩家体验角度评估设计
- 提出创意玩法和系统设计
- 关注数值平衡和游戏经济
- 考虑不同玩家群体的需求

你的口头禅：'从玩家角度来说'、'这样设计会更有趣'、'我们需要考虑数值平衡'"""

    async def respond_to_agenda(self, agenda_item: str, context: str) -> str:
        """回应会议议程"""
        prompt = f"""会议议程：{agenda_item}

当前讨论上下文：
{context}

作为策划，请从玩法设计和玩家体验角度发表你的看法，包括设计思路、数值考量和玩家感受。"""

        return await self.generate_response(context, prompt)

    async def react_to_message(self, message: str, speaker: str) -> str:
        """对他人的消息做出反应"""
        prompt = f"""{speaker}说：{message}

作为策划，请从游戏设计角度回应。你可以：
- 分析对玩家体验的影响
- 提出设计改进建议
- 讨论数值平衡问题
- 补充玩法细节"""

        return await self.generate_response(message, prompt)

    def propose_feature(self, name: str, description: str, category: str = "gameplay") -> None:
        """提出新功能"""
        self.design_docs.append({
            "name": name,
            "description": description,
            "category": category,
            "status": "proposed",
        })
        self.remember(f"提出功能设计: {name} - {description[:50]}", importance=0.7, category="design")

    def report_balance_issue(self, issue: str, impact: str = "medium") -> None:
        """报告平衡问题"""
        self.balance_issues.append({
            "issue": issue,
            "impact": impact,
            "status": "investigating",
        })
        self.remember(f"平衡问题: {issue} (影响: {impact})", importance=0.6, category="balance")

    def get_design_overview(self) -> Dict[str, Any]:
        """获取设计概览"""
        return {
            "proposed_features": len([d for d in self.design_docs if d["status"] == "proposed"]),
            "active_systems": len(self.game_systems),
            "balance_issues": len([i for i in self.balance_issues if i["status"] == "investigating"]),
        }
