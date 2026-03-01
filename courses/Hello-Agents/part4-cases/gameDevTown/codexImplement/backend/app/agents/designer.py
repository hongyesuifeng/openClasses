from app.agents.base import AgentProfile, BaseAgent
from app.services.llm import LLMService


class DesignerAgent(BaseAgent):
    def __init__(self, llm: LLMService) -> None:
        super().__init__(
            AgentProfile(
                id="designer-1",
                name="Diana",
                role="designer",
                personality={
                    "openness": 0.95,
                    "conscientiousness": 0.75,
                    "extraversion": 0.6,
                    "agreeableness": 0.7,
                    "neuroticism": 0.4,
                },
                expertise=["gameplay", "balance", "narrative"],
            ),
            llm,
        )
