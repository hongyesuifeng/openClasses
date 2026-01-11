# Week 3 — 构建自定义 MCP 服务器

设计并实现一个模型上下文协议（MCP）服务器，用于包装真实的外部 API。你可以：
- **本地运行**（STDIO 传输）并集成到 MCP 客户端（如 Claude Desktop）。
- 或**远程运行**（HTTP 传输）并从模型代理或客户端调用。这种方式较难，但可获得额外加分。

如果添加与 MCP 授权规范一致的身份验证（API 密钥或 OAuth2），可获额外加分。

## 学习目标
- 理解核心 MCP 功能：工具、资源、提示。
- 实现具有类型化参数和强大错误处理的工具定义。
- 遵循日志和传输最佳实践（STDIO 服务器不使用 stdout）。
- 可选：为 HTTP 传输实现授权流程。

## 要求
1. 选择一个外部 API 并记录你将使用的端点。例如：天气、GitHub issues、Notion 页面、电影/电视数据库、日历、任务管理器、金融/加密货币、旅行、体育统计等。
2. 暴露至少两个 MCP 工具
3. 实现基本的弹性：
   - 对 HTTP 失败、超时和空结果进行优雅的错误处理。
   - 尊重 API 速率限制（例如，简单的退避或面向用户的警告）。
4. 打包和文档：
   - 提供清晰的设置说明、环境变量和运行命令。
   - 包括示例调用流程（在客户端中输入/点击什么来触发工具）。
5. 选择一种部署模式：
   - 本地：STDIO 服务器，可从你的机器运行，并可被 Claude Desktop 或 AI IDE（如 Cursor）发现。
   - 远程：可通过网络访问的 HTTP 服务器，可由支持 MCP 的客户端或代理运行时调用。如果已部署并可访问，则获得额外加分。
6. （可选）加分：身份验证
   - 通过环境变量和客户端配置支持 API 密钥；或
   - 用于 HTTP 传输的 OAuth2 风格的 bearer token，验证 token 受众，从不将 token 传递给上游 API。

## 交付成果
- `week3/` 下的源代码（建议：`week3/server/` 具有清晰的入口点，如 `main.py` 或 `app.py`）。
- `week3/README.md`，包括：
  - 先决条件、环境设置和运行说明（本地和/或远程）。
  - 如何配置 MCP 客户端（本地的 Claude Desktop 示例）或远程的代理运行时。
  - 工具参考：名称、参数、示例输入/输出和预期行为。

## 评分标准（总分 90 分）
- 功能性（35 分）：实现 2+ 工具、正确的 API 集成、有意义的输出。
- 可靠性（20 分）：输入验证、错误处理、日志记录、速率限制意识。
- 开发者体验（20 分）：清晰的设置/文档、易于本地运行；合理的文件夹结构。
- 代码质量（15 分）：可读的代码、描述性名称、最小复杂性、适用的类型提示。
- 额外加分（10 分）：
  - +5 远程 HTTP MCP 服务器，可由代理/客户端（如 OpenAI/Claude SDK）调用。
  - +5 正确实现身份验证（API 密钥或具有受众验证的 OAuth2）。

## 有用的参考
- MCP 服务器快速入门：[modelcontextprotocol.io/quickstart/server](https://modelcontextprotocol.io/quickstart/server)
*注意：你不能提交这个确切的示例。*
- MCP 授权（HTTP）：[modelcontextprotocol.io/specification/2025-06-18/basic/authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- Cloudflare 上的远程 MCP（代理）：[developers.cloudflare.com/agents/guides/remote-mcp-server/](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)。在部署之前使用 modelcontextprotocol inspector 工具在本地调试你的服务器。
- https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel 如果你选择进行远程 MCP 部署，Vercel 是一个具有免费层的好选择。
