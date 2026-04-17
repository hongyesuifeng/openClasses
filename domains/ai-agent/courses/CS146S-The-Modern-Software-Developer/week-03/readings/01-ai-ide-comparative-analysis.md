# Reading 1: AI IDE Comparative Analysis and Practice
# AI IDE 深度对比与实践

> **Week 3 Reading #1**
> **主题**: Claude Code、Cursor、GitHub Copilot 的深度对比与实践
> **预计阅读时间**: 60-90 分钟

---

## 📚 导读

AI IDE（AI Integrated Development Environment）正在重塑软件开发的方式。本文深入对比三大主流 AI IDE，帮助你：

1. **理解 AI IDE 的核心价值** - 从传统开发到 AI 辅助开发的转变
2. **掌握三大工具的特点** - Claude Code、Cursor、GitHub Copilot 的对比
3. **学习最佳实践** - 如何最大化利用 AI IDE 提升效率
4. **实战应用技巧** - 具体场景的使用策略

---

## 🎯 学习目标

阅读完本文后，你应该能够：

- ✅ 理解 AI IDE 的核心能力和价值
- ✅ 掌握 Claude Code、Cursor、Copilot 的区别和适用场景
- ✅ 学会根据项目特点选择合适的 AI IDE
- ✅ 掌握 AI IDE 的高级使用技巧
- ✅ 能够制定 AI IDE 的最佳实践工作流

---

## 第一部分：AI IDE 的演进

### 从传统 IDE 到 AI IDE

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

### AI IDE 的核心能力

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

## 第二部分：三大 AI IDE 深度对比

### Claude Code - 全能型 AI IDE

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

#### 最佳实践

**场景 1: 大型项目重构**

```markdown
# 使用 Claude Code 进行架构级重构

步骤:
1. @README.md @architecture.md
   "理解项目整体架构"

2. @src/
   "分析当前代码结构，识别需要重构的模块"

3. "制定重构计划，保持功能不变"

4. "逐步实施重构，每步运行测试验证"

5. "生成迁移文档和更新日志"
```

**场景 2: 复杂 Bug 诊断**

```markdown
# 利用深度上下文诊断 Bug

步骤:
1. @error.log @src/auth.py @tests/test_auth.py
   "分析错误日志和相关代码"

2. "执行调试命令:
    - 检查环境变量
    - 运行特定测试
    - 查看数据库状态"

3. "定位根本原因并提供修复方案"

4. "验证修复不影响其他功能"

5. "添加预防性测试"
```

**场景 3: 学习新代码库**

```markdown
# 快速理解陌生项目

步骤:
1. @README.md @package.json @tsconfig.json
   "了解项目技术栈和配置"

2. @src/
   "生成项目架构图，说明模块关系"

3. "解释核心业务逻辑流程"

4. "识别关键入口和出口点"

5. "生成开发者快速上手指南"
```

---

### Cursor - 代码编辑专家

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

#### 最佳实践

**场景 1: 快速功能开发**

```
工作流:
1. 创建新文件: UserForm.tsx
2. Cmd+K: "创建用户表单，包含姓名、邮箱、密码字段"
3. Cursor 生成完整表单组件
4. Cmd+K: "添加表单验证"
5. Cursor 添加验证逻辑
6. 手动调整样式和细节
```

**场景 2: 代码重构**

```
重构流程:
1. 选中需要重构的代码块
2. Cmd+K: "将这个类转换为函数式组件"
3. Cursor 应用重构
4. 检查并调整
5. 运行测试验证
```

**场景 3: 代码审查辅助**

```
审查流程:
1. 打开 PR 中的文件
2. Cmd+L: "识别这段代码的潜在问题"
3. Cursor 分析并指出:
   - 安全问题
   - 性能瓶颈
   - 代码异味
   - 最佳实践建议
```

---

### GitHub Copilot - 智能结对编程

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

#### 最佳实践

**场景 1: 日常编码**

```
开发模式:
1. 编写函数签名
   def process_payment(user, amount):│

2. Copilot 自动补全函数体

3. 根据需要调整

4. 继续下一个函数
```

**场景 2: 测试驱动开发**

```
TDD 流程:
1. 先写测试
   def test_calculate_total():
       items = [{'price': 10}, {'price': 20}]
       result = calculate_total(items)
       assert result == 30

2. Copilot 生成实现代码

3. 运行测试

4. 根据测试结果调整
```

**场景 3: 文档维护**

```
文档流程:
1. 编写代码
2. Copilot Chat: "为这个函数生成文档"
3. Copilot 生成标准 docstring
4. 手动补充细节
```

---

## 第三部分：横向对比分析

### 功能对比矩阵

| 功能维度 | Claude Code | Cursor | GitHub Copilot |
|---------|-------------|--------|----------------|
| **上下文窗口** | 200K tokens | 128K tokens | 8K-32K tokens |
| **项目理解** | ⭐⭐⭐⭐⭐ 全项目 | ⭐⭐⭐⭐ 当前文件 | ⭐⭐⭐ 局部代码 |
| **Agent 能力** | ⭐⭐⭐⭐⭐ 自主执行 | ⭐⭐⭐ 编辑辅助 | ⭐⭐⭐ 建议生成 |
| **MCP 支持** | ✅ 原生支持 | ❌ 不支持 | ❌ 不支持 |
| **代码编辑** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **学习成本** | 中等 | 低 | 低 |
| **定价** | $20/月 | $20/月 | $10/月 |
| **离线使用** | ❌ | ❌ | ❌ |
| **语言支持** | 广泛 | 专注于主流 | 专注于主流 |

### 适用场景分析

#### Claude Code 最佳场景

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

#### Cursor 最佳场景

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

#### GitHub Copilot 最佳场景

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

### 性能对比

#### 代码生成质量

```python
# 任务: 实现 LRU 缓存

# Claude Code 生成
class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# 特点:
# - 使用 OrderedDict（Python 惯用法）
# - 完整的边界处理
# - 时间复杂度 O(1)
# - 包含类型提示
```

```python
# Cursor 生成
class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.dict = {}

    def get(self, key):
        if key in self.dict:
            self.dict[key] = (key, self.dict[key][1])
            return self.dict[key][1]
        return -1

    def put(self, key, value):
        if key in self.dict:
            del self.dict[key]
        elif len(self.dict) >= self.capacity:
            del self.dict[list(self.dict.keys())[0]]
        self.dict[key] = (key, value)

# 特点:
# - 基本功能正确
# - 使用普通字典
# - 性能略低
# - 缺少类型提示
```

```python
# Copilot 生成
class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key in self.cache:
            return self.cache[key]
        return -1

    def put(self, key: int, value: int) -> None:
        if len(self.cache) >= self.cap:
            del self.cache[list(self.cache.keys())[0]]
        self.cache[key] = value

# 特点:
# - 简单实现
# - 缺少 LRU 逻辑（move_to_end）
# - 功能不完整
# - 需要人工完善
```

#### 总结

| 工具 | 代码质量 | 完整性 | 最佳实践 | 需要修改 |
|-----|---------|--------|---------|---------|
| Claude Code | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 极少 |
| Cursor | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 少量 |
| Copilot | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | 中等 |

---

## 第四部分：高级使用技巧

### 1. 上下文管理策略

#### 文件选择策略

```markdown
# Claude Code - 精确上下文

❌ 不好:
@src/
"重构这个目录"

✅ 好:
@src/components/UserForm.tsx @src/components/UserForm.module.css @src/types/user.ts
"重构 UserForm 组件，使用 TypeScript 严格类型"

# 原因:
- 更精确的上下文
- 减少 token 消耗
- 更好的结果质量
```

```markdown
# Cursor - 相关文件优先

✅ 最佳实践:
1. 打开主要文件
2. 使用 Ctrl+Tab 快速切换
3. Cursor 会自动考虑打开的文件

# Cursor 会自动分析:
- 当前文件
- 相关导入
- 最近编辑的文件
```

```markdown
# Copilot - 注释引导

✅ 技巧:
# 实现用户认证，使用 JWT token
def authenticate_user(username, password):
    # Copilot 会根据注释生成合适代码
```

#### 项目级上下文

```markdown
# Claude Code - 创建项目摘要

# Step 1: 生成项目概览
@README.md @package.json @tsconfig.json
"生成项目技术栈摘要，保存到 docs/project-overview.md"

# Step 2: 使用摘要作为上下文
@docs/project-overview.md @src/auth/
"在认证模块中添加刷新 token 功能"

# 优势:
- 不需要每次重复项目背景
- 保持上下文一致性
- 加速后续对话
```

### 2. 提示词工程

#### Claude Code 提示词模板

```markdown
# 模板 1: 功能开发

@相关文件
请实现 [功能描述]:

要求:
1. [具体要求 1]
2. [具体要求 2]
3. [具体要求 3]

技术约束:
- 使用 [技术栈/框架]
- 遵循 [代码风格]
- 考虑 [性能/安全]

验收标准:
- [验收条件 1]
- [验收条件 2]

请:
1. 分析现有代码
2. 制定实施计划
3. 逐步实现
4. 编写测试
5. 运行验证
```

```markdown
# 模板 2: Bug 修复

@错误日志 @相关代码文件
请修复以下问题:

错误信息:
[复制完整错误信息]

复现步骤:
1. [步骤 1]
2. [步骤 2]

期望行为:
[描述期望结果]

实际行为:
[描述实际结果]

请:
1. 分析根本原因
2. 提供修复方案
3. 实施修复
4. 添加预防性测试
5. 验证无回归
```

#### Cursor 提示词技巧

```markdown
# Cmd+K 精简指令

原则: 越具体越好

❌ 模糊:
"优化这段代码"

✅ 具体:
"将这个循环转换为列表推导式，提升性能"

❌ 模糊:
"添加错误处理"

✅ 具体:
"添加 try-except 处理 FileNotFoundError，给出友好提示"

✅ 组合指令:
1. "添加类型提示"
2. "添加 docstring"
3. "使用 async/await 重构"
```

#### Copilot 提示词技巧

```javascript
// 1. 注释驱动

// 从 API 获取用户数据，处理加载和错误状态
async function fetchUser(userId) {
    // Copilot 会生成完整的错误处理
}

// 2. 函数名暗示

function validateEmail(email) {
    // Copilot 知道这是邮箱验证
    // 会生成相应的验证逻辑
}

// 3. 类型提示

interface User {
    id: number;
    name: string;
    email: string;
}

function createUser(user: User): Promise<User> {
    // Copilot 根据接口生成代码
}
```

### 3. 工作流优化

#### 开发工作流

```markdown
# 完整功能开发流程（Claude Code）

阶段 1: 需求理解
1. @docs/PRD.md
   "理解功能需求和验收标准"

2. @docs/architecture.md
   "了解相关模块和依赖关系"

阶段 2: 设计规划
3. "设计实现方案，包括:
    - 数据模型
    - API 接口
    - 核心逻辑
    - 错误处理"

阶段 3: 实现
4. @src/types/ @src/models/
   "定义数据模型和类型"

5. @src/api/
   "实现 API 端点"

6. @src/services/
   "实现业务逻辑"

7. @tests/
   "编写测试用例"

阶段 4: 验证
8. "运行所有测试，确保通过"

9. "运行 linter 和 type checker"

阶段 5: 文档
10. "更新 API 文档"

11. "生成变更日志"
```

```markdown
# 快速迭代流程（Cursor）

1. 创建新文件
2. Cmd+K: 生成基础代码
3. 手动调整细节
4. Cmd+K: 优化代码
5. 测试验证
6. 提交代码

# 特点:
- 快速迭代
- 即时反馈
- 适合原型开发
```

```markdown
# 企业开发流程（Copilot）

1. 阅读 Issue
2. 创建分支
3. Copilot 辅助编写代码
4. 运行测试
5. Copilot 生成文档
6. 提交 PR
7. Copilot 辅助代码审查

# 特点:
- 与 GitHub 深度集成
- 团队协作友好
- 标准化流程
```

### 4. 多工具协作

```markdown
# 组合使用策略

场景: 复杂功能开发

1. Claude Code - 架构设计
   @README.md @docs/
   "设计新功能的技术方案和架构"

2. Cursor - 快速实现
   - 使用 Claude 的设计作为指导
   - 快速生成和编辑代码
   - 实时调整优化

3. Copilot - 代码补充
   - 边写边补全
   - 生成测试用例
   - 添加文档注释

4. Claude Code - 集成测试
   @src/ @tests/
   "运行完整测试套件，修复问题"

5. Claude Code - 代码审查
   "审查 PR 代码，确保质量"
```

---

## 第五部分：实战案例分析

### 案例 1: REST API 开发

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

### 对比总结

| 工具 | 时间 | 代码质量 | 需要调整 | 适用阶段 |
|-----|------|---------|---------|---------|
| Claude Code | 15 min | ⭐⭐⭐⭐⭐ | 极少 | 完整功能开发 |
| Cursor | 20 min | ⭐⭐⭐⭐ | 少量 | 快速迭代 |
| Copilot | 30 min | ⭐⭐⭐ | 中等 | 日常编码 |

---

## 📊 知识检查

### 自我评估

1. **Claude Code、Cursor、Copilot 的核心区别是什么？**

2. **什么场景下应该使用 Claude Code 而不是 Cursor？**

3. **如何根据项目特点选择合适的 AI IDE？**

4. **在使用 AI IDE 时，如何提供高质量的上下文？**

5. **三大工具可以如何协作使用？**

---

## 🎯 实践建议

### 选择指南

```markdown
# 根据项目规模选择

小型项目 (< 10 文件)
→ Cursor 或 Copilot
→ 快速开发，即时反馈

中型项目 (10-50 文件)
→ Cursor
→ 平衡速度和质量

大型项目 (> 50 文件)
→ Claude Code
→ 深度上下文理解
```

```markdown
# 根据任务类型选择

新功能开发
→ Claude Code（规划 + 实现）
→ Cursor（快速实现）

Bug 修复
→ Claude Code（深度分析）
→ Cursor（快速修复）

代码重构
→ Cursor（编辑能力强）
→ Claude Code（架构层面）

代码审查
→ Claude Code（全面分析）
→ Copilot（PR 集成）
```

### 学习路径

```
Week 1: 基础使用
- 安装和配置
- 基本功能体验
- 简单任务实践

Week 2: 进阶技巧
- 提示词优化
- 上下文管理
- 工作流设计

Week 3: 高级应用
- 复杂场景处理
- 多工具协作
- 性能优化

Week 4: 实战项目
- 完整功能开发
- 最佳实践总结
- 个人模板库
```

---

## 📚 延伸阅读

### 官方文档

1. [Claude Code Documentation](https://claude.ai/code/docs)
2. [Cursor Documentation](https://cursor.sh/docs)
3. [GitHub Copilot Documentation](https://docs.github.com/en/copilot)

### 最佳实践

1. [AI-Driven Development](https://www.anthropic.com/index/claude-code)
2. [Prompt Engineering Guide](https://www.promptingguide.ai/)
3. [Effective AI Pair Programming](https://github.blog/features/copilot/)

---

**下一阅读**: [上下文管理完全指南](./02-context-management-complete-guide.md)
