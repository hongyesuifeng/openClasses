from __future__ import annotations

import random
from datetime import datetime

ROLE_ICON = {
    "producer": "🎬",
    "developer": "💻",
    "designer": "📝",
    "artist": "🎨",
}

ROLE_NAME = {
    "producer": "Alex",
    "developer": "Cody",
    "designer": "Diana",
    "artist": "Arty",
}

MEETING_LINES: dict[str, dict[str, list[str]]] = {
    "daily-standup": {
        "producer": [
            "今天站会聚焦 {topic}，先同步阻塞和风险。",
            "我们时间紧，先收敛到本周可交付。",
        ],
        "designer": [
            "我把 {topic} 拆成了玩法闭环，优先保证手感。",
            "上次反馈后，我降低了复杂度，保留核心乐趣。",
        ],
        "developer": [
            "技术上可行，建议分两期实现，先做稳定版。",
            "这个模块有性能风险，我会先做原型压测。",
        ],
        "artist": [
            "视觉上我会先交关键特效，再补全细节。",
            "我需要明确资源优先级，避免反复返工。",
        ],
    },
    "design-review": {
        "producer": ["今天评审 {topic}，先听方案，再做决策。"],
        "designer": ["我提议加入元素连携，让战斗策略更深。", "我希望保留高反馈的组合技体验。"],
        "developer": ["建议先做简化版，保证帧率和可维护性。", "若全量实现，工期会超出当前里程碑。"],
        "artist": ["我可以为关键技能做高辨识度特效。", "视觉语言建议统一为低多边形+手绘贴图。"],
    },
    "technical-review": {
        "producer": ["请给出技术方案、风险和工时估算。"],
        "designer": ["玩法目标是可读、可控、可扩展。"],
        "developer": ["我推荐动画驱动+命中检测，先确保稳定。", "物理方案效果好但成本偏高。"],
        "artist": ["只要接口稳定，视觉迭代就能并行推进。"],
    },
}


def render_line(role: str, meeting_type: str, topic: str) -> str:
    role_lines = MEETING_LINES.get(meeting_type, MEETING_LINES["daily-standup"]).get(role, ["收到。"])
    chosen = random.choice(role_lines)
    return chosen.format(topic=topic)


def message(role: str, text: str) -> dict[str, str]:
    return {
        "timestamp": datetime.now().strftime("%H:%M"),
        "role": role,
        "speaker": ROLE_NAME.get(role, role),
        "icon": ROLE_ICON.get(role, "💬"),
        "content": text,
    }
