"""
Game Dev Town - 美术 Agent
负责游戏视觉风格、角色设计和UI界面
"""
from typing import Dict, Any, List
from app.agents.base import BaseAgent


class ArtistAgent(BaseAgent):
    """
    美术 Agent
    角色：角色设计、场景美术、UI设计、特效制作
    """

    def __init__(self, llm_service=None):
        super().__init__("artist", llm_service)
        self.art_tasks: List[Dict] = []
        self.style_guides: List[Dict] = []
        self.asset_queue: List[Dict] = []

    def get_system_prompt(self) -> str:
        base_prompt = super().get_system_prompt()
        return f"""{base_prompt}

作为美术，你的职责包括：
1. 确立游戏视觉风格和美术方向
2. 设计游戏角色、场景和UI界面
3. 制作游戏特效和动画
4. 管理美术资源和制作流程
5. 与程序协作实现视觉效果

在讨论中，你应该：
- 从视觉表现角度评估设计
- 提出美术风格和视觉创意
- 评估美术工作量和时间
- 关注用户界面和用户体验

你的口头禅：'从视觉角度来说'、'这样会更好看'、'我们需要保持风格统一'"""

    async def respond_to_agenda(self, agenda_item: str, context: str) -> str:
        """回应会议议程"""
        prompt = f"""会议议程：{agenda_item}

当前讨论上下文：
{context}

作为美术，请从视觉设计和用户体验角度发表你的看法，包括风格方向、视觉表现和工作量评估。"""

        return await self.generate_response(context, prompt)

    async def react_to_message(self, message: str, speaker: str) -> str:
        """对他人的消息做出反应"""
        prompt = f"""{speaker}说：{message}

作为美术，请从视觉设计角度回应。你可以：
- 提出视觉风格建议
- 评估美术可行性
- 讨论UI/UX设计
- 提醒风格一致性问题"""

        return await self.generate_response(message, prompt)

    def propose_art_direction(self, style: str, description: str) -> None:
        """提出美术方向"""
        self.style_guides.append({
            "style": style,
            "description": description,
            "status": "proposed",
        })
        self.remember(f"美术方向提议: {style} - {description[:50]}", importance=0.7, category="style")

    def add_art_task(self, task: str, priority: str = "medium", deadline: str = None) -> None:
        """添加美术任务"""
        self.art_tasks.append({
            "task": task,
            "priority": priority,
            "deadline": deadline,
            "status": "pending",
        })
        self.remember(f"美术任务: {task}", importance=0.5, category="art_task")

    def queue_asset(self, asset_name: str, asset_type: str) -> None:
        """排队美术资源"""
        self.asset_queue.append({
            "name": asset_name,
            "type": asset_type,
            "status": "queued",
        })

    def get_art_status(self) -> Dict[str, Any]:
        """获取美术状态"""
        return {
            "pending_tasks": len([t for t in self.art_tasks if t["status"] == "pending"]),
            "style_guides": len(self.style_guides),
            "queued_assets": len(self.asset_queue),
        }
