from __future__ import annotations

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect


class WebSocketHub:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.connections.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.connections.discard(ws)

    async def broadcast(self, payload: dict) -> None:
        stale: list[WebSocket] = []
        text = json.dumps(payload, ensure_ascii=False)
        for ws in self.connections:
            try:
                await ws.send_text(text)
            except RuntimeError:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)


def build_ws_router(town, ws_hub: WebSocketHub) -> APIRouter:
    router = APIRouter()

    @router.websocket("/ws")
    async def ws_endpoint(ws: WebSocket):
        await ws_hub.connect(ws)
        await ws.send_json({"type": "connected", "message": "welcome to game dev town"})
        try:
            while True:
                data = await ws.receive_json()
                action = data.get("action")
                if action == "start_meeting":
                    meeting_type = data.get("meeting_type", "daily-standup")
                    topic = data.get("topic", "战斗系统设计")
                    proposer = data.get("proposer", "producer")
                    result = await town.hold_meeting(meeting_type, topic, proposer, broadcaster=ws_hub.broadcast)
                    await ws.send_json({"type": "command_result", "payload": result})
                elif action == "ping":
                    await ws.send_json({"type": "pong"})
                else:
                    await ws.send_json({"type": "error", "message": f"unknown action: {action}"})
        except WebSocketDisconnect:
            ws_hub.disconnect(ws)

    return router
