"""
Game Dev Town - REST API 路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.config import AGENT_ROLES, PROJECT_PHASES
from app.meeting import (
    MeetingOrchestrator,
    list_available_templates,
    list_available_scenarios,
    get_meeting_template,
    get_scenario_prompt,
)
from app.core.conversation import MeetingType
from app.services.llm import llm_service

router = APIRouter()

# 全局会议编排器实例
orchestrator = MeetingOrchestrator(llm_service)


# ============ 请求模型 ============

class StartMeetingRequest(BaseModel):
    """开始会议请求"""
    template_id: Optional[str] = None
    title: Optional[str] = None
    meeting_type: str = "brainstorm"
    agenda: List[str] = []


class RunDiscussionRequest(BaseModel):
    """运行讨论请求"""
    topic: str
    speaking_order: Optional[List[str]] = None
    rounds: int = 1


class MessageRequest(BaseModel):
    """发送消息请求"""
    speaker: str
    content: str


# ============ Agent 相关 API ============

@router.get("/agents")
async def get_agents():
    """获取所有 Agent 信息"""
    return {
        "agents": [
            {
                "role_id": role_id,
                **role_config,
            }
            for role_id, role_config in AGENT_ROLES.items()
        ]
    }


@router.get("/agents/{role_id}")
async def get_agent(role_id: str):
    """获取单个 Agent 信息"""
    if role_id not in AGENT_ROLES:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = orchestrator.agents.get(role_id)
    if agent:
        return agent.to_dict()

    return AGENT_ROLES[role_id]


@router.get("/agents/{role_id}/status")
async def get_agent_status(role_id: str):
    """获取 Agent 状态"""
    if role_id not in AGENT_ROLES:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent = orchestrator.agents.get(role_id)
    if agent:
        return agent.get_status()

    raise HTTPException(status_code=404, detail="Agent not initialized")


# ============ 会议相关 API ============

@router.get("/meetings/templates")
async def get_meeting_templates():
    """获取会议模板列表"""
    return {"templates": list_available_templates()}


@router.get("/meetings/scenarios")
async def get_meeting_scenarios():
    """获取场景列表"""
    return {"scenarios": list_available_scenarios()}


@router.post("/meetings/start")
async def start_meeting(request: StartMeetingRequest):
    """开始会议"""
    # 使用模板或自定义参数
    if request.template_id:
        template = get_meeting_template(request.template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        return await orchestrator.start_meeting(
            title=template["title"],
            meeting_type=template["type"],
            agenda=template["agenda"],
        )

    # 自定义会议
    meeting_type = MeetingType(request.meeting_type)
    return await orchestrator.start_meeting(
        title=request.title or "临时会议",
        meeting_type=meeting_type,
        agenda=request.agenda,
    )


@router.post("/meetings/discuss")
async def run_discussion(request: RunDiscussionRequest):
    """运行讨论"""
    if not orchestrator.meeting_active:
        raise HTTPException(status_code=400, detail="No active meeting")

    responses = await orchestrator.run_discussion_round(
        topic=request.topic,
        speaking_order=request.speaking_order,
    )

    return {"responses": responses}


@router.post("/meetings/interactive")
async def run_interactive_discussion(request: RunDiscussionRequest):
    """运行交互式讨论"""
    if not orchestrator.meeting_active:
        raise HTTPException(status_code=400, detail="No active meeting")

    orchestrator.current_topic = request.topic
    responses = await orchestrator.run_interactive_discussion(rounds=request.rounds)

    return {"responses": responses}


@router.post("/meetings/decide")
async def make_decision(topic: str, options: Optional[List[str]] = None):
    """做出决策"""
    if not orchestrator.meeting_active:
        raise HTTPException(status_code=400, detail="No active meeting")

    result = await orchestrator.make_decision(topic, options or [])
    return result


@router.post("/meetings/end")
async def end_meeting():
    """结束会议"""
    if not orchestrator.meeting_active:
        raise HTTPException(status_code=400, detail="No active meeting")

    result = await orchestrator.end_meeting()
    return result


@router.get("/meetings/status")
async def get_meeting_status():
    """获取会议状态"""
    return orchestrator.get_meeting_status()


# ============ 项目相关 API ============

@router.get("/project/info")
async def get_project_info():
    """获取项目信息"""
    from app.config import settings

    return {
        "name": settings.game.name,
        "phases": PROJECT_PHASES,
        "current_phase": "prototype",
    }


@router.get("/project/progress")
async def get_project_progress():
    """获取项目进度"""
    return orchestrator.get_project_progress()


@router.get("/project/tasks")
async def get_project_tasks():
    """获取项目任务"""
    return orchestrator.task_system.to_dict()


# ============ 场景相关 API ============

@router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    """获取场景详情"""
    scenario = get_scenario_prompt(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    return scenario


@router.post("/scenarios/{scenario_id}/run")
async def run_scenario(scenario_id: str):
    """运行场景"""
    scenario = get_scenario_prompt(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # 启动会议
    await orchestrator.start_meeting(
        title=scenario["topic"],
        meeting_type=MeetingType.BRAINSTORM,
        agenda=[scenario["topic"]],
    )

    # 运行讨论
    responses = await orchestrator.run_discussion_round(
        topic=scenario["context"],
    )

    return {
        "scenario": scenario_id,
        "responses": responses,
    }


# ============ 系统 API ============

@router.get("/system/status")
async def get_system_status():
    """获取系统状态"""
    return {
        "llm_available": llm_service.is_available(),
        "meeting_active": orchestrator.meeting_active,
        "agents_count": len(orchestrator.agents),
    }
