# Week 3: AI IDE 与 MCP 服务器开发

## 本周主题概述

Week 3 深入探讨 AI 集成开发环境(AI IDE)的使用和 MCP(Model Context Protocol)服务器开发,重点讲解如何通过有效的上下文管理和 PRD 撰写,让 AI 更好地理解和协助开发工作。

## 学习目标

### 核心目标
1. **掌握 AI IDE 的使用** - Claude Code、Cursor 等工具的深入应用
2. **学习上下文管理** - 如何让 AI 理解你的项目
3. **撰写高质量 PRD** - 产品需求文档的 AI 原生写作方法
4. **理解 MCP 协议** - 学习如何开发自定义 MCP 服务器

---

## 核心内容要点

### 1. AI IDE 深度解析

#### 主流 AI IDE 对比

| 特性 | Claude Code | Cursor | GitHub Copilot |
|------|-------------|--------|----------------|
| **开发者** | Anthropic | Cursor AI | GitHub/Microsoft |
| **底层模型** | Claude 3.5 Sonnet | GPT-4/Claude | OpenAI GPT-4 |
| **核心特色** | MCP 协议支持 | 强大的代码编辑 | VS Code 集成 |
| **上下文管理** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Agent 能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **可定制性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

#### Claude Code 核心功能

**1. 智能代码补全**
- 理解代码上下文,提供精准补全建议
- 自动生成函数签名和文档注释
- 支持多种编程语言

**2. 代码解释**
- 解释代码逻辑和算法
- 分析时间和空间复杂度
- 指出潜在问题和优化建议

**3. 重构建议**
- 识别代码异味(Code Smell)
- 建议设计模式应用
- 自动化重构操作并保持测试通过

**4. 调试助手**
- 分析错误堆栈信息
- 提供修复建议和代码示例
- 生成边界情况的测试用例

---

### 2. 上下文管理(Context Management)

#### 核心问题
LLM 的上下文窗口有限,如何让它理解大型代码库?

#### 四大策略

**策略一:项目结构清晰化**

优秀的项目结构应该:
- 按功能模块组织(src/, tests/, docs/)
- 清晰的职责划分(components/, services/, utils/)
- 完善的文档(README.md, architecture.md, api.md)

```
project/
├── src/
│   ├── components/    # UI 组件
│   ├── services/      # 业务逻辑
│   ├── utils/         # 工具函数
│   └── types/         # 类型定义
├── tests/
│   ├── unit/          # 单元测试
│   └── integration/   # 集成测试
├── docs/
│   ├── architecture.md # 架构文档
│   └── api.md         # API 文档
└── README.md
```

**策略二:README 驱动上下文**

AI 原生 README 应包含:
- **项目概述** - 一句话描述项目功能
- **技术栈** - 使用的框架和版本
- **快速开始** - 安装和运行步骤
- **项目结构** - 目录说明
- **核心概念** - 关键概念解释
- **开发规范** - 代码风格、命名约定、Git 工作流
- **常见任务** - 如何添加功能、修复 bug
- **AI 辅助提示** - 如何与 AI IDE 配合

**策略三:模块化文档**

- **architecture.md** - 系统架构、数据流、设计决策
- **api.md** - API 端点、请求/响应格式、认证方式

**策略四:智能上下文选择**

在 Claude Code 中使用 `@` 符号指定文件或目录:
```
@src/components/Button.tsx @src/components/Button.module.css
请重构 Button 组件,添加 loading 状态
```

---

### 3. AI 原生 PRD 撰写

#### 传统 PRD vs AI 原生 PRD

**传统 PRD**:
- 面向人类开发者
- 依赖口头沟通补充细节
- 需要反复确认需求

**AI 原生 PRD**:
- 面向 AI Agent
- 包含所有必要的上下文
- 可直接用于自动化开发

#### AI 原生 PRD 核心结构

1. **功能概述**
   - 目标:清晰描述要解决的问题
   - 成功指标:可量化的衡量标准

2. **用户故事**
   - 目标用户画像
   - 使用场景和痛点
   - 期望的结果

3. **功能需求**
   - 核心功能(输入/处理/输出)
   - 边界情况处理
   - 约束条件(性能/安全/兼容性)

4. **技术实现指导**
   - 参考代码示例
   - 推荐的设计模式
   - 依赖的服务和 API

5. **交互设计**
   - UI 草图或描述
   - 交互流程
   - 状态管理

6. **数据模型**
   - 数据结构定义
   - API 契约(请求/响应)

7. **测试策略**
   - 单元测试场景
   - 集成测试流程
   - 边界测试用例

8. **AI 开发指导**
   - 具体的开发步骤
   - 示例提示词
   - 验收标准

#### PRD 示例:用户认证功能

**功能**: 用户注册、登录、登出,支持邮箱验证和密码找回

**成功指标**:
- 注册转化率 > 60%
- 登录成功率 > 95%
- 平均登录时间 < 2 秒

**技术实现**:
- 后端: Node.js + Express
- 数据库: PostgreSQL
- 认证: JWT
- 加密: bcrypt

**API 端点**:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

---

### 4. MCP 服务器开发

#### 什么是 MCP?

MCP(Model Context Protocol)是 Anthropic 推出的开放协议,用于连接 AI 应用和外部数据源。

#### MCP 的核心价值

- **统一的数据接口** - 标准化的数据访问方式
- **上下文增强** - 让 AI 访问实时数据和外部系统
- **可扩展性** - 轻松添加新的数据源
- **安全性** - 明确的权限和访问控制

#### MCP 服务器示例

**文件系统 MCP Server**:
- 读取文件内容
- 搜索文件
- 列出目录结构

**数据库 MCP Server**:
- 执行查询
- 获取表结构
- 读取数据

**API MCP Server**:
- 调用外部 API
- 获取实时数据
- 与第三方服务集成

---

## 核心思想

### 1. Context is Everything
AI IDE 的效果取决于上下文质量:
- 清晰的项目结构
- 完善的文档
- 明确的需求
- 一致的代码风格

### 2. Iterate and Validate
- 不要期望 AI 一次生成完美代码
- 快速迭代
- 持续验证
- 及时反馈

### 3. Template-Driven Development
- 建立标准模板
- 积累可复用的提示词
- 保持一致性

---

## 实战作业准备

### Week 4 作业预告

**任务**: 使用 Claude Code 完成一个完整的功能开发

**要求**:
1. 选择一个真实项目
2. 撰写 AI 原生 PRD
3. 使用 Claude Code 进行开发
4. 记录开发过程和效率提升

**Week 3 准备工作**:
- 熟悉 AI IDE 的基本使用
- 练习撰写 AI 原生 PRD
- 优化项目结构和文档
- 学习 MCP 协议基础

---

## 学习建议

### 对于 AI IDE 使用

1. **定制化配置** - 根据项目特点调整 AI 设置
2. **建立提示词库** - 积累常用提示词模板
3. **版本控制集成** - 让 AI 理解 Git 历史
4. **定期清理上下文** - 保持上下文窗口高效

### 对于 PRD 撰写

1. **模板化** - 建立标准模板
2. **细化需求** - 避免模糊描述
3. **示例驱动** - 提供具体示例
4. **持续更新** - 保持 PRD 同步

### 对于 MCP 开发

1. **从简单开始** - 先实现基础功能
2. **理解协议** - 深入学习 MCP 规范
3. **安全优先** - 注意权限和数据安全
4. **充分测试** - 确保稳定性和可靠性

---

## 进阶学习资源

### 工具
- **Claude Code**: https://claude.ai/code
- **Cursor**: https://cursor.sh
- **GitHub Copilot**: https://github.com/features/copilot

### 文档
- **MCP 协议规范**: https://modelcontextprotocol.io
- **Claude API 文档**: https://docs.anthropic.com

### 推荐实践
1. 使用 Claude Code 重构一个旧项目
2. 为现有项目撰写 AI 原生 PRD
3. 开发简单的 MCP Server
4. 优化项目结构和文档

---

## 本周小结

Week 3 让我们掌握了:
1. **AI IDE 的深入使用** - Claude Code 的核心功能和最佳实践
2. **上下文管理策略** - 如何让 AI 更好地理解项目
3. **AI 原生 PRD 撰写** - 面向 AI 的需求文档写作方法
4. **MCP 协议基础** - 理解如何扩展 AI 的上下文能力

这些技能为 Week 4 的实战打下了坚实基础,让我们能够在实际开发中高效使用 AI 工具。
