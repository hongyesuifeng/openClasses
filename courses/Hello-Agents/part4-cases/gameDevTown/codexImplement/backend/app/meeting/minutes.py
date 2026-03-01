from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass
class MeetingMinutes:
    meeting_type: str
    topic: str
    summary: str
    decision: dict
    action_items: list[dict]

    def to_dict(self) -> dict:
        return asdict(self)
