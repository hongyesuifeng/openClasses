# 第十二讲：Skill 进阶开发

> 实践教程：深入 Skill 开发技术

## 本章概要

本章将介绍 Skill 的进阶开发技术，包括复杂参数处理、异步执行、错误处理、状态管理等。

---

## 1. 复杂参数处理

### 1.1 参数类型

```
支持的参数类型
────────────────────────────────────────────────────────

基本类型：
• string   字符串
• integer  整数
• number   浮点数
• boolean  布尔值

复杂类型：
• array    数组
• object   对象
• enum     枚举
```

### 1.2 参数定义

```json
{
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "搜索关键词"
      },
      "limit": {
        "type": "integer",
        "description": "返回结果数量",
        "default": 10,
        "minimum": 1,
        "maximum": 100
      },
      "sort": {
        "type": "string",
        "enum": ["relevance", "date", "popularity"],
        "default": "relevance"
      },
      "filters": {
        "type": "object",
        "properties": {
          "dateRange": {
            "type": "object",
            "properties": {
              "start": {"type": "string", "format": "date"},
              "end": {"type": "string", "format": "date"}
            }
          },
          "sources": {
            "type": "array",
            "items": {"type": "string"}
          }
        }
      }
    },
    "required": ["query"]
  }
}
```

### 1.3 参数验证

```python
# skill_utils.py

import json
from typing import Any, Dict, List

def validate_params(params: Dict, schema: Dict) -> tuple[bool, str]:
    """验证参数是否符合 schema"""

    # 检查必需参数
    required = schema.get("required", [])
    for field in required:
        if field not in params:
            return False, f"缺少必需参数: {field}"

    # 检查参数类型
    properties = schema.get("properties", {})
    for key, value in params.items():
        if key not in properties:
            continue

        prop_def = properties[key]
        expected_type = prop_def.get("type")

        if expected_type == "string" and not isinstance(value, str):
            return False, f"参数 {key} 应为字符串"
        elif expected_type == "integer" and not isinstance(value, int):
            return False, f"参数 {key} 应为整数"
        elif expected_type == "array" and not isinstance(value, list):
            return False, f"参数 {key} 应为数组"

        # 检查范围
        if "minimum" in prop_def and value < prop_def["minimum"]:
            return False, f"参数 {key} 不能小于 {prop_def['minimum']}"
        if "maximum" in prop_def and value > prop_def["maximum"]:
            return False, f"参数 {key} 不能大于 {prop_def['maximum']}"

        # 检查枚举值
        if "enum" in prop_def and value not in prop_def["enum"]:
            return False, f"参数 {key} 必须是 {prop_def['enum']} 之一"

    return True, "验证通过"
```

---

## 2. 异步执行

### 2.1 长时间运行的任务

```markdown
# 报告生成

## 描述
生成数据分析报告（可能需要较长时间）

## 执行
```bash
# 异步执行
python report_generator.py \
  --data "${data_source}" \
  --output "${output_path}" \
  --async \
  --callback "${CALLBACK_URL}"
```

## 输出
返回任务 ID，结果通过回调通知
```

### 2.2 任务状态管理

```python
# task_manager.py

import uuid
import json
from datetime import datetime
from enum import Enum

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskManager:
    def __init__(self, storage_path: str):
        self.storage_path = storage_path

    def create_task(self, skill_name: str, params: dict) -> str:
        """创建新任务"""
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "skill": skill_name,
            "params": params,
            "status": TaskStatus.PENDING.value,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "result": None,
            "error": None
        }
        self._save_task(task)
        return task_id

    def update_task(self, task_id: str, **updates):
        """更新任务状态"""
        task = self._load_task(task_id)
        task.update(updates)
        task["updated_at"] = datetime.now().isoformat()
        self._save_task(task)

    def get_task(self, task_id: str) -> dict:
        """获取任务状态"""
        return self._load_task(task_id)

    def _save_task(self, task: dict):
        path = f"{self.storage_path}/{task['id']}.json"
        with open(path, 'w') as f:
            json.dump(task, f)

    def _load_task(self, task_id: str) -> dict:
        path = f"{self.storage_path}/{task_id}.json"
        with open(path) as f:
            return json.load(f)
```

### 2.3 回调通知

```python
# callback.py

import requests
import json

def send_callback(callback_url: str, task_id: str, result: dict):
    """发送任务完成回调"""
    payload = {
        "task_id": task_id,
        "status": "completed",
        "result": result,
        "timestamp": datetime.now().isoformat()
    }

    try:
        response = requests.post(
            callback_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Callback failed: {e}")
        return False
```

---

## 3. 错误处理

### 3.1 标准错误格式

```python
# error_handler.py

from dataclasses import dataclass
from typing import Optional
import json

@dataclass
class SkillError:
    code: str
    message: str
    details: Optional[dict] = None

    def to_json(self) -> str:
        return json.dumps({
            "success": False,
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details
            }
        })

# 预定义错误
class SkillErrors:
    INVALID_PARAMS = SkillError(
        code="INVALID_PARAMS",
        message="参数验证失败"
    )

    NOT_FOUND = SkillError(
        code="NOT_FOUND",
        message="资源不存在"
    )

    RATE_LIMIT = SkillError(
        code="RATE_LIMIT",
        message="请求频率超限"
    )

    TIMEOUT = SkillError(
        code="TIMEOUT",
        message="执行超时"
    )

    INTERNAL = SkillError(
        code="INTERNAL_ERROR",
        message="内部错误"
    )
```

### 3.2 异常处理装饰器

```python
# decorators.py

import functools
import traceback
from error_handler import SkillErrors

def handle_errors(func):
    """统一错误处理装饰器"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            error = SkillErrors.INVALID_PARAMS
            error.details = {"reason": str(e)}
            print(error.to_json())
        except FileNotFoundError as e:
            error = SkillErrors.NOT_FOUND
            error.details = {"path": str(e)}
            print(error.to_json())
        except TimeoutError:
            print(SkillErrors.TIMEOUT.to_json())
        except Exception as e:
            error = SkillErrors.INTERNAL
            error.details = {
                "exception": type(e).__name__,
                "message": str(e),
                "traceback": traceback.format_exc()
            }
            print(error.to_json())
    return wrapper

# 使用示例
@handle_errors
def execute_skill(city: str, days: int):
    if not city:
        raise ValueError("城市名称不能为空")

    result = get_weather(city, days)
    return json.dumps({"success": True, "data": result})
```

---

## 4. 状态管理

### 4.1 Skill 状态存储

```python
# state_manager.py

import json
import os
from typing import Any, Dict

class StateManager:
    """Skill 状态管理器"""

    def __init__(self, skill_dir: str):
        self.state_file = os.path.join(skill_dir, ".state.json")
        self._load_state()

    def _load_state(self):
        """加载状态"""
        if os.path.exists(self.state_file):
            with open(self.state_file) as f:
                self.state = json.load(f)
        else:
            self.state = {}

    def _save_state(self):
        """保存状态"""
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)

    def get(self, key: str, default: Any = None) -> Any:
        """获取状态值"""
        return self.state.get(key, default)

    def set(self, key: str, value: Any):
        """设置状态值"""
        self.state[key] = value
        self._save_state()

    def delete(self, key: str):
        """删除状态值"""
        if key in self.state:
            del self.state[key]
            self._save_state()

    def clear(self):
        """清空状态"""
        self.state = {}
        self._save_state()

# 使用示例
state = StateManager("/path/to/skill")

# 保存用户偏好
state.set("user_preference", {"language": "zh", "units": "metric"})

# 读取用户偏好
pref = state.get("user_preference", {})
```

### 4.2 会话状态

```python
# session_state.py

class SessionState:
    """会话级别的状态管理"""

    _instances = {}

    @classmethod
    def get_instance(cls, session_id: str):
        if session_id not in cls._instances:
            cls._instances[session_id] = cls(session_id)
        return cls._instances[session_id]

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.data = {}

    def set(self, key: str, value: Any):
        self.data[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    def clear(self):
        self.data = {}

# 使用示例
session = SessionState.get_instance("user_123")
session.set("last_query", "北京天气")
last = session.get("last_query")
```

---

## 5. 链式 Skill 调用

### 5.1 工作流定义

```markdown
# 旅行规划

## 描述
规划完整的旅行方案，包括天气查询、机票搜索、酒店预订

## 工作流
```yaml
workflow:
  steps:
    - name: check_weather
      skill: weather
      params:
        city: "${destination}"
        days: 7

    - name: search_flights
      skill: flight_search
      params:
        from: "${departure}"
        to: "${destination}"
        date: "${travel_date}"
      depends_on: []

    - name: search_hotels
      skill: hotel_search
      params:
        city: "${destination}"
        check_in: "${travel_date}"
        nights: "${nights}"
      depends_on: []

    - name: generate_itinerary
      skill: itinerary_generator
      params:
        weather: "${check_weather.result}"
        flights: "${search_flights.result}"
        hotels: "${search_hotels.result}"
      depends_on:
        - check_weather
        - search_flights
        - search_hotels
```

## 输出
返回完整的旅行规划方案
```

### 5.2 工作流引擎

```python
# workflow_engine.py

import asyncio
from typing import Dict, List, Any

class WorkflowEngine:
    """工作流执行引擎"""

    def __init__(self):
        self.results = {}

    async def execute(self, workflow: Dict, params: Dict) -> Dict:
        """执行工作流"""
        steps = workflow.get("steps", [])

        # 拓扑排序确定执行顺序
        sorted_steps = self._topological_sort(steps)

        for step in sorted_steps:
            step_name = step["name"]
            skill_name = step["skill"]
            step_params = self._resolve_params(step.get("params", {}), params)

            # 执行 Skill
            result = await self._execute_skill(skill_name, step_params)
            self.results[step_name] = result

        return self.results

    def _resolve_params(self, step_params: Dict, global_params: Dict) -> Dict:
        """解析参数，替换变量引用"""
        resolved = {}
        for key, value in step_params.items():
            if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
                # 变量引用
                var_path = value[2:-1]

                # 支持引用其他步骤的结果
                if "." in var_path:
                    step_name, result_key = var_path.split(".", 1)
                    if step_name in self.results:
                        resolved[key] = self._get_nested(self.results[step_name], result_key)
                else:
                    resolved[key] = global_params.get(var_path)
            else:
                resolved[key] = value
        return resolved

    def _get_nested(self, obj: Dict, path: str) -> Any:
        """获取嵌套属性"""
        keys = path.split(".")
        for key in keys:
            if isinstance(obj, dict):
                obj = obj.get(key)
            else:
                return None
        return obj

    async def _execute_skill(self, skill_name: str, params: Dict) -> Dict:
        """执行单个 Skill"""
        # 实际实现中调用 Skill 执行器
        print(f"Executing skill: {skill_name} with params: {params}")
        await asyncio.sleep(1)  # 模拟执行
        return {"status": "success", "data": {}}

    def _topological_sort(self, steps: List[Dict]) -> List[Dict]:
        """拓扑排序"""
        # 简化实现，实际需要完整的拓扑排序算法
        return steps
```

---

## 6. 性能优化

### 6.1 缓存策略

```python
# cache.py

import hashlib
import json
import time
from functools import wraps

class Cache:
    """简单的内存缓存"""

    def __init__(self, ttl: int = 3600):
        self.ttl = ttl
        self.cache = {}

    def _make_key(self, *args, **kwargs) -> str:
        """生成缓存键"""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, key: str):
        """获取缓存"""
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            del self.cache[key]
        return None

    def set(self, key: str, value):
        """设置缓存"""
        self.cache[key] = (value, time.time())

    def cached(self, func):
        """缓存装饰器"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = self._make_key(*args, **kwargs)
            cached = self.get(key)
            if cached is not None:
                return cached

            result = func(*args, **kwargs)
            self.set(key, result)
            return result
        return wrapper

# 使用示例
cache = Cache(ttl=600)  # 10分钟缓存

@cache.cached
def get_weather(city: str):
    # 这个结果会被缓存
    return fetch_weather_from_api(city)
```

### 6.2 并发控制

```python
# concurrency.py

import asyncio
from typing import List, Any

async def execute_parallel(tasks: List[callable], max_concurrency: int = 5) -> List[Any]:
    """并发执行任务，限制最大并发数"""
    semaphore = asyncio.Semaphore(max_concurrency)

    async def run_with_semaphore(task):
        async with semaphore:
            return await task

    return await asyncio.gather(*[run_with_semaphore(t) for t in tasks])

# 使用示例
async def main():
    cities = ["北京", "上海", "广州", "深圳", "杭州"]

    # 创建任务列表
    tasks = [get_weather_async(city) for city in cities]

    # 并发执行，最多5个并发
    results = await execute_parallel(tasks, max_concurrency=3)

    return results
```

---

## 关键要点总结

1. **复杂参数**：支持多种类型和嵌套结构
2. **异步执行**：长时间任务使用回调和状态管理
3. **错误处理**：统一的错误格式和异常处理
4. **状态管理**：Skill 级别和会话级别的状态存储
5. **工作流**：链式调用多个 Skill 完成复杂任务
6. **性能优化**：缓存和并发控制

---

*下一章：[Skill 实战案例](03-skill-examples.md)*
