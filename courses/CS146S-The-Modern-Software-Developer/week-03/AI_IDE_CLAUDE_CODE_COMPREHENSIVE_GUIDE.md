# AI IDE 与上下文管理完全指南

## 📚 目录

1.  [AI IDE 概述](#1-ai-ide-概述)
2.  [核心概念与对比](#2-核心概念与对比)
3.  [上下文管理原理](#3-上下文管理原理)
4.  [上下文管理策略](#4-上下文管理策略)
5.  [AI 原生 README 撰写](#5-ai-原生-readme-撰写)
6.  [模块化文档体系](#6-模块化文档体系)
7.  [AI 原生 PRD 实战](#7-ai-原生-prd-实战)
8.  [智能上下文选择](#8-智能上下文选择)
9.  [实战案例深度解析](#9-实战案例深度解析)
10. [核心思想总结](#10-核心思想总结)
11. [参考资料](#11-参考资料)

---

## 1. AI IDE 概述

### 核心要点

- **定义**: AI IDE（AI Integrated Development Environment）是集成了大语言模型能力的智能开发环境，能够理解代码库、生成代码、解释逻辑、调试错误
- **价值**: 从传统开发的效率瓶颈中解放开发者，实现 10x 开发效率提升
- **必要性**: LLM 具有不确定性、上下文敏感和知识局限，需要 AI IDE 提供结构化的上下文管理
- **发展**: 从简单的代码补全工具，发展到具有 Agent 自主能力的全能型开发助手

### 1.1 从传统 IDE 到 AI IDE

#### 传统开发流程

```
开发者需求:
1. 手动编写代码
2. 查阅文档
3. Stack Overflow 搜索
4. 调试和修复
5. 代码审查

痛点:
- 效率低，重复工作多
- 知识碎片化
- 调试耗时长
- 上下文切换频繁
```

#### AI 辅助开发流程

```
AI IDE 辅助:
1. AI 理解需求并生成代码
2. AI 提供实时代码补全
3. AI 解释和重构代码
4. AI 诊断和修复 bug
5. AI 辅助代码审查

优势:
- 10x 开发效率
- 减少认知负担
- 快速迭代
- 持续上下文理解
```

### 1.2 AI IDE 的核心能力

#### 1. 智能代码补全

**传统补全 vs AI 补全**

```python
# 传统 IDE 补全（基于关键词）
def calculate_total(items):
    return items.│
    # 补全: length, append, extend...

# AI IDE 补全（理解语义）
def calculate_total(items):
    # AI 理解意图: 计算总价
    return sum(item['price'] for item in items)│
    # AI 补全完整的逻辑实现
```

#### 2. 代码生成

**从需求到代码**

```markdown
# 用户需求
"创建一个 REST API 端点，用于用户登录，
接受 username 和 password，返回 JWT token"

# AI IDE 生成
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # 验证用户
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        token = generate_jwt_token(user.id)
        return jsonify({'token': token}), 200

    return jsonify({'error': 'Invalid credentials'}), 401
```

#### 3. 代码解释

```python
# 复杂代码
@lru_cache(maxsize=128)
def fib(n):
    if n < 2:
        return n
    return fib(n-1) + fib(n-2)

# AI IDE 解释
"""
这是一个带有缓存的斐波那契数列实现:

1. @lru_cache: 使用 LRU (Least Recently Used) 缓存装饰器
   - 缓存最近 128 次计算结果
   - 避免重复计算，时间复杂度从 O(2^n) 降到 O(n)

2. 递归终止条件: n < 2 时直接返回 n
3. 递归关系: fib(n) = fib(n-1) + fib(n-2)

优化效果:
- 无缓存: fib(40) 需要约 1 秒
- 有缓存: fib(40) 需要约 0.0001 秒
"""
```

#### 4. 智能重构

```python
# 重构前
def process(data):
    r = []
    for x in data:
        if x > 0:
            r.append(x * 2)
    return r

# AI IDE 重构建议
"""
可以使用列表推导式简化代码:
"""
def process(data):
    return [x * 2 for x in data if x > 0]

# 性能提升: 约 20%
# 可读性: 更符合 Python 惯用法
```

---

## 2. 核心概念与对比

### 2.1 三大主流 AI IDE 对比

| 功能维度 | Claude Code | Cursor | GitHub Copilot |
|---------|-------------|--------|----------------|
| **开发者** | Anthropic | Cursor AI | GitHub/Microsoft |
| **底层模型** | Claude 3.5 Sonnet | GPT-4/Claude | OpenAI GPT-4 |
| **核心特色** | MCP 协议支持 | 强大的代码编辑 | VS Code 集成 |
| **上下文窗口** | 200K tokens | 128K tokens | 8K-32K tokens |
| **项目理解** | ⭐⭐⭐⭐⭐ 全项目 | ⭐⭐⭐⭐ 当前文件 | ⭐⭐⭐ 局部代码 |
| **Agent 能力** | ⭐⭐⭐⭐⭐ 自主执行 | ⭐⭐⭐⭐ 编辑辅助 | ⭐⭐⭐ 建议生成 |
| **MCP 支持** | ✅ 原生支持 | ❌ 不支持 | ❌ 不支持 |
| **代码编辑** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **学习成本** | 中等 | 低 | 低 |
| **定价** | $20/月 | $20/月 | $10/月 |
| **离线使用** | ❌ | ❌ | ❌ |
| **语言支持** | 广泛 | 专注于主流 | 专注于主流 |

### 2.2 Claude Code - 全能型 AI IDE

#### 核心特性

**1. 深度上下文理解**

```
优势:
- 200K token 上下文窗口
- 理解整个项目结构
- 跨文件关联分析
- 长期记忆能力

示例:
@src/auth/login.ts @src/auth/middleware.ts @src/types/user.ts
请分析用户认证流程的完整逻辑，并指出潜在的安全问题
```

**2. MCP 协议支持**

```python
# MCP 服务器集成
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "database": {
      "command": "python",
      "args": ["db_mcp_server.py"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}

# Claude Code 可以直接访问:
# - 文件系统
# - 数据库
# - Git 历史
# - 自定义数据源
```

**3. Agent 能力**

```
Claude Code 作为 Agent:

1. 自主规划
   - 分解复杂任务
   - 制定执行步骤
   - 识别依赖关系

2. 工具调用
   - 文件读写
   - 命令执行
   - 代码测试
   - Git 操作

3. 反思改进
   - 验证结果
   - 自我纠错
   - 迭代优化

示例对话:
User: "重构用户认证模块，添加双因素认证"

Claude Code:
1. [分析] 读取当前认证代码
2. [规划] 制定重构计划
3. [实现] 生成新代码
4. [测试] 编写并运行测试
5. [验证] 确保功能正常
6. [文档] 更新相关文档
```

#### 最佳场景

```
✅ 大型项目重构
   - 需要理解整个项目
   - 跨模块修改
   - 保持架构一致性

✅ 复杂 Bug 诊断
   - 需要分析多个文件
   - 理解系统交互
   - 执行调试命令

✅ 架构设计
   - 需要全局视角
   - 权衡技术方案
   - 生成架构文档

✅ MCP 集成需求
   - 自定义数据源
   - 企业内部系统
   - 特殊工具链
```

### 2.3 Cursor - 代码编辑专家

#### 核心特性

**1. 强大的代码编辑**

```
Cursor 编辑能力:

1. 智能预测
   - 预测下一步编辑
   - 多光标编辑
   - 批量重构

2. Tab 补全
   - 实时补全
   - 函数级生成
   - 上下文感知

3. Cmd+K 快速编辑
   - 选中文本
   - 输入指令
   - 即时生成
```

**2. Cmd+L 聊天模式**

```
使用场景:

# 添加功能
Cmd+L: "为这个函数添加输入验证"

# 修复错误
Cmd+L: "修复这个 TypeScript 类型错误"

# 优化代码
Cmd+L: "优化这段代码的性能"

# 解释代码
Cmd+L: "解释这段递归代码的逻辑"
```

**3. Cmd+I 代码库感知**

```python
# 全项目搜索和修改

Cmd+I: "在所有组件中将 'onClick' 改为 'onTap'"

Cursor 会:
1. 搜索所有组件
2. 预览修改位置
3. 批量应用修改
4. 确保一致性
```

#### 最佳场景

```
✅ 日常功能开发
   - 快速生成代码
   - 实时编辑优化
   - 快速迭代

✅ 代码重构
   - 局部代码优化
   - 设计模式应用
   - 代码风格统一

✅ 学习新技术
   - 代码示例生成
   - 语法快速学习
   - 最佳实践参考

✅ 个人项目
   - 快速原型开发
   - 小型应用
   - 独立开发
```

### 2.4 GitHub Copilot - 智能结对编程

#### 核心特性

**1. 实时代码建议**

```python
# 边写边补全

def send_notification(user, message):
    # Copilot 建议:
    # 1. 检查用户通知偏好
    # 2. 选择通知渠道
    # 3. 发送通知
    # 4. 记录日志
    preferences = get_notification_preferences(user.id)
    if preferences.get('email_enabled'):
        send_email(user.email, message)
    if preferences.get('push_enabled'):
        send_push(user.device_token, message)
```

**2. Copilot Chat**

```
交互模式:

# 解释代码
Copilot Chat: "这段代码做了什么？
              # 解释 @app.route 装饰器的作用"

# 生成测试
Copilot Chat: "为这个函数生成单元测试"

# 文档生成
Copilot Chat: "为这个类生成 docstring"

# 问题排查
Copilot Chat: "为什么这个测试失败了？
              # 帮我调试 @test_auth.py"
```

**3. GitHub 集成**

```
深度集成功能:

1. PR 代码审查
   - 自动识别潜在问题
   - 提供改进建议
   - 检查安全性

2. Issue 分析
   - 理解 issue 描述
   - 生成修复代码
   - 关联相关提交

3. Actions 支持
   - CI/CD 脚本生成
   - 工作流优化
```

#### 最佳场景

```
✅ 企业团队开发
   - 统一开发环境
   - 代码规范一致
   - 与 GitHub 深度集成

✅ 结对编程
   - 实时代码建议
   - 减少语法错误
   - 提升编码速度

✅ 测试编写
   - 自动生成测试
   - 边界情况覆盖
   - 测试框架集成

✅ 文档生成
   - 代码注释
   - API 文档
   - README 自动化
```

---

## 3. 上下文管理原理

### 3.1 为什么上下文至关重要

#### AI 的上下文理解机制

```
AI LLM 的上下文窗口:

┌─────────────────────────────────────┐
│   上下文窗口 (Context Window)       │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ System   │  │   User   │        │
│  │ Prompt   │  │  Query   │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      Project Context         │  │
│  │  - Code files                │  │
│  │  - Documentation             │  │
│  │  - History                   │  │
│  │  - Configuration             │  │
│  └──────────────────────────────┘  │
│                                     │
│  限制: Token 数量                    │
│  Claude: 200K tokens                │
│  GPT-4: 32K-128K tokens             │
└─────────────────────────────────────┘

问题:
- 上下文窗口有限
- 项目可能很大
- 如何选择最相关的内容？
```

#### 上下文质量的影响

```python
# 场景: 修复用户认证 bug

# ❌ 差的上下文
User: "修复登录 bug"

AI: "请提供更多信息：
     - 什么错误？
     - 在哪个文件？
     - 复现步骤是什么？"

# → 需要多轮对话，效率低

# ✅ 好的上下文
User: """
@src/auth/login.ts
@src/middleware/auth.ts
@error.log

修复登录 bug:
错误: TypeError: Cannot read property 'token' of undefined
位置: login.ts:45
复现: 用户登录后返回 500
"""

AI: "我分析了代码和错误日志。
     问题在于 login.ts:45，user 对象可能为 undefined。
     修复方案: 添加空值检查...

     [生成修复代码]
     [运行测试验证]
     [确认修复成功]"

# → 一次性解决，效率高
```

### 3.2 上下文管理的价值

#### 1. 提升准确性

```
上下文完整性 vs AI 准确性:

无上下文      ████████░░ 80%
基本上下文    ██████████ 90%
完整上下文    ██████████ 95%
优化上下文    ██████████ 98%

结论: 上下文越好，结果越准确
```

#### 2. 减少迭代

```
上下文质量与迭代次数:

❌ 差上下文:
Round 1: AI 生成代码 → 缺少错误处理
Round 2: 添加错误处理 → 类型不匹配
Round 3: 修复类型 → 性能问题
Round 4: 优化性能 → 完成

✅ 好上下文:
Round 1: 一次性生成完整代码 → 完成

节省: 75% 时间
```

#### 3. 增强理解

```
AI 理解层次:

Level 1: 语法理解
- "这是一个 if 语句"

Level 2: 语义理解
- "这是用户认证逻辑"

Level 3: 上下文理解
- "这是 JWT 认证，与整个系统架构一致"

Level 4: 业务理解
- "这是符合 GDPR 要求的用户认证流程"

目标: 通过上下文让 AI 达到 Level 4
```

---

## 4. 上下文管理策略

### 4.1 策略一：项目结构清晰化

#### 优秀的项目结构原则

**1. 按功能组织**

```
❌ 按技术类型组织（传统方式）
project/
├── controllers/
├── models/
├── views/
└── utils/

问题:
- 难以找到功能相关代码
- 跨文件修改困难
- AI 难以理解功能边界

✅ 按功能模块组织（现代方式）
project/
├── src/
│   ├── auth/              # 认证模块
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.model.ts
│   │   └── auth.types.ts
│   ├── user/              # 用户模块
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   └── user.model.ts
│   └── shared/            # 共享代码
│       ├── utils/
│       ├── types/
│       └── middleware/

优势:
- 功能内聚
- 易于维护
- AI 容易理解模块关系
```

**2. 清晰的命名约定**

```typescript
// ❌ 模糊的命名
src/
├── file1.ts
├── file2.ts
└── helper.ts

// ✅ 清晰的命名
src/
├── services/
│   ├── user.service.ts       # 用户业务逻辑
│   └── auth.service.ts       # 认证业务逻辑
├── controllers/
│   ├── user.controller.ts    # 用户路由处理
│   └── auth.controller.ts    # 认证路由处理
├── models/
│   ├── user.model.ts         # 用户数据模型
│   └── session.model.ts      # 会话数据模型
└── types/
    ├── user.types.ts         # 用户类型定义
    └── api.types.ts          # API 类型定义

// AI 能从命名理解:
// - 文件职责
// - 模块关系
// - 代码层次
```

**3. 分层架构**

```
推荐的项目层次:

project/
├── src/
│   ├── core/              # 核心业务逻辑
│   │   ├── domain/        # 领域模型
│   │   └── services/      # 业务服务
│   ├── infrastructure/    # 基础设施
│   │   ├── database/      # 数据库
│   │   ├── external-api/  # 外部 API
│   │   └── cache/         # 缓存
│   ├── application/       # 应用层
│   │   ├── use-cases/     # 用例
│   │   └── dtos/          # 数据传输对象
│   ├── presentation/      # 表现层
│   │   ├── controllers/   # 控制器
│   │   ├── views/         # 视图
│   │   └── validators/    # 验证器
│   └── shared/            # 共享
│       ├── utils/         # 工具
│       ├── types/         # 类型
│       └── constants/     # 常量
├── tests/
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/               # 端到端测试
└── docs/                  # 文档

AI 理解优势:
- 清晰的职责分离
- 依赖关系明确
- 易于定位代码
```

### 4.2 策略二：README 驱动上下文

#### AI 原生 README 的价值

**传统 README vs AI 原生 README**

```
传统 README:
✗ 项目简介
✗ 安装说明
✗ 基本使用

AI 原生 README:
✓ 项目概述
✓ 技术栈
✓ 项目结构
✓ 核心概念
✓ 开发规范
✓ 快速开始
✓ 常见任务
✓ AI 辅助提示

区别: AI 原生 README 包含 AI 需要的所有上下文
```

### 4.3 策略三：模块化文档

#### 文档体系架构

```
docs/
├── README.md                  # 文档入口
├── architecture.md            # 架构文档 ⭐ 必需
├── api.md                     # API 文档 ⭐ 必需
├── database.md                # 数据库文档
├── deployment.md              # 部署文档
├── development.md             # 开发指南
├── features/                  # 功能文档
│   ├── authentication.md
│   ├── user-management.md
│   └── reporting.md
└── guides/                    # 指南
    ├── getting-started.md
    ├── troubleshooting.md
    └── best-practices.md
```

#### 必需文档清单

1. **architecture.md** - 系统架构、模块设计、数据流
2. **api.md** - API 端点、请求/响应格式、认证方式
3. **README.md** - 项目入口、快速开始、核心概念

### 4.4 策略四：智能上下文选择

#### Claude Code 上下文选择技巧

**@ 符号的使用**

```markdown
# 基础用法

# 单个文件
@src/auth/login.ts
"解释登录函数的逻辑"

# 多个文件
@src/auth/login.ts @src/auth/middleware.ts @src/types/auth.ts
"分析认证流程的完整逻辑"

# 整个目录
@src/auth/
"重构认证模块，提升安全性"
```

**精确上下文 vs 宽泛上下文**

```markdown
# ❌ 太宽泛
@src/
"优化性能"

# 问题:
- AI 不知道要优化什么
- 可能优化不相关的代码
- 浪费 token

# ✅ 精确定向
@src/services/data-processing.ts @tests/data-processing.test.ts
"优化数据处理服务的性能，
目前处理 10000 条记录需要 5 秒，
目标优化到 1 秒以内"

# 优势:
- 明确目标
- 相关代码
- 可衡量
```

**层级上下文策略**

```
策略: 从全局到局部

Level 1: 项目概览
@README.md @docs/architecture.md
"理解项目整体架构"

Level 2: 模块上下文
@src/auth/ @docs/features/authentication.md
"理解认证模块的设计"

Level 3: 具体文件
@src/auth/services/login.service.ts
"修复登录服务中的 bug"

# 优势:
- AI 建立完整认知
- 理解上下文关系
- 做出符合架构的决策
```

---

## 5. AI 原生 README 撰写

### 5.1 AI 原生 README 完整模板

```markdown
# [项目名称]

## 项目概述

[一句话描述项目做什么]

**核心功能:**
- 功能 1: [描述]
- 功能 2: [描述]
- 功能 3: [描述]

**业务目标:**
[解决什么业务问题]

---

## 技术栈

### 前端
- **框架:** React 18.2.0
- **状态管理:** Redux Toolkit
- **UI 库:** Material-UI v5
- **构建工具:** Vite

### 后端
- **框架:** Express 4.18.0
- **数据库:** PostgreSQL 14
- **ORM:** Prisma
- **认证:** JWT + Passport

### 开发工具
- **语言:** TypeScript 5.0
- **测试:** Jest + React Testing Library
- **Lint:** ESLint + Prettier
- **包管理:** pnpm

---

## 项目结构

project/
├── src/
│   ├── frontend/              # 前端代码
│   │   ├── components/        # React 组件
│   │   ├── pages/             # 页面组件
│   │   ├── store/             # Redux store
│   │   ├── services/          # API 服务
│   │   └── utils/             # 工具函数
│   ├── backend/               # 后端代码
│   │   ├── controllers/       # 控制器
│   │   ├── services/          # 业务逻辑
│   │   ├── models/            # 数据模型
│   │   └── middleware/        # 中间件
│   └── shared/                # 共享代码
│       ├── types/             # TypeScript 类型
│       └── constants/         # 常量定义
├── tests/                     # 测试
├── docs/                      # 文档
└── scripts/                   # 脚本

**模块说明:**

### Frontend (`src/frontend/`)
- **components/**: 可复用的 UI 组件
  - `common/`: 通用组件（Button, Input 等）
  - `features/`: 功能组件（UserProfile, Dashboard 等）
- **pages/**: 页面级组件
- **store/**: Redux 状态管理
  - `slices/`: Redux slices
  - `selectors/`: 选择器
- **services/**: API 调用封装

### Backend (`src/backend/`)
- **controllers/**: HTTP 请求处理
- **services/**: 业务逻辑层
- **models/**: 数据模型（Prisma schema）
- **middleware/**: Express 中间件
  - `auth.ts`: JWT 认证
  - `error.ts`: 错误处理
  - `validation.ts`: 请求验证

### Shared (`src/shared/`)
- **types/**: 前后端共享类型
- **constants/**: 应用常量

---

## 核心概念

### 架构设计

**前后端分离架构:**

```
┌─────────────┐      API       ┌─────────────┐
│   React     │◄──────────────►│   Express   │
│   Frontend  │   REST/GraphQL │   Backend   │
└─────────────┘                └─────────────┘
       │                               │
       │                               │
       ▼                               ▼
┌─────────────┐                ┌─────────────┐
│  Redux      │                │ PostgreSQL  │
│  Store      │                │  Database   │
└─────────────┘                └─────────────┘
```

### 数据流

**单向数据流:**

```
User Action
    ↓
Dispatch Action
    ↓
Reducer updates State
    ↓
Selectors derive data
    ↓
Components re-render
```

---

## 开发规范

### 代码风格

**TypeScript 规范:**
- 使用严格模式: `strict: true`
- 优先使用 `interface` 而非 `type`
- 避免使用 `any`，使用 `unknown`
- 函数返回类型必须显式声明

**命名约定:**
- 组件: PascalCase (`UserProfile.tsx`)
- 函数: camelCase (`getUserById`)
- 常量: UPPER_SNAKE_CASE (`API_BASE_URL`)
- 类型/接口: PascalCase (`User`, `ApiResponse`)

**文件组织:**
- 一个文件一个主要导出
- 相关文件放在同一目录
- 使用 `index.ts` 简化导入

### Git 工作流

**分支策略:**
- `main`: 生产环境
- `develop`: 开发环境
- `feature/*`: 功能分支
- `bugfix/*`: Bug 修复分支

**提交规范:**
```
<type>(<scope>): <subject>

type:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例:
feat(auth): add JWT refresh token
fix(user): resolve profile image upload bug
docs(readme): update installation guide
```

---

## 快速开始

### 环境要求

- Node.js: >= 18.0.0
- pnpm: >= 8.0.0
- PostgreSQL: >= 14.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/your-project.git
cd your-project

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
pnpm prisma migrate dev

# 启动开发服务器
pnpm dev
```

---

## 常见任务

### 添加新功能

**步骤:**

1. **创建功能分支**
   ```bash
   git checkout -b feature/user-profile
   ```

2. **定义数据模型** (如需要)
   ```bash
   # src/backend/models/profile.model.ts
   # src/shared/types/profile.types.ts
   ```

3. **实现后端 API**
   - Controller: `src/backend/controllers/profile.controller.ts`
   - Service: `src/backend/services/profile.service.ts`
   - Routes: `src/backend/routes/profile.routes.ts`

4. **实现前端页面**
   - Component: `src/frontend/pages/ProfilePage.tsx`
   - Service: `src/frontend/services/profileApi.ts`
   - Redux: `src/frontend/store/slices/profileSlice.ts`

5. **编写测试**
   - Unit: `tests/unit/profile.service.test.ts`
   - Integration: `tests/integration/profile.api.test.ts`

6. **更新文档**
   ```bash
   # docs/features/user-profile.md
   ```

7. **测试并提交**
   ```bash
   pnpm test
   git add .
   git commit -m "feat(profile): add user profile page"
   ```

---

## AI 辅助开发提示

### 使用 Claude Code

**上下文选择:**

```bash
# 理解功能
@src/frontend/features/auth/ @docs/features/authentication.md
"解释认证流程的工作原理"

# 实现功能
@src/backend/models/ @src/backend/controllers/
"实现用户 CRUD API"

# 修复问题
@error.log @src/backend/controllers/auth.controller.ts
"修复登录返回 500 错误"

# 重构代码
@src/services/user.service.ts
"重构以提升性能和可读性"
```

**常用提示词:**

```
# 代码生成
"基于 [需求文档] 实现 [功能]，遵循 [编码规范]"

# 代码审查
"审查 [文件]，检查:
1. 安全问题
2. 性能瓶颈
3. 代码异味
4. 最佳实践"

# 测试生成
"为 [文件] 生成单元测试，覆盖率 > 80%"

# 文档生成
"为 [功能] 生成 API 文档"
```
```

### 5.2 README 维护

```markdown
# 保持 README 更新

✅ 必须更新的时机:
- 添加新功能
- 修改项目结构
- 更新技术栈
- 改变工作流程

✅ 定期检查:
- 每月检查一次
- 确保所有命令可运行
- 更新过时信息
- 补充新发现

✅ 使用 AI 辅助:
@README.md @src/
"检查 README 是否与当前代码库一致，
建议需要更新的部分"
```

---

## 6. 模块化文档体系

### 6.1 架构文档 (architecture.md)

```markdown
# 系统架构文档

## 概述
本系统采用前后端分离的微服务架构，支持水平扩展和高可用性。

## 架构图

```
        ┌─────────────┐
        │   Client    │
        │  (Browser)  │
        └──────┬──────┘
               │
        HTTPS  │
               │
        ┌──────▼──────┐
        │   Load      │
        │  Balancer   │
        └──────┬──────┘
               │
       ┌───────┼────────┐
       │       │        │
    ┌──▼───┐ ┌▼────┐ ┌──▼──┐
    │ Web  │ │ API │ │Admin│
    └──┬───┘ └┬────┘ └──┬──┘
       │      │         │
       └──────┼─────────┘
              │
        ┌─────▼─────┐
        │ Database  │
        │  Cluster  │
        └───────────┘
```

## 技术栈

### 前端
- React 18.2
- TypeScript 5.0
- Redux Toolkit
- Material-UI v5

### 后端
- Node.js 18
- Express 4.18
- TypeScript 5.0

### 数据库
- PostgreSQL 14
- Prisma ORM

## 模块设计

### 认证模块

**职责:**
- 用户注册/登录
- JWT Token 签发和验证
- 权限控制

**流程:**
```
1. 用户提交登录凭证
2. 后端验证凭证
3. 生成 JWT token (访问 token + 刷新 token)
4. 返回给客户端
5. 客户端存储 token
6. 后续请求携带 token
7. 后端验证 token
```

## 数据模型

### User (用户)
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

## API 设计原则

### RESTful 规范
- 使用名词而非动词
- 使用复数形式
- 使用小写字母和连字符

## 安全设计

### 认证
**JWT Token:**
- Access token: 15 分钟
- Refresh token: 7 天

### 授权
**RBAC (Role-Based Access Control):**
```
Admin
├── user:read
├── user:write
├── user:delete
└── system:admin
```

## 性能优化

### 数据库索引策略
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

### 缓存策略
**Redis 缓存:**
```
User Profile: TTL 1 小时
Session: TTL 7 天
API Response: TTL 5 分钟
```
```

### 6.2 API 文档 (api.md)

```markdown
# API 文档

## 基础信息

**Base URL:** `https://api.example.com/v1`
**认证方式:** Bearer Token (JWT)
**Content-Type:** `application/json`

## 认证 API

### 用户登录

**端点:** `POST /api/auth/login`

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "expiresIn": 900,
    "user": {
      "id": "123",
      "email": "user@example.com"
    }
  }
}
```

**错误响应 (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

## 用户 API

### 获取用户列表

**端点:** `GET /api/users`

**查询参数:**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `search`: 搜索关键词

**响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

## 错误代码

| 代码 | HTTP 状态 | 描述 |
|-----|----------|------|
| `INVALID_CREDENTIALS` | 401 | 登录凭证无效 |
| `TOKEN_EXPIRED` | 401 | Token 已过期 |
| `USER_NOT_FOUND` | 404 | 用户不存在 |
| `VALIDATION_ERROR` | 400 | 验证失败 |

## 速率限制

**限制规则:**
- 每小时: 1000 请求/IP
- 每分钟: 100 请求/IP
```

---

## 7. AI 原生 PRD 实战

### 7.1 PRD 的演进

#### 传统 PRD 的问题

**场景对比**

```markdown
# 传统 PRD 开发流程

Day 1: 产品经理写 PRD
"实现用户评论功能"

Day 2: 开发者阅读 PRD
"需求不够详细..."
- 需要哪些字段？
- 评论权限如何控制？
- 如何处理敏感词？

Day 3: 会议讨论
"补充需求细节..."

Day 4-5: 开发实现
（边开发边确认）

Day 6: 测试发现遗漏
"没有考虑评论审核..."

Day 7: 修改和补充
（返工）

问题:
- 需求不完整
- 沟通成本高
- 开发效率低
- 容易返工
```

```markdown
# AI 原生 PRD 开发流程

Day 1: 产品经理写 AI 原生 PRD
"实现用户评论功能（包含所有细节）"

Day 2-3: AI Agent 实现
@PRD.md @docs/architecture.md
"根据 PRD 实现评论功能"

AI Agent:
1. 分析 PRD
2. 设计数据模型
3. 实现 API
4. 实现 UI
5. 编写测试
6. 生成文档

Day 4: 人工审查
（检查实现是否符合预期）

Day 5: 部署上线

优势:
- 需求完整
- 无需反复沟通
- 快速迭代
- 质量可控
```

#### 对比分析

| 维度 | 传统 PRD | AI 原生 PRD |
|------|---------|------------|
| **目标读者** | 人类开发者 | AI Agent |
| **详细程度** | 概念性 | 完全详细 |
| **上下文** | 依赖口头补充 | 包含所有上下文 |
| **可执行性** | 需要解读 | 可直接执行 |
| **维护成本** | 高 | 中 |
| **开发效率** | 低 | 高 |

### 7.2 AI 原生 PRD 的八大要素

#### 要素 1: 功能概述

**目标**

清晰描述要解决的问题和目标

```markdown
# 示例: 用户评论功能

## 问题背景
当前博客平台缺乏用户互动功能，读者无法对文章发表评论，
导致用户参与度低，社区活跃度不足。

## 功能目标
实现用户评论系统，允许注册用户对文章发表评论，
提升用户参与度和社区活跃度。

## 成功指标
- 文章评论率达到 5%（评论数/阅读数）
- 用户平均停留时间提升 30%
- 月活跃用户增长 20%
```

**SMART 原则**

```markdown
# 好的目标 vs 差的目标

❌ 差的目标:
"提升用户体验"

问题: 模糊，无法衡量

✅ 好的目标:
"在 3 个月内，将用户平均会话时长从 5 分钟提升到 7 分钟"

符合 SMART:
- Specific（具体）: 会话时长
- Measurable（可衡量）: 5 → 7 分钟
- Achievable（可实现）: 40% 增长合理
- Relevant（相关）: 提升用户体验
- Time-bound（有时限）: 3 个月
```

#### 要素 2: 用户故事

**目标用户画像**

```markdown
# 用户画像

## 画像 1: 评论者 Alice

**基本信息:**
- 年龄: 28 岁
- 职业: 软件工程师
- 技术水平: 高

**使用场景:**
- 阅读技术文章后想分享见解
- 希望与作者和读者讨论
- 需要代码格式化支持

**痛点:**
- 当前无法发表评论
- 无法看到他人评论
- 无法回复讨论

**期望:**
- Markdown 支持
- 代码高亮
- 实时预览

## 画像 2: 博客作者 Bob

**基本信息:**
- 年龄: 35 岁
- 职业: 技术博主
- 技术水平: 中

**使用场景:**
- 需要管理文章评论
- 希望回复读者问题
- 需要审核不当内容

**痛点:**
- 缺少与读者互动渠道
- 无法了解读者反馈

**期望:**
- 评论审核功能
- 评论通知
- 数据统计
```

#### 要素 3: 功能需求

**核心功能**

```markdown
# 功能 1: 发表评论

**输入:**
- articleId: 文章 ID（string, required）
- content: 评论内容（string, required, max 5000 字符）
- parentId: 父评论 ID（string, optional, 用于回复）

**处理逻辑:**
1. 验证用户登录状态
2. 验证文章是否存在
3. 验证评论内容:
   - 长度检查（1-5000 字符）
   - 敏感词过滤
   - XSS 防护
4. 如果是回复，验证父评论存在
5. 保存到数据库
6. 异步通知文章作者
7. 返回评论对象

**输出:**
```json
{
  "id": "comment-123",
  "articleId": "article-456",
  "user": {
    "id": "user-789",
    "name": "Alice",
    "avatar": "https://..."
  },
  "content": "Great article!",
  "contentHtml": "<p>Great article!</p>",
  "parentId": null,
  "status": "approved",
  "createdAt": "2025-01-05T10:30:00Z",
  "updatedAt": "2025-01-05T10:30:00Z",
  "replies": [],
  "replyCount": 0
}
```

**约束条件:**
- 性能: 响应时间 < 200ms
- 安全: 防止 SQL 注入、XSS 攻击
- 数据: 内容持久化，99.9% 可用性
```

**边界情况**

```markdown
# 边界情况处理

## 情况 1: 评论权限
**规则:**
- 仅注册用户可评论
- 被封禁用户不可评论
- 文章作者可删除任何评论

## 情况 2: 敏感词过滤
**规则:**
- 检测预定义敏感词列表
- 中英文混合检测
- 变体检测（如: $h!t）

## 情况 3: 评论频率限制
**规则:**
- 每分钟最多 5 条评论
- 每小时最多 20 条评论

## 情况 4: 超长评论
**规则:**
- 最大 5000 字符

## 情况 5: 回复深度限制
**规则:**
- 最多 3 层嵌套
```

#### 要素 4: 技术实现指导

**数据模型**

```prisma
model Comment {
  id          String   @id @default(uuid())
  articleId   String
  userId      String
  parentId    String?

  content     String   @db.Text
  contentHtml String   @db.Text

  status      CommentStatus @default(PENDING)

  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  article     Article   @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")

  @@index([articleId])
  @@index([userId])
  @@index([parentId])
  @@index([status])
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

#### 要素 5: 交互设计

**UI 设计规范**

```markdown
# UI 设计规范

## 评论输入区

**位置:** 文章底部

**交互规范:**
1. 输入框自动聚焦
2. 输入时实时字符计数
3. Ctrl/Cmd + Enter 提交
4. 提交中禁用按钮和输入框
5. 提交失败保留内容
6. 支持 Markdown 语法

## 评论列表

**显示规则:**
- 分页加载（每页 20 条）
- 默认按最新排序
- 支持按热门排序
- 回复缩进显示（最多 3 层）

**视觉规范:**
```
字体:
- 用户名: 14px, medium
- 时间: 12px, regular, gray
- 内容: 15px, regular, leading 1.6

间距:
- 评论间距: 16px
- 内容边距: 12px 0
- 回复缩进: 48px

颜色:
- 背景色: #ffffff
- 边框色: #e5e7eb
- 主色: #3b82f6
- 文本色: #1f2937
- 次要文本: #6b7280
```
```

#### 要素 6: 数据模型

详细的数据模型已在要素 4 中展示。

#### 要素 7: 测试策略

```markdown
# 测试策略

## 单元测试

### 目标覆盖率: 85%+

### Service 层测试

```typescript
describe('CommentService', () => {
  describe('createComment', () => {
    it('should create comment successfully', async () => {
      const comment = await commentService.createComment({
        articleId: 'article-123',
        userId: 'user-456',
        content: 'Test comment'
      });

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Test comment');
      expect(comment.status).toBe('pending');
    });

    it('should reject comment exceeding max length', async () => {
      await expect(
        commentService.createComment({
          articleId: 'article-123',
          userId: 'user-456',
          content: 'x'.repeat(5001)
        })
      ).rejects.toThrow('Comment too long');
    });
  });
});
```

## 集成测试

```typescript
describe('Comment API Integration', () => {
  describe('POST /api/articles/:articleId/comments', () => {
    it('should create comment', async () => {
      const response = await request(app)
        .post('/api/articles/article-123/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Great article!'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toBe('Great article!');
    });
  });
});
```

## E2E 测试

```typescript
describe('Comment E2E', () => {
  it('should complete comment flow', async () => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    // 2. 导航到文章
    await page.goto('/articles/article-123');

    // 3. 输入评论
    await page.fill('textarea[name="content"]', 'Great article!');

    // 4. 提交评论
    await page.click('button[type="submit"]');

    // 5. 验证评论显示
    const comment = await page.waitForSelector('.comment-item');
    const text = await comment.evaluate(el => el.textContent);
    expect(text).toContain('Great article!');
  });
});
```
```

#### 要素 8: AI 开发指导

```markdown
# AI Agent 开发指导

## 开发步骤

### Step 1: 分析需求
@README.md @docs/architecture.md @PRD.md
"理解评论功能的整体需求和架构"

### Step 2: 设计数据模型
@src/models/
"基于 PRD 的数据模型设计，创建 Prisma schema"

### Step 3: 实现 Service 层
@src/services/comment.service.ts
"实现评论业务逻辑:
- createComment
- getComments
- deleteComment
- approveComment
- rejectComment

包含:
- 输入验证
- 敏感词过滤
- 频率限制
- 权限检查"

### Step 4: 实现 API 端点
@src/controllers/comment.controller.ts
@src/routes/comment.routes.ts
"实现 REST API 端点:
- POST /api/articles/:articleId/comments
- GET /api/articles/:articleId/comments
- DELETE /api/comments/:id
- PATCH /api/comments/:id/status"

### Step 5: 实现前端组件
@src/frontend/components/comments/
"创建 React 组件:
- CommentInput.tsx
- CommentList.tsx
- CommentItem.tsx
- CommentForm.tsx"

### Step 6: 实现 Redux 逻辑
@src/frontend/store/slices/commentSlice.ts
"实现评论状态管理:
- fetchComments
- createComment
- deleteComment
- updateEditing"

### Step 7: 编写测试
@tests/unit/comment.service.test.ts
@tests/integration/comment.api.test.ts
"编写单元测试和集成测试，覆盖率 > 85%"

### Step 8: 运行和验证
"运行所有测试，确保通过:
pnpm test

检查覆盖率:
pnpm test:coverage"

### Step 9: 生成文档
@docs/features/comments.md
"生成功能文档，包括:
- 功能概述
- API 使用说明
- 组件使用示例
- 配置说明"

## 验收标准

### 功能验收
- [ ] 用户可以发表评论
- [ ] 评论支持 Markdown
- [ ] 评论支持回复（最多 3 层）
- [ ] 敏感词自动过滤
- [ ] 频率限制生效
- [ ] 文章作者可删除评论
- [ ] 支持评论审核
- [ ] 评论通知发送

### 技术验收
- [ ] 所有测试通过（> 85% 覆盖率）
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] API 响应时间 < 200ms (P95)
- [ ] 前端性能得分 > 90

### 文档验收
- [ ] API 文档完整
- [ ] 组件使用文档完整
- [ ] 代码注释充分
- [ ] README 已更新
```

---

## 8. 智能上下文选择

### 8.1 不同场景下的上下文选择策略

#### 场景一: 新功能开发

```markdown
# 层级上下文策略

Level 1: 项目概览
@README.md @docs/architecture.md
"理解项目整体架构和技术栈"

Level 2: 相关模块
@src/features/similar-feature/ @docs/features/similar-feature.md
"参考类似功能的实现模式"

Level 3: 具体实现
@src/types/ @src/models/
"定义数据模型和类型"

Level 4: 功能实现
@src/controllers/ @src/services/
"实现新功能的 API 和业务逻辑"

Level 5: 测试验证
@tests/
"编写测试用例"
```

#### 场景二: Bug 修复

```markdown
# 精确上下文策略

✅ 包含:
1. 错误日志
   @error.log @logs/

2. 相关代码
   @src/auth/login.ts @src/middleware/auth.ts

3. 测试文件
   @tests/auth.test.ts

4. 配置文件
   @.env.example

❌ 不包含:
- 不相关的模块
- 整个 src 目录
- 文档文件（除非必要）

示例提示词:
"""
@error.log @src/auth/login.ts @src/middleware/auth.ts

修复登录 bug:
错误: TypeError: Cannot read property 'token' of undefined
位置: login.ts:45
复现: 用户登录后返回 500
"""
```

#### 场景三: 代码重构

```markdown
# 模块级上下文策略

小重构 (单个文件):
@src/services/user.service.ts
"优化函数性能，添加错误处理"

中重构 (模块级):
@src/auth/
"重构认证模块，提升代码可读性和可维护性"

大重构 (跨模块):
@src/auth/ @src/user/ @docs/architecture.md
"重构认证和用户模块，统一错误处理机制"
```

#### 场景四: 架构设计

```markdown
# 全局上下文策略

@README.md @docs/architecture.md @docs/api.md
"设计新功能的技术方案，确保与现有架构一致"

# 包含:
- 整体架构
- 现有 API 设计
- 数据模型
- 技术栈约束
```

#### 场景五: 学习新代码库

```markdown
# 渐进式上下文策略

Step 1: 项目概览
@README.md
"了解项目是什么"

Step 2: 技术栈
@package.json @tsconfig.json
"了解使用的技术"

Step 3: 架构理解
@docs/architecture.md
"理解系统架构"

Step 4: 核心模块
@src/core/ @src/services/
"理解核心业务逻辑"

Step 5: 入口点
@src/index.ts @src/main.ts
"理解应用启动流程"
```

### 8.2 上下文优先级矩阵

```
高优先级（必须包含）:
✓ 需求文档 (@docs/PRD-*.md)
✓ 相关代码 (@src/feature/)
✓ 测试文件 (@tests/*.test.ts)
✓ 配置文件 (@config/)

中优先级（按需包含）:
◐ 架构文档 (@docs/architecture.md)
◐ 相关模块 (@src/related/)
◐ 示例代码 (@examples/)
◐ 错误日志 (@logs/)

低优先级（可选）:
○ 历史提交 (@git:commit-*)
○ Issue 讨论 (@github:issue-*)
○ 文档注释
```

### 8.3 Cursor 上下文技巧

**文件打开策略**

```markdown
# Cursor 自动考虑打开的文件

技巧 1: 打开相关文件
1. 打开主要文件
2. 打开导入的文件
3. 打开测试文件

Cursor 会自动:
- 分析文件关系
- 理解导入依赖
- 考虑上下文一致性
```

**快捷键上下文**

```
Cmd+K: 编辑选中代码
- 上下文: 当前选中内容 + 打开的文件
- 适用: 快速修改

Cmd+L: 聊天模式
- 上下文: 整个项目
- 适用: 复杂查询

Cmd+I: 全项目搜索
- 上下文: 所有匹配文件
- 适用: 批量修改
```

### 8.4 Copilot 上下文技巧

**注释驱动**

```typescript
// 策略: 使用详细注释

/**
 * 从用户 ID 列表批量获取用户信息
 *
 * @param userIds - 用户 ID 数组
 * @returns 用户信息 Map，key 为 userId
 *
 * 实现要求:
 * - 最多处理 100 个用户 ID
 * - 使用批量查询优化性能
 * - 缓存结果 5 分钟
 * - 处理不存在的用户 ID
 */
async function batchGetUsers(userIds: string[]): Promise<Map<string, User>> {
    // Copilot 根据详细注释生成高质量代码
}
```

**类型提示**

```typescript
// 策略: 使用明确的类型

interface GetUserOptions {
    userId: string;
    includeProfile?: boolean;
    includePreferences?: boolean;
}

// Copilot 根据类型推断功能
function getUser(options: GetUserOptions): Promise<User> {
    // 实现
}
```

---

## 9. 实战案例深度解析

### 9.1 案例 1: REST API 开发

#### 使用 Claude Code

```markdown
# 步骤 1: 理解需求
@docs/PRD-user-api.md
"理解用户 API 的需求和验收标准"

# 步骤 2: 设计数据模型
"设计 User 数据模型，包括:
- 字段定义
- 验证规则
- 关系映射"

# 步骤 3: 实现 CRUD
@src/models/User.ts
"实现 User 模型的 CRUD 操作"

# 步骤 4: 创建 API 端点
@src/routes/userRoutes.ts
"实现用户 REST API 端点:
- GET /api/users
- GET /api/users/:id
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id"

# 步骤 5: 添加中间件
@src/middleware/auth.ts
"添加认证和授权中间件"

# 步骤 6: 编写测试
@tests/user.test.ts
"编写完整的 API 测试"

# 步骤 7: 运行验证
"运行测试并修复问题"

# 时间: 约 15 分钟
```

#### 使用 Cursor

```markdown
# 步骤 1: 创建模型文件
UserModel.ts

# 步骤 2: Cmd+K
"创建 User Mongoose 模型，包含 name, email, password 字段"

# 步骤 3: 创建路由文件
userRoutes.ts

# 步骤 4: Cmd+K
"实现用户 CRUD API 端点"

# 步骤 5: 手动调整细节

# 步骤 6: 编写测试

# 时间: 约 20 分钟
```

#### 使用 Copilot

```markdown
# 步骤 1: 手动编写骨架
// UserModel.ts
const UserSchema = new Schema({
    // Copilot 补全字段
})

// 步骤 2: 编写路由
router.get('/users', async (req, res) => {
    // Copilot 补全实现
})

# 步骤 3: 逐步完善

# 时间: 约 30 分钟
```

#### 对比总结

| 工具 | 时间 | 代码质量 | 需要调整 | 适用阶段 |
|-----|------|---------|---------|---------|
| Claude Code | 15 min | ⭐⭐⭐⭐⭐ | 极少 | 完整功能开发 |
| Cursor | 20 min | ⭐⭐⭐⭐ | 少量 | 快速迭代 |
| Copilot | 30 min | ⭐⭐⭐ | 中等 | 日常编码 |

### 9.2 案例 2: 复杂 Bug 诊断

#### 场景描述

```
Bug: 用户登录后随机返回 500 错误
频率: 约 10% 的登录请求
影响: 严重影响用户体验
```

#### 使用 Claude Code 诊断

```markdown
# Step 1: 收集上下文
@error.log @src/auth/login.ts @src/middleware/auth.ts @src/services/session.service.ts
"分析登录错误日志和相关代码"

# Step 2: 执行调试命令
"运行以下调试命令:
1. 检查数据库连接状态
2. 查看最近的错误日志
3. 运行相关测试"

# Step 3: 根本原因分析
Claude Code 发现:
"问题在于 session.service.ts:45
当并发登录请求时，可能出现竞态条件
导致 session 创建失败"

# Step 4: 修复方案
"添加数据库事务和重试机制:
1. 使用事务确保原子性
2. 添加重试逻辑（最多 3 次）
3. 添加详细日志"

# Step 5: 验证修复
"编写并发测试，模拟 100 个并发登录请求
验证修复后不再出现 500 错误"

# 结果: Bug 完全修复，耗时 30 分钟
```

#### 传统方式诊断

```
Step 1: 手动查看错误日志 (30 分钟)
Step 2: 添加调试日志 (15 分钟)
Step 3: 重新部署 (10 分钟)
Step 4: 等待问题复现 (2 小时)
Step 5: 分析日志 (30 分钟)
Step 6: 修复代码 (20 分钟)
Step 7: 验证修复 (1 小时)

总计: 约 4 小时

效率对比: Claude Code 快 8 倍
```

### 9.3 案例 3: 大型项目重构

#### 场景描述

```
项目: 电商系统
规模: 500+ 文件
任务: 重构支付模块
挑战:
- 支付流程涉及多个服务
- 需要保持向后兼容
- 不能影响生产环境
```

#### 使用 Claude Code 重构

```markdown
# Phase 1: 理解现状 (Day 1)

@README.md @docs/architecture.md @docs/api.md
"理解项目整体架构"

@src/payment/ @src/order/ @src/inventory/
"理解支付相关模块的当前实现"

"生成支付模块架构图，识别:
- 模块依赖关系
- 数据流
- 潜在问题"

# Phase 2: 设计方案 (Day 2)

"设计新的支付模块架构:
1. 分离支付逻辑和渠道
2. 引入支付网关抽象层
3. 添加支付状态机
4. 实现幂等性保证
5. 添加补偿机制"

# Phase 3: 渐进式重构 (Day 3-5)

Step 1: 创建新架构
@src/payment/gateways/ @src/payment/services/
"实现支付网关抽象层和具体实现:
- StripeGateway
- PayPalGateway
- AlipayGateway"

Step 2: 实现状态机
@src/payment/state-machine.ts
"实现支付状态机:
- PENDING → PROCESSING → SUCCESS/FAILED
- 支持状态转换验证
- 记录状态转换历史"

Step 3: 添加幂等性
@src/middleware/idempotency.ts
"实现幂等性中间件:
- 使用 requestId 去重
- 缓存请求结果
- 处理并发请求"

Step 4: 编写测试
@tests/payment/
"编写完整的测试套件:
- 单元测试 (覆盖率 > 85%)
- 集成测试
- E2E 测试
- 性能测试"

Step 5: 灰度发布
"实现灰度发布策略:
1. 使用特性开关
2. 1% → 10% → 50% → 100%
3. 监控关键指标
4. 准备回滚方案"

# Phase 4: 验证和优化 (Day 6-7)

"运行性能测试:
- 压力测试 (1000 TPS)
- 延迟测试 (P99 < 100ms)
- 可用性测试 (99.99%)"

"优化性能瓶颈:
1. 数据库查询优化
2. 缓存策略优化
3. 异步处理优化"

"生成迁移文档和运维手册"

# 结果: 7 天完成重构，零故障上线
```

#### 传统方式重构

```
时间: 3-4 周
风险:
- 需求理解不完整
- 架构设计反复
- 代码质量不稳定
- 测试覆盖不足
- 上线后频繁回滚

对比: Claude Code 提升 3 倍效率，质量更高
```

---

## 10. 核心思想总结

### 10.1 AI IDE 的核心理念

#### 1. Context is Everything

**上下文是 AI IDE 发挥效能的关键**

```
上下文质量层次:

Level 1: 无上下文
- AI 只能根据提示词生成
- 准确率: 60-70%

Level 2: 基本上下文
- AI 了解部分代码
- 准确率: 80-85%

Level 3: 完整上下文
- AI 理解整个模块
- 准确率: 90-95%

Level 4: 优化上下文
- AI 掌握完整上下文和架构
- 准确率: 95-98%

目标: 始终提供 Level 3-4 的上下文
```

#### 2. Iterate and Validate

**快速迭代，持续验证**

```
开发流程:

1. 快速生成
   - 使用 AI 快速生成初始代码
   - 不要追求第一次就完美

2. 逐步验证
   - 编写测试
   - 运行验证
   - 发现问题

3. 迭代改进
   - 根据反馈调整
   - 优化性能
   - 完善细节

4. 持续集成
   - 频繁提交
   - 自动化测试
   - 早期发现问题

优势:
- 减少返工
- 提升质量
- 加速交付
```

#### 3. Trust but Verify

**信任 AI，但始终验证**

```
信任光谱:

完全不信任 ←───────────────────────→ 完全信任
     ▲                                    ▲
     │                                    │
  人工审查                            自动执行
  每一步                            所有决策

最佳实践:

高风险操作:
- 数据库删除 → 人工审查
- 权限变更 → 人工审查
- 支付交易 → 人工审查

中风险操作:
- 代码重构 → 部分审查
- 测试生成 → 部分审查
- 文档更新 → 部分审查

低风险操作:
- 代码格式化 → 自动执行
- 注释补充 → 自动执行
- 简单函数 → 自动执行
```

#### 4. Template-Driven Development

**模板驱动开发**

```
模板体系:

1. 项目模板
   - 技术栈选择
   - 目录结构
   - 配置文件

2. 代码模板
   - 设计模式
   - 代码片段
   - 最佳实践

3. 文档模板
   - README
   - PRD
   - API 文档

4. 提示词模板
   - 功能开发
   - Bug 修复
   - 代码审查

优势:
- 一致性
- 效率提升
- 质量保证
- 知识积累
```

#### 5. Human-in-the-Loop

**人机协作**

```
协作模式:

1. 人类提供高层指导
   - 需求定义
   - 架构设计
   - 验收标准

2. AI 执行细节实现
   - 代码生成
   - 测试编写
   - 文档生成

3. 人类审查和调整
   - 代码审查
   - 架构调整
   - 性能优化

4. 持续学习改进
   - 积累提示词
   - 完善模板
   - 优化流程

结果:
- 优势互补
- 效率最大化
- 质量可控
- 持续改进
```

### 10.2 上下文管理的黄金法则

#### 1. 精确性 > 广泛性

```
❌ 错误示例:
@src/
"优化性能"

✅ 正确示例:
@src/services/data-processing.ts @tests/data-processing.test.ts
"优化数据处理服务的性能，
目前处理 10000 条记录需要 5 秒，
目标优化到 1 秒以内"

法则:
- 宁可精确选择 3 个文件，也不要模糊选择整个目录
- 明确的目标比广泛的描述更有效
- 可衡量的指标比模糊的要求更清晰
```

#### 2. 层级递进

```
从全局到局部的上下文策略:

Level 1: 项目概览
@README.md @docs/architecture.md
→ AI 建立全局认知

Level 2: 模块上下文
@src/feature/ @docs/features/
→ AI 理解模块设计

Level 3: 具体文件
@src/feature/file.ts
→ AI 聚焦具体实现

优势:
- AI 建立完整认知
- 理解上下文关系
- 做出符合架构的决策
- 减少误解和返工
```

#### 3. 按需加载

```
根据任务类型动态调整上下文:

新功能开发:
- 需求文档
- 相关模块
- 测试文件
- 配置文件

Bug 修复:
- 错误日志
- 相关代码
- 测试文件
- 最小化上下文

代码重构:
- 整个模块
- 架构文档
- 依赖关系
- 测试文件

架构设计:
- 所有架构文档
- 数据模型
- API 设计
- 技术栈约束
```

#### 4. Token 效率

```
优化 Token 使用策略:

优先包含:
✓ 需求文档 (高信息密度)
✓ 相关代码 (直接相关)
✓ 测试文件 (展示预期行为)
✓ 配置文件 (环境信息)

避免包含:
✗ 不相关的模块 (噪音)
✗ 整个目录 (信息过载)
✗ 注释过多的文件 (Token 浪费)
✗ 历史提交 (除非必要)

优化技巧:
- 使用 @ 精确指定文件
- 使用摘要代替完整文档
- 分阶段提供上下文
- 清理不必要的注释
```

### 10.3 AI 原生开发的核心原则

#### 1. 文档驱动

```
一切从文档开始:

1. PRD → 功能需求
2. Architecture → 架构设计
3. API → 接口定义
4. Test → 测试用例

优势:
- 需求清晰
- 设计完整
- 可追溯
- 易维护
```

#### 2. 测试先行

```
TDD (Test-Driven Development):

1. 先写测试
   - 定义预期行为
   - 明确验收标准

2. AI 生成代码
   - 基于测试实现
   - 确保通过测试

3. 重构优化
   - 在测试保护下
   - 安全重构

优势:
- 质量保证
- 设计清晰
- 易于重构
- 文档同步
```

#### 3. 渐进增强

```
从简单到复杂:

Phase 1: MVP (Minimum Viable Product)
- 核心功能
- 基本测试
- 简单文档

Phase 2: 增强
- 边界情况
- 错误处理
- 性能优化

Phase 3: 完善
- 高级功能
- 全面测试
- 完整文档

优势:
- 快速交付
- 早期反馈
- 降低风险
- 持续改进
```

#### 4. 自动化优先

```
能自动化的都自动化:

1. 代码生成
   - 使用 AI 生成模板代码
   - 自动创建文件结构
   - 自动生成配置

2. 测试自动化
   - 自动生成测试用例
   - 自动运行测试
   - 自动生成覆盖率报告

3. 文档自动化
   - 自动生成 API 文档
   - 自动更新 README
   - 自动生成 CHANGELOG

4. CI/CD 自动化
   - 自动构建
   - 自动测试
   - 自动部署

优势:
- 效率提升
- 错误减少
- 质量保证
- 快速迭代
```

---

## 11. 参考资料

### 11.1 官方文档

1. **Claude Code**
   - [Claude Code Documentation](https://claude.ai/code/docs)
   - [Claude API 文档](https://docs.anthropic.com)
   - [MCP 协议规范](https://modelcontextprotocol.io)

2. **Cursor**
   - [Cursor Documentation](https://cursor.sh/docs)
   - [Cursor Blog](https://cursor.sh/blog)

3. **GitHub Copilot**
   - [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
   - [Copilot Best Practices](https://github.blog/features/copilot/)

### 11.2 最佳实践

1. **AI 驱动开发**
   - [AI-Driven Development Guide](https://www.anthropic.com/index/claude-code)
   - [Prompt Engineering Guide](https://www.promptingguide.ai/)
   - [Effective AI Pair Programming](https://github.blog/features/copilot/)

2. **上下文管理**
   - [The Art of README](https://www.notion.so/help/guides/the-art-of-readme)
   - [API Documentation Best Practices](https://swagger.io/resources/articles/best-practices-in-api-documentation/)
   - [Software Architecture Documentation](https://www.arc42.org/overview)

3. **PRD 撰写**
   - [Writing Great PRDs](https://www.productplan.com/learn/how-to-write-a-prd/)
   - [User Story Mapping](https://www.atlassian.com/agile/project-management/user-stories)
   - [AI-First Development](https://www.anthropic.com/index/claude-code)

### 11.3 工具与框架

1. **文档工具**
   - [Docusaurus](https://docusaurus.io/) - 文档站点生成
   - [Swagger](https://swagger.io/) - API 文档
   - [Mermaid](https://mermaid.js.org/) - 架构图绘制

2. **测试框架**
   - [Jest](https://jestjs.io/) - JavaScript 测试框架
   - [Playwright](https://playwright.dev/) - E2E 测试
   - [Vitest](https://vitest.dev/) - 快速的单元测试

3. **开发工具**
   - [ESLint](https://eslint.org/) - 代码检查
   - [Prettier](https://prettier.io/) - 代码格式化
   - [Husky](https://typicode.github.io/husky/) - Git hooks

### 11.4 实践项目建议

1. **入门项目**
   - 使用 Claude Code 重构个人项目
   - 为现有项目撰写 AI 原生 README
   - 实现简单的功能模块（如评论、点赞）

2. **进阶项目**
   - 构建完整的用户认证系统
   - 实现 RESTful API
   - 开发数据可视化组件
   - 构建自动化测试套件

3. **高级项目**
   - 构建多 Agent 协作系统
   - 开发自定义 MCP Server
   - 建立 AI 原生开发流程
   - 实现 CI/CD 自动化

### 11.5 学习路径

```
Week 1: 基础使用
□ 安装和配置 Claude Code
□ 学习基本功能
□ 实践简单任务

Week 2: 上下文管理
□ 优化项目结构
□ 撰写 AI 原生 README
□ 建立文档体系

Week 3: PRD 撰写
□ 学习 PRD 结构
□ 撰写完整 PRD
□ PRD 驱动开发

Week 4: 高级应用
□ 复杂功能开发
□ 多工具协作
□ 性能优化

Week 5+: 持续实践
□ 真实项目应用
□ 积累提示词模板
□ 建立最佳实践
```

---

## 总结

**Week 3 核心收获:**

1. **AI IDE 的选择**
   - Claude Code: 大型项目、复杂任务、深度上下文
   - Cursor: 快速开发、日常编码、个人项目
   - Copilot: 团队协作、企业开发、GitHub 集成

2. **上下文管理四大策略**
   - 项目结构清晰化: 按功能组织、清晰命名、分层架构
   - README 驱动: AI 原生、完整信息、包含 AI 辅助提示
   - 模块化文档: architecture.md、api.md、功能文档
   - 智能选择: 精确性、层级递进、按需加载、Token 效率

3. **AI 原生 PRD**
   - 八大要素: 概述、用户故事、功能需求、技术指导、交互设计、数据模型、测试策略、AI 指导
   - 完整详细: 包含所有上下文，AI 可直接执行
   - 验收标准: 功能、技术、文档三维验收

4. **核心思想**
   - Context is Everything: 上下文决定质量
   - Iterate and Validate: 快速迭代，持续验证
   - Trust but Verify: 信任 AI，但始终验证
   - Template-Driven: 模板驱动，提升效率
   - Human-in-the-Loop: 人机协作，优势互补

5. **实践建议**
   - 从小项目开始，逐步提升
   - 建立自己的提示词库
   - 定期优化项目结构
   - 保持文档同步更新
   - 积累实战经验

**下一步: Week 4 将进入实战阶段，使用这些技能完成完整的功能开发！**
