from __future__ import annotations

import argparse
import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import build_router
from app.api.websocket import WebSocketHub, build_ws_router
from app.core.game_dev_town import GameDevTown


town = GameDevTown()
ws_hub = WebSocketHub()
app = FastAPI(title="Game Dev Town API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(build_router(town, ws_hub))
app.include_router(build_ws_router(town, ws_hub))


async def run_cli_meeting(meeting_type: str) -> None:
    await town.start_project("王者之路", "first-person-rpg", "6-months")
    data = await town.hold_meeting(meeting_type, "战斗系统设计", "designer")
    print(json.dumps(data["minutes"], ensure_ascii=False, indent=2))


async def run_cli_simulate(days: int) -> None:
    await town.start_project("王者之路", "first-person-rpg", "6-months")
    cycle = ["daily-standup", "design-review", "technical-review"]
    for i in range(days):
        mt = cycle[i % len(cycle)]
        await town.hold_meeting(mt, f"第{i + 1}天议题", "producer")
    status = await town.get_project_status()
    print(json.dumps(status["task_summary"], ensure_ascii=False))


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Game Dev Town")
    p.add_argument("--mode", choices=["meeting", "simulate"], default="meeting")
    p.add_argument("--type", dest="meeting_type", default="design-review")
    p.add_argument("--days", type=int, default=7)
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.mode == "meeting":
        asyncio.run(run_cli_meeting(args.meeting_type))
    else:
        asyncio.run(run_cli_simulate(args.days))
