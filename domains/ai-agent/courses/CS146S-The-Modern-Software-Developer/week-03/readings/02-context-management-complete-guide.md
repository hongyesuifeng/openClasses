# Reading 2: Context Management Complete Guide
# 上下文管理完全指南

> **Week 3 Reading #2**
> **主题**: 掌握让 AI 理解项目的上下文管理四大策略
> **预计阅读时间**: 60-90 分钟

---

## 📚 导读

上下文是 AI IDE 发挥效能的关键。本文深入探讨如何通过有效的上下文管理，让 AI 更好地理解你的项目：

1. **理解上下文的重要性** - 为什么 AI 需要上下文
2. **掌握四大策略** - 项目结构、README、模块化文档、智能选择
3. **实战技巧** - 具体的上下文构建方法
4. **最佳实践** - 行业标准的上下文管理方案

---

## 🎯 学习目标

阅读完本文后，你应该能够：

- ✅ 理解上下文对 AI IDE 性能的影响
- ✅ 掌握项目结构优化的原则
- ✅ 能够撰写 AI 原生 README
- ✅ 学会创建模块化文档
- ✅ 精通智能上下文选择技巧
- ✅ 建立自己的上下文管理体系

---

## 第一部分：为什么上下文至关重要

### AI 的上下文理解机制

#### 上下文窗口

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

### 上下文管理的价值

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

## 第二部分：策略一 - 项目结构清晰化

### 优秀的项目结构原则

#### 1. 按功能组织

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

#### 2. 清晰的命名约定

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

#### 3. 分层架构

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

### 重构项目结构

#### 评估当前结构

```markdown
# 检查清单

□ 代码组织是否按功能模块？
□ 文件命名是否清晰描述职责？
□ 目录深度是否合理（< 4 层）？
□ 是否有明确的分层？
□ 相关文件是否靠近？
□ 是否避免循环依赖？
□ 测试代码是否镜像源代码结构？

如果有 ❌，需要重构
```

#### 重构步骤

```markdown
# 使用 Claude Code 重构项目结构

步骤 1: 分析现状
@src/
"分析当前项目结构，识别组织问题"

步骤 2: 设计新结构
"基于功能模块原则，设计新的项目结构"

步骤 3: 制定迁移计划
"制定渐进式重构计划，确保功能不变"

步骤 4: 执行重构
"按计划逐步重构，每步运行测试验证"

步骤 5: 更新文档
@README.md
"更新 README 中的项目结构说明"
```

---

## 第三部分：策略二 - README 驱动上下文

### AI 原生 README 的价值

#### 传统 README vs AI 原生 README

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

### AI 原生 README 模板

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

```
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
```

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

### 认证流程

**JWT 认证:**

1. 用户登录 → POST /api/auth/login
2. 后端验证 → 返回 JWT token
3. 前端存储 → localStorage
4. 后续请求 → 携带 token (Authorization header)
5. 后端验证 → Middleware 检查 token

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

### 测试规范

**测试覆盖率目标:**
- 单元测试: > 80%
- 集成测试: > 60%
- E2E 测试: 核心流程 100%

**测试命名:**
```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when valid id provided', () => {
      // test
    });

    it('should throw error when user not found', () => {
      // test
    });
  });
});
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

### 开发

```bash
# 前端开发服务器 (http://localhost:5173)
pnpm dev:frontend

# 后端开发服务器 (http://localhost:3000)
pnpm dev:backend

# 同时启动前后端
pnpm dev

# 运行测试
pnpm test

# 类型检查
pnpm type-check

# Lint
pnpm lint
```

### 构建部署

```bash
# 生产构建
pnpm build

# 预览生产构建
pnpm preview

# 运行生产服务器
pnpm start
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

### 修复 Bug

**步骤:**

1. **创建 Bug 修复分支**
   ```bash
   git checkout -b bugfix/login-error
   ```

2. **复现 Bug**
   ```bash
   # 查看错误日志
   # 运行相关测试
   ```

3. **定位问题**
   ```bash
   # 使用调试器
   # 添加日志
   ```

4. **修复并测试**
   ```bash
   # 修复代码
   # 运行测试
   # 验证无回归
   ```

5. **提交**
   ```bash
   git add .
   git commit -m "fix(auth): resolve login session timeout"
   ```

### 更新依赖

```bash
# 检查过期依赖
pnpm outdated

# 更新依赖
pnpm update

# 更新 major 版本（需谨慎）
pnpm upgrade --latest

# 测试更新
pnpm test
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
"为 [功能] 生成 API 文档，包括:
- 端点说明
- 请求/响应格式
- 错误代码
- 示例"
```

### 使用 Cursor

**快捷键:**
- `Cmd+K`: 编辑选中代码
- `Cmd+L`: 聊天模式
- `Cmd+I`: 全项目搜索

**工作流:**
```
1. 创建新文件
2. Cmd+K: "生成 [功能] 基础代码"
3. 手动调整
4. Cmd+K: "优化代码性能"
5. 测试验证
```

### 使用 Copilot

**注释驱动:**
```typescript
// 从 API 获取用户数据，处理加载和错误状态
async function fetchUser(userId: string): Promise<User> {
  // Copilot 会生成实现
}
```

---

## 故障排查

### 常见问题

**数据库连接失败:**
```bash
# 检查 PostgreSQL 状态
sudo service postgresql status

# 检查环境变量
cat .env | grep DATABASE_URL

# 重置数据库
pnpm prisma migrate reset
```

**前端构建失败:**
```bash
# 清除缓存
rm -rf node_modules .next
pnpm install

# 检查 TypeScript 错误
pnpm type-check
```

**测试失败:**
```bash
# 运行单个测试文件
pnpm test auth.service.test.ts

# 调试模式
pnpm test:debug

# 查看覆盖率
pnpm test:coverage
```

---

## 贡献指南

欢迎贡献！请遵循:

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

**代码审查清单:**
- [ ] 测试通过
- [ ] 代码符合规范
- [ ] 文档已更新
- [ ] 无回归问题

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 联系方式

- 项目主页: [https://github.com/your-org/your-project](https://github.com/your-org/your-project)
- Issue: [https://github.com/your-org/your-project/issues](https://github.com/your-org/your-project/issues)
- Email: your-email@example.com
```

### README 维护

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

## 第四部分：策略三 - 模块化文档

### 文档体系架构

```
docs/
├── README.md                  # 文档入口
├── architecture.md            # 架构文档
├── api.md                     # API 文档
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

### 架构文档 (architecture.md)

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
               ┌───────────────┼───────────────┐
               │               │               │
        ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
        │   Web       │ │   API       │ │   Admin     │
        │  Server     │ │  Server     │ │  Server     │
        └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
                        ┌──────▼──────┐
                        │  Database   │
                        │  Cluster    │
                        └─────────────┘
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

### 缓存
- Redis 7.0

### 消息队列
- RabbitMQ 3.12

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

**数据流:**
```
┌──────┐     POST /api/auth/login    ┌──────────┐
│Client│─────────────────────────────►│Auth API  │
└──────┘                              └────┬─────┘
                                           │
                                     ┌─────▼─────┐
                                     │   User    │
                                     │  Service  │
                                     └─────┬─────┘
                                           │
                                     ┌─────▼─────┐
                                     │ Database  │
                                     └───────────┘
```

### 用户管理模块

**职责:**
- 用户 CRUD 操作
- 用户资料管理
- 用户偏好设置

**API:**
- GET /api/users - 获取用户列表
- GET /api/users/:id - 获取用户详情
- POST /api/users - 创建用户
- PUT /api/users/:id - 更新用户
- DELETE /api/users/:id - 删除用户

### 报告模块

**职责:**
- 数据聚合和分析
- 报告生成
- 导出功能

**架构:**
```
┌─────────────┐
 │Report API  │
 └──────┬──────┘
        │
  ┌─────┴─────┐
  │           │
┌─▼───┐    ┌─▼────────┐
│Data │    │Report    │
│Aggr.│    │Generator │
└─┬───┘    └──────────┘
  │
┌─▼──────┐
│Database│
└────────┘
```

## 数据模型

### 核心实体

**User (用户)**
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

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
}

interface UserPreferences {
  language: 'en' | 'zh' | 'ja';
  theme: 'light' | 'dark';
  notifications: boolean;
}
```

**Session (会话)**
```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}
```

## API 设计原则

### RESTful 规范

**命名:**
- 使用名词而非动词
- 使用复数形式
- 使用小写字母和连字符

示例:
```
✅ GET /api/users
❌ GET /api/getUsers

✅ POST /api/users
❌ POST /api/createUser

✅ PUT /api/users/:id
❌ PUT /api/updateUser/:id
```

**HTTP 方法:**
- GET: 查询资源
- POST: 创建资源
- PUT: 完整更新资源
- PATCH: 部分更新资源
- DELETE: 删除资源

**状态码:**
- 200 OK: 成功
- 201 Created: 创建成功
- 204 No Content: 成功，无返回内容
- 400 Bad Request: 请求错误
- 401 Unauthorized: 未认证
- 403 Forbidden: 无权限
- 404 Not Found: 资源不存在
- 500 Internal Server Error: 服务器错误

### 响应格式

**成功响应:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe"
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": {
      "userId": "123"
    }
  }
}
```

## 安全设计

### 认证

**JWT Token:**
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Access token: 15 分钟
// Refresh token: 7 天
```

### 授权

**RBAC (Role-Based Access Control):**
```
Admin
├── user:read
├── user:write
├── user:delete
└── system:admin

User
├── profile:read
├── profile:write
└── report:read
```

### 数据安全

**密码加密:**
- 使用 bcrypt
- Salt rounds: 10

**敏感数据:**
- 不记录日志
- 不返回给前端
- 加密存储

## 性能优化

### 数据库

**索引策略:**
```sql
-- 用户表
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 会话表
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
```

**查询优化:**
- 使用 JOIN 代替多次查询
- 分页加载大量数据
- 使用视图简化复杂查询

### 缓存策略

**Redis 缓存:**
```
User Profile: TTL 1 小时
Session: TTL 7 天
API Response: TTL 5 分钟
```

### CDN

**静态资源:**
- JavaScript/CSS: CDN
- 图片: CDN + 缩略图
- 字体: CDN

## 扩展性设计

### 水平扩展

**无状态设计:**
- Session 存储在 Redis
- 不依赖本地文件系统

**负载均衡:**
- Nginx 反向代理
- 多个应用实例

### 微服务拆分

**当前模块:**
- 认证服务
- 用户服务
- 报告服务

**未来拆分:**
- 通知服务
- 支付服务
- 文件服务

## 监控和日志

### 应用监控

**指标:**
- 请求响应时间
- 错误率
- CPU/内存使用
- 数据库连接数

### 日志

**日志级别:**
- ERROR: 错误
- WARN: 警告
- INFO: 重要信息
- DEBUG: 调试信息

**日志内容:**
```json
{
  "timestamp": "2025-01-05T10:30:00Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "context": {
    "service": "user-service",
    "error": "Connection timeout"
  }
}
```
```

### API 文档 (api.md)

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
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "123",
      "email": "user@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
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

### 刷新 Token

**端点:** `POST /api/auth/refresh`

**请求体:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
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
- `sort`: 排序字段 (createdAt, name, email)
- `order`: 排序方向 (asc, desc)

**示例:** `GET /api/users?page=1&limit=20&search=john&sort=createdAt&order=desc`

**响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "123",
        "email": "john@example.com",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://cdn.example.com/avatars/123.jpg"
        },
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

### 获取用户详情

**端点:** `GET /api/users/:id`

**示例:** `GET /api/users/123`

**响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "john@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://cdn.example.com/avatars/123.jpg",
      "bio": "Software developer"
    },
    "preferences": {
      "language": "en",
      "theme": "dark",
      "notifications": true
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-05T10:30:00Z"
  }
}
```

**错误响应 (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": {
      "userId": "123"
    }
  }
}
```

### 创建用户

**端点:** `POST /api/users`

**请求体:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "profile": {
    "firstName": "Jane",
    "lastName": "Doe"
  }
}
```

**响应 (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "456",
    "email": "newuser@example.com",
    "profile": {
      "firstName": "Jane",
      "lastName": "Doe"
    },
    "createdAt": "2025-01-05T10:30:00Z"
  }
}
```

**错误响应 (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Email already exists"
      }
    }
  }
}
```

### 更新用户

**端点:** `PUT /api/users/:id`

**请求体:**
```json
{
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "bio": "Updated bio"
  },
  "preferences": {
    "theme": "light"
  }
}
```

**响应 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "456",
    "email": "newuser@example.com",
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith",
      "bio": "Updated bio"
    },
    "preferences": {
      "language": "en",
      "theme": "light",
      "notifications": true
    },
    "updatedAt": "2025-01-05T10:35:00Z"
  }
}
```

### 删除用户

**端点:** `DELETE /api/users/:id`

**示例:** `DELETE /api/users/456`

**响应 (204 No Content):**
(无响应体)

## 错误代码

| 代码 | HTTP 状态 | 描述 |
|-----|----------|------|
| `INVALID_CREDENTIALS` | 401 | 登录凭证无效 |
| `TOKEN_EXPIRED` | 401 | Token 已过期 |
| `USER_NOT_FOUND` | 404 | 用户不存在 |
| `VALIDATION_ERROR` | 400 | 验证失败 |
| `DUPLICATE_EMAIL` | 400 | 邮箱已存在 |
| `INTERNAL_ERROR` | 500 | 内部服务器错误 |

## 速率限制

**限制规则:**
- 每小时: 1000 请求/IP
- 每分钟: 100 请求/IP

**响应头:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1704451200
```

**超限响应 (429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "retryAfter": 3600
    }
  }
}
```
```

---

## 第五部分：策略四 - 智能上下文选择

### Claude Code 上下文选择技巧

#### @ 符号的使用

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

#### 精确上下文 vs 宽泛上下文

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

#### 层级上下文策略

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

#### 上下文优先级

```markdown
# 高优先级（必须包含）

1. 需求文档
   @docs/PRD-feature-x.md

2. 相关代码
   @src/features/x/

3. 测试文件
   @tests/x.test.ts

4. 配置文件
   @tsconfig.json @package.json

# 中优先级（按需包含）

1. 架构文档
   @docs/architecture.md

2. 相关模块
   @src/related-module/

3. 示例代码
   @examples/similar-feature.ts

# 低优先级（可选）

1. 历史提交
   @git:commit-abc123

2. 文档注释
   @src/x.ts (docstrings)

3. Issue 讨论
   @github:issue-456
```

### Cursor 上下文技巧

#### 文件打开策略

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

#### 快捷键上下文

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

### Copilot 上下文技巧

#### 注释驱动

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

#### 类型提示

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

## 📊 知识检查

### 自我评估

1. **为什么上下文管理对 AI IDE 如此重要？**

2. **四大上下文管理策略分别是什么？它们如何协同工作？**

3. **如何撰写一个 AI 原生 README？应该包含哪些关键信息？**

4. **模块化文档体系应该如何组织？哪些文档是必需的？**

5. **在不同场景下，如何选择最合适的上下文？**

---

## 🎯 实践建议

### 实施路线图

```
Phase 1: 基础建设 (Week 1)
□ 优化项目结构
□ 创建 AI 原生 README
□ 建立文档目录

Phase 2: 文档完善 (Week 2-3)
□ 编写架构文档
□ 编写 API 文档
□ 编写开发指南

Phase 3: 持续优化 (Week 4+)
□ 定期更新文档
□ 优化上下文选择
□ 积累提示词模板
```

### 维护策略

```markdown
# 每周任务
□ 检查 README 是否需要更新
□ 更新 API 文档
□ 整理新功能文档

# 每月任务
□ 审查项目结构
□ 更新架构图
□ 清理过时文档

# 每季度任务
□ 全面文档审查
□ 重构不合理的结构
□ 优化上下文管理流程
```

---

## 📚 延伸阅读

### 最佳实践

1. [The Art of README](https://www.notion.so/help/guides/the-art-of-readme)
2. [API Documentation Best Practices](https://swagger.io/resources/articles/best-practices-in-api-documentation/)
3. [Software Architecture Documentation](https://www.arc42.org/overview)

### 工具

1. [Docusaurus](https://docusaurus.io/) - 文档站点生成
2. [Swagger](https://swagger.io/) - API 文档
3. [Mermaid](https://mermaid.js.org/) - 架构图绘制

---

**下一阅读**: [AI 原生 PRD 撰写实战](./03-ai-native-prd-in-action.md)
