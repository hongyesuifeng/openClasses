from __future__ import annotations

import hashlib

from app.config import get_settings


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def generate(self, role: str, prompt: str, fallback: str) -> str:
        # 教学案例默认离线可运行。若配置了 key，可在此替换为真实 API 调用。
        if not (self.settings.minimax_api_key or self.settings.anthropic_api_key):
            return fallback

        digest = hashlib.sha1(f"{role}:{prompt}".encode("utf-8")).hexdigest()[:8]
        return f"{fallback} [LLM:{digest}]"
