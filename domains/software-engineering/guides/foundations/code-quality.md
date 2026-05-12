# 代码质量指南

> 编写高质量、可维护代码的最佳实践

## 📚 学习目标

完成本指南后，你将能够：
- 理解代码质量的核心维度
- 掌握编写清晰代码的原则和技巧
- 学会使用工具自动化代码质量检查
- 了解代码审查的流程和要点

## 🎯 代码质量概述

### 什么是代码质量？

代码质量是代码满足需求、易于维护、可扩展和可测试的综合体现。高质量代码不仅"能工作"，更重要的是"易于理解和修改"。

### 代码质量的核心维度

```
代码质量
├── 可读性 (Readability) - 代码是否容易理解
├── 可维护性 (Maintainability) - 代码是否容易修改
├── 可测试性 (Testability) - 代码是否容易测试
├── 可靠性 (Reliability) - 代码是否稳定运行
├── 效率 (Efficiency) - 代码的性能表现
└── 安全性 (Security) - 代码的安全防护
```

## 1. 可读性

### 1.1 命名规范

**好的命名应该是**：
- ✅ 描述性的：说明"做什么"
- ✅ 一致的：遵循团队约定
- ✅ 简洁的：在不损失清晰度的前提下尽量简短
- ❌ 避免缩写：除非是广为人知的缩写

**变量命名示例**：
```python
# ❌ 差的命名
d = 10  # date? distance? days?
data1 = process_data(data2)
temp = get_value()

# ✅ 好的命名
days_until_expiry = 10
processed_users = filter_users(raw_users)
cached_value = get_from_cache_or_compute()
```

**函数命名示例**：
```python
# ❌ 差的命名
def process(d, s):
    pass

# ✅ 好的命名
def validate_user_credentials(username, password):
    pass
```

### 1.2 代码格式化

**统一格式化的重要性**：
- 减少认知负担
- 避免无意义的争议
- 提高代码审查效率

**推荐工具**：
- Python: Black, autopep8
- JavaScript: Prettier, ESLint
- C#: ReSharper, dotnet format

**配置示例（Python Black）**：
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py38']
include = '\.pyi?$'
```

### 1.3 注释的使用

**何时需要注释**：
- ✅ 解释"为什么"而非"是什么"
- ✅ 复杂算法的思路说明
- ✅ 业务规则的文档
- ✅ TODO/FIXME 标记

**何时不需要注释**：
- ❌ 重复代码逻辑
- ❌ 解释显而易见的代码
- ❌ 过时的注释

**注释示例**：
```python
# ❌ 差的注释
# 增加 i 的值
i += 1

# ✅ 好的注释
# 使用二分查找，因为数据已排序且查找频繁
def find_user(user_id):
    # ... binary search implementation
```

## 2. 可维护性

### 2.1 函数设计原则

**函数应该**：
- ✅ 小：不超过 20-30 行
- ✅ 单一职责：只做一件事
- ✅ 参数少：不超过 3-4 个参数
- ✅ 纯函数：避免副作用（除非必要）

**示例**：
```python
# ❌ 差的函数
def process_user(data):
    # 验证数据
    # 转换格式
    # 保存到数据库
    # 发送邮件
    # 更新缓存
    # ... 100+ lines

# ✅ 好的函数设计
def process_user(data):
    validated_data = validate_user_data(data)
    formatted_data = format_user_data(validated_data)
    user_id = save_user_to_db(formatted_data)
    send_welcome_email(user_id)
    update_user_cache(user_id)
    return user_id
```

### 2.2 DRY 原则（Don't Repeat Yourself）

**重复代码的问题**：
- 增加维护成本
- 容易产生不一致
- 违反单一真理来源原则

**示例**：
```python
# ❌ 重复代码
def calculate_discount_1(price):
    return price * 0.9

def calculate_discount_2(price):
    return price * 0.9

# ✅ 消除重复
DISCOUNT_RATE = 0.1

def calculate_discount(price):
    return price * (1 - DISCOUNT_RATE)
```

### 2.3 错误处理

**好的错误处理**：
- 明确的异常类型
- 有意义的错误信息
- 适当的异常传播
- 资源清理保证

**示例**：
```python
# ❌ 差的错误处理
try:
    user = get_user(user_id)
except Exception as e:
    print(f"Error: {e}")

# ✅ 好的错误处理
class UserNotFoundError(Exception):
    """当用户不存在时抛出"""

def get_user(user_id: int) -> User:
    if not is_valid_user_id(user_id):
        raise ValueError(f"Invalid user ID: {user_id}")

    user = database.query(user_id)
    if user is None:
        raise UserNotFoundError(f"User {user_id} not found")

    return user
```

## 3. 可测试性

### 3.1 编写可测试的代码

**可测试代码的特征**：
- 依赖注入：便于替换依赖
- 纯函数：相同的输入产生相同的输出
- 小函数：更容易测试
- 明确的接口：便于 mock

**示例**：
```python
# ❌ 难以测试
def process_order(order_id):
    # 直接使用全局变量和内部实例化
    db = Database.connect(DB_URL)
    order = db.get(order_id)
    # ...

# ✅ 易于测试
def process_order(order_id, database=None):
    if database is None:
        database = get_default_database()
    order = database.get(order_id)
    # ...

# 测试时可以注入 mock database
def test_process_order():
    mock_db = MockDatabase()
    process_order(123, database=mock_db)
```

### 3.2 测试覆盖率

**推荐的覆盖率目标**：
- 关键业务逻辑：90%+
- 核心功能：80%+
- 工具函数：70%+
- 整体项目：70%+

**覆盖率工具**：
- Python: pytest-cov
- JavaScript: Jest + Istanbul
- C#: Coverlet

## 4. 代码审查

### 4.1 审查清单

**功能检查**：
- [ ] 代码是否实现了需求
- [ ] 边界情况是否处理
- [ ] 错误处理是否完善

**质量检查**：
- [ ] 命名是否清晰
- [ ] 函数是否简短
- [ ] 是否有重复代码
- [ ] 注释是否必要且准确

**安全检查**：
- [ ] 输入是否验证
- [ ] 敏感数据是否保护
- [ ] 权限是否检查

### 4.2 审查流程

1. **自我审查**：提交前自己检查一遍
2. **同行审查**：至少一人审查
3. **响应反馈**：及时回应评论
4. **修改和迭代**：根据反馈改进
5. **批准和合并**：确认后合并

## 5. 自动化工具

### 5.1 静态分析工具

**Python**：
```bash
# 类型检查
mypy your_code.py

# 代码风格
flake8 your_code.py

# 安全检查
bandit -r your_project/

# 复杂度检查
radon cc your_project/ -a
```

**JavaScript/TypeScript**：
```bash
# ESLint
eslint your_code.js

# TypeScript 类型检查
tsc --noEmit

# Prettier 格式检查
prettier --check your_code.js
```

**C#**：
```bash
# Roslyn 分析器
dotnet build

# StyleCop
dotnet-format --verify-no-changes
```

### 5.2 CI/CD 集成

**GitHub Actions 示例**：
```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install flake8 mypy pytest pytest-cov

      - name: Lint with flake8
        run: flake8 your_project/

      - name: Type check with mypy
        run: mypy your_project/

      - name: Test with pytest
        run: pytest --cov=your_project --cov-report=xml
```

## 6. 技术债务管理

### 6.1 识别技术债务

**常见的技术债务信号**：
- 频繁出现的 bug
- 难以理解的代码
- 缺少测试的代码
- 过时的依赖库
- 性能问题

### 6.2 管理策略

**记录债务**：
```python
# TODO: [PERF] 优化这个 O(n²) 算法
# 技术债务: #123
# 负责人: @username
# 优先级: 中
# 预计工作量: 2小时

def slow_algorithm(items):
    # O(n²) implementation
    for item in items:
        for other in items:
            # ...
```

**偿还策略**：
1. **定期重构**：每个迭代分配 20% 时间
2. ** Boy Scout 规则**：让代码比你发现时更整洁
3. **高价值优先**：优先解决影响最大的债务

## 7. 性能优化

### 7.1 性能分析工具

**Python**：
```python
import cProfile
import pstats

# 性能分析
profiler = cProfile.Profile()
profiler.enable()

# 你的代码
your_function()

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(10)  # 打印前10个最耗时的函数
```

**JavaScript**：
```javascript
// Chrome DevTools Performance
console.time('functionName');
yourFunction();
console.timeEnd('functionName');

// 或使用 Performance API
performance.mark('start');
yourFunction();
performance.mark('end');
performance.measure('function', 'start', 'end');
```

### 7.2 优化原则

1. **先测量，后优化**：基于数据做决策
2. **优化瓶颈**：专注于影响最大的部分
3. **权衡取舍**：考虑可读性与性能
4. **渐进优化**：小步迭代，持续改进

## 8. 安全编码

### 8.1 常见安全问题

**SQL 注入**：
```python
# ❌ 危险
query = f"SELECT * FROM users WHERE id = {user_id}"

# ✅ 安全
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

**XSS 防护**：
```python
# ❌ 危险
return f"<div>{user_input}</div>"

# ✅ 安全
import html
return f"<div>{html.escape(user_input)}</div>"
```

### 8.2 安全检查清单

- [ ] 输入验证和清理
- [ ] 输出编码
- [ ] 认证和授权
- [ ] 敏感数据加密
- [ ] 依赖项安全更新

## 9. 最佳实践总结

### 编码规范

1. **遵循语言规范**：PEP 8、ESLint、C# Coding Conventions
2. **使用格式化工具**：自动格式化，避免争议
3. **编写自文档化代码**：好的命名 > 注释
4. **保持函数简短**：单一职责，易于理解

### 团队协作

1. **代码审查**：确保代码质量
2. **结对编程**：知识共享，质量保证
3. **编码标准**：团队统一规范
4. **持续学习**：分享最佳实践

## 10. 实战练习

### 练习 1：重构坏代码

将以下代码重构为高质量代码：
```python
def d(u):
    if u['a'] > 18 and u['m'] == 'M':
        return True
    else:
        return False
```

### 练习 2：添加错误处理

为以下函数添加完善的错误处理：
```python
def divide(a, b):
    return a / b
```

### 练习 3：提高可测试性

重构以下代码，使其更容易测试：
```python
def send_notification(user_id, message):
    db = Database.connect(DB_URL)
    user = db.get_user(user_id)
    email_service = EmailService(API_KEY)
    email_service.send(user.email, message)
```

---

**下一步**：[测试驱动开发指南](./tdd-guide.md)
