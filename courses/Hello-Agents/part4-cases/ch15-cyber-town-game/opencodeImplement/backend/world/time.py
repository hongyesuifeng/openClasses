"""
世界系统 - 时间、地点、事件管理
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random


class Location:
    """地点类"""
    
    def __init__(self, name: str, location_type: str = "general", capacity: int = 10, description: str = ""):
        self.name = name
        self.type = location_type
        self.capacity = capacity
        self.description = description
        self.current_visitors: List[str] = []
        self.amenities: List[str] = self._get_amenities()
    
    def _get_amenities(self) -> List[str]:
        if self.type == "social":
            return ["drink", "social"]
        elif self.type == "food":
            return ["food", "drink", "social"]
        elif self.type == "relax":
            return ["rest", "social"]
        elif self.type == "shop":
            return ["trade"]
        elif self.type == "home":
            return ["rest", "food"]
        return []
    
    def can_accommodate(self) -> bool:
        return len(self.current_visitors) < self.capacity
    
    def add_visitor(self, character_id: str) -> bool:
        if self.can_accommodate():
            self.current_visitors.append(character_id)
            return True
        return False
    
    def remove_visitor(self, character_id: str) -> bool:
        if character_id in self.current_visitors:
            self.current_visitors.remove(character_id)
            return True
        return False
    
    def get_social_opportunity(self) -> float:
        if self.capacity == 0:
            return 0
        return len(self.current_visitors) / self.capacity
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "type": self.type,
            "capacity": self.capacity,
            "current_visitors": self.current_visitors,
            "visitor_count": len(self.current_visitors),
            "amenities": self.amenities,
            "social_opportunity": round(self.get_social_opportunity(), 2)
        }


class TimeSystem:
    """时间系统"""
    
    def __init__(self, start_hour: int = 8):
        self.start_time = datetime.now().replace(hour=start_hour, minute=0, second=0, microsecond=0)
        self.current_time = self.start_time
        self.time_scale = 60
        self.is_running = False
    
    def update(self, delta_seconds: float) -> None:
        """更新游戏时间"""
        game_minutes = (delta_seconds * self.time_scale) / 60
        self.current_time += timedelta(minutes=game_minutes)
    
    def get_time_of_day(self) -> str:
        """获取时段"""
        hour = self.current_time.hour
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 18:
            return "afternoon"
        elif 18 <= hour < 22:
            return "evening"
        else:
            return "night"
    
    def get_time_display(self) -> str:
        """获取时间显示"""
        return self.current_time.strftime("%H:%M")
    
    def is_business_hour(self) -> bool:
        """是否营业时间"""
        hour = self.current_time.hour
        return 9 <= hour < 18
    
    def is_sleep_time(self) -> bool:
        """是否睡眠时间"""
        hour = self.current_time.hour
        return 22 <= hour or hour < 6
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_time": self.get_time_display(),
            "time_of_day": self.get_time_of_day(),
            "is_business_hour": self.is_business_hour(),
            "is_sleep_time": self.is_sleep_time(),
            "date": self.current_time.strftime("%Y-%m-%d")
        }


class Event:
    """事件类"""
    
    def __init__(
        self,
        event_type: str,
        description: str,
        participants: List[str],
        location: str,
        impact: Optional[Dict[str, float]] = None
    ):
        self.id = f"event_{datetime.now().timestamp()}"
        self.type = event_type
        self.description = description
        self.participants = participants
        self.location = location
        self.timestamp = datetime.now()
        self.impact = impact or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "description": self.description,
            "participants": self.participants,
            "location": self.location,
            "timestamp": self.timestamp.strftime("%H:%M"),
            "impact": self.impact
        }


class EventSystem:
    """事件系统"""
    
    def __init__(self):
        self.events: List[Event] = []
        self.max_events = 50
    
    def add_event(self, event: Event) -> None:
        """添加事件"""
        self.events.append(event)
        if len(self.events) > self.max_events:
            self.events = self.events[-self.max_events:]
    
    def create_conversation_event(self, char1: str, char2: str, location: str, topic: str = "") -> Event:
        """创建对话事件"""
        description = f"{char1} 和 {char2} 在 {location} 交谈"
        if topic:
            description += f"关于 {topic}"
        return Event(
            event_type="conversation",
            description=description,
            participants=[char1, char2],
            location=location,
            impact={"social": 0.1, "intimacy": 0.05}
        )
    
    def create_movement_event(self, character: str, from_loc: str, to_loc: str) -> Event:
        """创建移动事件"""
        return Event(
            event_type="movement",
            description=f"{character} 从 {from_loc} 移动到 {to_loc}",
            participants=[character],
            location=to_loc
        )
    
    def create_gossip_event(self, speaker: str, subject: str, location: str) -> Event:
        """创建传闻事件"""
        return Event(
            event_type="gossip",
            description=f"{speaker} 在 {location} 谈论 {subject}",
            participants=[speaker],
            location=location,
            impact={"reputation": 0.05}
        )
    
    def get_recent_events(self, count: int = 10) -> List[Event]:
        """获取最近事件"""
        return self.events[-count:]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "events": [e.to_dict() for e in self.get_recent_events(20)]
        }


class World:
    """世界类 - 整合所有世界系统"""
    
    def __init__(self):
        self.time_system = TimeSystem()
        self.locations: Dict[str, Location] = {}
        self.event_system = EventSystem()
        self._init_locations()
    
    def _init_locations(self) -> None:
        """初始化地点"""
        location_configs = [
            {"name": "酒馆", "location_type": "social", "capacity": 10, "description": "小镇的社交中心"},
            {"name": "咖啡馆", "location_type": "food", "capacity": 8, "description": "休闲放松的好去处"},
            {"name": "公园", "location_type": "relax", "capacity": 15, "description": "宁静的绿色空间"},
            {"name": "商店", "location_type": "shop", "capacity": 5, "description": "买卖交易的地方"},
            {"name": "住宅", "location_type": "home", "capacity": 3, "description": "休息的住所"}
        ]
        
        for config in location_configs:
            self.locations[config["name"]] = Location(**config)
    
    def get_location(self, name: str) -> Optional[Location]:
        return self.locations.get(name)
    
    def get_characters_at_location(self, location_name: str) -> List[str]:
        loc = self.locations.get(location_name)
        return loc.current_visitors if loc else []
    
    def get_available_actions(self, character_id: str, location_name: str) -> List[str]:
        """获取当前位置可用的行动"""
        loc = self.locations.get(location_name)
        if not loc:
            return ["move"]
        
        actions = ["move", "wait"]
        
        if "food" in loc.amenities and random.random() < 0.3:
            actions.append("eat")
        if "rest" in loc.amenities and random.random() < 0.2:
            actions.append("rest")
        if "social" in loc.amenities:
            if loc.get_social_opportunity() > 0.1:
                actions.append("talk")
            if random.random() < 0.1:
                actions.append("gossip")
        
        return actions
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "time": self.time_system.to_dict(),
            "locations": {name: loc.to_dict() for name, loc in self.locations.items()},
            "events": self.event_system.to_dict()
        }
