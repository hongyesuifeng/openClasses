"""
Game Dev Town - 决策系统
实现 Agent 的决策和行为选择逻辑
"""
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import random


class DecisionType(Enum):
    """决策类型"""
    AGREE = "agree"           # 同意
    DISAGREE = "disagree"     # 不同意
    PROPOSE = "propose"       # 提议
    QUESTION = "question"     # 提问
    CLARIFY = "clarify"       # 澄清
    COMPROMISE = "compromise" # 妥协
    DEFER = "defer"           # 推迟


@dataclass
class Decision:
    """决策结果"""
    decision_type: DecisionType
    content: str
    reasoning: str
    confidence: float = 0.8
    related_tasks: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class DecisionSystem:
    """
    Agent 决策系统
    基于角色特征和上下文做出决策
    """

    def __init__(self, role_config: Dict[str, Any]):
        self.role_config = role_config
        self.decision_history: List[Decision] = []
        self.bias_factors = self._init_bias_factors()

    def _init_bias_factors(self) -> Dict[str, float]:
        """初始化决策偏好因子"""
        expertise = self.role_config.get("expertise", [])
        personality = self.role_config.get("personality", "")

        factors = {
            "technical": 0.5,
            "creative": 0.5,
            "practical": 0.5,
            "risk_taking": 0.5,
        }

        # 根据角色调整偏好
        role = self.role_config.get("role", "")
        if role == "程序员":
            factors["technical"] = 0.8
            factors["practical"] = 0.7
            factors["risk_taking"] = 0.3
        elif role == "策划":
            factors["creative"] = 0.8
            factors["practical"] = 0.6
        elif role == "美术":
            factors["creative"] = 0.9
            factors["risk_taking"] = 0.6
        elif role == "制作人":
            factors["practical"] = 0.9
            factors["risk_taking"] = 0.4

        return factors

    def analyze_proposal(self, proposal: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """分析提议"""
        analysis = {
            "feasibility": self._assess_feasibility(proposal, context),
            "impact": self._assess_impact(proposal, context),
            "risks": self._identify_risks(proposal, context),
            "alignment": self._check_alignment(proposal, context),
        }
        return analysis

    def _assess_feasibility(self, proposal: str, context: Dict[str, Any]) -> float:
        """评估可行性"""
        # 简化版：基于关键词和上下文
        score = 0.5

        difficulty_keywords = {
            "简单": 0.3, "中等": 0.5, "复杂": 0.7, "极其复杂": 0.9
        }

        for keyword, difficulty in difficulty_keywords.items():
            if keyword in proposal:
                score = 1 - difficulty * (1 - self.bias_factors["technical"])
                break

        return min(1.0, max(0.0, score))

    def _assess_impact(self, proposal: str, context: Dict[str, Any]) -> Dict[str, float]:
        """评估影响"""
        return {
            "schedule": 0.5,   # 对进度的影响
            "quality": 0.5,    # 对质量的影响
            "resources": 0.5,  # 对资源的影响
            "team": 0.5,       # 对团队的影响
        }

    def _identify_risks(self, proposal: str, context: Dict[str, Any]) -> List[str]:
        """识别风险"""
        risks = []

        risk_keywords = {
            "延期": "可能导致项目延期",
            "技术": "存在技术实现风险",
            "资源": "资源需求可能超出预算",
            "复杂": "实现复杂度较高",
        }

        for keyword, risk in risk_keywords.items():
            if keyword in proposal:
                risks.append(risk)

        return risks

    def _check_alignment(self, proposal: str, context: Dict[str, Any]) -> float:
        """检查与项目目标的一致性"""
        # 基于角色专业知识检查
        expertise = self.role_config.get("expertise", [])
        alignment_score = 0.5

        for exp in expertise:
            if exp in proposal:
                alignment_score += 0.1

        return min(1.0, alignment_score)

    def make_decision(
        self,
        proposal: str,
        context: Dict[str, Any],
        options: Optional[List[DecisionType]] = None,
    ) -> Decision:
        """做出决策"""
        analysis = self.analyze_proposal(proposal, context)

        # 基于分析决定决策类型
        if analysis["feasibility"] < 0.3:
            decision_type = DecisionType.DISAGREE
            reasoning = f"可行性较低({analysis['feasibility']:.2f})，存在实施困难"
        elif analysis["risks"]:
            decision_type = DecisionType.QUESTION
            reasoning = f"存在潜在风险: {', '.join(analysis['risks'])}"
        elif analysis["alignment"] > 0.7:
            decision_type = DecisionType.AGREE
            reasoning = f"与专业领域高度相关({analysis['alignment']:.2f})"
        else:
            decision_type = DecisionType.PROPOSE
            reasoning = "建议进一步完善方案"

        confidence = (analysis["feasibility"] + analysis["alignment"]) / 2

        decision = Decision(
            decision_type=decision_type,
            content=proposal,
            reasoning=reasoning,
            confidence=confidence,
            metadata={"analysis": analysis},
        )

        self.decision_history.append(decision)
        return decision

    def get_decision_history(self, count: int = 10) -> List[Dict[str, Any]]:
        """获取决策历史"""
        recent = self.decision_history[-count:]
        return [
            {
                "type": d.decision_type.value,
                "content": d.content,
                "reasoning": d.reasoning,
                "confidence": d.confidence,
            }
            for d in recent
        ]
