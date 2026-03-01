"""
行为系统 - Agent 行为决策
"""

from typing import List, Dict, Any, Optional
import random
from agent.character import Character
from world.time import World


class Action:
    """行动类"""
    
    def __init__(self, action_type: str, target: str = "", description: str = ""):
        self.type = action_type
        self.target = target
        self.description = description or f"执行 {action_type}"
    
    def to_dict(self) -> Dict[str, str]:
        return {
            "type": self.type,
            "target": self.target,
            "description": self.description
        }


class BehaviorSystem:
    """行为系统"""
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client
    
    def decide_action(self, character: Character, world: World) -> Action:
        """决定下一步行动"""
        character.update_needs()
        
        dominant_need = character.get_dominant_need()
        
        if character.goals:
            goal = character.goals[0]
            if goal.importance > 0.7:
                return self._plan_goal_action(character, world, goal)
        
        if dominant_need == 'hunger' and character.hunger > 0.7:
            return self._handle_hunger(character, world)
        
        if dominant_need == 'energy' and character.energy < 0.3:
            return self._handle_energy(character, world)
        
        if dominant_need == 'social' and character.social > 0.6:
            return self._handle_social(character, world)
        
        nearby_characters = world.get_characters_at_location(character.current_location)
        nearby_characters = [c for c in nearby_characters if c != character.id]
        
        if nearby_characters and random.random() < 0.4:
            return Action(
                action_type="interact",
                target=random.choice(nearby_characters),
                description=f"与 nearby_characters[0] 交流"
            )
        
        return self._explore(character, world)
    
    def _handle_hunger(self, character: Character, world: World) -> Action:
        """处理饥饿需求"""
        food_locations = ["咖啡馆", "商店", "住宅"]
        available = [loc for loc in food_locations if world.get_location(loc)]
        
        if available:
            target = random.choice(available)
            if target != character.current_location:
                return Action(
                    action_type="move",
                    target=target,
                    description=f"去 {target} 吃东西"
                )
            else:
                return Action(
                    action_type="eat",
                    description="在当前位置进食"
                )
        
        return Action(action_type="wait", description="等待食物")
    
    def _handle_energy(self, character: Character, world: World) -> Action:
        """处理能量需求"""
        rest_locations = ["住宅", "公园"]
        available = [loc for loc in rest_locations if world.get_location(loc)]
        
        if available:
            target = random.choice(available)
            if target != character.current_location:
                return Action(
                    action_type="move",
                    target=target,
                    description=f"去 {target} 休息"
                )
            else:
                return Action(
                    action_type="rest",
                    description="在当前位置休息"
                )
        
        return Action(action_type="wait", description="找个地方休息")
    
    def _handle_social(self, character: Character, world: World) -> Action:
        """处理社交需求"""
        social_locations = ["酒馆", "咖啡馆", "公园"]
        available = [loc for loc in social_locations if world.get_location(loc)]
        
        if available:
            target = random.choice(available)
            if target != character.current_location:
                return Action(
                    action_type="move",
                    target=target,
                    description=f"去 {target} 找人聊天"
                )
            else:
                nearby = world.get_characters_at_location(character.current_location)
                other_chars = [c for c in nearby if c != character.id]
                if other_chars:
                    return Action(
                        action_type="talk",
                        target=random.choice(other_chars),
                        description="与附近的人聊天"
                    )
        
        return Action(action_type="wait", description="寻找社交机会")
    
    def _plan_goal_action(self, character: Character, world: World, goal) -> Action:
        """规划目标行动"""
        if "去" in goal.description or "拜访" in goal.description:
            for loc_name in world.locations:
                if loc_name in goal.description:
                    return Action(
                        action_type="move",
                        target=loc_name,
                        description=goal.description
                    )
        
        return Action(action_type="wait", description="继续目标")
    
    def _explore(self, character: Character, world: World) -> Action:
        """探索行为"""
        locations = list(world.locations.keys())
        
        if not locations:
            return Action(action_type="wait", description="无处可去")
        
        current = character.current_location
        other_locations = [loc for loc in locations if loc != current]
        
        if not other_locations:
            return Action(action_type="wait", description="留在当前地点")
        
        if random.random() < 0.3:
            target = random.choice(other_locations)
            return Action(
                action_type="move",
                target=target,
                description=f"去 {target} 看看"
            )
        
        return Action(action_type="observe", description="观察周围")


class DecisionSystem:
    """决策系统 - 使用 LLM 进行更智能的决策"""
    
    def __init__(self, llm_client=None):
        self.llm_client = llm_client
        self.behavior = BehaviorSystem(llm_client)
    
    def make_decision(self, character: Character, world: World) -> Action:
        """做出决策"""
        if self.llm_client and random.random() < 0.5:
            try:
                return self._llm_decide(character, world)
            except Exception:
                pass
        
        return self.behavior.decide_action(character, world)
    
    def _llm_decide(self, character: Character, world: World) -> Action:
        """使用 LLM 决策"""
        context = self._build_context(character, world)
        
        system_prompt = f"""你是一个虚拟角色的决策助手。
角色信息:
- 名字: {character.name}
- 性格: {character.personality.description}
- 当前情绪: {character.mood_emoji} ({character.mood:.2f})
- 能量: {character.energy:.2f}
- 饥饿: {character.hunger:.2f}
- 社交需求: {character.social:.2f}
- 当前位置: {character.current_location}

当前世界状态:
{context}

请选择一个行动。选项: move, eat, rest, talk, wait, observe, gossip

返回格式: action:行动名:目标(可选):描述"""
        
        messages = [{"role": "user", "content": "请为这个角色决定下一步行动"}]
        
        try:
            response = self.llm_client.chat(messages, system_prompt)
            
            if "move:" in response:
                parts = response.split(":")
                if len(parts) >= 2:
                    return Action(
                        action_type="move",
                        target=parts[1].strip(),
                        description=response
                    )
            
            if "talk:" in response:
                return Action(action_type="talk", description=response)
            
            if "eat:" in response:
                return Action(action_type="eat", description=response)
            
            if "rest:" in response:
                return Action(action_type="rest", description=response)
            
            if "gossip:" in response:
                return Action(action_type="gossip", description=response)
            
            if "observe:" in response:
                return Action(action_type="observe", description=response)
            
        except Exception:
            pass
        
        return self.behavior.decide_action(character, world)
    
    def _build_context(self, character: Character, world: World) -> str:
        """构建上下文"""
        time_info = world.time_system.get_time_display()
        location_info = character.current_location
        
        nearby = world.get_characters_at_location(character.current_location)
        nearby_names = [c for c in nearby if c != character.id]
        
        nearby_text = ", ".join(nearby_names) if nearby_names else "无"
        
        return f"""
时间: {time_info} ({world.time_system.get_time_of_day()})
地点: {location_info}
附近的人: {nearby_text}
"""
