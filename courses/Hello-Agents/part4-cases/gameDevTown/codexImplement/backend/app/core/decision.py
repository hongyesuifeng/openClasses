from __future__ import annotations

from dataclasses import dataclass
from typing import Any


DECISION_WEIGHTS: dict[str, dict[str, float]] = {
    "design": {"designer": 0.4, "producer": 0.25, "developer": 0.2, "artist": 0.15},
    "technical": {"developer": 0.5, "producer": 0.25, "designer": 0.15, "artist": 0.1},
    "art": {"artist": 0.45, "producer": 0.25, "designer": 0.2, "developer": 0.1},
    "resource": {"producer": 0.5, "developer": 0.2, "designer": 0.15, "artist": 0.15},
}


@dataclass
class DecisionResult:
    topic: str
    option_id: str
    option_name: str
    score: float
    score_board: dict[str, float]


class DecisionSystem:
    def decide(
        self,
        topic: str,
        decision_type: str,
        options: list[dict[str, Any]],
        votes: dict[str, dict[str, Any]],
    ) -> DecisionResult:
        weights = DECISION_WEIGHTS.get(decision_type, DECISION_WEIGHTS["resource"])
        score_board: dict[str, float] = {opt["id"]: 0.0 for opt in options}

        for role, vote in votes.items():
            choice = vote.get("choice")
            confidence = float(vote.get("confidence", 0.5))
            if choice in score_board:
                score_board[choice] += weights.get(role, 0.0) * confidence

        winner = max(options, key=lambda opt: score_board.get(opt["id"], 0.0))
        return DecisionResult(
            topic=topic,
            option_id=winner["id"],
            option_name=winner["name"],
            score=round(score_board[winner["id"]], 4),
            score_board={k: round(v, 4) for k, v in score_board.items()},
        )
