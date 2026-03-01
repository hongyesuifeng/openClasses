"""
Game Dev Town - 配置管理模块
管理环境变量和应用配置
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

# 加载环境变量
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)


class LLMConfig(BaseModel):
    """LLM 服务配置"""
    api_key: str
    base_url: str
    model: str
    max_tokens: int = 2048
    temperature: float = 0.7


class ServerConfig(BaseModel):
    """服务器配置"""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True


class GameConfig(BaseModel):
    """游戏配置"""
    name: str = "王者之路"
    max_memory_items: int = 50
    meeting_turn_delay: float = 2.0


class Settings(BaseModel):
    """应用总配置"""
    llm: LLMConfig
    server: ServerConfig
    game: GameConfig

    @classmethod
    def from_env(cls) -> "Settings":
        """从环境变量加载配置"""
        return cls(
            llm=LLMConfig(
                api_key=os.getenv("MINIMAX_API_KEY", ""),
                base_url=os.getenv("MINIMAX_BASE_URL", "https://api.minimax.chat/v1"),
                model=os.getenv("MINIMAX_MODEL", "abab6.5s-chat"),
            ),
            server=ServerConfig(
                host=os.getenv("HOST", "0.0.0.0"),
                port=int(os.getenv("PORT", "8000")),
                debug=os.getenv("DEBUG", "true").lower() == "true",
            ),
            game=GameConfig(
                name=os.getenv("GAME_NAME", "王者之路"),
                max_memory_items=int(os.getenv("MAX_MEMORY_ITEMS", "50")),
                meeting_turn_delay=float(os.getenv("MEETING_TURN_DELAY", "2.0")),
            ),
        )


# 全局配置实例
settings = Settings.from_env()


# Agent 角色定义
AGENT_ROLES = {
    "producer": {
        "name": "张制作",
        "role": "制作人",
        "description": "负责项目整体规划、进度管理和团队协调",
        "color": "#FF6B6B",
        "avatar": "🎯",
        "expertise": ["项目管理", "资源调配", "风险评估", "里程碑规划"],
        "personality": "稳重、有条理、善于协调",
    },
    "developer": {
        "name": "李程序",
        "role": "程序员",
        "description": "负责游戏核心系统开发和技术架构设计",
        "color": "#4ECDC4",
        "avatar": "💻",
        "expertise": ["系统架构", "性能优化", "网络同步", "AI系统"],
        "personality": "技术狂、逻辑缜密、追求完美",
    },
    "designer": {
        "name": "王策划",
        "role": "策划",
        "description": "负责游戏玩法设计、数值平衡和系统设计",
        "color": "#FFE66D",
        "avatar": "📋",
        "expertise": ["玩法设计", "数值平衡", "经济系统", "社交系统"],
        "personality": "创意丰富、数据敏感、玩家视角",
    },
    "artist": {
        "name": "陈美术",
        "role": "美术",
        "description": "负责游戏视觉风格、角色设计和UI界面",
        "color": "#C44D58",
        "avatar": "🎨",
        "expertise": ["角色设计", "场景美术", "UI设计", "特效制作"],
        "personality": "审美独特、注重细节、追求美感",
    },
}

# 项目阶段定义
PROJECT_PHASES = [
    {
        "id": "concept",
        "name": "概念阶段",
        "description": "确定游戏核心概念和目标用户",
        "duration": "2周",
    },
    {
        "id": "prototype",
        "name": "原型阶段",
        "description": "开发核心玩法原型进行验证",
        "duration": "4周",
    },
    {
        "id": "production",
        "name": "量产阶段",
        "description": "完整开发游戏内容和系统",
        "duration": "12周",
    },
    {
        "id": "polish",
        "name": "打磨阶段",
        "description": "优化体验和修复问题",
        "duration": "4周",
    },
    {
        "id": "release",
        "name": "发布阶段",
        "description": "准备上线和市场营销",
        "duration": "2周",
    },
]
