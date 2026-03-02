"""
Game Dev Town - 对话模板
预定义的会议场景和对话模板
"""
from typing import List, Dict, Any
from app.core.conversation import MeetingType


# 会议模板
MEETING_TEMPLATES = {
    "project_kickoff": {
        "title": "项目启动会 - 王者之路",
        "type": MeetingType.PLANNING,
        "agenda": [
            "项目目标确认",
            "团队成员介绍",
            "里程碑规划",
            "分工讨论",
        ],
        "description": "游戏开发项目正式启动，团队首次会议",
    },
    "weekly_review": {
        "title": "周例会 - 进度同步",
        "type": MeetingType.REVIEW,
        "agenda": [
            "本周工作汇报",
            "问题讨论",
            "下周计划",
        ],
        "description": "每周例行进度同步会议",
    },
    "feature_discussion": {
        "title": "功能评审 - 新英雄设计",
        "type": MeetingType.BRAINSTORM,
        "agenda": [
            "新英雄概念介绍",
            "技能设计讨论",
            "美术风格确定",
            "技术实现评估",
        ],
        "description": "讨论新英雄的设计方案",
    },
    "technical_review": {
        "title": "技术评审 - 网络同步方案",
        "type": MeetingType.DECISION,
        "agenda": [
            "方案A：状态同步",
            "方案B：帧同步",
            "性能对比",
            "决策投票",
        ],
        "description": "评估并决定网络同步技术方案",
    },
    "milestone_check": {
        "title": "里程碑检查 - Alpha版本",
        "type": MeetingType.REVIEW,
        "agenda": [
            "功能完成度检查",
            "Bug列表回顾",
            "发布准备情况",
            "下一步计划",
        ],
        "description": "检查Alpha版本的完成情况",
    },
}

# 场景对话提示
SCENARIO_PROMPTS = {
    "hero_design": {
        "topic": "新英雄「暗影刺客」设计方案",
        "context": """我们需要设计一个新英雄「暗影刺客」，定位为打野刺客。
初步设定：
- 被动：击杀敌人后获得短暂隐身
- 一技能：突进并造成伤害
- 二技能：范围减速
- 大招：传送到目标背后并暴击

请从各自专业角度讨论这个设计的可行性和改进建议。""",
        "expected_responses": {
            "producer": "关注开发周期和资源分配",
            "developer": "评估技能实现的技术难度",
            "designer": "分析英雄平衡性和玩法体验",
            "artist": "讨论视觉特效和角色形象",
        },
    },
    "performance_issue": {
        "topic": "游戏卡顿问题紧急讨论",
        "context": """最近测试发现，10人团战时帧率下降严重。
当前数据：
- 正常情况：60 FPS
- 5v5团战：35-45 FPS
- 技能特效全开：25-30 FPS

需要尽快解决这个问题。请各部门给出建议。""",
        "expected_responses": {
            "producer": "评估问题严重程度和修复优先级",
            "developer": "提出技术优化方案",
            "designer": "建议可以精简的特效",
            "artist": "提供美术资源优化方向",
        },
    },
    "monetization": {
        "topic": "付费系统设计方案",
        "context": """需要设计游戏的付费系统，包括：
1. 英雄购买方式
2. 皮肤定价策略
3. 战斗通行证设计
4. 平衡付费与免费玩家体验

请从玩家体验和商业收益两个角度讨论。""",
        "expected_responses": {
            "producer": "考虑收益目标和合规要求",
            "developer": "评估系统实现复杂度",
            "designer": "确保数值平衡和公平性",
            "artist": "规划皮肤设计风格和主题",
        },
    },
    "game_fun_evaluation": {
        "topic": "游戏是否好玩 - 核心乐趣评估",
        "context": """我们需要评估当前游戏的核心乐趣是否足够吸引玩家。

当前游戏数据：
- 新手留存率（次日）：35%
- 7日留存率：12%
- 平均游戏时长：18分钟/局
- 玩家反馈关键词：画面好、匹配慢、英雄不平衡

讨论要点：
1. 游戏的核心乐趣是什么？
2. 哪些地方让玩家觉得无聊或挫败？
3. 如何提升游戏的"再来一局"冲动？
4. 有哪些快速可执行的改进方案？

请从各自专业角度分析游戏乐趣并提出改进建议。""",
        "expected_responses": {
            "producer": "关注整体体验和项目优先级",
            "developer": "分析技术实现和性能影响",
            "designer": "分析核心玩法和数值平衡",
            "artist": "讨论视觉反馈和成就感设计",
        },
    },
    "prototype_demo": {
        "topic": "原型Demo节点 - 核心展示内容讨论",
        "context": """即将迎来原型Demo节点评审，需要确定核心展示内容。

评审目标：
- 向发行方展示游戏核心价值
- 预计展示时间：15分钟
- 需要展示：核心玩法、美术风格、技术亮点

当前开发状态：
- 3个英雄已完成（战士、法师、射手）
- 1张地图（5v5峡谷）
- 基础匹配系统
- 技能特效完成度60%

讨论要点：
1. Demo应该重点展示什么？
2. 哪些功能必须在这个节点前完成？
3. 如何在15分钟内展现游戏特色？
4. 需要准备哪些备用方案？

请讨论并确定Demo展示的核心内容和分工。""",
        "expected_responses": {
            "producer": "把控整体节奏和关键里程碑",
            "developer": "评估功能完成风险和技术展示点",
            "designer": "设计展示流程和玩法亮点",
            "artist": "确保美术品质和视觉冲击力",
        },
    },
}

# 角色特定对话示例
ROLE_DIALOGUE_EXAMPLES = {
    "producer": [
        "好的，让我确认一下这个提议对项目进度的影响。",
        "我们需要评估一下风险，这个改动可能会延期。",
        "我建议我们分阶段实施，先做MVP版本。",
        "这个任务优先级很高，需要这周内完成。",
        "团队配合得很好，进度比预期快。",
    ],
    "developer": [
        "从技术角度看，这个方案是可行的，预计需要3天开发。",
        "这个功能有性能风险，需要做压力测试。",
        "代码重构可以解决这个技术债务，但需要2天时间。",
        "我建议使用现有的框架来实现，可以节省时间。",
        "发现了一个严重Bug，需要紧急修复。",
    ],
    "designer": [
        "从玩家体验来说，这个设计会让游戏更有趣。",
        "数值方面需要调整，目前英雄B太强势了。",
        "建议增加一个新手引导系统，降低学习成本。",
        "这个经济系统设计可以激励玩家持续参与。",
        "玩家反馈说匹配时间太长，需要优化。",
    ],
    "artist": [
        "视觉风格上，我建议采用更鲜明的色彩对比。",
        "这个特效可能太花哨了，会影响游戏性能。",
        "UI界面需要简化，当前信息密度太高。",
        "角色动画已经完成80%，预计明天交付。",
        "新地图的场景设计初稿已经出来了。",
    ],
}


def get_meeting_template(template_id: str) -> Dict[str, Any]:
    """获取会议模板"""
    return MEETING_TEMPLATES.get(template_id)


def get_scenario_prompt(scenario_id: str) -> Dict[str, Any]:
    """获取场景提示"""
    return SCENARIO_PROMPTS.get(scenario_id)


def get_random_dialogue(role_id: str) -> str:
    """获取随机对话示例"""
    import random
    dialogues = ROLE_DIALOGUE_EXAMPLES.get(role_id, [])
    return random.choice(dialogues) if dialogues else ""


def list_available_templates() -> List[Dict[str, str]]:
    """列出所有可用模板"""
    return [
        {
            "id": template_id,
            "title": template["title"],
            "description": template["description"],
        }
        for template_id, template in MEETING_TEMPLATES.items()
    ]


def list_available_scenarios() -> List[Dict[str, str]]:
    """列出所有可用场景"""
    return [
        {
            "id": scenario_id,
            "topic": scenario["topic"],
        }
        for scenario_id, scenario in SCENARIO_PROMPTS.items()
    ]
