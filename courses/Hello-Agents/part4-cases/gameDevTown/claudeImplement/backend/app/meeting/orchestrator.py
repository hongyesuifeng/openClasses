"""
Game Dev Town - 会议编排系统
管理会议流程和 Agent 交互
"""
from typing import Dict, Any, List, Optional
import asyncio
from datetime import datetime

from app.agents.base import BaseAgent
from app.agents import create_agent
from app.core.conversation import ConversationManager, MeetingType, MessageType
from app.core.task import TaskSystem, TaskStatus, TaskPriority
from app.config import settings, AGENT_ROLES


class MeetingOrchestrator:
    """
    会议编排器
    负责组织会议、管理发言顺序、汇总决策
    """

    def __init__(self, llm_service=None):
        self.llm_service = llm_service
        self.agents: Dict[str, BaseAgent] = {}
        self.conversation_manager = ConversationManager()
        self.task_system = TaskSystem()
        self.meeting_active = False
        self.current_topic = ""
        self.websocket_manager = None
        self._should_stop = False  # 中断标志

        # 初始化所有 Agent
        self._initialize_agents()

    def _initialize_agents(self) -> None:
        """初始化所有 Agent"""
        for role_id in AGENT_ROLES.keys():
            self.agents[role_id] = create_agent(role_id, self.llm_service)

    def set_websocket_manager(self, ws_manager) -> None:
        """设置 WebSocket 管理器"""
        self.websocket_manager = ws_manager

    async def broadcast_message(self, message: Dict[str, Any]) -> None:
        """广播消息到前端"""
        if self.websocket_manager:
            await self.websocket_manager.broadcast(message)

    async def start_meeting(
        self,
        title: str,
        meeting_type: MeetingType,
        agenda: List[str],
    ) -> Dict[str, Any]:
        """开始会议"""
        if self.meeting_active:
            return {"error": "已有进行中的会议"}

        participants = list(self.agents.keys())
        self.conversation_manager.start_meeting(
            title=title,
            meeting_type=meeting_type,
            participants=participants,
            agenda=agenda,
        )

        self.meeting_active = True

        # 广播会议开始
        await self.broadcast_message({
            "type": "meeting_started",
            "data": {
                "title": title,
                "type": meeting_type.value,
                "participants": [self.agents[p].to_dict() for p in participants],
                "agenda": agenda,
            },
        })

        return {
            "status": "started",
            "meeting_id": self.conversation_manager.current_meeting.id,
            "title": title,
            "participants": participants,
        }

    async def run_discussion_round(
        self,
        topic: str,
        speaking_order: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """运行一轮讨论"""
        if not self.meeting_active:
            return []

        self.current_topic = topic
        responses = []

        # 设置发言顺序
        order = speaking_order or list(self.agents.keys())

        for role_id in order:
            agent = self.agents.get(role_id)
            if not agent:
                continue

            # 设置 Agent 正在发言
            agent.set_speaking(True)
            agent.set_mood("thinking")

            # 广播状态更新
            await self.broadcast_message({
                "type": "agent_status",
                "data": agent.get_status(),
            })

            # 获取会议上下文
            context = self.conversation_manager.get_meeting_context(last_n_messages=3)

            # 生成回复
            response = await agent.respond_to_agenda(topic, context)

            # 添加到会议记录
            message = self.conversation_manager.add_message(
                speaker=role_id,
                speaker_name=agent.name,
                content=response,
                message_type=MessageType.SPEECH,
            )

            # 重置发言状态
            agent.set_speaking(False)
            agent.set_mood("neutral")

            # 广播消息
            await self.broadcast_message({
                "type": "new_message",
                "data": message.to_dict() if message else {
                    "speaker": role_id,
                    "speaker_name": agent.name,
                    "content": response,
                },
            })

            responses.append({
                "speaker": role_id,
                "speaker_name": agent.name,
                "content": response,
            })

            # 延迟，模拟思考时间
            await asyncio.sleep(settings.game.meeting_turn_delay)

        return responses

    async def run_interactive_discussion(
        self,
        rounds: int = 2,
    ) -> List[Dict[str, Any]]:
        """运行交互式讨论"""
        all_responses = []
        self._should_stop = False  # 重置中断标志

        for round_num in range(rounds):
            # 检查中断标志
            if self._should_stop:
                print("会议被中断")
                break

            # 每轮更换发言顺序，让讨论更自然
            speaking_order = self._get_round_robin_order(round_num)

            for role_id in speaking_order:
                # 检查中断标志
                if self._should_stop:
                    break

                agent = self.agents.get(role_id)
                if not agent:
                    continue

                agent.set_speaking(True)
                await self.broadcast_message({
                    "type": "agent_status",
                    "data": agent.get_status(),
                })

                # 获取上一条消息作为上下文
                context = self.conversation_manager.get_meeting_context(last_n_messages=3)

                # 根据上下文决定发言内容
                if self.conversation_manager.turn_count == 0:
                    response = await agent.respond_to_agenda(self.current_topic, context)
                else:
                    # 获取最后一条消息并做出反应
                    messages = self.conversation_manager.current_meeting.messages
                    if messages:
                        last_msg = messages[-1]
                        response = await agent.react_to_message(
                            last_msg.content,
                            last_msg.speaker_name,
                        )
                    else:
                        response = await agent.respond_to_agenda(self.current_topic, context)

                message = self.conversation_manager.add_message(
                    speaker=role_id,
                    speaker_name=agent.name,
                    content=response,
                )

                agent.set_speaking(False)
                await self.broadcast_message({
                    "type": "new_message",
                    "data": message.to_dict() if message else {
                        "speaker": role_id,
                        "speaker_name": agent.name,
                        "content": response,
                    },
                })

                all_responses.append({
                    "speaker": role_id,
                    "speaker_name": agent.name,
                    "content": response,
                })

                await asyncio.sleep(settings.game.meeting_turn_delay)

                # 检查是否应该结束会议
                if self.conversation_manager.should_end_meeting():
                    break

        return all_responses

    def _get_round_robin_order(self, round_num: int) -> List[str]:
        """获取轮询发言顺序"""
        agents_list = list(self.agents.keys())
        # 根据轮次旋转顺序
        offset = round_num % len(agents_list)
        return agents_list[offset:] + agents_list[:offset]

    async def make_decision(self, topic: str, options: List[str] = None) -> Dict[str, Any]:
        """做出决策"""
        # 收集所有 Agent 的意见
        votes = {}

        for role_id, agent in self.agents.items():
            decision = agent.analyze_proposal(topic, {"options": options})
            votes[role_id] = {
                "decision": decision.decision_type.value,
                "reasoning": decision.reasoning,
                "confidence": decision.confidence,
            }

        # 广播投票结果
        await self.broadcast_message({
            "type": "decision_votes",
            "data": votes,
        })

        # 制作人做最终决策
        producer = self.agents.get("producer")
        if producer:
            final_decision = await producer.generate_response(
                topic,
                f"基于团队意见做出最终决策: {votes}",
            )

            self.conversation_manager.add_message(
                speaker="producer",
                speaker_name=producer.name,
                content=final_decision,
                message_type=MessageType.DECISION,
            )

            self.conversation_manager.add_conclusion(final_decision)

            return {
                "topic": topic,
                "votes": votes,
                "final_decision": final_decision,
            }

        return {"votes": votes}

    async def end_meeting(self) -> Dict[str, Any]:
        """结束会议"""
        # 设置中断标志，停止正在进行的讨论
        self._should_stop = True

        if not self.meeting_active:
            return {"error": "没有进行中的会议"}

        # 生成会议总结
        meeting = self.conversation_manager.end_meeting()

        if meeting:
            # 提取行动项
            action_items = self._extract_action_items(meeting)

            # 创建任务
            for item in action_items:
                self.task_system.create_task(
                    title=item["task"],
                    description=item.get("description", ""),
                    assignee=item.get("assignee", "producer"),
                    priority=TaskPriority.MEDIUM,
                )

            summary = {
                "meeting_id": meeting.id,
                "title": meeting.title,
                "duration": str(meeting.end_time - meeting.start_time),
                "participants": meeting.participants,
                "message_count": len(meeting.messages),
                "conclusions": meeting.conclusions,
                "action_items": action_items,
                # 添加任务统计数据
                "task_stats": self.task_system.get_project_progress(),
            }

            await self.broadcast_message({
                "type": "meeting_ended",
                "data": summary,
            })

            self.meeting_active = False
            return summary

        self.meeting_active = False
        return {"status": "ended"}

    def _extract_action_items(self, meeting) -> List[Dict[str, Any]]:
        """从会议中提取行动项"""
        items = []

        # 简化版：从结论中提取
        for conclusion in meeting.conclusions:
            items.append({
                "task": conclusion[:100],
                "description": conclusion,
                "assignee": "producer",
            })

        return items

    def get_meeting_status(self) -> Dict[str, Any]:
        """获取会议状态"""
        return {
            "active": self.meeting_active,
            "current_topic": self.current_topic,
            "turn_count": self.conversation_manager.turn_count,
            "participants": list(self.agents.keys()),
            "summary": self.conversation_manager.get_conversation_summary(),
        }

    def get_agent_statuses(self) -> List[Dict[str, Any]]:
        """获取所有 Agent 状态"""
        return [agent.get_status() for agent in self.agents.values()]

    def get_project_progress(self) -> Dict[str, Any]:
        """获取项目进度"""
        return self.task_system.get_project_progress()
