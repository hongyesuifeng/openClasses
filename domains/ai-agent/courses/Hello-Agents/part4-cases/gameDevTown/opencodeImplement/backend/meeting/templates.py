"""
会议对话模板
"""

MEETING_TEMPLATES = {
    "daily_standup": {
        "name": "每日站会",
        "duration": 15,
        "opening": [
            "好的，我们开始今天的站会。{name}，你先说说进度？",
            "各位，开始今天的站会吧。先从{name}开始。"
        ],
        "producer": [
            "今天的会议重点是{topic}，大家有什么想法？",
            "感谢{speaker}的汇报。{next}，到你了吗？",
            "好的，我来做个总结。"
        ],
        "designer": [
            "我这边关于{feature}的设计有新进展...",
            "根据上次讨论，我更新了{system}的设计。",
            "我需要{resource}支持，预计{time}能完成。"
        ],
        "developer": [
            "从技术角度，{feature}的实现需要约{time}。",
            "我发现了一个问题：{issue}。",
            "代码方面，建议采用{approach}方案。"
        ],
        "artist": [
            "美术风格上，我建议采用{style}方向。",
            "{resource}的资源完成了{percent}%。",
            "视觉上有个想法：{idea}。"
        ]
    },
    "design_review": {
        "name": "设计评审",
        "duration": 60,
        "opening": [
            "好的，我们开始设计评审。{proposer}，请介绍一下设计方案。"
        ],
        "producer": [
            "好的，Diana，请介绍一下你的设计方案。",
            "Cody，从技术角度来看这个方案可行性如何？",
            "我们把这个方案记录下来，下一步是..."
        ],
        "designer": [
            "今天要讨论的是{system}系统，我的设计思路是...",
            "这个设计的核心目标是{goal}，通过{approach}来实现。",
            "我考虑加入{feature}来增加玩家体验。"
        ],
        "developer": [
            "方案整体不错，但{aspect}可能需要调整。",
            "技术实现上，我建议...",
            "这个功能的开发周期大约需要{time}。"
        ],
        "artist": [
            "从视觉表现角度，{aspect}需要加强。",
            "这个设计给美术发挥空间很大。",
            "UI部分我可以配合{style}风格。"
        ]
    },
    "technical_review": {
        "name": "技术评审",
        "duration": 45,
        "opening": [
            "好的，我们开始技术评审。Cody，请介绍技术方案。"
        ],
        "producer": [
            "Cody，从技术角度评估这个方案。",
            "风险点有哪些？我们需要如何应对？",
            "好的，技术方案确认，开始开发。"
        ],
        "designer": [
            "这个技术方案对玩法有什么限制？",
            "能否支持{system}的扩展？",
            "性能方面需要达到什么标准？"
        ],
        "developer": [
            "技术方案是{approach}，优势是{advantage}。",
            "潜在风险是{risk}，解决方案是{solution}。",
            "预计开发周期{time}，需要{resource}支持。"
        ],
        "artist": [
            "这个方案对美术资源有什么要求？",
            "特效表现能达到预期吗？",
            "UI交互方面有什么限制？"
        ]
    },
    "art_review": {
        "name": "美术评审",
        "duration": 30,
        "opening": [
            "好的，我们开始美术评审。Arty，请展示你的设计方案。"
        ],
        "producer": [
            "Arty，你的美术风格很有特色。",
            "这个风格是否符合项目定位？",
            "美术资源预计什么时候能完成？"
        ],
        "designer": [
            "这个视觉风格我很喜欢！",
            "能否加入{element}来增强氛围？",
            "UI风格和世界观很搭。"
        ],
        "developer": [
            "美术资源的技术规格是什么？",
            "对性能有什么影响？",
            "需要准备什么资源格式？"
        ],
        "artist": [
            "我建议采用{style}风格...",
            "视觉上，{element}可以这样表现...",
            "已完成{percent}%，预计{time}完成。"
        ]
    },
    "milestone": {
        "name": "里程碑会议",
        "duration": 90,
        "opening": [
            "各位，我们来回顾一下这个阶段的里程碑成果。"
        ],
        "producer": [
            "先请各位汇报一下阶段成果。",
            "这个阶段有哪些亮点和问题？",
            "下阶段的目标是..."
        ],
        "designer": [
            "本阶段完成了{system}的设计。",
            "玩家反馈很好的是{feature}。",
            "下阶段计划设计{system}。"
        ],
        "developer": [
            "技术方面，完成了{module}开发。",
            "性能指标达到{target}。",
            "下阶段重点是{module}。"
        ],
        "artist": [
            "美术资源完成{percent}%。",
            "新增了{style}风格的资源。",
            "下阶段将完成{resource}。"
        ]
    }
}


def get_template(meeting_type: str) -> dict:
    """获取会议模板"""
    return MEETING_TEMPLATES.get(meeting_type, MEETING_TEMPLATES["daily_standup"])


def format_message(template: str, context: dict) -> str:
    """格式化消息"""
    try:
        return template.format(**context)
    except KeyError:
        return template
