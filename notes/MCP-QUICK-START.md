# MCP 服务器快速入门指南

## ✅ 安装完成！

你现在已经拥有 10 个强大的 MCP 服务器，可以大幅增强你的学习体验。

---

## 📦 已安装的 MCP 服务器列表

| # | 名称 | 包名 | 主要功能 | 需要配置 |
|---|------|------|----------|----------|
| 1 | Filesystem | @modelcontextprotocol/server-filesystem | 文件读写、搜索 | ❌ 无 |
| 2 | GitHub | @modelcontextprotocol/server-github | 仓库管理、PR、Issues | ✅ Token |
| 3 | Brave Search | @modelcontextprotocol/server-brave-search | 网页搜索 | ❌ 无 |
| 4 | Playwright | @executeautomation/playwright-mcp-server | 浏览器自动化 | ⚠️ 浏览器 |
| 5 | PostgreSQL | @modelcontextprotocol/server-postgres | 数据库查询 | ✅ 连接字符串 |
| 6 | Slack | @modelcontextprotocol/server-slack | 消息、频道管理 | ✅ Token |
| 7 | Google Drive | @modelcontextprotocol/server-gdrive | 云端文档管理 | ✅ 凭证 |
| 8 | Exa Search | exa-mcp-server | AI 语义搜索 | ✅ API Key |
| 9 | PDF Reader | @sylphx/pdf-reader-mcp | PDF 文档读取 | ❌ 无 |
| 10 | TextIn OCR | @intsig/server-textin | 图片文字识别 | ✅ API Key |

---

## 🚀 立即可用的服务器（无需配置）

以下 3 个服务器可以直接使用，无需任何配置：

### 1. 文件操作 (Filesystem)
```
你可以直接让我：
- 读取任何文件
- 编辑代码
- 搜索文件内容
- 管理项目结构
```

### 2. 网页搜索 (Brave Search)
```
你可以直接让我：
- 搜索最新的技术资料
- 查找文档和教程
- 获取实时信息
```

### 3. PDF 阅读 (PDF Reader)
```
你可以直接让我：
- 读取 PDF 文档
- 提取文本和图片
- 总结论文内容
```

---

## 🔧 需要配置的服务器

### GitHub（推荐优先配置）
**获取 Token**: https://github.com/settings/tokens

```json
// 在 .claude/mcp-config.json 中设置:
"env": {
  "GITHUB_TOKEN": "你的GitHub Token"
}
```

**配置后可以**:
- 自动提交代码
- 管理 PR 和 Issues
- 查看仓库历史

---

### Exa Search（AI 搜索）
**获取 API Key**: https://docs.exa.ai

```json
// 在 .claude/mcp-config.json 中设置:
"env": {
  "EXA_API_KEY": "你的Exa API Key"
}
```

**配置后可以**:
- 智能语义搜索
- GitHub 代码搜索
- 深度技术研究

---

### TextIn OCR（文字识别）
需要到 TextIn 官网注册并获取 API Key

```json
// 在 .claude/mcp-config.json 中设置:
"env": {
  "TEXTIN_API_KEY": "你的TextIn API Key"
}
```

**配置后可以**:
- 识别图片中的文字
- 扫描文档数字化
- 提取截图内容

---

## 📝 使用示例

### 学习场景 1: 课程笔记整理

```
你: "帮我读取 courses/cs146S/01-weeks/week-1.md 文件"
你: "总结我本周学习的核心要点"
你: "在笔记中添加一个代码示例部分"
```

### 学习场景 2: 查找学习资料

```
你: "使用 Brave 搜索 'React 19 新特性'"
你: "搜索 'Python async await 最佳实践'"
```

### 学习场景 3: PDF 论文阅读

```
你: "读取 documents/paper.pdf"
你: "总结这篇论文的核心观点"
你: "提取论文中的所有公式"
```

### 学习场景 4: 代码提交到 GitHub

```
你: "提交当前更改到 GitHub"
你: "创建一个新的分支 feature/add-notes"
你: "查看最近的 commit 历史"
```

---

## 🎯 学习工作流建议

### 日常学习流程

1. **学习前**: 使用 Brave/Exa 搜索相关资料
2. **学习中**: 使用 Filesystem 记录笔记
3. **遇到问题**: 搜索文档和社区讨论
4. **完成项目**: 使用 GitHub 提交代码
5. **阅读论文**: 使用 PDF Reader 提取内容
6. **复习总结**: 使用 OCR 识别手写笔记

### 自动化任务

```
# 每周自动总结
你: "读取本周所有笔记，生成学习总结"

# 查找重点
你: "在所有笔记中搜索包含'重要'的段落"

# 生成复习清单
你: "整理所有未完成的学习目标"
```

---

## ⚙️ 配置文件位置

所有配置都在项目目录中：

```
.claude/
├── mcp-config.json          # MCP 服务器配置
└── settings.local.json      # Claude Code 设置

notes/
└── MCP-SERVERS.md           # 详细使用指南
```

---

## 🔐 安全提示

⚠️ **重要**: 不要将 API 密钥提交到 Git！

```bash
# 配置文件已在 .gitignore 中
git add .gitignore
git commit -m "添加 MCP 配置文件保护"
```

---

## 📚 下一步

1. **立即可用**: 开始使用 Filesystem、Brave Search、PDF Reader
2. **推荐配置**: 设置 GitHub Token（2分钟）
3. **可选配置**: 根据需要配置其他服务
4. **学习指南**: 查看 `notes/MCP-SERVERS.md` 了解详情

---

## 💡 常见问题

**Q: MCP 服务器在哪里运行？**
A: 作为本地进程运行，不会将数据发送到外部服务器（除了搜索和API调用）。

**Q: 如何知道 MCP 是否正常工作？**
A: 直接尝试使用，如"读取 README.md"，如果成功就说明正常。

**Q: 可以添加更多 MCP 服务器吗？**
A: 可以！编辑 `.claude/mcp-config.json` 添加更多服务器。

**Q: 配置错误怎么办？**
A: 查看 `notes/MCP-SERVERS.md` 中的故障排除部分。

---

**开始使用吧！享受 MCP 带来的强大功能！** 🎉

---

*最后更新: 2025-12-30*
*MCP 服务器数量: 10*
*状态: ✅ 已配置并可用*
