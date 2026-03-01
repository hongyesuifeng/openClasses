from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date
from typing import Any
from uuid import uuid4


@dataclass
class Task:
    id: str
    title: str
    description: str
    assignee: str
    status: str = "pending"
    priority: str = "medium"
    due_date: str | None = None
    dependencies: list[str] = field(default_factory=list)


class TaskSystem:
    def __init__(self) -> None:
        self.tasks: dict[str, Task] = {}

    def create_task(self, payload: dict[str, Any]) -> Task:
        task = Task(
            id=str(uuid4())[:8],
            title=payload["title"],
            description=payload.get("description", ""),
            assignee=payload.get("assignee", "producer"),
            status=payload.get("status", "pending"),
            priority=payload.get("priority", "medium"),
            due_date=payload.get("due_date") or date.today().isoformat(),
            dependencies=payload.get("dependencies", []),
        )
        self.tasks[task.id] = task
        return task

    def update_status(self, task_id: str, status: str) -> Task | None:
        task = self.tasks.get(task_id)
        if not task:
            return None
        task.status = status
        return task

    def list_tasks(self) -> list[dict[str, Any]]:
        return [asdict(t) for t in self.tasks.values()]

    def summary(self) -> dict[str, int]:
        out = {"pending": 0, "in_progress": 0, "done": 0}
        for task in self.tasks.values():
            if task.status in out:
                out[task.status] += 1
        return out
