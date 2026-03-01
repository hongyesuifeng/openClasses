"""
Game Dev Town - WebSocket 处理
实时通信支持
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import asyncio

from app.services.llm import llm_service
from app.meeting import MeetingOrchestrator, get_scenario_prompt
from app.core.conversation import MeetingType, MessageType
from app.config import AGENT_ROLES

websocket_router = APIRouter()


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """接受新连接"""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket 连接建立，当前连接数: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """断开连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"WebSocket 连接断开，当前连接数: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """广播消息到所有连接"""
        message_json = json.dumps(message, ensure_ascii=False)
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception:
                disconnected.append(connection)

        # 清理断开的连接
        for conn in disconnected:
            self.disconnect(conn)

    async def send_personal(self, websocket: WebSocket, message: Dict[str, Any]):
        """发送个人消息"""
        message_json = json.dumps(message, ensure_ascii=False)
        await websocket.send_text(message_json)


# 全局连接管理器
manager = ConnectionManager()

# 全局会议编排器
orchestrator = MeetingOrchestrator(llm_service)
orchestrator.set_websocket_manager(manager)

# 当前运行的任务（用于中断）
current_scenario_task = None


@websocket_router.websocket("/meeting")
async def websocket_meeting(websocket: WebSocket):
    """会议 WebSocket 端点"""
    await manager.connect(websocket)

    try:
        # 发送初始状态
        await manager.send_personal(websocket, {
            "type": "connected",
            "data": {
                "message": "已连接到游戏小镇",
                "agents": [
                    {"role_id": role_id, **config}
                    for role_id, config in AGENT_ROLES.items()
                ],
                "meeting_status": orchestrator.get_meeting_status(),
            },
        })

        while True:
            # 接收消息
            data = await websocket.receive_text()
            message = json.loads(data)

            # 处理不同类型的消息
            await handle_websocket_message(websocket, message)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket 错误: {e}")
        manager.disconnect(websocket)


async def handle_websocket_message(websocket: WebSocket, message: Dict[str, Any]):
    """处理 WebSocket 消息"""
    msg_type = message.get("type", "")
    data = message.get("data", {})

    handlers = {
        "start_meeting": handle_start_meeting,
        "run_discussion": handle_run_discussion,
        "send_message": handle_send_message,
        "end_meeting": handle_end_meeting,
        "get_status": handle_get_status,
        "run_scenario": handle_run_scenario,
    }

    handler = handlers.get(msg_type)
    if handler:
        await handler(websocket, data)
    else:
        await manager.send_personal(websocket, {
            "type": "error",
            "data": {"message": f"未知消息类型: {msg_type}"},
        })


async def handle_start_meeting(websocket: WebSocket, data: Dict[str, Any]):
    """处理开始会议"""
    result = await orchestrator.start_meeting(
        title=data.get("title", "临时会议"),
        meeting_type=MeetingType(data.get("meeting_type", "brainstorm")),
        agenda=data.get("agenda", []),
    )

    await manager.send_personal(websocket, {
        "type": "meeting_started",
        "data": result,
    })


async def handle_run_discussion(websocket: WebSocket, data: Dict[str, Any]):
    """处理运行讨论"""
    if not orchestrator.meeting_active:
        await manager.send_personal(websocket, {
            "type": "error",
            "data": {"message": "没有进行中的会议"},
        })
        return

    topic = data.get("topic", "")
    rounds = data.get("rounds", 1)

    orchestrator.current_topic = topic
    responses = await orchestrator.run_interactive_discussion(rounds=rounds)

    # 结果会通过 broadcast 自动发送


async def handle_send_message(websocket: WebSocket, data: Dict[str, Any]):
    """处理发送消息（用户输入）"""
    if not orchestrator.meeting_active:
        await manager.send_personal(websocket, {
            "type": "error",
            "data": {"message": "没有进行中的会议"},
        })
        return

    content = data.get("content", "")

    # 添加用户消息到会议
    message = orchestrator.conversation_manager.add_message(
        speaker="user",
        speaker_name="用户",
        content=content,
    )

    # 广播用户消息
    await manager.broadcast({
        "type": "new_message",
        "data": message.to_dict() if message else {
            "speaker": "user",
            "speaker_name": "用户",
            "content": content,
        },
    })

    # 让 Agent 们响应用户消息
    for role_id, agent in orchestrator.agents.items():
        response = await agent.react_to_message(content, "用户")

        agent.set_speaking(True)
        await manager.broadcast({
            "type": "agent_status",
            "data": agent.get_status(),
        })

        msg = orchestrator.conversation_manager.add_message(
            speaker=role_id,
            speaker_name=agent.name,
            content=response,
        )

        agent.set_speaking(False)

        await manager.broadcast({
            "type": "new_message",
            "data": msg.to_dict() if msg else {
                "speaker": role_id,
                "speaker_name": agent.name,
                "content": response,
            },
        })

        await asyncio.sleep(1)


async def handle_end_meeting(websocket: WebSocket, data: Dict[str, Any]):
    """处理结束会议"""
    global current_scenario_task

    # 取消正在运行的任务
    if current_scenario_task and not current_scenario_task.done():
        current_scenario_task.cancel()
        try:
            await current_scenario_task
        except asyncio.CancelledError:
            pass
        current_scenario_task = None

    # 结束会议
    result = await orchestrator.end_meeting()

    # 广播会议结束
    await manager.broadcast({
        "type": "meeting_ended",
        "data": result,
    })


async def handle_get_status(websocket: WebSocket, data: Dict[str, Any]):
    """处理获取状态"""
    await manager.send_personal(websocket, {
        "type": "status_update",
        "data": {
            "meeting": orchestrator.get_meeting_status(),
            "agents": orchestrator.get_agent_statuses(),
            "progress": orchestrator.get_project_progress(),
        },
    })


async def handle_run_scenario(websocket: WebSocket, data: Dict[str, Any]):
    """处理运行场景"""
    global current_scenario_task

    scenario_id = data.get("scenario_id", "hero_design")
    scenario = get_scenario_prompt(scenario_id)

    if not scenario:
        await manager.send_personal(websocket, {
            "type": "error",
            "data": {"message": f"场景不存在: {scenario_id}"},
        })
        return

    # 启动会议
    await orchestrator.start_meeting(
        title=scenario["topic"],
        meeting_type=MeetingType.BRAINSTORM,
        agenda=[scenario["topic"]],
    )

    # 广播场景介绍
    intro_message = orchestrator.conversation_manager.add_message(
        speaker="system",
        speaker_name="系统",
        content=f"📋 会议主题：{scenario['topic']}\n\n{scenario['context'][:200]}...",
        message_type=MessageType.SYSTEM,
    )
    await manager.broadcast({
        "type": "new_message",
        "data": intro_message.to_dict() if intro_message else {
            "speaker": "system",
            "speaker_name": "系统",
            "content": f"📋 会议主题：{scenario['topic']}",
        },
    })

    # 在后台运行讨论（不阻塞消息处理）
    async def run_discussion():
        global current_scenario_task
        try:
            await asyncio.sleep(1)
            orchestrator.current_topic = scenario["context"]
            rounds = data.get("rounds", 3)
            await orchestrator.run_interactive_discussion(rounds=rounds)

            # 自动结束会议并生成总结（如果未被中断）
            if orchestrator.meeting_active:
                result = await orchestrator.end_meeting()
                await manager.broadcast({
                    "type": "meeting_ended",
                    "data": result,
                })
        except asyncio.CancelledError:
            print("场景任务被取消")
        finally:
            current_scenario_task = None

    current_scenario_task = asyncio.create_task(run_discussion())
