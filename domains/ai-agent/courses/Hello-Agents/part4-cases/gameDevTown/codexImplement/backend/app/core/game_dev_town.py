from __future__ import annotations

from app.agents import ArtistAgent, DesignerAgent, DeveloperAgent, ProducerAgent
from app.core.task import TaskSystem
from app.meeting.orchestrator import MeetingOrchestrator
from app.services.llm import LLMService


class GameDevTown:
    def __init__(self, api_key: str = "", base_url: str = "") -> None:
        self.api_key = api_key
        self.base_url = base_url
        self.llm = LLMService()
        self.task_system = TaskSystem()
        self.agents = {
            "producer": ProducerAgent(self.llm),
            "developer": DeveloperAgent(self.llm),
            "designer": DesignerAgent(self.llm),
            "artist": ArtistAgent(self.llm),
        }
        self.meeting = MeetingOrchestrator(self.agents, self.task_system)
        self.project: dict = {
            "name": "",
            "type": "first-person-rpg",
            "timeline": "6-months",
            "phase": "Phase 2",
            "status": "idle",
        }
        self.history: list[dict] = []

    async def start_project(self, name: str, project_type: str, timeline: str) -> dict:
        self.project.update(
            {
                "name": name,
                "type": project_type,
                "timeline": timeline,
                "status": "running",
            }
        )
        self.task_system.create_task(
            {
                "title": "战斗系统原型",
                "description": "完成元素战斗原型并可演示",
                "assignee": "developer",
                "status": "in_progress",
                "priority": "high",
            }
        )
        return self.project

    async def hold_meeting(self, meeting_type: str, topic: str, proposer: str, broadcaster=None) -> dict:
        result = await self.meeting.hold_meeting(meeting_type, topic, proposer, broadcaster=broadcaster)
        self.history.append(result)
        return result

    async def get_project_status(self) -> dict:
        return {
            "project": self.project,
            "tasks": self.task_system.list_tasks(),
            "task_summary": self.task_system.summary(),
            "recent_meetings": self.history[-5:],
            "agents": [
                {"role": k, "name": v.profile.name, "expertise": v.profile.expertise}
                for k, v in self.agents.items()
            ],
        }
