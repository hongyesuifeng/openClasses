# Reading 2: MCP Protocol Practical Guide
# MCP 协议实战指南

> **Week 2 Reading #2**
> **主题**: Model Context Protocol 的原理、实现和应用
> **预计阅读时间**: 60-90 分钟

---

## 📚 导读

MCP (Model Context Protocol) 是 Anthropic 提出的标准化协议，用于连接 LLM 与外部数据源。本文将深入探讨：

1. **MCP 基础** - 协议的核心概念和架构
2. **Server 实现** - 如何构建 MCP Server
3. **Client 集成** - 如何在应用中使用 MCP
4. **实战案例** - 构建实际可用的 MCP Server

---

## 🎯 学习目标

阅读完本文后,你应该能够：

- ✅ 理解 MCP 协议的设计目标和原理
- ✅ 掌握 MCP Server 的核心概念（Resources、Tools、Prompts）
- ✅ 能够从零实现一个 MCP Server
- ✅ 了解 MCP 的安全性和权限控制
- ✅ 能够将 MCP 集成到实际项目中

---

## 第一部分：MCP 协议基础

### 什么是 MCP？

**MCP (Model Context Protocol)** 是一个开放标准协议，用于连接 AI Assistant 与外部数据源和工具。

**核心问题**：

```
┌─────────────┐
│     LLM     │
│             │
│ "被限制在"  │
│  对话窗口中 │
└─────────────┘
     ↑
     │ 无法访问
     │
     ├─→ 文件系统
     ├─→ 数据库
     ├─→ API 服务
     ├─→ 内部文档
     └─→ Git 历史
```

**MCP 的解决方案**：

```
┌─────────────┐
│     LLM     │
└──────┬──────┘
       │ MCP Protocol
       ▼
┌─────────────┐
│  MCP Client │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│         MCP Server          │
│  ┌────────┐  ┌────────┐    │
│  │ Files  │  │  DB    │    │
│  ├────────┤  ├────────┤    │
│  │  API   │  │  Git   │    │
│  └────────┘  └────────┘    │
└─────────────────────────────┘
```

### MCP 的三大核心能力

#### 1. Resources（资源访问）

**定义**: 提供对数据源的**只读**访问

**特点**：
- 类似于文件系统
- 支持读取操作
- 可以列表、搜索、获取

**示例**：
```python
# MCP Server 定义的资源
resources = {
    "file:///home/user/project/README.md": {
        "uri": "file:///home/user/project/README.md",
        "name": "Project README",
        "description": "项目说明文档",
        "mimeType": "text/markdown"
    },
    "db://users/123": {
        "uri": "db://users/123",
        "name": "User 123",
        "description": "用户 123 的信息",
        "mimeType": "application/json"
    }
}
```

#### 2. Tools（工具调用）

**定义**: 提供可执行的函数或操作

**特点**：
- 可以修改数据
- 执行复杂操作
- 有输入输出

**示例**：
```python
# MCP Server 定义的工具
tools = {
    "read_file": {
        "name": "read_file",
        "description": "读取文件内容",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "文件路径"
                }
            },
            "required": ["path"]
        }
    },
    "write_file": {
        "name": "write_file",
        "description": "写入文件",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["path", "content"]
        }
    },
    "execute_query": {
        "name": "execute_query",
        "description": "执行数据库查询",
        "inputSchema": {
            "type": "object",
            "properties": {
                "sql": {"type": "string"},
                "params": {"type": "array"}
            }
        }
    }
}
```

#### 3. Prompts（提示模板）

**定义**: 预定义的提示词模板

**用途**：
- 标准化常见任务
- 提供最佳实践
- 简化操作

**示例**：
```python
# MCP Server 定义的提示模板
prompts = {
    "review_code": {
        "name": "review_code",
        "description": "代码审查提示模板",
        "arguments": [
            {
                "name": "file_path",
                "description": "要审查的文件路径",
                "required": True
            },
            {
                "name": "focus_areas",
                "description": "审查重点（安全、性能、可读性）",
                "required": False
            }
        ]
    },
    "generate_tests": {
        "name": "generate_tests",
        "description": "生成测试用例",
        "arguments": [
            {
                "name": "code",
                "description": "要测试的代码",
                "required": True
            }
        ]
    }
}
```

---

## 第二部分：MCP 协议架构

### 通信模式

**传输层**: MCP 可以运行在多种传输协议上：
- **stdio**: 标准输入输出（最简单）
- **SSE**: Server-Sent Events（Web 应用）
- **WebSocket**: 双向实时通信

**消息格式**: JSON-RPC 2.0

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### 生命周期

```
1. 初始化 (Initialize)
   ↓
2. Server 描述能力 (ServerCapabilities)
   ↓
3. Client 请求 (Request)
   ↓
4. Server 响应 (Response)
   ↓
5. 持续交互 (Ongoing)
   ↓
6. 关闭 (Shutdown)
```

---

## 第三部分：构建 MCP Server

### 项目结构

```
my-mcp-server/
├── server.py              # MCP Server 主文件
├── resources.py           # Resources 实现
├── tools.py              # Tools 实现
├── prompts.py            # Prompts 实现
├── config.json           # 配置文件
└── requirements.txt      # 依赖
```

### 基础实现

#### 步骤 1: 安装依赖

```bash
pip install mcp
```

#### 步骤 2: 创建 Server

```python
# server.py
from mcp.server import Server
from mcp.types import Tool, Resource

# 创建 Server 实例
server = Server("my-custom-server")

@server.list_resources()
async def list_resources() -> list[Resource]:
    """列出所有可用资源"""
    return [
        Resource(
            uri="file:///config/app.json",
            name="Application Config",
            description="应用配置文件",
            mimeType="application/json"
        ),
        Resource(
            uri="file:///logs/app.log",
            name="Application Logs",
            description="应用日志文件",
            mimeType="text/plain"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    """读取资源内容"""
    if uri == "file:///config/app.json":
        with open("config/app.json", "r") as f:
            return f.read()
    elif uri == "file:///logs/app.log":
        with open("logs/app.log", "r") as f:
            return f.read()
    else:
        raise ValueError(f"Unknown resource: {uri}")
```

#### 步骤 3: 添加 Tools

```python
# tools.py
import os
import subprocess
from typing import Any

@server.list_tools()
async def list_tools() -> list[Tool]:
    """列出所有可用工具"""
    return [
        Tool(
            name="read_file",
            description="读取文件内容",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "文件路径"
                    }
                },
                "required": ["path"]
            }
        ),
        Tool(
            name="write_file",
            description="写入文件",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"}
                },
                "required": ["path", "content"]
            }
        ),
        Tool(
            name="search_code",
            description="在代码库中搜索",
            inputSchema={
                "type": "object",
                "properties": {
                    "pattern": {"type": "string"},
                    "file_pattern": {"type": "string"}
                },
                "required": ["pattern"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Any) -> str:
    """调用工具"""
    if name == "read_file":
        return read_file(arguments["path"])
    elif name == "write_file":
        return write_file(arguments["path"], arguments["content"])
    elif name == "search_code":
        return search_code(arguments["pattern"])
    else:
        raise ValueError(f"Unknown tool: {name}")


def read_file(path: str) -> str:
    """读取文件"""
    try:
        with open(path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return f"Error: File not found: {path}"
    except Exception as e:
        return f"Error: {str(e)}"


def write_file(path: str, content: str) -> str:
    """写入文件"""
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, 'w') as f:
            f.write(content)

        return f"Successfully wrote to {path}"
    except Exception as e:
        return f"Error: {str(e)}"


def search_code(pattern: str, file_pattern: str = None) -> str:
    """搜索代码"""
    try:
        cmd = ["grep", "-r", pattern, "."]

        if file_pattern:
            cmd.extend(["--include", file_pattern])

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd="."
        )

        if result.returncode == 0:
            return result.stdout
        else:
            return "No matches found"
    except Exception as e:
        return f"Error: {str(e)}"
```

#### 步骤 4: 添加 Prompts

```python
# prompts.py
from mcp.types import Prompt

@server.list_prompts()
async def list_prompts() -> list[Prompt]:
    """列出所有提示模板"""
    return [
        Prompt(
            name="review_code",
            description="代码审查",
            arguments=[
                {
                    "name": "code",
                    "description": "要审查的代码",
                    "required": True
                },
                {
                    "name": "focus",
                    "description": "审查重点（安全、性能、可读性）",
                    "required": False
                }
            ]
        ),
        Prompt(
            name="explain_error",
            description="解释错误信息",
            arguments=[
                {
                    "name": "error_message",
                    "description": "错误信息",
                    "required": True
                },
                {
                    "name": "context",
                    "description": "相关代码上下文",
                    "required": False
                }
            ]
        )
    ]

@server.get_prompt()
async def get_prompt(name: str, arguments: dict) -> str:
    """获取提示模板内容"""
    if name == "review_code":
        code = arguments.get("code", "")
        focus = arguments.get("focus", "general")

        return f"""请审查以下代码：

```python
{code}
```

审查重点: {focus}

请检查：
1. 代码正确性
2. 潜在的安全问题
3. 性能优化空间
4. 代码可读性
5. 最佳实践建议

请提供具体的改进建议。"""

    elif name == "explain_error":
        error_msg = arguments.get("error_message", "")
        context = arguments.get("context", "")

        return f"""请解释以下错误：

错误信息:
{error_msg}

相关代码:
{context}

请提供：
1. 错误原因分析
2. 可能的解决方案
3. 如何预防此类错误"""

    else:
        raise ValueError(f"Unknown prompt: {name}")
```

#### 步骤 5: 主程序

```python
# main.py
import asyncio
from server import server

async def main():
    """启动 MCP Server"""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 第四部分：实战案例

### 案例 1: 日志分析 MCP Server

**功能**:
- 读取日志文件
- 分析错误
- 过滤日志
- 生成报告

**实现**:

```python
# log_analyzer_server.py
from mcp.server import Server
from mcp.types import Tool, Resource
import re
from datetime import datetime
from collections import Counter

server = Server("log-analyzer")

# Resources
@server.list_resources()
async def list_logs() -> list[Resource]:
    """列出可用的日志文件"""
    logs_dir = "logs"
    log_files = []

    for filename in os.listdir(logs_dir):
        if filename.endswith(".log"):
            log_files.append(Resource(
                uri=f"log:///{filename}",
                name=filename,
                description=f"日志文件: {filename}",
                mimeType="text/plain"
            ))

    return log_files

@server.read_resource()
async def read_log(uri: str) -> str:
    """读取日志内容"""
    filename = uri.replace("log:///", "")
    path = os.path.join("logs", filename)

    with open(path, 'r') as f:
        return f.read()

# Tools
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="analyze_errors",
            description="分析日志中的错误",
            inputSchema={
                "type": "object",
                "properties": {
                    "log_file": {
                        "type": "string",
                        "description": "日志文件名"
                    },
                    "level": {
                        "type": "string",
                        "enum": ["ERROR", "WARNING", "CRITICAL"],
                        "description": "日志级别"
                    }
                },
                "required": ["log_file"]
            }
        ),
        Tool(
            name="filter_by_time",
            description="按时间过滤日志",
            inputSchema={
                "type": "object",
                "properties": {
                    "log_file": {"type": "string"},
                    "start_time": {"type": "string"},
                    "end_time": {"type": "string"}
                },
                "required": ["log_file", "start_time", "end_time"]
            }
        ),
        Tool(
            name="generate_report",
            description="生成日志分析报告",
            inputSchema={
                "type": "object",
                "properties": {
                    "log_file": {"type": "string"}
                },
                "required": ["log_file"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    if name == "analyze_errors":
        return analyze_errors(arguments["log_file"], arguments.get("level"))
    elif name == "filter_by_time":
        return filter_by_time(
            arguments["log_file"],
            arguments["start_time"],
            arguments["end_time"]
        )
    elif name == "generate_report":
        return generate_report(arguments["log_file"])
    else:
        raise ValueError(f"Unknown tool: {name}")


def analyze_errors(log_file: str, level: str = "ERROR") -> str:
    """分析错误日志"""
    path = os.path.join("logs", log_file)

    errors = []
    error_pattern = re.compile(rf"\[({level})\]")

    with open(path, 'r') as f:
        for line in f:
            if error_pattern.search(line):
                errors.append(line.strip())

    # 统计错误类型
    error_types = Counter()
    for error in errors:
        # 提取错误类型（简化示例）
        if "TypeError" in error:
            error_types["TypeError"] += 1
        elif "ValueError" in error:
            error_types["ValueError"] += 1
        elif "ConnectionError" in error:
            error_types["ConnectionError"] += 1

    result = {
        "total_errors": len(errors),
        "error_types": dict(error_types),
        "sample_errors": errors[:10]  # 返回前 10 个
    }

    return json.dumps(result, indent=2)


def filter_by_time(log_file: str, start_time: str, end_time: str) -> str:
    """按时间过滤日志"""
    path = os.path.join("logs", log_file)

    start = datetime.fromisoformat(start_time)
    end = datetime.fromisoformat(end_time)

    filtered = []

    # 假设日志格式: [2025-01-15 14:30:22] ...
    time_pattern = re.compile(r"\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]")

    with open(path, 'r') as f:
        for line in f:
            match = time_pattern.search(line)
            if match:
                log_time = datetime.fromisoformat(match.group(1))
                if start <= log_time <= end:
                    filtered.append(line.strip())

    return "\n".join(filtered)


def generate_report(log_file: str) -> str:
    """生成日志分析报告"""
    path = os.path.join("logs", log_file)

    # 统计各种信息
    total_lines = 0
    levels = Counter()
    hourly_distribution = Counter()

    time_pattern = re.compile(r"\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)")
    level_pattern = re.compile(r"\[(ERROR|WARNING|INFO|DEBUG|CRITICAL)\]")

    with open(path, 'r') as f:
        for line in f:
            total_lines += 1

            # 统计日志级别
            level_match = level_pattern.search(line)
            if level_match:
                levels[level_match.group(1)] += 1

            # 统计小时分布
            time_match = time_pattern.search(line)
            if time_match:
                hour = time_match.group(1)[:13]  # 提取到小时
                hourly_distribution[hour] += 1

    report = f"""
# 日志分析报告

文件: {log_file}
生成时间: {datetime.now().isoformat()}

## 概览
- 总行数: {total_lines}
- 时间跨度: {len(hourly_distribution)} 小时

## 日志级别分布
{json.dumps(dict(levels), indent=2)}

## 每小时日志量（Top 10）
{json.dumps(dict(hourly_distribution.most_common(10)), indent=2)}

## 建议
"""

    if levels["ERROR"] > 100:
        report += "- ⚠️ 错误数量过多，建议优先处理\n"

    if levels["WARNING"] > 500:
        report += "- ⚠️ 警告数量较多，建议检查\n"

    return report
```

### 案例 2: Git 历史 MCP Server

**功能**:
- 获取提交历史
- 搜索提交信息
- 查看文件变更
- 分析贡献者

**实现**:

```python
# git_history_server.py
from mcp.server import Server
from mcp.types import Tool
import subprocess
import json

server = Server("git-history")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_commits",
            description="获取 Git 提交历史",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "返回数量限制",
                        "default": 10
                    },
                    "branch": {
                        "type": "string",
                        "description": "分支名",
                        "default": "main"
                    }
                }
            }
        ),
        Tool(
            name="search_commits",
            description="搜索提交信息",
            inputSchema={
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词"
                    }
                },
                "required": ["keyword"]
            }
        ),
        Tool(
            name="show_file_diff",
            description="显示文件变更",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "文件路径"
                    },
                    "commit_hash": {
                        "type": "string",
                        "description": "提交哈希（可选）"
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="get_contributors",
            description="获取贡献者统计",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    if name == "get_commits":
        return get_commits(arguments.get("limit", 10), arguments.get("branch", "main"))
    elif name == "search_commits":
        return search_commits(arguments["keyword"])
    elif name == "show_file_diff":
        return show_file_diff(arguments["file_path"], arguments.get("commit_hash"))
    elif name == "get_contributors":
        return get_contributors()
    else:
        raise ValueError(f"Unknown tool: {name}")


def get_commits(limit: int = 10, branch: str = "main") -> str:
    """获取提交历史"""
    try:
        result = subprocess.run(
            ["git", "log", "-n", str(limit), branch, "--pretty=format:%H|%an|%ae|%ad|%s"],
            capture_output=True,
            text=True,
            cwd="."
        )

        if result.returncode != 0:
            return f"Error: {result.stderr}"

        commits = []
        for line in result.stdout.strip().split("\n"):
            if line:
                hash_val, author, email, date, message = line.split("|", 4)
                commits.append({
                    "hash": hash_val,
                    "author": author,
                    "email": email,
                    "date": date,
                    "message": message
                })

        return json.dumps(commits, indent=2, ensure_ascii=False)

    except Exception as e:
        return f"Error: {str(e)}"


def search_commits(keyword: str) -> str:
    """搜索提交信息"""
    try:
        result = subprocess.run(
            ["git", "log", "--all", "--grep", keyword, "--pretty=format:%H|%an|%ad|%s"],
            capture_output=True,
            text=True,
            cwd="."
        )

        if result.returncode != 0:
            return f"Error: {result.stderr}"

        commits = []
        for line in result.stdout.strip().split("\n"):
            if line:
                hash_val, author, date, message = line.split("|", 3)
                commits.append({
                    "hash": hash_val,
                    "author": author,
                    "date": date,
                    "message": message
                })

        return json.dumps(commits, indent=2, ensure_ascii=False)

    except Exception as e:
        return f"Error: {str(e)}"


def show_file_diff(file_path: str, commit_hash: str = None) -> str:
    """显示文件变更"""
    try:
        if commit_hash:
            result = subprocess.run(
                ["git", "show", f"{commit_hash}:{file_path}"],
                capture_output=True,
                text=True,
                cwd="."
            )
        else:
            result = subprocess.run(
                ["git", "diff", "HEAD", file_path],
                capture_output=True,
                text=True,
                cwd="."
            )

        if result.returncode != 0:
            return f"Error: {result.stderr}"

        return result.stdout

    except Exception as e:
        return f"Error: {str(e)}"


def get_contributors() -> str:
    """获取贡献者统计"""
    try:
        result = subprocess.run(
            ["git", "shortlog", "-sn", "--all"],
            capture_output=True,
            text=True,
            cwd="."
        )

        if result.returncode != 0:
            return f"Error: {result.stderr}"

        contributors = []
        for line in result.stdout.strip().split("\n"):
            if line:
                commits, author = line.strip().split("\t")
                contributors.append({
                    "author": author,
                    "commits": int(commits)
                })

        return json.dumps(contributors, indent=2, ensure_ascii=False)

    except Exception as e:
        return f"Error: {str(e)}"
```

---

## 第五部分：安全和最佳实践

### 安全考虑

#### 1. 权限控制

**原则**: 最小权限原则

```python
class SecureMCPServer(Server):
    def __init__(self):
        super().__init__("secure-server")
        self.allowed_paths = ["/home/user/project"]
        self.readonly = False

    def check_permission(self, path: str, operation: str) -> bool:
        """检查权限"""
        # 检查路径是否在允许范围内
        real_path = os.path.realpath(path)
        if not any(real_path.startswith(allowed) for allowed in self.allowed_paths):
            return False

        # 检查操作权限
        if operation == "write" and self.readonly:
            return False

        # 检查敏感文件
        sensitive_patterns = [".env", "secret", "password", "key"]
        if any(pattern in real_path for pattern in sensitive_patterns):
            return False

        return True

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> str:
        # 权限检查
        if name == "write_file":
            path = arguments["path"]
            if not self.check_permission(path, "write"):
                return "Error: Permission denied"

        # 执行操作
        return await super().call_tool(name, arguments)
```

#### 2. 输入验证

```python
def validate_tool_arguments(tool_name: str, arguments: dict) -> bool:
    """验证工具参数"""

    if tool_name == "execute_command":
        # 禁止执行危险命令
        dangerous_commands = ["rm -rf", "format", "shutdown", "reboot"]
        cmd = arguments.get("command", "")

        if any(dangerous in cmd.lower() for dangerous in dangerous_commands):
            raise ValueError("Dangerous command detected")

    if tool_name == "write_file":
        # 验证路径
        path = arguments.get("path", "")

        # 防止路径遍历攻击
        if ".." in path or path.startswith("/"):
            raise ValueError("Invalid path")

    return True
```

#### 3. 速率限制

```python
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_requests: int = 100, window: int = 60):
        self.max_requests = max_requests
        self.window = window
        self.requests = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        """检查是否允许请求"""
        now = time.time()

        # 清理过期记录
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if now - req_time < self.window
        ]

        # 检查是否超限
        if len(self.requests[client_id]) >= self.max_requests:
            return False

        # 记录请求
        self.requests[client_id].append(now)
        return True

# 使用
rate_limiter = RateLimiter(max_requests=100, window=60)

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    client_id = arguments.get("client_id", "default")

    if not rate_limiter.is_allowed(client_id):
        return "Error: Rate limit exceeded"

    # 执行操作
    ...
```

### 性能优化

#### 1. 缓存

```python
from functools import lru_cache
import hashlib

class CachedMCPServer(Server):
    def __init__(self):
        super().__init__("cached-server")
        self.cache = {}

    def get_cache_key(self, method: str, **kwargs) -> str:
        """生成缓存键"""
        data = f"{method}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(data.encode()).hexdigest()

    @server.call_tool()
    async def call_tool(self, name: str, arguments: dict) -> str:
        cache_key = self.get_cache_key(name, **arguments)

        # 检查缓存
        if cache_key in self.cache:
            return self.cache[cache_key]

        # 执行操作
        result = await self.execute_tool(name, arguments)

        # 缓存结果
        self.cache[cache_key] = result

        return result
```

#### 2. 流式响应

```python
async def stream_large_file(path: str):
    """流式读取大文件"""
    chunk_size = 8192  # 8KB

    with open(path, 'r') as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            yield chunk
```

---

## 📊 知识检查

### 自我评估

1. **MCP 协议的三大核心能力是什么？它们有什么区别？**

2. **如何实现一个自定义的 MCP Server？需要哪些步骤？**

3. **MCP Server 中的 Tools 和 Resources 有什么区别？何时使用哪个？**

4. **在设计 MCP Server 时，如何确保安全性？**

5. **如何优化 MCP Server 的性能？**

---

## 🎯 实践建议

### 开发流程

**1. 设计阶段**
- 明确数据源
- 定义 Resources
- 设计 Tools
- 规划 Prompts

**2. 实现阶段**
- 先实现核心功能
- 添加错误处理
- 编写测试
- 编写文档

**3. 测试阶段**
- 单元测试
- 集成测试
- 安全测试
- 性能测试

**4. 部署阶段**
- 配置监控
- 设置日志
- 准备回滚

### 调试技巧

**1. 日志记录**
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("mcp-server")

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> str:
    logger.debug(f"Calling tool: {name} with args: {arguments}")
    ...
```

**2. 交互式测试**
```bash
# 使用 MCP Inspector 测试
mcp-inspector server.py
```

---

## 📚 延伸阅读

### 官方文档

1. [MCP Specification](https://spec.modelcontextprotocol.io/)
2. [MCP SDK Documentation](https://github.com/modelcontextprotocol/python-sdk)
3. [MCP Examples](https://github.com/modelcontextprotocol/servers)

### 实现参考

1. [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
2. [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
3. [PostgreSQL MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)

---

**下一阅读**: [Coding Agent 最佳实践](./03-coding-agent-best-practices.md)
