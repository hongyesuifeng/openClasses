# 第4章：智能体经典范式构建

## 章节概述

本章将学习三种最重要的智能体范式：**ReAct**、**Plan-and-Solve** 和 **Reflection**。这些范式是构建复杂智能体的基础。

## 学习目标

- 理解三种经典范式的原理
- 从零实现每种范式
- 掌握范式的适用场景
- 能够选择合适的范式解决问题

---

## 范式一：ReAct（推理+行动）

### 核心思想

ReAct = **Re**asoning（推理）+ **Act**ing（行动）

智能体通过循环执行以下步骤来解决问题：
1. **Thought**（思考）：分析当前情况
2. **Action**（行动）：执行具体操作
3. **Observation**（观察）：观察行动结果
4. 重复直到达成目标

### 工作流程

```
┌─────────────────────────────────────────┐
│              用户问题                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Thought: 分析问题                │
│         "我需要查找..."                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Action: 执行工具                 │
│         "搜索: Python 快速排序"          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Observation: 观察结果               │
│      "找到 5 篇相关文章..."              │
└──────────────┬──────────────────────────┘
               │
               ▼
         (继续循环...)
               │
               ▼
┌─────────────────────────────────────────┐
│         最终答案                         │
└─────────────────────────────────────────┘
```

### 代码实现

```python
import re
from typing import List, Dict, Any
from llm_client import LLMClient  # 假设的 LLM 客户端

class ReActAgent:
    """
    ReAct 智能体实现
    """
    def __init__(self, llm_client: LLMClient, tools: Dict[str, callable]):
        self.llm = llm_client
        self.tools = tools
        self.max_iterations = 10

    def run(self, query: str) -> str:
        """
        执行 ReAct 循环

        Args:
            query: 用户问题

        Returns:
            最终答案
        """
        # 构建提示词
        prompt = self.build_initial_prompt(query)

        # 执行推理-行动循环
        for iteration in range(self.max_iterations):
            # 调用 LLM 生成思考和行动
            response = self.llm.generate(prompt)

            # 解析响应
            thought, action, action_input = self.parse_response(response)

            print(f"[迭代 {iteration + 1}]")
            print(f"思考: {thought}")
            print(f"行动: {action}({action_input})")

            # 检查是否结束
            if action == "finish":
                return action_input

            # 执行行动
            if action in self.tools:
                observation = self.tools[action](action_input)
                print(f"观察: {observation}\n")
            else:
                observation = f"错误: 未知工具 '{action}'"
                print(f"观察: {observation}\n")

            # 更新提示词
            prompt = self.update_prompt(prompt, thought, action, action_input, observation)

        return "错误: 达到最大迭代次数，未能解决问题"

    def build_initial_prompt(self, query: str) -> str:
        """构建初始提示词"""
        tools_desc = "\n".join([
            f"- {name}: {tool.__doc__}"
            for name, tool in self.tools.items()
        ])

        prompt = f"""你是 ReAct 智能体。请使用以下工具回答问题：

可用工具：
{tools_desc}

使用以下格式：
思考: [你的推理过程]
行动: [工具名称]
行动输入: [工具输入]

观察: [工具返回的结果]
... (可以重复思考-行动-观察)

问题: {query}

思考:"""
        return prompt

    def parse_response(self, response: str) -> tuple:
        """解析 LLM 响应"""
        # 提取思考
        thought_match = re.search(r'思考:\s*(.*?)(?=\n行动:|$)', response, re.DOTALL)
        thought = thought_match.group(1).strip() if thought_match else ""

        # 提取行动
        action_match = re.search(r'行动:\s*(\w+)', response)
        action = action_match.group(1) if action_match else ""

        # 提取行动输入
        action_input_match = re.search(r'行动输入:\s*(.*?)(?=\n思考:|\n观察:|$)', response, re.DOTALL)
        action_input = action_input_match.group(1).strip() if action_input_match else ""

        return thought, action, action_input

    def update_prompt(self, prompt: str, thought: str, action: str,
                     action_input: str, observation: str) -> str:
        """更新提示词，添加新的思考-行动-观察"""
        new_step = f"\n思考: {thought}\n行动: {action}\n行动输入: {action_input}\n观察: {observation}\n思考:"
        return prompt + new_step


# 使用示例
def search_tool(query: str) -> str:
    """搜索工具"""
    # 模拟搜索
    return f"找到关于 '{query}' 的信息..."

def calculator_tool(expression: str) -> str:
    """计算器工具"""
    try:
        result = eval(expression)
        return f"计算结果: {result}"
    except:
        return "计算错误"

# 创建智能体
tools = {
    "search": search_tool,
    "calculator": calculator_tool
}

agent = ReActAgent(llm_client=LLMClient(), tools=tools)

# 运行
result = agent.run("Python 的快速排序算法是什么？")
print(result)
```

### 游戏开发应用

**游戏 NPC 行为决策**

```python
class NPCAgent(ReActAgent):
    """
    游戏中的 NPC 智能体
    """
    def __init__(self, npc_name: str, llm_client: LLMClient):
        # NPC 可用的行动
        tools = {
            "move_to": self.move_to,
            "talk_to": self.talk_to,
            "use_item": self.use_item,
            "attack": self.attack,
            "flee": self.flee
        }
        super().__init__(llm_client, tools)
        self.npc_name = npc_name

    def decide_action(self, situation: str) -> str:
        """
        决定下一步行动

        Args:
            situation: 当前情况描述

        Returns:
            行动决策
        """
        prompt = f"""你是游戏角色 {self.npc_name}。

当前情况: {situation}

你的性格: 勇敢但谨慎
你的目标: 保护村庄

思考你应该如何行动，然后执行。

思考:"""

        return self.run(prompt)

    def move_to(self, location: str) -> str:
        """移动到指定位置"""
        return f"{self.npc_name} 移动到了 {location}"

    def talk_to(self, target: str) -> str:
        """与目标对话"""
        return f"{self.npc_name} 与 {target} 开始对话"

    def use_item(self, item: str) -> str:
        """使用物品"""
        return f"{self.npc_name} 使用了 {item}"

    def attack(self, target: str) -> str:
        """攻击目标"""
        return f"{self.npc_name} 攻击了 {target}"

    def flee(self) -> str:
        """逃跑"""
        return f"{self.npc_name} 逃跑"


# 游戏循环示例
npc = NPCAgent("守卫队长", LLMClient())

while game_running:
    # 获取当前游戏状态
    situation = get_game_state()

    # NPC 决策
    action = npc.decide_action(situation)

    # 执行行动
    execute_action(action)
```

---

## 范式二：Plan-and-Solve（规划与解决）

### 核心思想

将复杂问题分解为：
1. **Plan**（规划）：先制定详细的执行计划
2. **Solve**（解决）：按计划逐步执行

### 工作流程

```
问题: "如何开发一个游戏？"

┌─────────────────────────────────────┐
│      Plan: 制定计划                  │
│      1. 确定游戏类型                 │
│      2. 设计核心玩法                 │
│      3. 选择游戏引擎                 │
│      4. 开发原型                     │
│      5. 测试和优化                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Step 1: 确定游戏类型           │
│      → 完成: RPG 游戏               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Step 2: 设计核心玩法           │
│      → 完成: 回合制战斗             │
└──────────────┬──────────────────────┘
               │
               ▼
         (继续执行...)
```

### 代码实现

```python
class PlanAndSolveAgent:
    """
    Plan-and-Solve 智能体
    """
    def __init__(self, llm_client: LLMClient, tools: Dict[str, callable]):
        self.llm = llm_client
        self.tools = tools

    def run(self, query: str) -> str:
        """
        执行 Plan-and-Solve 流程
        """
        # 第一步：制定计划
        plan = self.make_plan(query)
        print(f"📋 计划:\n{plan}\n")

        # 第二步：执行计划
        result = self.execute_plan(plan, query)

        return result

    def make_plan(self, query: str) -> List[str]:
        """
        制定执行计划

        Returns:
            步骤列表
        """
        prompt = f"""对于以下问题，制定一个详细的执行计划。

问题: {query}

请将问题分解为 3-7 个具体的步骤。
每个步骤应该是可执行的、具体的。

格式：
1. [步骤1]
2. [步骤2]
...

计划:"""

        response = self.llm.generate(prompt)

        # 解析计划
        steps = self.parse_plan(response)
        return steps

    def parse_plan(self, response: str) -> List[str]:
        """解析计划文本"""
        steps = []
        for line in response.split('\n'):
            # 匹配 "1. 步骤内容" 格式
            match = re.match(r'\d+\.\s*(.+)', line)
            if match:
                steps.append(match.group(1).strip())
        return steps

    def execute_plan(self, plan: List[str], original_query: str) -> str:
        """
        执行计划

        Args:
            plan: 计划步骤列表
            original_query: 原始问题

        Returns:
            最终答案
        """
        context = {
            'original_query': original_query,
            'completed_steps': [],
            'intermediate_results': []
        }

        for i, step in enumerate(plan, 1):
            print(f"▶ 步骤 {i}/{len(plan)}: {step}")

            # 执行当前步骤
            step_result = self.execute_step(step, context)

            # 保存结果
            context['completed_steps'].append(step)
            context['intermediate_results'].append(step_result)

            print(f"✅ 完成: {step_result}\n")

        # 汇总所有步骤的结果
        final_answer = self.synthesize_results(context)
        return final_answer

    def execute_step(self, step: str, context: Dict) -> str:
        """
        执行单个步骤
        """
        prompt = f"""背景:
原始问题: {context['original_query']}

已完成步骤:
{self.format_completed_steps(context['completed_steps'])}

当前步骤: {step}

请执行这个步骤，提供具体的结果。
如果需要使用工具，请说明。

结果:"""

        response = self.llm.generate(prompt)

        # 检查是否需要调用工具
        for tool_name in self.tools.keys():
            if tool_name in response.lower():
                # 提取工具输入
                tool_input = self.extract_tool_input(response, tool_name)
                if tool_input:
                    return self.tools[tool_name](tool_input)

        return response

    def synthesize_results(self, context: Dict) -> str:
        """
        综合所有步骤的结果
        """
        prompt = f"""基于以下步骤的执行结果，生成最终的完整答案：

原始问题: {context['original_query']}

执行的步骤和结果:
{self.format_steps_and_results(context)}

请提供完整、连贯的最终答案。
"""

        return self.llm.generate(prompt)

    def format_completed_steps(self, steps: List[str]) -> str:
        """格式化已完成的步骤"""
        return "\n".join([f"- {step}" for step in steps])

    def format_steps_and_results(self, context: Dict) -> str:
        """格式化步骤和结果"""
        formatted = []
        for step, result in zip(context['completed_steps'], context['intermediate_results']):
            formatted.append(f"步骤: {step}\n结果: {result}\n")
        return "\n".join(formatted)

    def extract_tool_input(self, response: str, tool_name: str) -> str:
        """从响应中提取工具输入"""
        # 简单实现：寻找工具名称后的内容
        pattern = f"{tool_name}\\s*:?\\s*(.+?)(?:\n|$)"
        match = re.search(pattern, response, re.IGNORECASE)
        return match.group(1).strip() if match else None
```

### 游戏开发应用

**游戏任务生成**

```python
class QuestGeneratorAgent(PlanAndSolveAgent):
    """
    游戏任务生成器
    """
    def __init__(self, llm_client: LLMClient):
        tools = {
            "generate_objective": self.generate_objective,
            "create_dialogue": self.create_dialogue,
            "design_reward": self.design_reward
        }
        super().__init__(llm_client, tools)

    def generate_quest(self, quest_type: str, player_level: int) -> Dict:
        """
        生成游戏任务

        Args:
            quest_type: 任务类型（主线、支线、日常等）
            player_level: 玩家等级

        Returns:
            任务详细信息
        """
        query = f"""
        为 {player_level} 级玩家生成一个{quest_type}任务。

        任务要求:
        - 难度适中
        - 有趣的剧情
        - 合理的奖励
        """

        # 使用 Plan-and-Solve 生成任务
        plan = self.make_plan(query)

        # 执行计划
        result = self.execute_plan(plan, query)

        return self.parse_quest(result)

    def generate_objective(self, description: str) -> str:
        """生成任务目标"""
        return f"任务目标: {description}"

    def create_dialogue(self, character: str) -> str:
        """创建对话"""
        return f"{character}: [生成的对话内容]"

    def design_reward(self, quest_difficulty: str) -> str:
        """设计奖励"""
        return f"奖励: 经验值、金币、装备..."
```

---

## 范式三：Reflection（反思）

### 核心思想

智能体通过以下步骤提升输出质量：
1. **Act**（行动）：生成初始方案
2. **Observe**（观察）：检查方案质量
3. **Reflect**（反思）：分析问题和改进点
4. **Refine**（改进）：基于反思优化方案
5. 重复直到满意

### 工作流程

```
问题: "写一个快速排序函数"

┌─────────────────────────────────────┐
│   Draft 1: 初始草稿                  │
│   [基础实现]                         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Reflect: 反思                      │
│   问题:                              │
│   - 没有处理边界情况                 │
│   - 缺少注释                         │
│   - 没有优化                         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Draft 2: 改进版本                  │
│   [添加边界处理和注释]               │
└──────────────┬──────────────────────┘
               │
               ▼
         (继续优化...)
```

### 代码实现

```python
class ReflectionAgent:
    """
    Reflection 智能体
    """
    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client
        self.max_refinements = 3

    def run(self, query: str, context: str = "") -> str:
        """
        执行反思循环
        """
        current_version = None
        feedback_history = []

        for iteration in range(self.max_refinements + 1):
            print(f"\n🔄 迭代 {iteration + 1}")

            if iteration == 0:
                # 第一次：生成初始版本
                current_version = self.generate_draft(query, context)
            else:
                # 后续：基于反馈改进
                current_version = self.refine(
                    query,
                    current_version,
                    feedback_history[-1],
                    context
                )

            print(f"当前版本:\n{current_version}\n")

            # 获取反馈
            feedback = self.get_feedback(query, current_version, context)
            print(f"反馈:\n{feedback}\n")
            feedback_history.append(feedback)

            # 检查是否满意
            if self.is_satisfactory(feedback):
                print("✅ 达到满意的质量!")
                break

        return current_version

    def generate_draft(self, query: str, context: str) -> str:
        """
        生成初始草稿
        """
        prompt = f"""任务: {query}

{context}

请完成这个任务。这是第一版，重点是正确性。
"""

        return self.llm.generate(prompt)

    def get_feedback(self, query: str, version: str, context: str) -> str:
        """
        获取对当前版本的反馈

        分析：
        - 问题和缺陷
        - 改进建议
        - 质量评分
        """
        prompt = f"""任务: {query}

当前版本:
{version}

请分析这个版本，提供详细的反馈：

1. 问题分析:
   - 有哪些错误或不足？
   - 遗漏了什么？

2. 改进建议:
   - 具体应该如何改进？
   - 优先级排序

3. 质量评估:
   - 给出 1-10 分的质量评分
   - 是否达到可用标准？

反馈:"""

        return self.llm.generate(prompt)

    def refine(self, query: str, current_version: str, feedback: str, context: str) -> str:
        """
        基于反馈改进
        """
        prompt = f"""任务: {query}

当前版本:
{current_version}

反馈:
{feedback}

请根据反馈改进当前版本。只修改需要改进的部分，保持其他部分不变。

改进后的版本:"""

        return self.llm.generate(prompt)

    def is_satisfactory(self, feedback: str) -> bool:
        """
        判断反馈是否表示满意
        """
        # 检查反馈中的关键词
        positive_indicators = ['满意', 'excellent', '完美', '可以接受']
        negative_indicators = ['需要改进', '不够好', '有问题', '应改进']

        feedback_lower = feedback.lower()

        # 如果有积极指标，没有严重问题
        if any(indicator in feedback_lower for indicator in positive_indicators):
            return True

        # 如果没有严重问题
        if not any(indicator in feedback_lower for indicator in negative_indicators):
            # 检查评分
            score_match = re.search(r'(\d+)/10', feedback)
            if score_match:
                score = int(score_match.group(1))
                return score >= 8

        return False
```

### 游戏开发应用

**NPC 对话优化**

```python
class DialogueRefiner(ReflectionAgent):
    """
    游戏对话优化器
    """
    def __init__(self, llm_client: LLMClient):
        super().__init__(llm_client)

    def generate_dialogue(self, character: str, situation: str,
                         personality: Dict) -> str:
        """
        生成并优化 NPC 对话

        Args:
            character: 角色名称
            situation: 情境描述
            personality: 性格特征
        """
        context = f"""
角色: {character}
情境: {situation}
性格:
- 开放性: {personality['openness']}
- 外向性: {personality['extraversion']}
- 亲和性: {personality['agreeableness']}
- 神经质: {personality['neuroticism']}

要求:
1. 对话要符合角色性格
2. 自然、流畅
3. 推动剧情发展
4. 有情感表现
"""

        query = f"为 {character} 生成一句对话"

        return self.run(query, context)

    def get_feedback(self, query: str, dialogue: str, context: str) -> str:
        """
        获取对话反馈
        """
        prompt = f"""{context}

生成的对话:
"{dialogue}"

请评估这段对话:

1. 角色一致性:
   - 是否符合角色性格？
   - 语气是否恰当？

2. 自然度:
   - 是否自然流畅？
   - 是否像真人说话？

3. 剧情推动:
   - 是否推动故事发展？
   - 是否有趣？

4. 情感表达:
   - 情感是否到位？
   - 是否有感染力？

5. 具体建议:
   - 哪些地方需要修改？
   - 如何改进？

反馈:"""

        return self.llm.generate(prompt)
```

---

## 三种范式的对比与选择

| 特性 | ReAct | Plan-and-Solve | Reflection |
|------|-------|----------------|------------|
| **适用场景** | 探索性任务、需要工具调用 | 复杂多步骤任务 | 需要高质量输出 |
| **优点** | 灵活、可适应 | 结构化、可控 | 质量高、可迭代 |
| **缺点** | 可能冗余 | 计划可能不完善 | 需要多轮迭代 |
| **成本** | 中等（多次 LLM 调用） | 中等（计划+执行） | 高（多轮优化） |
| **游戏应用** | NPC 行为决策 | 任务/剧情生成 | 对话/内容优化 |
| **编程应用** | 代码生成、调试 | 系统设计、重构 | 代码审查、优化 |

### 选择建议

**使用 ReAct 当：**
- 需要探索和试错
- 有多个工具可用
- 任务路径不确定

**使用 Plan-and-Solve 当：**
- 任务复杂但可分解
- 需要清晰执行路径
- 希望可追踪进度

**使用 Reflection 当：**
- 质量要求高
- 需要多次迭代优化
- 有明确的评估标准

**组合使用：**
可以组合使用多种范式！例如：
- Plan-and-Solve 制定计划
- ReAct 执行每一步
- Reflection 优化最终结果

---

## 练习作业

### 基础练习
1. **实现 ReAct Agent**
   - 创建工具集（搜索、计算、查询）
   - 实现完整的 ReAct 循环
   - 测试多步问题解决

2. **实现 Plan-and-Solve Agent**
   - 实现计划生成
   - 实现步骤执行
   - 测试复杂任务分解

3. **实现 Reflection Agent**
   - 实现草稿生成
   - 实现反馈机制
   - 实现迭代优化

### 进阶练习
4. **游戏方向**：
   - 用 ReAct 实现 NPC 行为系统
   - 用 Plan-and-Solve 实现任务生成器
   - 用 Reflection 优化对话系统

5. **编程方向**：
   - 用 ReAct 实现代码调试助手
   - 用 Plan-and-Solve 实现代码重构工具
   - 用 Reflection 实现代码审查系统

### 挑战练习
6. **组合范式**
   - 设计一个组合多种范式的系统
   - 实现 Agent 间的协作
   - 测试复杂场景

## 下一步

完成本章后，进入：
- [第5章：低代码平台](../ch05-lowcode/) - 了解 Coze、Dify 等平台
