"""
赛博小镇 - 主程序入口
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import threading
import time

from agent.character import Character, create_default_characters
from agent.behavior import BehaviorSystem, DecisionSystem
from world.time import World
from social.communication import SocialNetwork, CommunicationSystem
from llm.minimax import LLMClient, create_llm_client


app = FastAPI(title="赛博小镇 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GameState:
    """游戏状态"""
    
    def __init__(self):
        self.characters: Dict[str, Character] = {}
        self.world = World()
        self.social_network = SocialNetwork()
        self.llm_client = LLMClient()
        self.behavior_system = BehaviorSystem(self.llm_client)
        self.decision_system = DecisionSystem(self.llm_client)
        self.communication = CommunicationSystem(self.llm_client)
        self.is_running = False
        self.tick_count = 0
        
        self._init_characters()
    
    def _init_characters(self) -> None:
        """初始化角色"""
        default_chars = create_default_characters()
        for char in default_chars:
            self.characters[char.id] = char
            
            loc = self.world.get_location(char.current_location)
            if loc:
                loc.add_visitor(char.id)
    
    def tick(self, delta_time: float = 1.0) -> Dict[str, Any]:
        """游戏 tick"""
        self.tick_count += 1
        
        self.world.time_system.update(delta_time)
        
        for char in list(self.characters.values()):
            if char.current_location:
                old_loc = self.world.get_location(char.current_location)
                if old_loc:
                    old_loc.remove_visitor(char.id)
            
            action = self.decision_system.make_decision(char, self.world)
            self._execute_action(char, action)
            
            if char.current_location:
                new_loc = self.world.get_location(char.current_location)
                if new_loc:
                    new_loc.add_visitor(char.id)
            
            self._decay_memories(char)
        
        return self.get_state()
    
    def _execute_action(self, character: Character, action) -> None:
        """执行行动"""
        character.current_action = action.description
        
        if action.type == "move":
            target = action.target
            old_loc = character.current_location
            character.current_location = target
            
            if old_loc != target:
                event = self.world.event_system.create_movement_event(
                    character.name, old_loc, target
                )
                self.world.event_system.add_event(event)
        
        elif action.type == "eat":
            character.hunger = max(0, character.hunger - 0.5)
            character.energy = min(1.0, character.energy + 0.1)
            character.add_memory(f"在{character.current_location}吃了东西", 0.4, 0.2)
        
        elif action.type == "rest":
            character.energy = min(1.0, character.energy + 0.3)
            character.add_memory(f"在{character.current_location}休息", 0.3, 0.1)
        
        elif action.type == "talk" or action.type == "interact":
            target_id = action.target
            target_char = self.characters.get(target_id)
            if target_char:
                conversation = self.communication.generate_conversation(
                    character.name,
                    character.personality.description,
                    character.mood,
                    target_char.name,
                    f"在{character.current_location}相遇"
                )
                
                event = self.world.event_system.create_conversation_event(
                    character.name, target_char.name,
                    character.current_location
                )
                self.world.event_system.add_event(event)
                
                self.social_network.update_relationship(
                    character.id, target_char.id, "friendly_conversation"
                )
                
                character.social = max(0, character.social - 0.2)
                character.mood = min(1.0, character.mood + 0.1)
                character.add_memory(
                    f"和{target_char.name}交谈", 0.6, 0.3
                )
        
        elif action.type == "gossip":
            event = self.world.event_system.create_gossip_event(
                character.name, "某件事", character.current_location
            )
            self.world.event_system.add_event(event)
            character.add_memory(f"在{character.current_location}谈论八卦", 0.3, 0.1)
    
    def _decay_memories(self, character: Character) -> None:
        """记忆衰减"""
        hours_passed = 0.1
        for memory in character.memories:
            memory.decay(hours_passed)
        
        character.memories = [m for m in character.memories if m.importance > 0.05]
    
    def get_state(self) -> Dict[str, Any]:
        """获取游戏状态"""
        return {
            "is_running": self.is_running,
            "tick_count": self.tick_count,
            "world": self.world.to_dict(),
            "characters": {cid: char.to_dict() for cid, char in self.characters.items()},
            "social": self.social_network.to_dict(),
            "llm_configured": self.llm_client.is_configured()
        }
    
    def update_llm_config(self, provider: str, api_key: str, model: str) -> None:
        """更新 LLM 配置"""
        self.llm_client.update_config(provider, api_key, model)
        self.behavior_system.llm_client = self.llm_client
        self.decision_system.llm_client = self.llm_client
        self.communication.llm_client = self.llm_client
    
    def start(self) -> None:
        """开始游戏"""
        self.is_running = True
    
    def stop(self) -> None:
        """暂停游戏"""
        self.is_running = False


game_state = GameState()


class ConfigRequest(BaseModel):
    provider: str
    api_key: str
    model: str


class ChatRequest(BaseModel):
    character_id: str
    message: str


@app.get("/")
async def root():
    return {"message": "欢迎来到赛博小镇 API"}


@app.get("/api/config")
async def get_config():
    return game_state.llm_client.to_dict()


@app.post("/api/config")
async def set_config(config: ConfigRequest):
    print(f"[DEBUG] set_config called: provider={config.provider}, api_key={'*'*8}{config.api_key[-4:] if config.api_key else ''}, model={config.model}")
    game_state.update_llm_config(config.provider, config.api_key, config.model)
    print(f"[DEBUG] after update_llm_config, is_configured: {game_state.llm_client.is_configured()}")
    return {"success": True, "message": "配置已更新"}


@app.get("/api/test-connection")
async def test_connection():
    print(f"[DEBUG] test_connection called, is_configured: {game_state.llm_client.is_configured()}, api_key: {'*'*8}{game_state.llm_client.api_key[-4:] if game_state.llm_client.api_key else ''}")
    return game_state.llm_client.test_connection()


@app.get("/api/world")
async def get_world():
    return game_state.get_state()


@app.get("/api/characters")
async def get_characters():
    return {
        "characters": {cid: char.to_dict() for cid, char in game_state.characters.items()}
    }


@app.get("/api/character/{character_id}")
async def get_character(character_id: str):
    char = game_state.characters.get(character_id)
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")
    return char.to_dict()


@app.get("/api/locations")
async def get_locations():
    return {
        "locations": {name: loc.to_dict() for name, loc in game_state.world.locations.items()}
    }


@app.get("/api/events")
async def get_events():
    return game_state.world.event_system.to_dict()


@app.post("/api/tick")
async def tick():
    result = game_state.tick()
    return result


@app.post("/api/start")
async def start_game():
    game_state.start()
    return {"success": True, "message": "游戏已开始"}


@app.post("/api/stop")
async def stop_game():
    game_state.stop()
    return {"success": True, "message": "游戏已暂停"}


@app.post("/api/chat")
async def send_chat(chat: ChatRequest):
    char = game_state.characters.get(chat.character_id)
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")
    
    response = game_state.communication.generate_conversation(
        char.name,
        char.personality.description,
        char.mood,
        "玩家",
        chat.message
    )
    
    return {
        "character_id": char.id,
        "character_name": char.name,
        "response": response
    }


@app.get("/api/social/{character_id}")
async def get_social_circle(character_id: str):
    return {
        "social_circle": game_state.social_network.get_social_circle(character_id)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9091)
