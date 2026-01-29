"""
应用配置管理

集中管理应用的环境变量和配置项。
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class Config:
    """应用配置类"""

    # 项目路径
    BASE_DIR: Path = Path(__file__).resolve().parents[1]
    DATA_DIR: Path = BASE_DIR / "data"

    # 数据库配置
    DB_PATH: Path = DATA_DIR / "app.db"

    # Ollama 配置
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "127.0.0.1")
    OLLAMA_PORT: int = int(os.getenv("OLLAMA_PORT", "11434"))
    OLLAMA_TIMEOUT: int = int(os.getenv("OLLAMA_TIMEOUT", "30"))
    OLLAMA_TEMPERATURE: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.0"))

    # 提取配置
    DEFAULT_EXTRACTION_METHOD: str = os.getenv("DEFAULT_EXTRACTION_METHOD", "heuristic")

    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # API 配置
    API_TITLE: str = "Action Item Extractor"
    API_VERSION: str = "1.0.0"

    @classmethod
    def get_ollama_base_url(cls) -> str:
        """获取 Ollama 服务地址"""
        return f"http://{cls.OLLAMA_HOST}:{cls.OLLAMA_PORT}"

    @classmethod
    def ensure_data_dir(cls) -> None:
        """确保数据目录存在"""
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)


# 初始化配置
Config.ensure_data_dir()


# 导出配置实例
config = Config()
