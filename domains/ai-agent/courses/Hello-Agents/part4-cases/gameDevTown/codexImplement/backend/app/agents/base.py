from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.memory import MemorySystem
from app.core.conversation import render_line
from app.services.llm import LLMService


@dataclass
class AgentProfile:
    id: str
    name: str
    role: str
    personality: dict[str, float]
    expertise: list[str]


class BaseAgent:
    def __init__(self, profile: AgentProfile, llm: LLMService) -> None:
        self.profile = profile
        self.memory = MemorySystem()
        self.llm = llm

    async def process_input(self, context: str, meeting_type: str, topic: str) -> str:
        memories = self.memory.retrieve(context)
        prompt = self.build_prompt(context, memories, meeting_type, topic)
        response = await self.llm.generate(self.profile.role, prompt, fallback=render_line(self.profile.role, meeting_type, topic))
        self.memory.store(f"[{meeting_type}] {topic}: {response}")
        return response

    def build_prompt(self, context: str, memories: list[Any], meeting_type: str, topic: str) -> str:
        mem_text = "\n".join([f"- {m.content}" for m in memories[-3:]])
        return (
            f"你是{self.profile.name}({self.profile.role})。\n"
            f"会议类型: {meeting_type}\n"
            f"话题: {topic}\n"
            f"上下文: {context}\n"
            f"记忆:\n{mem_text}\n"
            "请用1-2句给出专业观点。"
        )
