"""
决策系统 - Decision System
基于角色职责和权重的决策机制
"""

import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class DecisionType(Enum):
    """决策类型"""
    DESIGN = "design"
    TECHNICAL = "technical"
    ART = "art"
    RESOURCE = "resource"


DECISION_WEIGHTS = {
    DecisionType.DESIGN: {
        "producer": 0.25,
        "developer": 0.20,
        "designer": 0.40,
        "artist": 0.15
    },
    DecisionType.TECHNICAL: {
        "producer": 0.25,
        "developer": 0.50,
        "designer": 0.15,
        "artist": 0.10
    },
    DecisionType.ART: {
        "producer": 0.25,
        "developer": 0.10,
        "designer": 0.20,
        "artist": 0.45
    },
    DecisionType.RESOURCE: {
        "producer": 0.50,
        "developer": 0.20,
        "designer": 0.15,
        "artist": 0.15
    }
}


@dataclass
class Vote:
    """投票"""
    role: str
    choice: str
    confidence: float
    reason: str


@dataclass
class Decision:
    """决策"""
    id: str
    topic: str
    decision_type: DecisionType
    options: List[Dict[str, Any]]
    votes: Dict[str, Vote] = field(default_factory=dict)
    result: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    resolved_at: Optional[float] = None
    resolved_by: Optional[str] = None


class DecisionSystem:
    """决策系统"""
    
    def __init__(self):
        self.decisions: Dict[str, Decision] = {}
        self.weights = DECISION_WEIGHTS
    
    def create_decision(
        self,
        topic: str,
        decision_type: DecisionType,
        options: List[Dict[str, Any]]
    ) -> Decision:
        """创建决策"""
        decision_id = f"decision_{int(time.time() * 1000)}"
        decision = Decision(
            id=decision_id,
            topic=topic,
            decision_type=decision_type,
            options=options
        )
        self.decisions[decision_id] = decision
        return decision
    
    def add_vote(
        self,
        decision_id: str,
        role: str,
        choice: str,
        confidence: float,
        reason: str
    ) -> bool:
        """添加投票"""
        decision = self.decisions.get(decision_id)
        if not decision:
            return False
        
        vote = Vote(
            role=role,
            choice=choice,
            confidence=confidence,
            reason=reason
        )
        decision.votes[role] = vote
        return True
    
    def calculate_result(self, decision_id: str) -> Optional[str]:
        """计算决策结果"""
        decision = self.decisions.get(decision_id)
        if not decision:
            return None
        
        weights = self.weights.get(decision.decision_type, {})
        scores = {opt["id"]: 0.0 for opt in decision.options}
        
        for role, vote in decision.votes.items():
            if vote.choice == "abstain":
                continue
            
            weight = weights.get(role, 0)
            for opt in decision.options:
                if opt["id"] == vote.choice:
                    scores[opt["id"]] += weight * vote.confidence
        
        if not scores:
            return None
        
        result = max(scores.items(), key=lambda x: x[1])
        
        for opt in decision.options:
            if opt["id"] == result[0]:
                decision.result = opt["id"]
                break
        
        decision.resolved_at = time.time()
        decision.resolved_by = "weighted_vote"
        return decision.result
    
    def has_consensus(self, decision_id: str, threshold: float = 0.6) -> bool:
        """检查是否达成共识"""
        decision = self.decisions.get(decision_id)
        if not decision or not decision.votes:
            return False
        
        votes_list = list(decision.votes.values())
        if len(votes_list) < 2:
            return False
        
        choice_counts = {}
        for vote in votes_list:
            if vote.choice != "abstain":
                choice_counts[vote.choice] = choice_counts.get(vote.choice, 0) + 1
        
        total = sum(choice_counts.values())
        if total == 0:
            return False
        
        max_count = max(choice_counts.values())
        return (max_count / total) >= threshold
    
    def get_decision(self, decision_id: str) -> Optional[Decision]:
        """获取决策"""
        return self.decisions.get(decision_id)
    
    def get_all_decisions(self) -> List[Decision]:
        """获取所有决策"""
        return list(self.decisions.values())
    
    def get_pending_decisions(self) -> List[Decision]:
        """获取待处理决策"""
        return [d for d in self.decisions.values() if d.result is None]
    
    def export_decisions(self) -> List[Dict[str, Any]]:
        """导出决策数据"""
        return [
            {
                "id": d.id,
                "topic": d.topic,
                "decision_type": d.decision_type.value,
                "options": d.options,
                "votes": {
                    role: {
                        "choice": v.choice,
                        "confidence": v.confidence,
                        "reason": v.reason
                    }
                    for role, v in d.votes.items()
                },
                "result": d.result,
                "created_at": d.created_at,
                "resolved_at": d.resolved_at,
                "resolved_by": d.resolved_by
            }
            for d in self.decisions.values()
        ]
