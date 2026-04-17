#!/usr/bin/env python3
"""
GitHub MCP Server - 主入口

一个 Model Context Protocol 服务器，包装 GitHub API。
提供工具来查询仓库信息和 Issues。

运行方式:
    python -m server.main
或
    python server/main.py
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志 - MCP STDIO 服务器必须使用 stderr，不能用 stdout
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stderr  # 重要：STDIO 服务器必须使用 stderr
)
logger = logging.getLogger(__name__)

# GitHub API 配置
GITHUB_API_BASE = os.getenv("GITHUB_API_BASE_URL", "https://api.github.com")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))

# 创建 MCP 服务器实例
server = Server("github-mcp-server")
app = server  # 别名，便于使用


# ============================================================================
# GitHub API 客户端
# ============================================================================

class GitHubClient:
    """GitHub API 客户端"""

    def __init__(self):
        self.base_url = GITHUB_API_BASE
        self.token = GITHUB_TOKEN
        self.timeout = REQUEST_TIMEOUT
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self):
        """异步上下文管理器入口"""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-MCP-Server/1.0",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        else:
            logger.info("未设置 GITHUB_TOKEN，将使用未认证请求（速率限制更严格）")

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            timeout=self.timeout
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器退出"""
        if self._client:
            await self._client.aclose()

    async def get(self, endpoint: str, params: dict | None = None) -> dict[str, Any]:
        """
        发送 GET 请求到 GitHub API

        Args:
            endpoint: API 端点（如 "/repos/{owner}/{repo}"）
            params: 查询参数

        Returns:
            解析后的 JSON 响应

        Raises:
            httpx.HTTPStatusError: HTTP 错误
            httpx.TimeoutError: 请求超时
        """
        if not self._client:
            raise RuntimeError("GitHubClient 未初始化，请使用 'async with' 语法")

        try:
            logger.info(f"请求 GitHub API: GET {endpoint}")
            response = await self._client.get(endpoint, params=params)
            response.raise_for_status()

            # 检查速率限制
            remaining = response.headers.get("X-RateLimit-Remaining", "unknown")
            logger.debug(f"剩余 API 配额: {remaining}")

            return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"资源未找到: {endpoint}")
                raise ValueError(f"GitHub API 资源未找到: {endpoint}") from e
            elif e.response.status_code == 403:
                logger.error(f"API 速率限制或权限不足: {e.response.text}")
                raise PermissionError("GitHub API 速率限制或权限不足") from e
            else:
                logger.error(f"GitHub API 错误: {e.response.status_code} - {e.response.text}")
                raise

        except httpx.TimeoutException as e:
            logger.error(f"请求超时: {endpoint}")
            raise TimeoutError(f"请求超时（{self.timeout}秒）") from e

        except httpx.RequestError as e:
            logger.error(f"网络错误: {e}")
            raise ConnectionError(f"无法连接到 GitHub API") from e


# ============================================================================
# MCP 工具实现
# ============================================================================

@server.list_tools()
async def list_tools() -> list[Tool]:
    """
    列出所有可用的 MCP 工具

    Returns:
        工具定义列表
    """
    return [
        Tool(
            name="get_repository_info",
            description="获取 GitHub 仓库的详细信息，包括描述、星标数、语言等",
            inputSchema={
                "type": "object",
                "properties": {
                    "owner": {
                        "type": "string",
                        "description": "仓库所有者（用户名或组织名）"
                    },
                    "repo": {
                        "type": "string",
                        "description": "仓库名称"
                    }
                },
                "required": ["owner", "repo"]
            }
        ),
        Tool(
            name="get_repository_issues",
            description="获取 GitHub 仓库的 Issues 列表，支持过滤和分页",
            inputSchema={
                "type": "object",
                "properties": {
                    "owner": {
                        "type": "string",
                        "description": "仓库所有者（用户名或组织名）"
                    },
                    "repo": {
                        "type": "string",
                        "description": "仓库名称"
                    },
                    "state": {
                        "type": "string",
                        "enum": ["open", "closed", "all"],
                        "description": "Issue 状态（默认: open）"
                    },
                    "limit": {
                        "type": "number",
                        "description": "返回的 Issues 数量（默认: 10，最大: 100）"
                    }
                },
                "required": ["owner", "repo"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """
    处理工具调用请求

    Args:
        name: 工具名称
        arguments: 工具参数

    Returns:
        文本内容列表
    """
    logger.info(f"调用工具: {name} 参数: {arguments}")

    try:
        async with GitHubClient() as client:
            if name == "get_repository_info":
                return await get_repository_info(client, arguments)
            elif name == "get_repository_issues":
                return await get_repository_issues(client, arguments)
            else:
                raise ValueError(f"未知工具: {name}")

    except (ValueError, PermissionError, TimeoutError, ConnectionError) as e:
        logger.error(f"工具执行错误: {e}")
        return [TextContent(type="text", text=f"错误: {str(e)}")]
    except Exception as e:
        logger.exception(f"未预期的错误: {e}")
        return [TextContent(type="text", text=f"未预期的错误: {str(e)}")]


async def get_repository_info(client: GitHubClient, args: dict[str, Any]) -> list[TextContent]:
    """
    获取仓库信息

    Args:
        client: GitHub API 客户端
        args: 参数字典，包含 owner 和 repo

    Returns:
        包含仓库信息的文本内容
    """
    owner = args.get("owner")
    repo = args.get("repo")

    if not owner or not repo:
        raise ValueError("缺少必需参数: owner 和 repo")

    # 调用 GitHub API
    data = await client.get(f"/repos/{owner}/{repo}")

    # 格式化输出
    result = {
        "name": data.get("name"),
        "full_name": data.get("full_name"),
        "description": data.get("description"),
        "language": data.get("language"),
        "stars": data.get("stargazers_count"),
        "forks": data.get("forks_count"),
        "open_issues": data.get("open_issues_count"),
        "url": data.get("html_url"),
        "created_at": data.get("created_at"),
        "updated_at": data.get("updated_at"),
    }

    # 构建可读的文本输出
    output = f"""
# 仓库信息

**名称**: {result['full_name']}

**描述**: {result['description'] or '无描述'}

**统计**:
- ⭐ Stars: {result['stars']:,}
- 🍴 Forks: {result['forks']:,}
- 🐛 开放 Issues: {result['open_issues']:,}
- 💻 主要语言: {result['language'] or '未知'}

**时间**:
- 创建于: {result['created_at']}
- 更新于: {result['updated_at']}

**链接**: {result['url']}
""".strip()

    return [TextContent(type="text", text=output)]


async def get_repository_issues(client: GitHubClient, args: dict[str, Any]) -> list[TextContent]:
    """
    获取仓库 Issues 列表

    Args:
        client: GitHub API 客户端
        args: 参数字典

    Returns:
        包含 Issues 列表的文本内容
    """
    owner = args.get("owner")
    repo = args.get("repo")
    state = args.get("state", "open")
    limit = min(args.get("limit", 10), 100)  # 限制最多 100 条

    if not owner or not repo:
        raise ValueError("缺少必需参数: owner 和 repo")

    # 调用 GitHub API
    params = {
        "state": state,
        "per_page": limit,
        "sort": "created",
        "direction": "desc"
    }
    data = await client.get(f"/repos/{owner}/{repo}/issues", params=params)

    if not data:
        return [TextContent(type="text", text=f"未找到 {state} 状态的 Issues")]

    # 格式化输出
    output_lines = [f"# {owner}/{repo} 的 Issues (状态: {state}, 显示: {len(data)} 条)\n"]

    for i, issue in enumerate(data, 1):
        # 跳过 Pull Requests（它们也会出现在 issues 端点中）
        if "pull_request" in issue:
            continue

        number = issue.get("number")
        title = issue.get("title")
        body = issue.get("body", "无描述")
        state = issue.get("state")
        created_at = issue.get("created_at")
        url = issue.get("html_url")
        user = issue.get("user", {}).get("login")

        # 截断过长的描述
        if len(body) > 200:
            body = body[:200] + "..."

        output_lines.append(f"""
## Issue #{number}: {title}

- **状态**: {state}
- **创建者**: @{user}
- **创建时间**: {created_at}
- **链接**: {url}

**描述**:
{body}
---
""".strip())

    return [TextContent(type="text", text="\n\n".join(output_lines))]


# ============================================================================
# 主入口
# ============================================================================

async def main():
    """MCP 服务器主入口"""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
