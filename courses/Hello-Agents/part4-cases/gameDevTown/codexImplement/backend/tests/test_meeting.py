import pytest

from app.core.game_dev_town import GameDevTown


@pytest.mark.asyncio
async def test_meeting_creates_task_and_minutes():
    town = GameDevTown()
    await town.start_project("王者之路", "first-person-rpg", "6-months")
    result = await town.hold_meeting("technical-review", "战斗系统技术方案", "developer")

    assert result["minutes"]["decision"]["winner"]["id"] in {"A", "B"}
    tasks = town.task_system.list_tasks()
    assert len(tasks) >= 2
