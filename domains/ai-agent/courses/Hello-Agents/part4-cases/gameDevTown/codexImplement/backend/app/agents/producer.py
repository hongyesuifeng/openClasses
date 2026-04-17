from app.agents.base import AgentProfile, BaseAgent
from app.services.llm import LLMService


class ProducerAgent(BaseAgent):
    def __init__(self, llm: LLMService) -> None:
        super().__init__(
            AgentProfile(
                id="producer-1",
                name="Alex",
                role="producer",
                personality={
                    "openness": 0.7,
                    "conscientiousness": 0.9,
                    "extraversion": 0.8,
                    "agreeableness": 0.65,
                    "neuroticism": 0.3,
                },
                expertise=["planning", "risk", "resource"],
            ),
            llm,
        )
