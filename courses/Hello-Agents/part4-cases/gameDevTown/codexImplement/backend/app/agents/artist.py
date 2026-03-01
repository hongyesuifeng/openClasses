from app.agents.base import AgentProfile, BaseAgent
from app.services.llm import LLMService


class ArtistAgent(BaseAgent):
    def __init__(self, llm: LLMService) -> None:
        super().__init__(
            AgentProfile(
                id="artist-1",
                name="Arty",
                role="artist",
                personality={
                    "openness": 0.9,
                    "conscientiousness": 0.7,
                    "extraversion": 0.55,
                    "agreeableness": 0.8,
                    "neuroticism": 0.45,
                },
                expertise=["visual", "vfx", "ux"],
            ),
            llm,
        )
