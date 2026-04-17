from __future__ import annotations

from typing import Awaitable, Callable

from app.core.conversation import message
from app.core.decision import DecisionSystem
from app.core.task import TaskSystem
from app.meeting.minutes import MeetingMinutes
from app.meeting.templates import MEETING_CONFIG


Broadcast = Callable[[dict], Awaitable[None]]


class MeetingOrchestrator:
    def __init__(self, agents: dict, task_system: TaskSystem) -> None:
        self.agents = agents
        self.task_system = task_system
        self.decision_system = DecisionSystem()

    async def hold_meeting(
        self,
        meeting_type: str,
        topic: str,
        proposer: str,
        broadcaster: Broadcast | None = None,
    ) -> dict:
        config = MEETING_CONFIG.get(meeting_type, MEETING_CONFIG["daily-standup"])
        participants = config["participants"]
        dialogue: list[dict] = []

        for role in participants:
            agent = self.agents[role]
            content = await agent.process_input(
                context=f"提案人: {proposer}; 主题: {topic}",
                meeting_type=meeting_type,
                topic=topic,
            )
            msg = message(role, content)
            dialogue.append(msg)
            if broadcaster:
                await broadcaster({"type": "agent_message", **msg})

        decision = self._make_decision(meeting_type, topic)
        task = self.task_system.create_task(
            {
                "title": f"[{config['name']}] {topic}",
                "description": f"执行会议决策: {decision['winner']['name']}",
                "assignee": proposer,
                "status": "in_progress",
                "priority": "high",
            }
        )

        minutes = MeetingMinutes(
            meeting_type=meeting_type,
            topic=topic,
            summary=f"会议共 {len(dialogue)} 条发言，最终采用 {decision['winner']['name']}。",
            decision=decision,
            action_items=[{"task_id": task.id, "owner": proposer}],
        )

        payload = {
            "meeting_type": meeting_type,
            "topic": topic,
            "dialogue": dialogue,
            "minutes": minutes.to_dict(),
        }
        if broadcaster:
            await broadcaster({"type": "meeting_update", "status": "completed", "payload": payload})
        return payload

    def _make_decision(self, meeting_type: str, topic: str) -> dict:
        if meeting_type in ("design-review", "technical-review"):
            options = [
                {"id": "A", "name": "物理引擎方案"},
                {"id": "B", "name": "动画驱动方案"},
            ]
            decision_type = "technical" if meeting_type == "technical-review" else "design"
            votes = {
                "producer": {"choice": "B", "confidence": 0.7},
                "developer": {"choice": "B", "confidence": 0.92},
                "designer": {"choice": "A", "confidence": 0.62},
                "artist": {"choice": "B", "confidence": 0.6},
            }
        else:
            options = [{"id": "A", "name": "维持当前节奏"}, {"id": "B", "name": "压缩范围保里程碑"}]
            decision_type = "resource"
            votes = {
                "producer": {"choice": "B", "confidence": 0.85},
                "developer": {"choice": "B", "confidence": 0.7},
                "designer": {"choice": "A", "confidence": 0.6},
                "artist": {"choice": "A", "confidence": 0.55},
            }

        result = self.decision_system.decide(topic, decision_type, options, votes)
        return {
            "type": decision_type,
            "winner": {"id": result.option_id, "name": result.option_name, "score": result.score},
            "score_board": result.score_board,
        }
