# Week 3-4: AI IDE 与 Agent 管理

> **课程讲师**: Mihail Eric
> **周次**: 第 3-4 周
> **主题**: AI IDE、上下文管理、PRD 撰写、人机协作平衡
> **作业**: Coding with Claude Code
> **嘉宾**: Boris Cherney (Anthropic) - Claude Code 的创造者

---

## 一、本周学习目标

第 3-4 周从理论学习转向实际开发环境，深入探讨如何在实际项目中使用 AI IDE：

### 核心目标
1. **掌握 AI IDE 的使用** - Claude Code、Cursor 等工具的深入应用
2. **学习上下文管理** - 如何让 AI 理解你的项目
3. **撰写高质量 PRD** - 产品需求文档的 AI 原生写作方法
4. **建立人机协作模式** - 在信任与验证之间找到平衡
5. **理解 Agent 管理策略** - 多 Agent 协作与工作流设计

---

## 二、主要内容详解

### 2.1 AI IDE 深度解析

#### 什么是 AI IDE？
AI IDE（AI Integrated Development Environment）是集成了大语言模型能力的智能开发环境，能够理解代码库、生成代码、解释逻辑、调试错误。

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

##### 1. 智能代码补全
```
用户输入: def calculate_average(
AI 补全:    numbers: List[float]) -> float:
    """Calculate the average of a list of numbers."""
    return sum(numbers) / len(numbers) if numbers else 0.0
```

##### 2. 代码解释
选中任意代码片段，Claude Code 可以：
- 解释代码逻辑
- 分析复杂度
- 指出潜在问题
- 提供优化建议

##### 3. 重构建议
- 识别代码异味（Code Smell）
- 建议设计模式应用
- 自动化重构操作
- 保持测试通过

##### 4. 调试助手
- 分析错误堆栈
- 提供修复建议
- 生成测试用例
- 边界情况检查

---

### 2.2 上下文管理（Context Management）

#### 核心问题
LLM 的上下文窗口有限，如何让它理解大型代码库？

#### 策略一：项目结构清晰化

**❌ 糟糕的项目结构**:
```
project/
├── stuff/
├── temp/
├── new_file.py
├── new_file2.py
├── test.py
└── test2.py
```

**✅ 优秀的项目结构**:
```
project/
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── types/
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── architecture.md
│   └── api.md
└── README.md
```

#### 策略二：README 驱动上下文

**AI 原生 README 模板**:

```markdown
# 项目名称

## 项目概述
{一句话描述项目功能和目标}

## 技术栈
- 前端：{框架和版本}
- 后端：{框架和版本}
- 数据库：{类型和版本}
- 其他：{重要依赖}

## 快速开始
### 安装
\`\`\`bash
npm install
\`\`\`

### 运行
\`\`\`bash
npm run dev
\`\`\`

## 项目结构
\`\`\`
src/
├── components/    # React 组件
├── services/      # API 服务
├── utils/         # 工具函数
└── types/         # TypeScript 类型定义
\`\`\`

## 核心概念
### {重要概念 1}
{解释}

### {重要概念 2}
{解释}

## 开发规范
### 代码风格
- 使用 ESLint + Prettier
- 遵循 Airbnb Style Guide

### 命名约定
- 组件：PascalCase
- 函数：camelCase
- 常量：UPPER_SNAKE_CASE

### Git 工作流
- feature 分支开发
- Pull Request 审查
- 保持 main 分支稳定

## 常见任务
### 添加新功能
1. 创建 feature 分支
2. 开发并测试
3. 提交 PR
4. 代码审查后合并

### 修复 Bug
1. 创建 bugfix 分支
2. 编写复现测试
3. 修复并验证
4. 提交 PR

## 测试
\`\`\`bash
npm test
\`\`\`

## AI 辅助开发提示
当使用 AI IDE 时，可以这样说：
- "参考 src/services/api.ts 的模式添加新 API"
- "按照 components/Button 的风格创建新组件"
- "重构 utils/formatter.ts 使其更高效"
```

#### 策略三：模块化文档

**docs/architecture.md**:
```markdown
# 系统架构

## 整体架构
\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│  Database   │
│  (React)    │    │  (Node.js)  │    │ (PostgreSQL)│
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

## 数据流
1. 用户在 Frontend 触发操作
2. Frontend 调用 Backend API
3. Backend 处理并查询 Database
4. Database 返回数据
5. Backend 格式化响应
6. Frontend 更新 UI

## 关键设计决策
### 为什么选择 React？
- 组件化开发
- 丰富生态系统
- 性能优化能力

### 为什么使用 PostgreSQL？
- ACID 保证
- 复杂查询支持
- JSON 数据类型
```

**docs/api.md**:
```markdown
# API 文档

## 认证
所有 API 请求需要携带 Bearer Token：
\`\`\`
Authorization: Bearer {token}
\`\`\`

## 端点列表

### GET /api/users
获取用户列表

**查询参数**:
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 10）

**响应**:
\`\`\`json
{
  "data": [...],
  "total": 100,
  "page": 1
}
\`\`\`

### POST /api/users
创建新用户

**请求体**:
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

**响应**:
\`\`\`json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`
```

#### 策略四：智能上下文选择

在 Claude Code 中，你可以指定 AI 关注的文件：

```
@src/components/Button.tsx @src/components/Button.module.css
请重构 Button 组件，添加 loading 状态
```

或者使用目录范围：

```
@src/services/
参考现有的 API 服务模式，创建一个新的用户管理服务
```

---

### 2.3 AI 原生 PRD 撰写

#### 什么是 PRD？
PRD（Product Requirements Document）是产品需求文档，定义产品要做什么、为什么做、怎么做。

#### 传统 PRD vs AI 原生 PRD

**传统 PRD**:
- 面向人类开发者
- 依赖口头沟通补充细节
- 需要反复确认需求

**AI 原生 PRD**:
- 面向 AI Agent
- 包含所有必要的上下文
- 可直接用于自动化开发

#### AI 原生 PRD 模板

```markdown
# PRD: [功能名称]

## 1. 功能概述
### 1.1 目标
{清晰描述这个功能要解决什么问题}

### 1.2 成功指标
{如何衡量功能是否成功}
- 指标 1: {具体数值}
- 指标 2: {具体数值}

## 2. 用户故事
### 2.1 目标用户
{描述目标用户画像}

### 2.2 使用场景
**场景 1**: {场景描述}
- 用户需求: {具体需求}
- 当前痛点: {现有问题}
- 期望结果: {理想体验}

## 3. 功能需求
### 3.1 核心功能
**功能 A**: {描述}
- 输入: {参数}
- 处理: {逻辑}
- 输出: {结果}

**功能 B**: {描述}
...

### 3.2 边界情况
- 情况 1: {如何处理}
- 情况 2: {如何处理}
- 情况 3: {如何处理}

### 3.3 约束条件
- 性能: {具体要求}
- 安全: {安全要求}
- 兼容性: {兼容性要求}

## 4. 技术实现指导
### 4.1 参考代码
\`\`\`
{类似的现有实现}
\`\`\`

### 4.2 设计模式
建议使用: {设计模式名称}

### 4.3 依赖服务
- API 1: {描述}
- 数据库表: {表结构}
- 第三方服务: {集成方式}

## 5. 交互设计
### 5.1 UI 草图
\`\`\`
[ASCII 艺术或描述]
+-------------------+
|  标题             |
+-------------------+
|  [按钮 1] [按钮 2]|
+-------------------+
\`\`\`

### 5.2 交互流程
1. 用户执行操作
2. 系统响应
3. 反馈展示

### 5.3 状态管理
- 状态 1: {描述}
- 状态 2: {描述}
- 转换条件: {何时切换}

## 6. 数据模型
### 6.1 数据结构
\`\`\`typescript
interface DataType {
  field1: string;
  field2: number;
  field3?: boolean;
}
\`\`\`

### 6.2 API 契约
**请求**:
\`\`\`json
{...}
\`\`\`

**响应**:
\`\`\`json
{...}
\`\`\`

## 7. 测试策略
### 7.1 单元测试
需要测试的场景:
- 场景 1: {测试用例}
- 场景 2: {测试用例}

### 7.2 集成测试
端到端测试流程:
1. 步骤 1
2. 步骤 2
3. 验证结果

### 7.3 边界测试
特殊输入:
- 空值
- 极端值
- 非法输入

## 8. 部署计划
### 8.1 发布阶段
- Alpha: {范围}
- Beta: {范围}
- GA: {全面发布}

### 8.2 回滚计划
如果出现问题: {回滚步骤}

## 9. AI 开发指导
### 9.1 开发步骤
1. 第一步: {具体任务}
2. 第二步: {具体任务}
3. 第三步: {具体任务}

### 9.2 示例提示词
\`\`\`
请参考 src/features/example 的实现，
按照本 PRD 的需求，创建一个新的功能模块。
要求：
- 遵循现有代码风格
- 包含完整的类型定义
- 编写单元测试
- 更新 API 文档
\`\`\`

### 9.3 验收标准
- [ ] 功能完整性
- [ ] 代码规范
- [ ] 测试覆盖 > 80%
- [ ] 性能达标
- [ ] 文档更新
```

#### PRD 示例：用户认证功能

```markdown
# PRD: 用户认证功能

## 1. 功能概述
实现用户注册、登录、登出功能，支持邮箱验证和密码找回。

### 1.1 目标
让用户能够安全地创建账户、登录系统、管理会话。

### 1.2 成功指标
- 注册转化率 > 60%
- 登录成功率 > 95%
- 平均登录时间 < 2 秒

## 2. 功能需求
### 2.1 用户注册
- 输入：邮箱、密码、确认密码
- 验证：邮箱格式、密码强度（至少 8 位，包含字母和数字）
- 流程：发送验证邮件 → 点击链接 → 激活账户

### 2.2 用户登录
- 输入：邮箱/用户名 + 密码
- 记住我：7 天免登录
- 错误处理：3 次失败后锁定 15 分钟

### 2.3 密码找回
- 输入：注册邮箱
- 流程：发送重置链接 → 设置新密码

## 3. 技术实现
### 3.1 技术栈
- 后端：Node.js + Express
- 数据库：PostgreSQL
- 认证：JWT（JSON Web Token）
- 加密：bcrypt

### 3.2 API 端点
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### 3.3 数据模型
\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 4. 安全要求
- 密码使用 bcrypt 加密（salt rounds: 10）
- JWT Token 有效期：1 小时
- Refresh Token 有效期：7 天
- HTTPS 传输
- 限流：同一 IP 每分钟最多 10 次请求

## 5. AI 开发步骤
1. 创建 User 模型和数据库迁移
2. 实现注册 API（含邮件发送）
3. 实现登录 API（含 JWT 生成）
4. 实现中间件验证 Token
5. 编写单元测试和集成测试
6. 更新 API 文档
```

---

### 2.4 Agent 管理策略

#### 单 Agent vs 多 Agent

**单 Agent 模式**:
- ✅ 简单直接
- ✅ 容易调试
- ❌ 能力有限
- ❌ 难以扩展

**多 Agent 模式**:
- ✅ 专业化分工
- ✅ 可并行执行
- ✅ 易于扩展
- ❌ 协调复杂
- ❌ 需要精心设计

#### 多 Agent 架构模式

##### 模式一：层次结构（Hierarchical）

```
┌─────────────────────┐
│   Manager Agent     │  ← 负责任务分解和分配
└──────────┬──────────┘
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│  Coder  │ │  Tester │ │Reviewer│
│  Agent  │ │  Agent  │ │ Agent  │
└─────────┘ └─────────┘ └─────────┘
```

**实现示例**:
```python
class ManagerAgent:
    def execute(self, task):
        # 1. 分解任务
        subtasks = self.decompose(task)

        # 2. 分配给专业 Agent
        code_agent = CoderAgent()
        test_agent = TesterAgent()
        review_agent = ReviewerAgent()

        # 3. 协调执行
        code = code_agent.write_code(subtasks.code)
        tests = test_agent.write_tests(subtasks.test)
        review = review_agent.review(code)

        # 4. 整合结果
        return self.integrate(code, tests, review)
```

##### 模式二：协作网络（Collaborative Network）

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│  Agent  │◄─►│  Agent  │◄─►│  Agent  │
│    A    │   │    B    │   │    C    │
└─────────┘   └─────────┘   └─────────┘
     ▲             ▲             ▲
     └─────────────┴─────────────┘
              共享上下文
```

**适用场景**:
- 需要多个 Agent 同时协作
- 信息共享频繁
- 需要动态调整协作关系

##### 模式三：流水线（Pipeline）

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│  Agent  │──▶│  Agent  │──▶│  Agent  │
│  Design │   │  Code   │   │  Test   │
└─────────┘   └─────────┘   └─────────┘
```

**适用场景**:
- 任务有明确的先后顺序
- 每个 Agent 的输出是下一个的输入

#### Agent 通信协议

##### 1. 消息格式

```python
@dataclass
class AgentMessage:
    sender: str           # 发送者 ID
    receiver: str         # 接收者 ID
    message_type: str     # 消息类型
    content: dict         # 消息内容
    context: dict         # 共享上下文
    timestamp: datetime   # 时间戳
```

##### 2. 消息类型

```python
MessageType = {
    "REQUEST": "请求其他 Agent 帮助",
    "RESPONSE": "响应请求",
    "NOTIFICATION": "通知消息",
    "ERROR": "错误报告",
    "COMPLETION": "任务完成"
}
```

##### 3. 通信示例

```python
# Coder Agent 请求 Tester Agent 帮助
message = AgentMessage(
    sender="coder-agent-1",
    receiver="tester-agent-1",
    message_type="REQUEST",
    content={
        "task": "为以下代码生成测试用例",
        "code": "def add(a, b): return a + b",
        "requirements": ["边界测试", "异常处理"]
    },
    context={
        "project": "calculator-app",
        "file": "src/math/operations.py"
    },
    timestamp=datetime.now()
)

# Tester Agent 响应
response = AgentMessage(
    sender="tester-agent-1",
    receiver="coder-agent-1",
    message_type="RESPONSE",
    content={
        "status": "completed",
        "test_cases": [...],
        "coverage": "95%"
    },
    context=message.context,
    timestamp=datetime.now()
)
```

#### Agent 协调策略

##### 1. 任务分配

```python
class TaskDispatcher:
    def __init__(self, agents):
        self.agents = agents
        self.workload = {agent.id: 0 for agent in agents}

    def dispatch(self, task):
        # 选择负载最轻的 Agent
        available = [
            agent for agent in self.agents
            if agent.can_handle(task)
        ]
        selected = min(available, key=lambda a: self.workload[a.id])

        # 分配任务
        self.workload[selected.id] += 1
        return selected.execute(task)
```

##### 2. 冲突解决

```python
class ConflictResolver:
    def resolve(self, conflicts):
        """解决 Agent 之间的冲突"""
        for conflict in conflicts:
            if conflict.type == "resource":
                # 资源冲突：使用锁机制
                self.acquire_lock(conflict.resource)
            elif conflict.type == "decision":
                # 决策冲突：投票或仲裁
                self.vote(conflict.options)
            elif conflict.type == "priority":
                # 优先级冲突：根据重要性排序
                self.prioritize(conflict.tasks)
```

---

### 2.5 人机协作平衡

#### 信任光谱

```
完全不信任 ←───────────────────────→ 完全信任
     ▲                                    ▲
     │                                    │
  人工审查                            自动执行
  每一步                            所有决策
```

#### 最佳实践

##### 1. 风险分级

**高风险操作** - 必须人工审查:
- 数据库删除操作
- 支付和金融交易
- 权限变更
- 生产环境部署

**中风险操作** - 部分审查:
- 重构代码
- 生成测试
- 文档更新

**低风险操作** - 可以自动化:
- 代码格式化
- 简单函数生成
- 注释补充

##### 2. 审查清单（Checklist）

```markdown
## AI 代码审查清单

### 安全性
- [ ] 没有 SQL 注入风险
- [ ] 没有 XSS 漏洞
- [ ] 敏感数据已加密
- [ ] 权限检查完整

### 正确性
- [ ] 逻辑正确
- [ ] 边界情况处理
- [ ] 错误处理完善
- [ ] 测试覆盖充分

### 性能
- [ ] 无明显性能问题
- [ ] 无内存泄漏
- [ ] 无 N+1 查询
- [ ] 适当缓存

### 可维护性
- [ ] 命名清晰
- [ ] 代码风格统一
- [ ] 注释充分
- [ ] 模块化合理
```

##### 3. 渐进式信任

```
第一阶段：监督学习
- AI 提供建议
- 人类做决策
- 记录 AI 的表现

第二阶段：辅助模式
- AI 处理简单任务
- 人类处理复杂任务
- 定期抽查 AI 工作

第三阶段：协作模式
- AI 处理大部分任务
- 人类审查关键部分
- 建立反馈循环

第四阶段：自主模式
- AI 自主执行
- 人类设定边界
- 异常时人工介入
```

---

## 三、核心思想与实践

### 3.1 核心思想

#### 1. Context is Everything
AI IDE 的效果取决于上下文质量：
- 清晰的项目结构
- 完善的文档
- 明确的需求
- 一致的代码风格

#### 2. Iterate and Validate
- 不要期望 AI 一次生成完美代码
- 快速迭代
- 持续验证
- 及时反馈

#### 3. Trust but Verify
- 相信 AI 的能力
- 验证 AI 的输出
- 建立质量门
- 保持警惕

#### 4. Human-in-the-Loop
- 人类提供高层指导
- AI 执行细节实现
- 人机优势互补
- 持续学习改进

### 3.2 实践建议

#### 对于 AI IDE 使用

1. **定制化配置** - 根据项目特点调整 AI 设置
2. **建立提示词库** - 积累常用提示词模板
3. **版本控制集成** - 让 AI 理解 Git 历史
4. **定期清理上下文** - 保持上下文窗口高效

#### 对于 PRD 撰写

1. **模板化** - 建立标准模板
2. **细化需求** - 避免模糊描述
3. **示例驱动** - 提供具体示例
4. **持续更新** - 保持 PRD 同步

#### 对于 Agent 管理

1. **简单开始** - 从单 Agent 开始
2. **渐进扩展** - 逐步增加 Agent 数量
3. **清晰分工** - 每个 Agent 职责明确
4. **充分测试** - 确保 Agent 可靠性

---

## 四、作业实战

### Week 4: Coding with Claude Code

**目标**: 使用 Claude Code 完成一个完整的功能开发

**任务**:
1. 选择一个真实项目（可以是自己项目）
2. 撰写 AI 原生 PRD
3. 使用 Claude Code 进行开发
4. 记录开发过程和效率提升

**示例项目**:
- 实现用户认证系统
- 创建 RESTful API
- 开发数据可视化组件
- 构建自动化测试套件

**提交要求**:
1. PRD 文档
2. 完成的代码
3. 测试报告
4. 反思总结（哪些 AI 做得好，哪些需要人工介入）

**评价标准**:
- PRD 的质量
- 代码质量
- 测试覆盖率
- AI 利用效率

---

## 五、嘉宾分享：Boris Cherney (Anthropic)

### Claude Code 的设计哲学

#### 核心原则

1. **开发者优先** - 不是替代开发者，而是增强开发者
2. **透明可控** - 开发者始终了解 AI 在做什么
3. **安全第一** - 严格的权限和审查机制
4. **可扩展性** - 通过 MCP 支持自定义集成

#### 未来路线图

- 更智能的上下文理解
- 更好的多语言支持
- 增强的团队协作功能
- 更强大的调试能力

---

## 六、进阶学习资源

### 工具
- **Claude Code**: https://claude.ai/code
- **Cursor**: https://cursor.sh
- **GitHub Copilot**: https://github.com/features/copilot

### 文档
- **MCP 协议规范**: https://modelcontextprotocol.io
- **Claude API 文档**: https://docs.anthropic.com

### 实践项目
1. 使用 Claude Code 重构一个旧项目
2. 构建多 Agent 协作系统
3. 开发自定义 MCP Server
4. 建立 AI 原生开发流程

---

## 七、本周小结

第 3-4 周深入探讨了 AI IDE 和 Agent 管理的实践：

1. **AI IDE 掌握** - 学会使用 Claude Code 等工具
2. **上下文管理** - 理解如何让 AI 理解项目
3. **PRD 撰写** - 掌握 AI 原生需求文档写作
4. **Agent 协作** - 理解多 Agent 架构和协调
5. **人机平衡** - 在信任与验证之间找到平衡点

这些技能让我们能够在实际项目中高效地使用 AI 工具，真正实现生产力提升。

---

**下一周预告**: Week 5 将深入探讨现代终端和 AI 增强的命令行工具。
