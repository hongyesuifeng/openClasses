# MCP 服务器使用指南

本项目已配置10个最常用的 Model Context Protocol (MCP) 服务器，增强了 Claude Code 的能力。

## 已安装的 MCP 服务器

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

### 2. 🐙 GitHub MCP Server
**包名**: `@modelcontextprotocol/server-github`

**功能**:
- 管理仓库、分支、PR、Issues
- 提交代码、查看历史
- 代码审查

**使用场景**:
- 自动化版本控制
- PR 管理
- CI/CD 集成

**配置**:
需要设置 GitHub Token:
```bash
# 在 mcp-config.json 中设置:
"GITHUB_TOKEN": "your_github_personal_access_token"
```

获取 Token: https://github.com/settings/tokens

---

### 3. 🔍 Brave Search MCP Server
**包名**: `@modelcontextprotocol/server-brave-search`

**功能**:
- 隐私优先的网页搜索
- 实时信息获取
- 内容总结

**使用场景**:
- 研究和资料收集
- 查找最新信息
- 技术文档查询

**配置**: 开箱即用，无需 API 密钥

---

### 4. 🎭 Playwright MCP Server
**包名**: `@executeautomation/playwright-mcp-server`

**功能**:
- 浏览器自动化
- 网页截图
- 执行 JavaScript
- 表单填写

**使用场景**:
- 自动化测试
- 网页抓取
- UI 验证
- 浏览器交互

**配置**:
首次使用需要安装浏览器：
```bash
npx playwright install
```

---

### 5. 🐘 PostgreSQL MCP Server
**包名**: `@modelcontextprotocol/server-postgres`

**功能**:
- 执行 SQL 查询
- 分析数据库模式
- 数据建模

**使用场景**:
- 数据分析
- 后端开发
- 数据库管理

**配置**:
需要数据库连接字符串：
```json
"postgresql://username:password@localhost:5432/database_name"
```

---

### 6. 💬 Slack MCP Server
**包名**: `@modelcontextprotocol/server-slack`

**功能**:
- 发送消息
- 频道摘要
- 搜索对话
- 工作区管理

**使用场景**:
- 团队协作自动化
- 通知管理
- 讨论总结

**配置**:
需要 Slack Token:
```bash
# 在 mcp-config.json 中设置:
"SLACK_TOKEN": "xoxb-your-token-here"
```

获取 Token: https://api.slack.com/authentication/token-types

---

### 7. 📊 Google Drive MCP Server
**包名**: `@modelcontextprotocol/server-gdrive`

**功能**:
- 搜索文件
- 读取文档
- 文件分类
- 协作文档管理

**使用场景**:
- 云端文档管理
- 资料整理
- 团队资源共享

**配置**:
需要 Google Credentials JSON:
1. 创建 Google Cloud 项目
2. 启用 Drive API
3. 下载服务账号密钥
4. 在配置中设置 `GOOGLE_CREDENTIALS`

---

### 8. 🔎 Exa Search MCP Server
**包名**: `exa-mcp-server`

**功能**:
- AI 驱动的语义搜索
- GitHub 代码搜索
- 公司研究
- 深度研究

**使用场景**:
- 智能代码搜索
- 技术研究
- 竞品分析

**配置**:
需要 Exa API Key:
```bash
# 在 mcp-config.json 中设置:
"EXA_API_KEY": "your_exa_api_key"
```

获取 API Key: https://docs.exa.ai/reference/exa-mcp

---

### 9. 📄 PDF Reader MCP Server
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

### 10. 🔡 TextIn OCR MCP Server
**包名**: `@intsig/server-textin`

**功能**:
- 图片 OCR 识别
- PDF 文字识别
- Word 文档识别
- 多语言支持

**使用场景**:
- 扫描文档数字化
- 图片文字提取
- 自动化数据录入
- 多语言文档处理

**配置**:
需要 TextIn API Key:
```bash
# 在 mcp-config.json 中设置:
"TEXTIN_API_KEY": "your_textin_api_key"
```

获取 API Key: 需要在 TextIn 官网注册

---

## 配置步骤

### 1. 复制配置文件

```bash
# 配置文件位于
.claude/mcp-config.json
```

### 2. 设置 API 密钥

编辑 `mcp-config.json`，替换以下占位符：
- `YOUR_GITHUB_TOKEN_HERE`
- `YOUR_SLACK_TOKEN_HERE`
- `YOUR_GOOGLE_CREDENTIALS_HERE`
- `YOUR_EXA_API_KEY_HERE`
- `YOUR_TEXTIN_API_KEY_HERE`

### 3. 配置 PostgreSQL（可选）

如果你使用 PostgreSQL，更新连接字符串：
```json
"postgresql://username:password@localhost:5432/your_database"
```

### 4. 安装 Playwright 浏览器（可选）

```bash
npx playwright install
```

---

## 使用示例

### 文件操作
```
Claude: 读取 README.md 文件
Claude: 在 notes/ 目录下搜索所有包含 "学习" 的文件
```

### GitHub 操作
```
Claude: 创建一个新分支 feature/add-mcp-guide
Claude: 提交当前更改到 GitHub
Claude: 查看 main 分支的最新 commit
```

### 网页搜索
```
Claude: 使用 Brave 搜索 "MCP server tutorial 2025"
Claude: 搜索最新的 React 19 新特性
```

### 浏览器自动化
```
Claude: 使用 Playwright 打开 https://example.com 并截图
Claude: 在网页上填写表单并提交
```

### 数据库查询
```
Claude: 查询 users 表中的所有记录
Claude: 统计 orders 表中的订单数量
```

### PDF 处理
```
Claude: 读取 documents/report.pdf 并总结内容
Claude: 从 PDF 中提取所有表格数据
```

### OCR 识别
```
Claude: 识别 images/screenshot.png 中的文字
Claude: 从扫描的 PDF 中提取文本
```

---

## 故障排除

### MCP 服务器未启动

1. 检查配置文件格式是否正确
2. 确认所有依赖已安装：`npm list -g`
3. 查看 Claude Code 日志

### API 密钥错误

1. 确认 API 密钥已正确设置
2. 检查密钥是否过期
3. 验证密钥权限

### Playwright 浏览器未安装

```bash
npx playwright install
```

### 权限问题

确保 Claude Code 有权限访问：
- 项目目录
- GitHub 仓库
- Google Drive 文件

---

## 安全建议

1. **不要提交 API 密钥到 Git**
   - 将 `mcp-config.json` 添加到 `.gitignore`
   - 使用环境变量存储敏感信息

2. **使用最小权限原则**
   - GitHub Token: 只授予必要权限
   - Google Credentials: 使用服务账号
   - API Keys: 定期轮换

3. **定期审查权限**
   - 检查已授权的应用
   - 撤销不再使用的密钥

---

## 参考资源

### 官方文档
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Claude Code 文档](https://code.anthropic.com/)

### MCP 服务器列表
- [Smithery.ai](https://smithery.ai/) - MCP 服务器注册表
- [GitHub - popular-mcp-servers](https://github.com/pedrojaques99/popular-mcp-servers)
- [MCP Market](https://mcpmarket.com/) - MCP 服务器排行榜

### 社区资源
- [Awesome MCP Servers](https://github.com/yzfly/Awesome-MCP-ZH)
- [Desktop Commander - Best MCP Servers](https://desktopcommander.app/blog/2025/11/25/best-mcp-servers/)

---

**最后更新**: 2025-12-30

**安装的服务器数量**: 10

**状态**: ✅ 已配置并可以使用
