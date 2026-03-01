import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass
class Settings:
    app_name: str = "Game Dev Town"
    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimaxi.com/anthropic"
    anthropic_api_key: str = ""
    anthropic_base_url: str = "https://api.minimaxi.com/anthropic"
    model_name: str = "MiniMax-Text-01"


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Game Dev Town"),
        minimax_api_key=os.getenv("MINIMAX_API_KEY", ""),
        minimax_base_url=os.getenv("MINIMAX_BASE_URL", "https://api.minimaxi.com/anthropic"),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        anthropic_base_url=os.getenv("ANTHROPIC_BASE_URL", "https://api.minimaxi.com/anthropic"),
        model_name=os.getenv("MODEL_NAME", "MiniMax-Text-01"),
    )
