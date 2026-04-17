from app.agents.base import AgentProfile, BaseAgent
from app.services.llm import LLMService


class DeveloperAgent(BaseAgent):
    def __init__(self, llm: LLMService) -> None:
        super().__init__(
            AgentProfile(
                id="developer-1",
                name="Cody",
                role="developer",
                personality={
                    "openness": 0.6,
                    "conscientiousness": 0.85,
                    "extraversion": 0.4,
                    "agreeableness": 0.7,
                    "neuroticism": 0.35,
                },
                expertise=["system", "performance", "engineering"],
            ),
            llm,
        )
