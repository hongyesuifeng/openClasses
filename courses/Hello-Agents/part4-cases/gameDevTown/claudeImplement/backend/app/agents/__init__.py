"""
Game Dev Town - Agents Module
"""
from app.agents.base import BaseAgent, AgentState
from app.agents.producer import ProducerAgent
from app.agents.developer import DeveloperAgent
from app.agents.designer import DesignerAgent
from app.agents.artist import ArtistAgent

__all__ = [
    "BaseAgent",
    "AgentState",
    "ProducerAgent",
    "DeveloperAgent",
    "DesignerAgent",
    "ArtistAgent",
]


def create_agent(role_id: str, llm_service=None):
    """工厂函数：创建 Agent 实例"""
    agents = {
        "producer": ProducerAgent,
        "developer": DeveloperAgent,
        "designer": DesignerAgent,
        "artist": ArtistAgent,
    }

    agent_class = agents.get(role_id)
    if agent_class:
        return agent_class(llm_service)

    raise ValueError(f"Unknown agent role: {role_id}")
