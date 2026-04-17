from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class MemoryEntry:
    content: str
    timestamp: str
    importance: float
    tags: list[str] = field(default_factory=list)


class MemorySystem:
    def __init__(self, short_term_limit: int = 10, importance_threshold: float = 0.75) -> None:
        self.short_term_limit = short_term_limit
        self.importance_threshold = importance_threshold
        self.short_term: list[MemoryEntry] = []
        self.long_term: list[MemoryEntry] = []
        self.project: dict[str, Any] = {}

    def calculate_importance(self, text: str) -> float:
        keywords = ("决定", "风险", "延期", "上线", "里程碑", "阻塞", "关键")
        hit = sum(1 for k in keywords if k in text)
        return min(1.0, 0.3 + hit * 0.2)

    def store(self, content: str, mem_type: str = "short", tags: list[str] | None = None) -> MemoryEntry:
        entry = MemoryEntry(
            content=content,
            timestamp=datetime.utcnow().isoformat(),
            importance=self.calculate_importance(content),
            tags=tags or [],
        )
        if mem_type == "long" or entry.importance >= self.importance_threshold:
            self.long_term.append(entry)
        else:
            self.short_term.append(entry)
            if len(self.short_term) > self.short_term_limit:
                self.short_term.pop(0)
        return entry

    def retrieve(self, context: str, limit: int = 6) -> list[MemoryEntry]:
        context_tokens = set(context.lower().split())

        def relevant(entry: MemoryEntry) -> bool:
            text_tokens = set(entry.content.lower().split())
            return bool(context_tokens & text_tokens)

        chosen = [*self.short_term, *[m for m in self.long_term if relevant(m)]]
        return chosen[-limit:]

    def dump(self) -> dict[str, Any]:
        return {
            "short_term": [asdict(x) for x in self.short_term],
            "long_term": [asdict(x) for x in self.long_term],
            "project": self.project,
        }
