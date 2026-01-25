# MCP 服务器使用指南

本项目已配置 5 个开箱即用的 Model Context Protocol (MCP) 服务器，无需 API 密钥即可使用。

## 已配置的 MCP 服务器（无需 API 密钥）

### 1. 📁 Filesystem MCP Server
**包名**: `@modelcontextprotocol/server-filesystem`

**功能**:
- 读取、写入、编辑本地文件
- 搜索文件和目录
- 管理项目结构

**使用场景**:
- 代码库导航
- 批量文件操作
- 项目重构

**配置**: 已自动配置，可访问 `openClasses` 目录

---

### 2. 🌐 Fetch MCP Server
**包名**: `@modelcontextprotocol/server-fetch`

**功能**:
- 获取网页内容
- HTTP 请求
- API 调用
- 内容抓取

**使用场景**:
- 获取在线资源
- 爬取网页数据
- 调用公开 API
- 实时信息获取

**配置**: 开箱即用，无需 API 密钥

---

### 3. 🧠 Memory MCP Server
**包名**: `@modelcontextprotocol/server-memory`

**功能**:
- 知识图谱管理
- 实体关系存储
- 语义搜索
- 长期记忆

**使用场景**:
- 构建知识库
- 记录重要信息
- 语义检索
- 知识关联

**配置**: 开箱即用，无需 API 密钥

---

### 4. ⏰ Time MCP Server
**包名**: `@modelcontextprotocol/server-time`

**功能**:
- 获取当前时间
- 时区转换
- 日期计算
- 时间格式化

**使用场景**:
- 时间戳转换
- 日程管理
- 截止日期计算
- 多时区协作

**配置**: 开箱即用，无需 API 密钥

---

### 5. 📄 PDF Reader MCP Server
**包名**: `@sylphx/pdf-reader-mcp`

**功能**:
- 提取 PDF 文本
- 提取图片
- 元数据分析
- PDF 内容搜索

**使用场景**:
- 学术论文阅读
- 文档分析
- 资料提取
- 自动化文档处理

**配置**: 开箱即用

---

## 其他需要 API 密钥的 MCP 服务器

以下是官方推荐的其他 MCP 服务器，需要配置 API 密钥才能使用：

### 🐙 GitHub MCP Server
**包名**: `@modelcontextprotocol/server-github`

需要 GitHub Token，用于仓库管理、PR、Issues 等操作。

### 💬 Slack MCP Server
**包名**: `@modelcontextprotocol/server-slack`

需要 Slack Token，用于消息发送、频道管理等。

### 📊 Google Drive MCP Server
**包名**: `@modelcontextprotocol/server-gdrive`

需要 Google Credentials，用于云端文档管理。

### 🔎 Exa Search MCP Server
**包名**: `exa-mcp-server`

需要 Exa API Key，提供 AI 驱动的语义搜索。

### 🔡 TextIn OCR MCP Server
**包名**: `@intsig/server-textin`

需要 TextIn API Key，用于图片和扫描文档文字识别。

### 🐘 PostgreSQL MCP Server
**包名**: `@modelcontextprotocol/server-postgres`

需要数据库连接字符串，用于数据库查询和管理。

### 🎭 Playwright MCP Server
**包名**: `@executeautomation/playwright-mcp-server`

需要安装浏览器，用于浏览器自动化和测试。

---

## 配置说明

### 当前配置状态

✅ **已配置并可用**（5个服务器）：
- Filesystem
- Fetch
- Memory
- Time
- PDF Reader

⚠️ **未配置**（需要 API 密钥）：
- GitHub
- Slack
- Google Drive
- Exa
- TextIn OCR
- PostgreSQL
- Playwright

### 添加需要 API 密钥的服务器

如果你需要使用上述需要 API 密钥的服务器，可以按以下步骤操作：

1. **获取 API 密钥**
   - 访问相应服务的官网注册账号
   - 在控制台创建 API 密钥或 Token

2. **编辑配置文件**
   编辑 `.claude/mcp-config.json`，添加相应服务器配置：

   ```json
   {
     "mcpServers": {
       "github": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-github"],
         "env": {
           "GITHUB_TOKEN": "your_actual_token_here"
         }
       }
     }
   }
   ```

3. **重启 Claude Code**
   重新启动 Claude Code 以加载新配置。

---

## 使用示例

### 文件操作
```
Claude: 读取 README.md 文件
Claude: 在 notes/ 目录下搜索所有包含 "学习" 的文件
```

### 网页获取
```
Claude: 获取 https://example.com 的内容
Claude: 抓取这个网页的文本内容
```

### 记忆管理
```
Claude: 记住这个重要的概念
Claude: 我之前提到过的学习计划是什么？
```

### 时间工具
```
Claude: 现在是几点？
Claude: 计算 7 天后的日期
```

### PDF 处理
```
Claude: 读取 documents/report.pdf 并总结内容
Claude: 从 PDF 中提取所有表格数据
```

---

## 故障排除

### MCP 服务器未启动

1. 检查配置文件格式是否正确（JSON 格式）
2. 确认 npx 可以正常使用：`npx --version`
3. 查看 Claude Code 的错误日志
4. 尝试手动测试服务器：`npx -y @modelcontextprotocol/server-filesystem`

### 服务器连接失败

1. 确认网络连接正常
2. 检查防火墙设置
3. 尝试重新启动 Claude Code

### 功能不可用

1. 确认服务器已正确配置
2. 检查文件路径是否正确（针对 Filesystem）
3. 查看 Claude Code 的 MCP 工具列表

---

## 安全建议

1. **定期更新 MCP 服务器**
   ```bash
   npx -y @modelcontextprotocol/server-filesystem --help
   ```

2. **注意文件访问权限**
   - Filesystem 服务器只能访问配置的目录
   - 不要配置包含敏感信息的目录

3. **保护你的数据**
   - 不要让 AI 访问包含密码的文件
   - 谨慎使用 Memory 服务器存储敏感信息

---

## 参考资源

### 官方文档
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Claude Code 文档](https://code.anthropic.com/)

### MCP 服务器列表
- [Smithery.ai](https://smithery.ai/) - MCP 服务器注册表
- [GitHub - official MCP servers](https://github.com/modelcontextprotocol/servers)
- [MCP Market](https://mcpmarket.com/) - MCP 服务器排行榜

### 社区资源
- [Awesome MCP Servers](https://github.com/yzfly/Awesome-MCP-ZH)
- [Desktop Commander - Best MCP Servers](https://desktopcommander.app/blog/2025/11/25/best-mcp-servers/)

---

**最后更新**: 2025-12-31

**已配置的服务器数量**: 5（开箱即用）

**状态**: ✅ 已配置并可以直接使用，无需 API 密钥

