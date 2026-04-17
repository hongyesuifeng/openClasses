"""
社交系统 - 关系网络和对话系统
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


class Relationship:
    """关系类"""
    
    def __init__(self, from_id: str, to_id: str):
        self.from_id = from_id
        self.to_id = to_id
        self.intimacy = 0.2
        self.trust = 0.2
        self.respect = 0.2
        self.attraction = 0.0
        self.interaction_history: List[Dict[str, Any]] = []
        self.last_interaction = datetime.now()
    
    def update(
        self,
        intimacy_delta: float = 0,
        trust_delta: float = 0,
        respect_delta: float = 0,
        attraction_delta: float = 0,
        interaction_type: str = ""
    ) -> None:
        """更新关系"""
        self.intimacy = max(0, min(1, self.intimacy + intimacy_delta))
        self.trust = max(0, min(1, self.trust + trust_delta))
        self.respect = max(0, min(1, self.respect + respect_delta))
        self.attraction = max(0, min(1, self.attraction + attraction_delta))
        
        self.interaction_history.append({
            "type": interaction_type,
            "timestamp": datetime.now().isoformat(),
            "intimacy": self.intimacy,
            "trust": self.trust
        })
        
        if len(self.interaction_history) > 20:
            self.interaction_history = self.interaction_history[-20:]
        
        self.last_interaction = datetime.now()
    
    def get_level(self) -> str:
        """获取关系等级"""
        avg = (self.intimacy + self.trust + self.respect) / 3
        if avg >= 0.8:
            return "挚友"
        elif avg >= 0.6:
            return "好友"
        elif avg >= 0.4:
            return "熟人"
        elif avg >= 0.2:
            return "认识"
        else:
            return "陌生人"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_id": self.from_id,
            "to_id": self.to_id,
            "intimacy": round(self.intimacy, 2),
            "trust": round(self.trust, 2),
            "respect": round(self.respect, 2),
            "attraction": round(self.attraction, 2),
            "level": self.get_level(),
            "last_interaction": self.last_interaction.isoformat()
        }


class SocialNetwork:
    """社交网络"""
    
    def __init__(self):
        self.relationships: Dict[str, Relationship] = {}
    
    def _get_key(self, id1: str, id2: str) -> str:
        """获取关系键"""
        ids = sorted([id1, id2])
        return f"{ids[0]}_{ids[1]}"
    
    def get_relationship(self, id1: str, id2: str) -> Relationship:
        """获取关系"""
        key = self._get_key(id1, id2)
        
        if key not in self.relationships:
            self.relationships[key] = Relationship(id1, id2)
        
        return self.relationships[key]
    
    def update_relationship(
        self,
        id1: str,
        id2: str,
        interaction_type: str
    ) -> None:
        """根据互动类型更新关系"""
        rel = self.get_relationship(id1, id2)
        
        if interaction_type == "friendly_conversation":
            rel.update(intimacy_delta=0.1, trust_delta=0.05, interaction_type=interaction_type)
        elif interaction_type == "help":
            rel.update(trust_delta=0.15, respect_delta=0.1, interaction_type=interaction_type)
        elif interaction_type == "conflict":
            rel.update(intimacy_delta=-0.1, trust_delta=-0.15, respect_delta=-0.1, interaction_type=interaction_type)
        elif interaction_type == "gossip":
            rel.update(trust_delta=-0.1, interaction_type=interaction_type)
        elif interaction_type == "greet":
            rel.update(intimacy_delta=0.05, interaction_type=interaction_type)
        elif interaction_type == "trade":
            rel.update(trust_delta=0.1, respect_delta=0.05, interaction_type=interaction_type)
    
    def get_social_circle(self, character_id: str) -> List[Dict[str, Any]]:
        """获取社交圈"""
        circle = []
        
        for key, rel in self.relationships.items():
            if rel.from_id == character_id:
                circle.append({
                    "character_id": rel.to_id,
                    "relationship": rel.to_dict()
                })
            elif rel.to_id == character_id:
                circle.append({
                    "character_id": rel.from_id,
                    "relationship": rel.to_dict()
                })
        
        circle.sort(key=lambda x: x["relationship"]["intimacy"], reverse=True)
        return circle
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_relationships": len(self.relationships),
            "relationships": {
                key: rel.to_dict()
                for key, rel in self.relationships.items()
            }
        }


class CommunicationSystem:
    """通信系统 - 处理角色间对话"""
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client
    
    def generate_greeting(
        self,
        speaker_name: str,
        speaker_personality: str,
        target_name: str,
        location: str
    ) -> str:
        """生成问候语"""
        if self.llm_client and self.llm_client.is_configured():
            system_prompt = f"""你是一个叫{speaker_name}的角色。
性格: {speaker_personality}
请用符合你性格的方式说一句简短的问候语。"""
            
            messages = [{"role": "user", "content": f"你在{location}遇到了{target_name}，请打个招呼"}]
            
            try:
                response = self.llm_client.chat(messages, system_prompt, max_tokens=100)
                if not response.startswith("Error"):
                    return response
            except Exception:
                pass
        
        greetings = [
            f"你好啊，{target_name}！",
            f"嘿，{target_name}，最近怎么样？",
            f"哟，{target_name}！",
            f"嗨，{target_name}，真巧在这里遇见你！",
            f"{target_name}，你好！"
        ]
        
        import random
        return random.choice(greetings)
    
    def generate_conversation(
        self,
        speaker_name: str,
        speaker_personality: str,
        speaker_mood: float,
        target_name: str,
        context: str,
        conversation_history: Optional[List[str]] = None
    ) -> str:
        """生成对话内容"""
        if self.llm_client and self.llm_client.is_configured():
            mood_desc = "开心" if speaker_mood > 0.3 else "平静" if speaker_mood > -0.3 else "低落"
            
            system_prompt = f"""你是一个叫{speaker_name}的角色。
性格: {speaker_personality}
当前情绪: {mood_desc}

请根据对话历史，用符合角色性格的方式回复。
保持对话自然、简短（1-2句话）。"""
            
            history_text = ""
            if conversation_history:
                history_text = "对话历史:\n" + "\n".join(conversation_history[-4:])
            
            user_content = f"""当前情况: {context}
{history_text}
请回复 {target_name}。"""
            
            messages = [{"role": "user", "content": user_content}]
            
            try:
                response = self.llm_client.chat(messages, system_prompt, max_tokens=100)
                if not response.startswith("Error"):
                    return response
            except Exception:
                pass
        
        responses = [
            "今天的天气真不错啊。",
            "你最近在忙什么呢？",
            "这家店的东西挺好的。",
            "对了，你听说了吗？",
            "那件事真是太有意思了。"
        ]
        
        import random
        return random.choice(responses)
    
    def generate_gossip(
        self,
        speaker_name: str,
        speaker_personality: str,
        subject: str
    ) -> str:
        """生成传闻"""
        if self.llm_client and self.llm_client.is_configured():
            system_prompt = f"""你是一个叫{speaker_name}的角色。
性格: {speaker_personality}

请说一句简短的传闻或八卦。"""
            
            messages = [{"role": "user", "content": f"你想谈论关于{subject}的事情"}]
            
            try:
                response = self.llm_client.chat(messages, system_prompt, max_tokens=50)
                if not response.startswith("Error"):
                    return response
            except Exception:
                pass
        
        gossips = [
            f"我听说 {subject} 最近...",
            f"有人告诉我关于 {subject} 的事...",
            f"你们知道 {subject} 吗？",
            f"我跟你们说啊，{subject}..."
        ]
        
        import random
        return random.choice(gossips)
