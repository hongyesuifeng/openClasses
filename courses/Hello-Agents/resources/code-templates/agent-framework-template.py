# Agent 框架基础模板

这是从零开始构建智能体框架的基础模板，对应课程第7章内容。

## 基础 Agent 类

```python
# agent_framework/base.py

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Message:
    """消息类"""
    role: str  # 'user', 'assistant', 'system', 'tool'
    content: str
    timestamp: datetime = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.metadata is None:
            self.metadata = {}


@dataclass
class Tool:
    """工具定义"""
    name: str
    description: str
    function: Callable
    parameters: Dict[str, Any]


class Memory:
    """记忆系统基类"""

    def __init__(self, max_size: int = 1000):
        self.memories: List[Message] = []
        self.max_size = max_size

    def add(self, message: Message):
        """添加记忆"""
        self.memories.append(message)
        # 如果超过最大容量，删除最旧的
        if len(self.memories) > self.max_size:
            self.memories = self.memories[-self.max_size:]

    def get_recent(self, n: int = 10) -> List[Message]:
        """获取最近的记忆"""
        return self.memories[-n:]

    def search(self, query: str, top_k: int = 5) -> List[Message]:
        """搜索相关记忆（简单实现，可改用向量搜索）"""
        # 简单的关键词匹配
        results = []
        for memory in self.memories:
            if query.lower() in memory.content.lower():
                results.append(memory)
        return results[:top_k]

    def clear(self):
        """清空记忆"""
        self.memories = []


class BaseAgent(ABC):
    """智能体基类"""

    def __init__(
        self,
        name: str,
        llm_client: Any,
        system_prompt: str = "",
        tools: Optional[List[Tool]] = None,
        memory: Optional[Memory] = None
    ):
        self.name = name
        self.llm = llm_client
        self.system_prompt = system_prompt
        self.tools = {tool.name: tool for tool in (tools or [])}
        self.memory = memory or Memory()
        self.conversation_history: List[Message] = []

    @abstractmethod
    def think(self, input_message: str, context: Dict[str, Any] = None) -> str:
        """思考并生成响应（核心方法）"""
        pass

    def act(self, action_name: str, action_input: Dict[str, Any]) -> Any:
        """执行工具/行动"""
        if action_name not in self.tools:
            return f"Error: Unknown tool '{action_name}'"

        tool = self.tools[action_name]
        try:
            result = tool.function(**action_input)
            return result
        except Exception as e:
            return f"Error executing {action_name}: {str(e)}"

    def remember(self, message: Message):
        """记住消息"""
        self.memory.add(message)

    def reset(self):
        """重置对话历史"""
        self.conversation_history = []

    def get_info(self) -> Dict[str, Any]:
        """获取智能体信息"""
        return {
            "name": self.name,
            "tools": list(self.tools.keys()),
            "system_prompt": self.system_prompt,
            "memory_count": len(self.memory.memories)
        }


class ReActAgent(BaseAgent):
    """ReAct 智能体实现"""

    def __init__(self, *args, max_iterations: int = 10, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_iterations = max_iterations

    def think(self, input_message: str, context: Dict[str, Any] = None) -> str:
        """
        ReAct 循环：思考 -> 行动 -> 观察
        """
        # 构建初始提示
        prompt = self._build_react_prompt(input_message)

        for iteration in range(self.max_iterations):
            # 生成思考和行动
            response = self.llm.generate(prompt)

            # 解析响应
            thought, action, action_input = self._parse_react_response(response)

            print(f"[迭代 {iteration + 1}]")
            print(f"思考: {thought}")

            # 检查是否结束
            if action == "finish" or action == "answer":
                print(f"最终答案: {action_input}")
                return action_input

            print(f"行动: {action}({action_input})")

            # 执行行动
            observation = self.act(action, action_input)
            print(f"观察: {observation}\n")

            # 更新提示
            prompt += f"\n思考: {thought}\n行动: {action}\n行动输入: {action_input}\n观察: {observation}\n思考:"

        return "达到最大迭代次数"

    def _build_react_prompt(self, query: str) -> str:
        """构建 ReAct 提示"""
        tools_desc = "\n".join([
            f"- {name}: {tool.description}"
            for name, tool in self.tools.items()
        ])

        return f"""{self.system_prompt}

可用工具:
{tools_desc}

使用以下格式:
思考: [你的推理]
行动: [工具名称]
行动输入: [工具输入]
观察: [结果]

问题: {query}

思考:"""

    def _parse_react_response(self, response: str) -> tuple:
        """解析 ReAct 响应"""
        import re

        thought_match = re.search(r'思考:\s*(.+?)(?=\n行动:|$)', response, re.DOTALL)
        action_match = re.search(r'行动:\s*(\w+)', response)
        input_match = re.search(r'行动输入:\s*(.+?)(?=\n思考:|\n观察:|$)', response, re.DOTALL)

        thought = thought_match.group(1).strip() if thought_match else ""
        action = action_match.group(1) if action_match else ""
        action_input = input_match.group(1).strip() if input_match else ""

        return thought, action, action_input


class ReflectiveAgent(BaseAgent):
    """反思智能体实现"""

    def __init__(self, *args, max_refinements: int = 3, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_refinements = max_refinements

    def think(self, input_message: str, context: Dict[str, Any] = None) -> str:
        """
        反思循环：生成 -> 反馈 -> 改进
        """
        current_version = None
        feedback_history = []

        for i in range(self.max_refinements + 1):
            print(f"\n[迭代 {i + 1}]")

            if i == 0:
                # 生成初始版本
                current_version = self._generate_draft(input_message)
            else:
                # 基于反馈改进
                current_version = self._refine(
                    input_message,
                    current_version,
                    feedback_history[-1]
                )

            print(f"当前版本: {current_version[:100]}...")

            # 获取反馈
            feedback = self._get_feedback(input_message, current_version)
            print(f"反馈: {feedback[:100]}...")
            feedback_history.append(feedback)

            # 检查是否满意
            if self._is_satisfactory(feedback):
                print("✅ 达到满意质量")
                break

        return current_version

    def _generate_draft(self, query: str) -> str:
        """生成初稿"""
        prompt = f"{self.system_prompt}\n\n任务: {query}\n\n请完成这个任务。"
        return self.llm.generate(prompt)

    def _get_feedback(self, query: str, version: str) -> str:
        """获取反馈"""
        prompt = f"""评估以下回答的质量：

任务: {query}

回答:
{version}

请提供详细反馈：
1. 问题和不足
2. 改进建议
3. 质量评分(1-10)
"""
        return self.llm.generate(prompt)

    def _refine(self, query: str, current: str, feedback: str) -> str:
        """基于反馈改进"""
        prompt = f"""任务: {query}

当前版本:
{current}

反馈:
{feedback}

请根据反馈改进当前版本。
"""
        return self.llm.generate(prompt)

    def _is_satisfactory(self, feedback: str) -> bool:
        """判断是否满意"""
        import re
        score_match = re.search(r'(\d+)/10', feedback)
        if score_match:
            return int(score_match.group(1)) >= 8
        return "满意" in feedback or "excellent" in feedback.lower()


class MultiAgentSystem:
    """多智能体系统"""

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.message_queue: List[Message] = []

    def add_agent(self, agent: BaseAgent):
        """添加智能体"""
        self.agents[agent.name] = agent

    def send_message(self, from_agent: str, to_agent: str, message: str) -> str:
        """智能体间发送消息"""
        if to_agent not in self.agents:
            return f"Error: Agent '{to_agent}' not found"

        agent = self.agents[to_agent]
        response = agent.think(
            message,
            context={"from": from_agent}
        )

        # 记录消息
        msg = Message(
            role="agent",
            content=f"From {from_agent} to {to_agent}: {message}",
            metadata={"response": response}
        )
        self.message_queue.append(msg)

        return response

    def broadcast(self, from_agent: str, message: str) -> Dict[str, str]:
        """广播消息给所有智能体"""
        responses = {}
        for agent_name in self.agents:
            if agent_name != from_agent:
                responses[agent_name] = self.send_message(
                    from_agent,
                    agent_name,
                    message
                )
        return responses

    def collaborative_task(self, task: str, coordinator: str) -> str:
        """协作完成任务"""
        if coordinator not in self.agents:
            return "Error: Coordinator not found"

        # 协调者分析任务
        coordinator_agent = self.agents[coordinator]
        analysis = coordinator_agent.think(
            f"分析以下任务，并决定需要哪些智能体协作：{task}"
        )

        # 这里简化处理，实际可以更复杂的协作逻辑
        return analysis
```

## 使用示例

```python
# examples/basic_usage.py

from agent_framework.base import ReActAgent, ReflectiveAgent, Tool, Message
from llm_client import OpenAIClient  # 假设的 LLM 客户端

# 初始化 LLM 客户端
llm = OpenAIClient(api_key="your-api-key")

# 定义工具
def search_web(query: str) -> str:
    """搜索网络（示例）"""
    return f"关于 '{query}' 的搜索结果..."

def calculator(expression: str) -> str:
    """计算器"""
    try:
        result = eval(expression)
        return str(result)
    except:
        return "计算错误"

tools = [
    Tool(
        name="search",
        description="搜索网络信息",
        function=search_web,
        parameters={"query": "str"}
    ),
    Tool(
        name="calculator",
        description="执行数学计算",
        function=calculator,
        parameters={"expression": "str"}
    )
]

# 创建 ReAct 智能体
react_agent = ReActAgent(
    name="Researcher",
    llm_client=llm,
    system_prompt="你是一个研究助手，可以使用搜索和计算工具。",
    tools=tools
)

# 使用智能体
result = react_agent.think("Python 的最新版本是什么？")
print(f"结果: {result}")

# 创建反思智能体
reflective_agent = ReflectiveAgent(
    name="Writer",
    llm_client=llm,
    system_prompt="你是一个专业作家，擅长写作。"
)

# 使用反思智能体
article = reflective_agent.think("写一篇关于人工智能的短文（200字）")
print(f"文章: {article}")
```

## 游戏开发专用 Agent

```python
# agent_framework/game_agent.py

from agent_framework.base import BaseAgent, Tool, Message
from typing import Dict, Any, List
from enum import Enum


class ActionType(Enum):
    """游戏行动类型"""
    MOVE = "move"
    TALK = "talk"
    ATTACK = "attack"
    USE_ITEM = "use_item"
    WAIT = "wait"


@dataclass
class GameState:
    """游戏状态"""
    player_location: str
    nearby_npcs: List[str]
    nearby_items: List[str]
    current_quest: str
    time_of_day: str


class GameAgent(BaseAgent):
    """游戏 NPC 智能体"""

    def __init__(
        self,
        name: str,
        llm_client: Any,
        personality: Dict[str, float],
        role: str,
        **kwargs
    ):
        system_prompt = self._build_personality_prompt(name, personality, role)
        super().__init__(name, llm_client, system_prompt, **kwargs)
        self.personality = personality
        self.role = role
        self.relationships: Dict[str, float] = {}  # 与其他角色的关系

    def _build_personality_prompt(self, name: str, personality: Dict, role: str) -> str:
        """构建性格提示"""
        return f"""你是游戏角色 {name}，身份是 {role}。

你的性格特征：
- 开放性: {personality.get('openness', 0.5)}/1.0
- 尽责性: {personality.get('conscientiousness', 0.5)}/1.0
- 外向性: {personality.get('extraversion', 0.5)}/1.0
- 亲和性: {personality.get('agreeableness', 0.5)}/1.0
- 神经质: {personality.get('neuroticism', 0.5)}/1.0

你的行为应该符合你的性格和身份。
"""

    def decide_action(self, game_state: GameState) -> tuple:
        """
        决定下一步行动

        Returns:
            (action_type, action_target)
        """
        prompt = f"""
当前游戏状态：
- 位置: {game_state.player_location}
- 附近NPC: {', '.join(game_state.nearby_npcs)}
- 附近物品: {', '.join(game_state.nearby_items)}
- 当前任务: {game_state.current_quest}
- 时间: {game_state.time_of_day}

根据你的性格和当前情况，决定下一步行动。

返回格式：
行动类型: [move/talk/attack/use_item/wait]
行动目标: [目标描述]
理由: [你的想法]
"""

        response = self.think(prompt)

        # 解析响应
        action_type = self._extract_action_type(response)
        action_target = self._extract_action_target(response)

        return action_type, action_target

    def generate_dialogue(
        self,
        player_message: str,
        context: Dict[str, Any]
    ) -> str:
        """生成对话"""
        relationship = context.get('relationship', 0.5)

        prompt = f"""
玩家说: "{player_message}"

情境: {context.get('situation', '普通对话')}

你们的关系值: {relationship}/1.0

根据你的性格和与玩家的关系，回应玩家。
"""

        return self.think(prompt)

    def update_relationship(self, other_character: str, delta: float):
        """更新关系值"""
        if other_character not in self.relationships:
            self.relationships[other_character] = 0.5

        self.relationships[other_character] = max(
            0.0,
            min(1.0, self.relationships[other_character] + delta)
        )

    def _extract_action_type(self, response: str) -> ActionType:
        """从响应中提取行动类型"""
        import re
        match = re.search(r'行动类型:\s*(\w+)', response)
        if match:
            action_str = match.group(1).lower()
            for action_type in ActionType:
                if action_type.value == action_str:
                    return action_type
        return ActionType.WAIT

    def _extract_action_target(self, response: str) -> str:
        """从响应中提取行动目标"""
        import re
        match = re.search(r'行动目标:\s*(.+?)(?:\n理由:|$)', response, re.DOTALL)
        return match.group(1).strip() if match else ""


# 使用示例
def create_game_npc():
    """创建游戏 NPC"""
    llm = OpenAIClient(api_key="your-api-key")

    # 守卫 NPC
    guard = GameAgent(
        name="守卫队长",
        llm_client=llm,
        personality={
            'openness': 0.3,
            'conscientiousness': 0.9,
            'extraversion': 0.4,
            'agreeableness': 0.5,
            'neuroticism': 0.3
        },
        role="村庄守卫",
        tools=[
            Tool("move", "移动到指定位置", lambda loc: f"移动到 {loc}", {"location": "str"}),
            Tool("talk", "与目标对话", lambda target: f"与 {target} 对话", {"target": "str"}),
        ]
    )

    return guard
```

这个模板提供了：
1. **基础 Agent 类**：可扩展的基类
2. **ReAct 实现**：推理-行动循环
3. **反思 Agent**：迭代优化
4. **多智能体系统**：协作框架
5. **游戏专用 Agent**：游戏 NPC 基类

你可以基于此模板继续扩展！
