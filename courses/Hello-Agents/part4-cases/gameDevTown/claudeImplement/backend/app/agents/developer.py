"""
Game Dev Town - 程序员 Agent
负责游戏核心系统开发和技术架构设计
"""
from typing import Dict, Any, List
from app.agents.base import BaseAgent


class DeveloperAgent(BaseAgent):
    """
    程序员 Agent
    角色：系统架构、性能优化、网络同步、AI系统
    """

    def __init__(self, llm_service=None):
        super().__init__("developer", llm_service)
        self.technical_debt: List[Dict] = []
        self.code_reviews: List[Dict] = []
        self.performance_issues: List[Dict] = []

    def get_system_prompt(self) -> str:
        base_prompt = super().get_system_prompt()
        return f"""{base_prompt}

作为程序员，你的职责包括：
1. 设计和实现游戏核心系统
2. 确保代码质量和系统稳定性
3. 优化游戏性能，处理技术难题
4. 评估技术方案的可行性
5. 与其他部门协作实现功能需求

在讨论中，你应该：
- 从技术角度评估提议的可行性
- 提醒潜在的技术风险和挑战
- 给出具体的技术实现建议
- 估算开发工作量和时间

你的口头禅：'从技术角度来说'、'这个实现起来需要X天'、'让我想想最优解'"""

    async def respond_to_agenda(self, agenda_item: str, context: str) -> str:
        """回应会议议程"""
        prompt = f"""会议议程：{agenda_item}

当前讨论上下文：
{context}

作为程序员，请从技术实现角度发表你的看法，包括可行性分析、技术方案和工作量估算。"""

        return await self.generate_response(context, prompt)

    async def react_to_message(self, message: str, speaker: str) -> str:
        """对他人的消息做出反应"""
        prompt = f"""{speaker}说：{message}

作为程序员，请从技术角度回应。你可以：
- 评估技术可行性
- 提出技术方案建议
- 指出潜在技术问题
- 给出工作量估算"""

        return await self.generate_response(message, prompt)

    def estimate_effort(self, task: str, complexity: str = "medium") -> Dict[str, Any]:
        """估算开发工作量"""
        base_days = {
            "low": 1,
            "medium": 3,
            "high": 5,
            "very_high": 10,
        }

        days = base_days.get(complexity, 3)

        self.remember(
            f"工作量估算: {task} -> {days}天 (复杂度: {complexity})",
            importance=0.6,
            category="estimation",
        )

        return {
            "task": task,
            "complexity": complexity,
            "estimated_days": days,
            "confidence": 0.7,
        }

    def add_technical_debt(self, description: str, priority: str = "medium") -> None:
        """添加技术债务"""
        self.technical_debt.append({
            "description": description,
            "priority": priority,
            "created_at": "now",
            "status": "pending",
        })
        self.remember(f"技术债务: {description}", importance=0.5, category="tech_debt")

    def report_performance_issue(self, issue: str, severity: str = "medium") -> None:
        """报告性能问题"""
        self.performance_issues.append({
            "issue": issue,
            "severity": severity,
            "status": "investigating",
        })
        self.remember(f"性能问题: {issue} (严重程度: {severity})", importance=0.7, category="performance")

    def get_technical_status(self) -> Dict[str, Any]:
        """获取技术状态"""
        return {
            "technical_debt_count": len(self.technical_debt),
            "pending_debts": [d for d in self.technical_debt if d["status"] == "pending"],
            "performance_issues": len(self.performance_issues),
            "code_reviews_pending": len([r for r in self.code_reviews if r["status"] == "pending"]),
        }
