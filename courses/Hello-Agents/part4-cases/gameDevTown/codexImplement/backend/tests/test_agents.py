import pytest

from app.core.game_dev_town import GameDevTown


@pytest.mark.asyncio
async def test_agents_can_talk():
    town = GameDevTown()
    await town.start_project("王者之路", "first-person-rpg", "6-months")
    meeting = await town.hold_meeting("design-review", "战斗系统设计", "designer")
    assert len(meeting["dialogue"]) == 4
    assert all("content" in m for m in meeting["dialogue"])
