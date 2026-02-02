# Week 3 MCP 服务器 - 技术架构文档

本文档详细说明 GitHub MCP 服务器的技术原理、架构设计和实现细节。

---

## 目录

1. [项目概述](#项目概述)
2. [MCP 协议原理](#mcp-协议原理)
3. [系统架构](#系统架构)
4. [核心组件](#核心组件)
5. [工具实现](#工具实现)
6. [错误处理](#错误处理)
7. [客户端集成](#客户端集成)
8. [技术栈详解](#技术栈详解)
9. [安全性考虑](#安全性考虑)
10. [性能优化](#性能优化)

---

## 项目概述

### 目标

构建一个 Model Context Protocol (MCP) 服务器，包装 GitHub API，让 AI 助手能够查询仓库信息和 Issues。

### 技术挑战

1. **协议适配** - 理解并实现 MCP 协议
2. **异步编程** - 使用 Python asyncio 处理并发
3. **错误处理** - 优雅处理各种 API 错误
4. **日志规范** - 遵循 MCP 的日志要求（stderr only）

---

## MCP 协议原理

### 什么是 MCP？

MCP (Model Context Protocol) 是一个开放协议，定义了 AI 应用与外部系统之间的通信标准。

```
┌─────────────────────────────────────────────────────────┐
│                    MCP 架构图                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐         ┌──────────┐         ┌───────┐  │
│   │   AI    │◄───────►│ MCP 客户端│◄───────►│ MCP   │  │
│   │ 助手    │  JSON   │ (Claude  │  STDIO  │ 服务器 │  │
│   │         │  -RPC   │   CLI)   │         │       │  │
│   └─────────┘         └──────────┘         └───┬───┘  │
│                                              │       │
│                                              ▼       │
│                                       ┌───────────┐  │
│                                       │ 外部 API  │  │
│                                       │(GitHub)   │  │
│                                       └───────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### MCP 核心概念

#### 1. 传输层 (Transport)

MCP 支持多种传输方式：

| 传输方式 | 描述 | 优势 | 适用场景 |
|----------|------|------|----------|
| **STDIO** | 标准输入/输出 | 简单、安全 | 本地运行 |
| **HTTP/SSE** | HTTP + Server-Sent Events | 远程访问 | 云部署 |

本项目使用 **STDIO** 传输。

#### 2. 资源 (Resources)

只读的数据源，如文件、数据库记录等。

#### 3. 工具 (Tools)

可执行的函数，可以执行副作用操作。本项目实现两个工具。

#### 4. 提示 (Prompts)

预定义的提示模板。

### JSON-RPC 2.0 消息格式

MCP 使用 JSON-RPC 2.0 协议进行通信：

```json
// 请求消息
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_repository_info",
    "arguments": {
      "owner": "microsoft",
      "repo": "vscode"
    }
  }
}

// 响应消息
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# 仓库信息\n..."
      }
    ]
  }
}

// 错误消息
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params"
  }
}
```

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      系统分层架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              应用层 (Application Layer)              │   │
│  │  • 工具注册 (Tool Registration)                      │   │
│  │  • 工具调用 (Tool Invocation)                        │   │
│  │  • 结果格式化 (Result Formatting)                     │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │              MCP 协议层 (MCP Protocol Layer)         │   │
│  │  • JSON-RPC 消息处理                                 │   │
│  │  • STDIO 传输管理                                    │   │
│  │  • 服务器生命周期管理                                │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │              业务逻辑层 (Business Logic Layer)       │   │
│  │  • GitHubClient (API 客户端)                        │   │
│  │  • get_repository_info()                            │   │
│  │  • get_repository_issues()                          │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │              数据访问层 (Data Access Layer)          │   │
│  │  • HTTP 请求处理                                     │   │
│  │  • 响应解析                                         │   │
│  │  • 错误检测                                         │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │              外部服务层 (External Services)          │   │
│  │  • GitHub REST API v3                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 代码组织结构

```
server/
├── __init__.py         # 包声明
└── main.py             # 主程序（约 450 行）
    │
    ├── 导入和配置
    │   ├── MCP SDK 导入
    │   ├── 日志配置（stderr）
    │   └── 环境变量加载
    │
    ├── GitHubClient 类
    │   ├── 异步上下文管理器
    │   ├── get() 方法（API 调用）
    │   └── 错误处理
    │
    ├── MCP 工具注册
    │   ├── list_tools() 装饰器
    │   └── 工具 Schema 定义
    │
    ├── 工具处理逻辑
    │   ├── call_tool() 处理器
    │   ├── get_repository_info()
    │   └── get_repository_issues()
    │
    └── 服务器入口
        ├── stdio_server()
        └── server.run()
```

---

## 核心组件

### 1. GitHubClient - API 客户端

#### 设计模式：异步上下文管理器

```python
class GitHubClient:
    async def __aenter__(self):
        # 初始化 HTTP 客户端
        self._client = httpx.AsyncClient(...)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # 清理资源
        await self._client.aclose()

    async def get(self, endpoint: str, params: dict) -> dict:
        # 发送 HTTP 请求
        response = await self._client.get(endpoint, params=params)
        return response.json()
```

#### 为什么使用异步？

| 方面 | 同步 | 异步 |
|------|------|------|
| **阻塞** | 每个请求阻塞线程 | 不阻塞事件循环 |
| **并发** | 需要多线程 | 单线程并发 |
| **资源** | 线程开销大 | 轻量级协程 |
| **MCP 要求** | - | ✅ 必须异步 |

#### 请求头配置

```python
headers = {
    "Accept": "application/vnd.github.v3+json",  # 指定 API 版本
    "User-Agent": "GitHub-MCP-Server/1.0",       # GitHub 要求
    "Authorization": f"Bearer {token}"            # 可选认证
}
```

### 2. MCP 服务器实例

```python
server = Server("github-mcp-server")

# 装饰器模式注册工具
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [...]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    return [...]
```

### 3. 工具 Schema 定义

使用 JSON Schema 定义工具接口：

```python
Tool(
    name="get_repository_info",
    description="获取 GitHub 仓库的详细信息",
    inputSchema={
        "type": "object",
        "properties": {
            "owner": {"type": "string"},
            "repo": {"type": "string"}
        },
        "required": ["owner", "repo"]
    }
)
```

---

## 工具实现

### 工具 1: get_repository_info

#### 功能

获取 GitHub 仓库的完整信息。

#### 实现流程

```
用户请求
   │
   ▼
解析参数 (owner, repo)
   │
   ▼
调用 GitHub API: GET /repos/{owner}/{repo}
   │
   ▼
解析 JSON 响应
   │
   ▼
格式化为可读文本
   │
   ▼
返回 TextContent
```

#### GitHub API 端点

```
GET /repos/{owner}/{repo}

响应示例：
{
  "id": 12345678,
  "name": "vscode",
  "full_name": "microsoft/vscode",
  "description": "Visual Studio Code",
  "language": "TypeScript",
  "stargazers_count": 181175,
  "forks_count": 37637,
  "open_issues_count": 13331,
  "created_at": "2015-09-03T00:00:00Z",
  "updated_at": "2026-01-29T00:00:00Z",
  "html_url": "https://github.com/microsoft/vscode"
}
```

### 工具 2: get_repository_issues

#### 功能

获取仓库的 Issues 列表，支持状态过滤和分页。

#### 实现流程

```
用户请求 (owner, repo, state, limit)
   │
   ▼
构建查询参数
   │
   ▼
调用 GitHub API: GET /repos/{owner}/{repo}/issues
   │
   ▼
过滤 Pull Requests
   │
   ▼
格式化每个 Issue
   │
   ▼
返回 TextContent
```

#### GitHub API 端点

```
GET /repos/{owner}/{repo}/issues

查询参数：
- state: open | closed | all
- per_page: 1-100
- sort: created | updated | comments
- direction: asc | desc

响应：Issue 对象数组
```

---

## 错误处理

### 错误分类

```python
try:
    response = await client.get(endpoint)
except httpx.HTTPStatusError as e:
    # HTTP 错误响应
    status = e.response.status_code

    if status == 404:
        # 资源未找到
        raise ValueError("资源未找到")
    elif status == 403:
        # 速率限制或权限
        raise PermissionError("速率限制或权限不足")
    elif status == 401:
        # 未授权
        raise PermissionError("未授权访问")

except httpx.TimeoutException:
    # 请求超时
    raise TimeoutError("请求超时")

except httpx.RequestError:
    # 网络连接失败
    raise ConnectionError("无法连接到 GitHub API")

except Exception:
    # 未预期的错误
    raise RuntimeError("未知错误")
```

### 错误传播

```
GitHub API
   │
   ▼ (HTTP 404)
GitHubClient.get()
   │
   ▼ (raise ValueError)
工具函数
   │
   ▼ (return TextContent with error)
call_tool()
   │
   ▼ (JSON-RPC error response)
MCP 客户端
   │
   ▼
显示错误给用户
```

### 日志策略

MCP 规范要求：**只能使用 stderr，不能使用 stdout**

```python
# ✅ 正确
logging.basicConfig(stream=sys.stderr)

# ❌ 错误（会破坏 MCP 通信）
logging.basicConfig(stream=sys.stdout)
```

日志级别：

| 级别 | 用途 | 示例 |
|------|------|------|
| DEBUG | 详细调试信息 | API 响应头、速率限制配额 |
| INFO | 一般信息 | API 请求、工具调用 |
| WARNING | 警告 | 资源未找到、接近速率限制 |
| ERROR | 错误 | API 失败、连接超时 |

---

## 客户端集成

### Claude CLI 集成

#### 配置流程

```bash
# 1. 添加 MCP 服务器
claude mcp add --transport stdio github -- python -m server.main

# 2. 配置保存到 ~/.claude.json
{
  "mcpServers": {
    "github": {
      "command": "python",
      "args": ["-m", "server.main"],
      "transport": "stdio"
    }
  }
}

# 3. 验证连接
claude mcp list
```

#### 运行时流程

```
┌──────────────────────────────────────────────────────────┐
│              Claude CLI 启动流程                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Claude CLI 启动                                      │
│     │                                                    │
│     ▼                                                    │
│  2. 读取 ~/.claude.json 配置                             │
│     │                                                    │
│     ▼                                                    │
│  3. 为每个 MCP 服务器启动子进程                           │
│     │                                                    │
│     ├─► python -m server.main (github)                   │
│     ├─► npx @z_ai/mcp-server (zai)                      │
│     └─► ...                                              │
│     │                                                    │
│     ▼                                                    │
│  4. 通过 STDIO 建立 JSON-RPC 通信                        │
│     │                                                    │
│     ▼                                                    │
│  5. 调用 server.list_tools() 获取可用工具               │
│     │                                                    │
│     ▼                                                    │
│  6. 等待用户输入...                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 工具调用流程

```
用户输入: "帮我查看 microsoft/vscode 仓库的信息"
   │
   ▼
Claude 分析意图，选择工具
   │
   ▼
发送 JSON-RPC 请求:
{
  "method": "tools/call",
  "params": {
    "name": "get_repository_info",
    "arguments": {"owner": "microsoft", "repo": "vscode"}
  }
}
   │
   ▼
MCP 服务器处理请求
   │
   ▼
调用 GitHub API
   │
   ▼
返回 JSON-RPC 响应:
{
  "result": {
    "content": [{"type": "text", "text": "# 仓库信息..."}]
  }
}
   │
   ▼
Claude 格式化并展示结果
```

### Claude Desktop 集成（可选）

配置文件位置：

| 操作系统 | 配置文件 |
|----------|----------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

---

## 技术栈详解

### 1. MCP SDK (`mcp` >= 0.9.0)

**核心类**：

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# 创建服务器
server = Server("server-name")

# 装饰器
@server.list_tools()   # 注册工具列表
@server.call_tool()    # 处理工具调用

# STDIO 传输
async with stdio_server() as (read_stream, write_stream):
    await server.run(read_stream, write_stream)
```

### 2. HTTPX (`httpx` >= 0.27.0)

**为什么选择 HTTPX？**

| 特性 | HTTPX | Requests |
|------|-------|----------|
| 异步支持 | ✅ 原生 | ❌ 需要 aiohttp |
| HTTP/2 | ✅ 支持 | ❌ 不支持 |
| 类型提示 | ✅ 完整 | ⚠️ 部分 |
| 维护状态 | ✅ 活跃 | ⚠️ 低频 |

**异步客户端**：

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get(url, params=params, timeout=30)
    data = response.json()
```

### 3. Pydantic (数据验证)

MCP SDK 内部使用 Pydantic 验证工具参数：

```python
from mcp.types import Tool

# 工具定义会被验证
Tool(
    name="tool_name",           # 必需，string
    description="...",          # 必需，string
    inputSchema={               # 必需，JSON Schema dict
        "type": "object",
        "properties": {...},
        "required": [...]
    }
)
```

### 4. Python-dotenv (环境变量)

```python
from dotenv import load_dotenv
import os

load_dotenv()  # 加载 .env 文件

token = os.getenv("GITHUB_TOKEN", "")  # 带默认值
```

---

## 安全性考虑

### 1. API Token 管理

**最佳实践**：

```env
# .env (不提交到 Git)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# .env.example (提交到 Git)
GITHUB_TOKEN=
```

**Git 忽略**：

```
# .gitignore
.env
__pycache__/
*.pyc
```

### 2. 速率限制

GitHub API 速率限制：

| 认证状态 | 限制 | 重置时间 |
|----------|------|----------|
| 未认证 | 60 次/小时 | 每小时 |
| 已认证 | 5000 次/小时 | 每小时 |

**响应头检测**：

```python
remaining = response.headers.get("X-RateLimit-Remaining")
if int(remaining) < 10:
    logger.warning("接近 API 速率限制")
```

### 3. 输入验证

```python
# 验证必需参数
if not owner or not repo:
    raise ValueError("缺少必需参数: owner 和 repo")

# 限制数量范围
limit = min(args.get("limit", 10), 100)
```

### 4. 错误信息脱敏

```python
# ❌ 不要泄露敏感信息
logger.error(f"Token: {token}")

# ✅ 只记录必要信息
logger.error(f"请求失败: endpoint={endpoint}")
```

---

## 性能优化

### 1. 异步并发

可以同时发起多个请求：

```python
async def fetch_multiple_repos(repos):
    async with GitHubClient() as client:
        tasks = [
            get_repository_info(client, repo)
            for repo in repos
        ]
        return await asyncio.gather(*tasks)
```

### 2. 连接复用

使用 `AsyncClient` 上下文管理器自动复用连接：

```python
async with GitHubClient() as client:
    # 多个请求共享同一个连接
    await client.get("/repos/owner/repo1")
    await client.get("/repos/owner/repo2")
```

### 3. 超时控制

```python
# 全局超时
TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))

# 每个请求的超时
self._client = httpx.AsyncClient(timeout=timeout)
```

---

## 测试策略

### 测试覆盖

```python
# test_server.py
async def main():
    # 测试 1: API 连接
    await test_github_client()

    # 测试 2: 工具 1
    await test_get_repository_info()

    # 测试 3: 工具 2
    await test_get_repository_issues()

    # 测试 4: 错误处理
    await test_error_handling()
```

### 运行测试

```bash
# 直接运行
python test_server.py

# 使用 pytest（如果添加）
pytest tests/
```

---

## 部署考虑

### 本地部署 (当前实现)

- ✅ 简单快速
- ✅ 无需网络配置
- ✅ 适合开发调试

### 远程部署 (未来扩展)

使用 HTTP/SSE 传输：

```python
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Route

# 创建 Starlette 应用
app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse)
    ]
)

# SSE 端点
async def handle_sse(request):
    transport = SseServerTransport("/messages")
    await server.run(transport, request)
```

部署到 Vercel/Cloudflare Workers：
- 添加 `requirements.txt`
- 配置 API 端点
- 设置环境变量

---

## 总结

### 关键技术点

| 技术 | 作用 | 难点 |
|------|------|------|
| MCP 协议 | AI 与外部系统通信 | 理解 JSON-RPC 规范 |
| AsyncIO | 异步编程 | 协程和事件循环 |
| HTTPX | HTTP 客户端 | 异步请求处理 |
| 错误处理 | 优雅降级 | 分类和传播 |
| 日志规范 | MCP 兼容 | stderr only |

### 学习收获

1. **协议设计** - 理解了 MCP 如何定义标准化通信
2. **异步编程** - 掌握了 Python asyncio 的使用
3. **API 集成** - 学会了包装外部 API 的最佳实践
4. **错误处理** - 建立了完善的错误处理体系
5. **文档编写** - 编写了清晰的技术文档

### 扩展方向

1. **更多工具** - 创建 Issue、查看 PR、获取文件内容
2. **缓存机制** - 减少 API 调用
3. **Webhook 支持** - 实时事件通知
4. **远程部署** - HTTP/SSE 传输
5. **OAuth2** - 安全的身份验证

---

## 参考资料

- [MCP 官方文档](https://modelcontextprotocol.io)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification)
- [Python AsyncIO 教程](https://docs.python.org/3/library/asyncio.html)
- [HTTPX 文档](https://www.python-httpx.org/)
