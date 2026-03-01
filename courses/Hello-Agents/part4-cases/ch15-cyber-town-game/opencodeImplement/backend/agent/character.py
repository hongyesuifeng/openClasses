"""
角色类 - Agent 的核心实现
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid


class Personality:
    """性格类 - 基于大五人格模型"""
    
    def __init__(
        self,
        openness: float = 0.5,
        conscientiousness: float = 0.5,
        extraversion: float = 0.5,
        agreeableness: float = 0.5,
        neuroticism: float = 0.5
    ):
        self.openness = max(0, min(1, openness))
        self.conscientiousness = max(0, min(1, conscientiousness))
        self.extraversion = max(0, min(1, extraversion))
        self.agreeableness = max(0, min(1, agreeableness))
        self.neuroticism = max(0, min(1, neuroticism))
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "openness": self.openness,
            "conscientiousness": self.conscientiousness,
            "extraversion": self.extraversion,
            "agreeableness": self.agreeableness,
            "neuroticism": self.neuroticism
        }
    
    @property
    def description(self) -> str:
        traits = []
        if self.extraversion > 0.7:
            traits.append("外向")
        elif self.extraversion < 0.3:
            traits.append("内向")
        if self.agreeableness > 0.7:
            traits.append("友好")
        elif self.agreeableness < 0.3:
            traits.append("冷漠")
        if self.conscientiousness > 0.7:
            traits.append("勤奋")
        elif self.conscientiousness < 0.3:
            traits.append("懒散")
        if self.openness > 0.7:
            traits.append("开放")
        elif self.openness < 0.3:
            traits.append("保守")
        return "、".join(traits) if traits else "普通"


class Memory:
    """记忆类"""
    
    def __init__(self, event: str, importance: float = 0.5):
        self.id = str(uuid.uuid4())
        self.event = event
        self.importance = max(0, min(1, importance))
        self.timestamp = datetime.now()
        self.emotional_impact = 0.0
        self.access_count = 0
        self.associations: List[str] = []
    
    def decay(self, hours_passed: float, decay_rate: float = 24.0) -> None:
        """记忆衰减"""
        import math
        factor = math.exp(-hours_passed / decay_rate)
        if self.emotional_impact > 0.7 or self.importance > 0.8:
            factor *= 1.5
        self.importance = max(0, self.importance * factor)
    
    def strengthen(self) -> None:
        """加强记忆"""
        self.importance = min(1.0, self.importance + 0.1)
        self.access_count += 1
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event": self.event,
            "importance": round(self.importance, 2),
            "timestamp": self.timestamp.isoformat(),
            "emotional_impact": self.emotional_impact,
            "access_count": self.access_count
        }


class Goal:
    """目标类"""
    
    def __init__(self, description: str, importance: float = 0.5, duration: int = 10):
        self.id = str(uuid.uuid4())
        self.description = description
        self.importance = max(0, min(1, importance))
        self.duration = duration
        self.progress = 0
        self.created_at = datetime.now()
        self.completed = False
    
    def update(self, amount: int = 1) -> bool:
        """更新目标进度"""
        self.progress += amount
        if self.progress >= self.duration:
            self.completed = True
        return self.completed
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "description": self.description,
            "importance": self.importance,
            "progress": self.progress,
            "duration": self.duration,
            "completed": self.completed
        }


class Character:
    """
    角色类 - Agent 的核心实现
    
    包含:
    - 基础属性
    - 状态属性
    - 记忆系统
    - 目标系统
    """
    
    def __init__(
        self,
        name: str,
        age: int,
        personality: Optional[Personality] = None,
        occupation: str = "居民",
        bio: str = ""
    ):
        self.id = str(uuid.uuid4())[:8]
        self.name = name
        self.age = age
        self.occupation = occupation
        self.bio = bio
        self.personality = personality or Personality()
        
        self.current_location = "公园"
        
        self.mood = 0.0
        self.energy = 1.0
        self.hunger = 0.0
        self.social = 0.3
        
        self.reputation = 0.5
        
        self.memories: List[Memory] = []
        self.goals: List[Goal] = []
        self.relationships: Dict[str, Dict[str, float]] = {}
        
        self.current_action = ""
        self.last_action_time = datetime.now()
    
    def add_memory(self, event: str, importance: float = 0.5, emotional_impact: float = 0.0) -> Memory:
        """添加记忆"""
        memory = Memory(event, importance)
        memory.emotional_impact = emotional_impact
        self.memories.append(memory)
        
        if len(self.memories) > 100:
            self.memories.sort(key=lambda m: m.importance, reverse=True)
            self.memories = self.memories[:100]
        
        return memory
    
    def get_relevant_memories(self, query: str, top_k: int = 5) -> List[Memory]:
        """检索相关记忆"""
        if not self.memories:
            return []
        
        now = datetime.now()
        scored_memories = []
        
        for memory in self.memories:
            memory.access_count += 1
            
            query_words = set(query.lower().split())
            event_words = set(memory.event.lower().split())
            keyword_score = len(query_words & event_words) / max(len(query_words), 1)
            
            hours_passed = (now - memory.timestamp).total_seconds() / 3600
            time_score = max(0, 1 - hours_passed / 72)
            
            importance_score = memory.importance
            
            emotion_score = abs(memory.emotional_impact - self.mood) / 2
            
            access_score = min(memory.access_count / 10, 1.0)
            
            total_score = (
                0.3 * keyword_score +
                0.2 * time_score +
                0.3 * importance_score +
                0.1 * (1 - emotion_score) +
                0.1 * access_score
            )
            
            scored_memories.append((memory, total_score))
        
        scored_memories.sort(key=lambda x: x[1], reverse=True)
        return [m for m, s in scored_memories[:top_k]]
    
    def update_needs(self, delta_time: float = 1.0) -> None:
        """更新需求"""
        self.hunger = min(1.0, self.hunger + 0.01 * delta_time)
        self.energy = max(0.0, self.energy - 0.005 * delta_time)
        
        if self.current_location:
            pass
    
    def add_goal(self, description: str, importance: float = 0.5, duration: int = 10) -> Goal:
        """添加目标"""
        goal = Goal(description, importance, duration)
        self.goals.append(goal)
        return goal
    
    def complete_goal(self, goal_id: str) -> None:
        """完成目标"""
        for goal in self.goals:
            if goal.id == goal_id:
                goal.completed = True
                break
        self.goals = [g for g in self.goals if not g.completed]
    
    def get_dominant_need(self) -> str:
        """获取最强烈的需求"""
        needs = {
            "hunger": self.hunger,
            "energy": 1 - self.energy,
            "social": self.social
        }
        return max(needs.items(), key=lambda x: x[1])[0]
    
    @property
    def mood_emoji(self) -> str:
        if self.mood > 0.5:
            return "😊"
        elif self.mood > 0:
            return "🙂"
        elif self.mood > -0.5:
            return "😐"
        else:
            return "😔"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "occupation": self.occupation,
            "bio": self.bio,
            "personality": self.personality.to_dict(),
            "current_location": self.current_location,
            "mood": round(self.mood, 2),
            "mood_emoji": self.mood_emoji,
            "energy": round(self.energy, 2),
            "hunger": round(self.hunger, 2),
            "social": round(self.social, 2),
            "reputation": round(self.reputation, 2),
            "current_action": self.current_action,
            "goals": [g.to_dict() for g in self.goals],
            "relationships": self.relationships
        }


def create_default_characters() -> List[Character]:
    """创建默认角色"""
    characters = [
        Character(
            name="杰克",
            age=35,
            personality=Personality(extraversion=0.8, agreeableness=0.7, openness=0.6),
            occupation="酒馆老板",
            bio="热情好客，喜欢和客人聊天"
        ),
        Character(
            name="玛丽",
            age=28,
            personality=Personality(extraversion=0.6, agreeableness=0.8, neuroticism=0.4),
            occupation="咖啡馆服务员",
            bio="温柔善良，喜欢小动物"
        ),
        Character(
            name="汤姆",
            age=45,
            personality=Personality(conscientiousness=0.8, extraversion=0.3, openness=0.4),
            occupation="商店老板",
            bio="精打细算，为人谨慎"
        ),
        Character(
            name="莎拉",
            age=25,
            personality=Personality(openness=0.9, extraversion=0.7, neuroticism=0.3),
            occupation="艺术家",
            bio="自由奔放，热爱创作"
        ),
        Character(
            name="艾伦",
            age=30,
            personality=Personality(conscientiousness=0.6, agreeableness=0.5, neuroticism=0.6),
            occupation="公园园丁",
            bio="沉默寡言，但工作认真"
        )
    ]
    return characters
