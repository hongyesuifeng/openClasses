from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


class StartProjectRequest(BaseModel):
    name: str
    type: str = "first-person-rpg"
    timeline: str = "6-months"


class StartMeetingRequest(BaseModel):
    type: Literal["daily-standup", "design-review", "technical-review", "art-review", "milestone"]
    topic: str
    proposer: Literal["producer", "developer", "designer", "artist"] = "producer"


class UpdateTaskRequest(BaseModel):
    task_id: str
    status: Literal["pending", "in_progress", "done"]


def build_router(town, ws_hub):
    router = APIRouter(prefix="/api")

    @router.get("/health")
    async def health():
        return {"ok": True}

    @router.post("/project/start")
    async def start_project(payload: StartProjectRequest):
        data = await town.start_project(payload.name, payload.type, payload.timeline)
        await ws_hub.broadcast({"type": "project_update", "payload": data})
        return data

    @router.get("/project/status")
    async def project_status():
        return await town.get_project_status()

    @router.post("/meeting/start")
    async def meeting_start(payload: StartMeetingRequest):
        result = await town.hold_meeting(payload.type, payload.topic, payload.proposer, broadcaster=ws_hub.broadcast)
        return result

    @router.get("/tasks")
    async def tasks():
        return {"tasks": town.task_system.list_tasks(), "summary": town.task_system.summary()}

    @router.post("/tasks/update")
    async def update_task(payload: UpdateTaskRequest):
        task = town.task_system.update_status(payload.task_id, payload.status)
        if not task:
            raise HTTPException(status_code=404, detail="task not found")
        await ws_hub.broadcast({"type": "task_update", "payload": {"task_id": task.id, "status": task.status}})
        return task

    return router
