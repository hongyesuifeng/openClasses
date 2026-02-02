# GitHub MCP Server

一个 Model Context Protocol (MCP) 服务器，用于包装 GitHub API。该服务器允许 MCP 客户端（如 Claude CLI、Claude Desktop、Cursor 等）查询 GitHub 仓库信息和 Issues。

## 功能特性

- 🔍 **查询仓库信息** - 获取任意公开 GitHub 仓库的详细信息
- 🐛 **列出 Issues** - 查看仓库的 Issues，支持状态过滤
- 🛡️ **错误处理** - 完善的错误处理和速率限制意识
- 📝 **结构化输出** - 格式化的、易读的结果展示
- 🔌 **Claude CLI 集成** - 开箱即用的命令行集成

## 项目结构

```
week3/
├── server/
│   ├── __init__.py    # 包初始化
│   └── main.py        # MCP 服务器主入口
├── test_server.py     # 测试脚本
├── requirements.txt   # Python 依赖
├── .env.example      # 环境变量示例
└── README.md         # 本文件
```

## 先决条件

- Python 3.10+
- pip 或 Poetry
- Claude CLI (推荐) 或其他 MCP 客户端

## 快速开始

### 1. 安装依赖

```bash
cd week3
pip install -r requirements.txt
```

### 2. 配置环境变量（可选）

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# GitHub API Token (可选)
# 获取方式: https://github.com/settings/tokens
# 建议：勾选 `public_repo` 权限即可
GITHUB_TOKEN=your_token_here

# 日志级别 (DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
```

**注意**：如果不设置 `GITHUB_TOKEN`，服务器仍可工作，但会受到更严格的速率限制（每小时 60 次请求 vs 5000 次）。

### 3. 运行服务器

```bash
python -m server.main
```

或使用 Python 直接运行：

```bash
python server/main.py
```

服务器启动后会等待 STDIO 输入。这是正常的 - MCP 协议通过 STDIO 通信。

---

## 配置 Claude CLI（推荐）

Claude CLI 是最简单的方式来使用此 MCP 服务器。

### 1. 添加 MCP 服务器

```bash
# 添加服务器到 Claude CLI 配置
claude mcp add --transport stdio github -- python -m server.main
```

如果使用 conda 环境，指定完整 Python 路径：

```bash
# 获取 Python 路径
which python  # 或 conda 环境中的 python

# 添加服务器（替换为你的 Python 路径）
claude mcp add --transport stdio github -- /home/username/miniconda3/envs/your_env/bin/python -m server.main
```

### 2. 验证连接

```bash
claude mcp list
```

你应该看到：

```
github: python -m server.main - ✓ Connected
```

### 3. 测试工具

启动 Claude CLI 并测试：

```bash
# 方式 1: 直接运行
claude

# 方式 2: 单次执行
claude --print "帮我查看 microsoft/vscode 仓库的信息"

# 方式 3: 绕过权限提示（测试时使用）
claude --print --permission-mode bypassPermissions "列出 python/cpython 仓库最近开放的 3 个 issues"
```

### 4. 查看服务器详情

```bash
claude mcp get github
```

### 5. 移除服务器（如需要）

```bash
claude mcp remove github
```

---

## 配置 Claude Desktop（可选）

要将此 MCP 服务器集成到 Claude Desktop：

### 1. 找到配置文件

| 操作系统 | 配置文件位置 |
|----------|-------------|
| macOS    | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows  | `%APPDATA%\Claude\claude_desktop_config.json` |

### 2. 编辑配置文件

添加以下内容：

```json
{
  "mcpServers": {
    "github": {
      "command": "python",
      "args": [
        "-m",
        "server.main"
      ],
      "cwd": "/absolute/path/to/week3",
      "env": {
        "GITHUB_TOKEN": "your_token_here"  // 可选
      }
    }
  }
}
```

**重要**：将 `/absolute/path/to/week3` 替换为你的实际路径。

### 3. 重启 Claude Desktop

重启后，Claude Desktop 会自动连接到 MCP 服务器。

### 4. 测试连接

在 Claude Desktop 中输入：

> 请帮我查看 microsoft/vscode 仓库的信息

Claude 应该会调用 `get_repository_info` 工具并返回结果。

---

## 工具参考

### 1. get_repository_info

获取 GitHub 仓库的详细信息。

**参数**：

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| owner | string | ✅ | 仓库所有者（用户名或组织名） |
| repo | string | ✅ | 仓库名称 |

**示例输入**：

```json
{
  "owner": "microsoft",
  "repo": "vscode"
}
```

**示例输出**：

```
# 仓库信息

**名称**: microsoft/vscode

**描述**: Visual Studio Code

**统计**:
- ⭐ Stars: 123,456
- 🍴 Forks: 23,456
- 🐛 开放 Issues: 1,234
- 💻 主要语言: TypeScript

**时间**:
- 创建于: 2015-04-15T00:00:00Z
- 更新于: 2024-01-30T00:00:00Z

**链接**: https://github.com/microsoft/vscode
```

---

### 2. get_repository_issues

获取仓库的 Issues 列表。

**参数**：

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| owner | string | ✅ | 仓库所有者（用户名或组织名） |
| repo | string | ✅ | 仓库名称 |
| state | string | ❌ | Issue 状态：`open`、`closed` 或 `all`（默认: `open`） |
| limit | number | ❌ | 返回的 Issues 数量（默认: 10，最大: 100） |

**示例输入**：

```json
{
  "owner": "microsoft",
  "repo": "vscode",
  "state": "open",
  "limit": 5
}
```

**示例输出**：

```
# microsoft/vscode 的 Issues (状态: open, 显示: 5 条)

## Issue #12345: Issue title here

- **状态**: open
- **创建者**: @username
- **创建时间**: 2024-01-30T00:00:00Z
- **链接**: https://github.com/microsoft/vscode/issues/12345

**描述**:
This is a sample issue description...
---
```

---

## 示例调用流程

### 使用 Claude CLI

**场景 1：查询仓库信息**

```bash
claude --print "帮我查看 facebook/react 仓库的基本信息，包括星标数和主要语言"
```

Claude 会调用：
- 工具：`get_repository_info`
- 参数：`{"owner": "facebook", "repo": "react"}`

---

**场景 2：查看最近开放的 Issues**

```bash
claude --print "请列出 vercel/next.js 仓库最近开放的 5 个 issue"
```

Claude 会调用：
- 工具：`get_repository_issues`
- 参数：`{"owner": "vercel", "repo": "next.js", "state": "open", "limit": 5}`

---

**场景 3：比较两个仓库**

```bash
claude --print "请比较 python/cpython 和 rust-lang/rust 两个仓库的星标数"
```

Claude 会调用两次 `get_repository_info` 并比较结果。

---

### 使用 Claude Desktop（可选）

**场景 1：查询仓库信息**

> 请帮我查看 facebook/react 仓库的基本信息，包括星标数和主要语言。

Claude 会调用：
- 工具：`get_repository_info`
- 参数：`{"owner": "facebook", "repo": "react"}`

---

**场景 2：查看最近开放的 Issues**

> 请列出 vercel/next.js 仓库最近开放的 5 个 issue。

Claude 会调用：
- 工具：`get_repository_issues`
- 参数：`{"owner": "vercel", "repo": "next.js", "state": "open", "limit": 5}`

---

**场景 3：比较两个仓库**

> 请比较 python/cpython 和 rust-lang/rust 两个仓库的星标数。

Claude 会调用两次 `get_repository_info` 并比较结果。

---

## 错误处理

服务器会优雅地处理以下错误：

| 错误类型 | 处理方式 |
|----------|----------|
| 仓库不存在 | 返回 "资源未找到" 错误消息 |
| API 速率限制 | 返回 "速率限制或权限不足" 错误消息 |
| 网络超时 | 返回 "请求超时" 错误消息 |
| 网络连接失败 | 返回 "无法连接到 GitHub API" 错误消息 |
| 缺少必需参数 | 返回验证错误消息 |

---

## 开发与调试

### 使用测试脚本

项目包含一个测试脚本，可以直接验证服务器功能：

```bash
python test_server.py
```

这会运行 4 个测试用例：
1. GitHub API 连接测试
2. `get_repository_info` 工具测试
3. `get_repository_issues` 工具测试
4. 错误处理测试

示例输出：
```
============================================================
GitHub MCP 服务器测试套件
============================================================
============================================================
测试 1: GitHub API 客户端连接
============================================================
✅ 成功获取仓库: microsoft/vscode
...
============================================================
测试总结
============================================================
通过: 4/4
失败: 0/4
```

### 查看日志

服务器使用 stderr 输出日志（MCP 协议要求）。查看日志：

```bash
python -m server.main 2>&1 | grep -E "INFO|ERROR"
```

### 使用 MCP Inspector 测试

安装 MCP Inspector：

```bash
npm install -g @modelcontextprotocol/inspector
```

运行服务器并测试：

```bash
# 方式 1: 直接运行
mcp-inspector python -m server.main

# 方式 2: 指定工作目录
cd week3
mcp-inspector python -m server.main
```

这会打开一个 Web 界面，让你手动测试工具调用。

---

## API 速率限制

GitHub API 的速率限制：

| 认证状态 | 每小时请求限制 |
|----------|----------------|
| 未认证 | 60 次 |
| 已认证 | 5,000 次 |

建议设置 `GITHUB_TOKEN` 以获得更高的限制。

**获取 Token**：
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择 `public_repo` 权限
4. 生成并复制 token

---

## 故障排除

### 问题：Claude CLI 显示 "Failed to connect"

**解决方案**：

1. 检查 Python 路径是否正确：
```bash
which python
claude mcp get github
```

2. 如果使用 conda 环境，使用完整路径：
```bash
claude mcp remove github
claude mcp add --transport stdio github -- /full/path/to/python -m server.main
```

3. 验证依赖已安装：
```bash
pip install -r requirements.txt
python -c "import server.main; print('OK')"
```

4. 使用测试脚本验证服务器功能：
```bash
python test_server.py
```

### 问题：Claude Desktop 无法连接（可选）

**解决方案**：

1. 检查配置文件路径是否正确
2. 确保 `cwd` 是绝对路径
3. 检查 Python 和依赖是否正确安装
4. 查看 Claude Desktop 日志（Help > Developer > Toggle Logs）

### 问题：API 返回 403 错误

**解决方案**：

1. 检查是否超过了速率限制
2. 设置 `GITHUB_TOKEN` 环境变量
3. 确保网络可以访问 GitHub

### 问题：找不到 Python 模块

**解决方案**：

```bash
# 确保在 week3 目录下运行
cd week3
python -m server.main

# 或者设置 PYTHONPATH
export PYTHONPATH=/path/to/week3
python -m server.main
```

---

## 技术栈

- **MCP SDK**: `mcp` >= 0.9.0
- **HTTP 客户端**: `httpx` >= 0.27.0
- **环境管理**: `python-dotenv` >= 1.0.0
- **GitHub API**: REST API v3
- **测试**: AsyncIO 单元测试

---

## 许可证

本项目为教学作业，仅供学习使用。

GitHub API 遵循 GitHub 的服务条款。
