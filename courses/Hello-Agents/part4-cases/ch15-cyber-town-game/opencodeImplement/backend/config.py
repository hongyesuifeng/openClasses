"""
配置文件
"""

LLM_PROVIDERS = {
    "minimax": {
        "name": "MiniMax",
        "base_url": "https://api.minimax.com/v1",
        "models": ["MiniMax-M2.5", "MiniMax-M2.5-highspeed", "MiniMax-M2.1"],
        "default_model": "MiniMax-M2.5"
    },
    "zhipu": {
        "name": "智谱GLM",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "models": ["glm-3-turbo", "glm-4"],
        "default_model": "glm-4"
    },
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-3.5-turbo", "gpt-4"],
        "default_model": "gpt-3.5-turbo"
    }
}

GAME_CONFIG = {
    "time_scale": 60,
    "tick_interval": 5,
    "max_characters": 10,
    "default_locations": [
        {"name": "酒馆", "type": "social", "capacity": 10},
        {"name": "咖啡馆", "type": "food", "capacity": 8},
        {"name": "公园", "type": "relax", "capacity": 15},
        {"name": "商店", "type": "shop", "capacity": 5},
        {"name": "住宅", "type": "home", "capacity": 3}
    ]
}
