# 代码审查实践指南

> 基于 Google、Microsoft 等顶级科技公司代码审查最佳实践

## 📚 核心资源

- **Google Engineering Practices**: Code Review
- **Microsoft Code Review Guidelines**
- **《代码整洁之道》** - Robert C. Martin
- **《软件工艺》** - Sandro Mancuso

## 🎯 代码审查的定义和价值

### 什么是代码审查？

**代码审查（Code Review）** 是开发人员在代码合并到主分支前，系统性地检查代码的过程。

**核心目标**：
1. **确保代码质量**：发现 Bug、逻辑错误、潜在问题
2. **知识共享**：团队成员互相学习最佳实践
3. **统一标准**：保持代码风格和架构一致性
4. **团队建设**：增强团队凝聚力和所有权意识

### 代码审查 vs. 测试

| 维度 | 代码审查 | 测试 |
|------|----------|------|
| 发现什么 | 逻辑错误、设计问题、可维护性 | Bug、功能问题 |
| 谁来做 | 人（同行） | 机器或测试人员 |
| 成本 | 较高（时间成本） | 较低（自动化） |
| 价值 | 知识共享、持续改进 | 质量保证 |

### 代码审查的投资回报

```
审查成本：1 小时
├── 发现潜在 Bug：节省 10 小时调试
├── 知识传播：节省未来 5 小时重复学习
├── 代码质量提升：节省长期维护成本
└── 团队成长：难以量化但价值巨大

总回报：远超投入成本
```

## 📋 代码审查清单

### 1. 功能正确性

- [ ] **代码实现了需求吗？**
  - 对比 PR 描述和实际实现
  - 检查边界条件
  - 验证错误处理

- [ ] **逻辑是否正确？**
  ```python
  # ❌ 问题代码
  def calculate_discount(quantity):
      if quantity > 10:
          return 0.1
      elif quantity > 5:
          return 0.15  # Bug: 应该是 0.05

  # ✅ 修复后
  def calculate_discount(quantity):
      if quantity > 10:
          return 0.1
      elif quantity > 5:
          return 0.05
      return 0
  ```

- [ ] **边界条件处理？**
  ```python
  # ❌ 未处理空列表
  def get_first_item(items):
      return items[0]

  # ✅ 处理边界条件
  def get_first_item(items):
      if not items:
          return None
      return items[0]
  ```

### 2. 代码质量

- [ ] **代码可读性**
  - 变量和函数命名清晰
  - 逻辑流程易于理解
  - 避免深层嵌套

  ```python
  # ❌ 命名不清晰
  def proc(d, c):
      r = 0
      for x in d:
          if x['t'] == c:
              r += x['a']
      return r

  # ✅ 清晰的命名
  def calculate_total_amount(transactions, category):
      total = 0
      for transaction in transactions:
          if transaction['type'] == category:
              total += transaction['amount']
      return total
  ```

- [ ] **函数职责单一**
  ```python
  # ❌ 函数做太多事情
  def process_order(order):
      # 验证
      if not order.get('customer_id'):
          raise ValueError("Invalid order")
      # 计算价格
      total = sum(item['price'] for item in order['items'])
      # 发送邮件
      send_email(order['customer_id'])
      # 保存到数据库
      db.save(order)
      return total

  # ✅ 职责分离
  def process_order(order):
      validate_order(order)
      total = calculate_order_total(order)
      save_order(order)
      notify_customer(order)
      return total
  ```

- [ ] **避免重复代码**
  ```python
  # ❌ 重复代码
  class UserSerializer:
      def serialize(self, user):
          return {
              'id': user.id,
              'name': user.name,
              'email': user.email,
              'created_at': user.created_at.isoformat()
          }

  class ProductSerializer:
      def serialize(self, product):
          return {
              'id': product.id,
              'name': product.name,
              'price': product.price,
              'created_at': product.created_at.isoformat()
          }

  # ✅ 提取公共逻辑
  class BaseSerializer:
      def serialize_timestamps(self, obj):
          return {
              'created_at': obj.created_at.isoformat(),
              'updated_at': obj.updated_at.isoformat()
          }
  ```

### 3. 错误处理

- [ ] **异常处理恰当**
  ```python
  # ❌ 吞掉异常
  def process_data(data):
      try:
          result = complex_calculation(data)
      except Exception:
          pass  # 静默失败
      return result

  # ✅ 适当的异常处理
  def process_data(data):
      try:
          result = complex_calculation(data)
      except ValueError as e:
          logger.error(f"Invalid data: {e}")
          raise
      except Exception as e:
          logger.exception(f"Unexpected error: {e}")
          raise
      return result
  ```

- [ ] **资源管理正确**
  ```python
  # ❌ 可能泄漏资源
  def process_file(filename):
      f = open(filename)
      data = f.read()
      # 如果出错，文件不会关闭
      process(data)

  # ✅ 使用上下文管理器
  def process_file(filename):
      with open(filename) as f:
          data = f.read()
      process(data)
  ```

### 4. 性能考虑

- [ ] **算法复杂度合理**
  ```python
  # ❌ O(n²) 复杂度
  def find_duplicates(items):
      duplicates = []
      for i, item1 in enumerate(items):
          for item2 in items[i+1:]:
              if item1 == item2 and item2 not in duplicates:
                  duplicates.append(item2)
      return duplicates

  # ✅ O(n) 复杂度
  def find_duplicates(items):
      seen = set()
      duplicates = set()
      for item in items:
          if item in seen:
              duplicates.add(item)
          else:
              seen.add(item)
      return list(duplicates)
  ```

- [ ] **避免不必要的计算**
  ```python
  # ❌ 重复计算
  def process_items(items):
      results = []
      for item in items:
          expensive_value = calculate_expensive_value(item)
          if expensive_value > 10:
              results.append(expensive_value * 2)
      return results

  # ✅ 缓存结果
  def process_items(items):
      results = []
      for item in items:
          expensive_value = calculate_expensive_value(item)
          if expensive_value > 10:
              results.append(expensive_value * 2)
          # 如果后续不需要 expensive_value，不应该计算
      return results
  ```

### 5. 安全性

- [ ] **输入验证**
  ```python
  # ❌ 未验证输入
  def execute_query(query):
      cursor.execute(query)  # SQL 注入风险

  # ✅ 参数化查询
  def execute_query(query, params):
      cursor.execute(query, params)
  ```

- [ ] **敏感数据处理**
  ```python
  # ❌ 日志中包含敏感信息
  def login(username, password):
      logger.info(f"Login attempt: {username}, {password}")

  # ✅ 避免记录敏感信息
  def login(username, password):
      logger.info(f"Login attempt: {username}")
  ```

### 6. 测试覆盖

- [ ] **测试充分**
  - 正常路径测试
  - 边界条件测试
  - 错误情况测试

  ```python
  # 测试示例
  def test_calculate_discount():
      # 正常情况
      assert calculate_discount(15) == 0.1

      # 边界条件
      assert calculate_discount(10) == 0.05
      assert calculate_discount(5) == 0

      # 边界值
      assert calculate_discount(0) == 0
      assert calculate_discount(-1) == 0
  ```

- [ ] **测试可读性**
  ```python
  # ❌ 不清晰的测试
  def test_1():
      assert func(1, 2, 3) == 6

  # ✅ 描述性的测试
  def test_calculate_total_with_multiple_items():
      result = calculate_total([1, 2, 3])
      assert result == 6
  ```

### 7. 文档和注释

- [ ] **公共 API 有文档**
  ```python
  def calculate_discount(quantity: int, customer_tier: str) -> float:
      """
      计算订单折扣。

      Args:
          quantity: 商品数量
          customer_tier: 客户等级 ('basic', 'premium', 'vip')

      Returns:
          折扣率（0.0-1.0）

      Raises:
          ValueError: 如果 customer_tier 无效

      Examples:
          >>> calculate_discount(10, 'premium')
          0.1
      """
  ```

- [ ] **复杂逻辑有注释**
  ```python
  # 使用 Floyd-Warshall 算法计算所有节点对的最短路径
  # 时间复杂度: O(V³)，其中 V 是节点数量
  for k in range(n):
      for i in range(n):
          for j in range(n):
              # 如果通过节点 k 的路径更短，更新距离
              if dist[i][j] > dist[i][k] + dist[k][j]:
                  dist[i][j] = dist[i][k] + dist[k][j]
  ```

### 8. 代码风格

- [ ] **遵循项目规范**
  - 命名约定
  - 代码格式化
  - 文件组织

- [ ] **一致性**
  ```python
  # ❌ 不一致的风格
  def get_data(): return {}
  def GetData(): return {}
  def getData(): return {}

  # ✅ 一致的风格
  def get_data(): return {}
  def get_user(): return {}
  def get_order(): return {}
  ```

## 🎨 代码审查流程

### 1. 审查前准备

**审查者**：
- 理解 PR 的目的和背景
- 阅读相关文档和需求
- 准备充足的时间（不要匆忙）

**提交者**：
- 自我审查代码
- 编写清晰的 PR 描述
- 确保测试通过
- 保持 PR 小而聚焦

### 2. PR 描述模板

```markdown
## 变更概述
简要描述这个 PR 的目的和实现方式。

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 性能优化

## 测试
描述如何测试这些变更：
- 单元测试：xxx
- 集成测试：xxx
- 手动测试：xxx

## 截图/演示
如果适用，添加截图或 GIF

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 通过了所有 CI 检查

## 相关 Issue
Closes #123
Related to #456
```

### 3. 审查过程

**第一步：整体理解**
- 阅读 PR 描述
- 查看变更文件列表
- 理解整体架构变化

**第二步：详细审查**
- 逐文件审查代码
- 关注关键变化
- 提出问题和建议

**第三步：总结反馈**
- 总结主要问题
- 提出改进建议
- 明确是否需要修改

### 4. 反馈分类

**必须修复（Blocker）**：
- Bug 或逻辑错误
- 安全漏洞
- 严重的性能问题
- 缺少关键测试

**建议修改（Recommendation）**：
- 代码风格问题
- 可读性改进
- 性能优化机会
- 更好的实现方式

**可选改进（Optional）**：
- 命名建议
- 注释完善
- 小的重构机会

### 5. 反馈示例

```markdown
# 必须修复
❌ `process_payment` 函数没有处理支付失败的情况，可能导致订单状态不一致。
建议：添加异常处理和事务回滚。

# 建议修改
⚠️ 考虑使用 `dataclasses` 替代普通的类来定义 `Order`，这样可以减少样板代码。

# 可选改进
💡 `calculate_total` 函数可以考虑使用生成器表达式来提高内存效率。

# 正面反馈
✅ 很好地处理了边界条件！
✅ 测试覆盖充分，包括边界情况和错误场景。
✅ 代码结构清晰，易于理解。
```

## 🚀 最佳实践

### 1. 审查者原则

**保持友善和尊重**
```markdown
# ❌ 负面示例
"这段代码写得不好，重写。"

# ✅ 正面示例
"我注意到这段代码可能存在潜在问题。建议我们可以考虑另一种实现方式，
这样可能更容易维护。你觉得怎么样？"
```

**解释原因，而不是只指出问题**
```markdown
# ❌
"改成这样。"

# ✅
"建议修改为 X，因为这样可以避免 Y 问题，同时提高可读性。"
```

**区分偏好和问题**
```markdown
# 明确标注
"这是一个小建议（非必须），你可以根据自己的判断决定是否采纳。"
```

### 2. 提交者原则

**保持开放心态**
- 将审查视为学习机会
- 不要把代码批评视为个人攻击
- 主动讨论和澄清

**响应及时**
- 及时回复审查意见
- 解释设计决策
- 感谢审查者的时间

**持续改进**
- 记录常见反馈
- 建立个人检查清单
- 分享学到的经验

### 3. 团队实践

**定期同步**
- 每周代码审查会议
- 分享优秀实践
- 讨论疑难问题

**建立规范**
- 统一代码风格指南
- 常见模式库
- 审查检查清单

**培养文化**
- 鼓励提问和讨论
- 庆祝代码质量提升
- 认可优秀贡献

## 📊 代码审查指标

### 关键指标

1. **审查速度**
   - 目标：24 小时内完成首次审查
   - 监控：平均审查时间

2. **PR 大小**
   - 目标：每个 PR < 400 行代码
   - 监控：平均 PR 大小

3. **审查覆盖率**
   - 目标：100% 的代码经过审查
   - 监控：未经审查合并的 PR

4. **修改轮次**
   - 目标：平均 < 3 轮修改
   - 监控：平均修改次数

### 反馈质量

```python
# 评估反馈质量
def review_quality_score(review):
    """
    评估代码审查质量

    因素：
    - 是否解释了原因
    - 是否提供了示例
    - 是否区分了优先级
    - 是否保持礼貌
    """
    score = 0

    if review.has_explanations:
        score += 25

    if review.has_examples:
        score += 25

    if review.has_priority_labels:
        score += 25

    if review.is_polite:
        score += 25

    return score
```

## 🎯 实战案例

### 案例 1：发现潜在 Bug

**审查代码**：
```python
def transfer_money(from_account, to_account, amount):
    if from_account.balance < amount:
        raise InsufficientFundsError()

    from_account.balance -= amount
    to_account.balance += amount

    save_account(from_account)
    save_account(to_account)
```

**问题发现**：
```markdown
⚠️ 发现一个并发问题：
如果在两个保存操作之间发生异常，会导致数据不一致。

建议使用数据库事务：
```python
def transfer_money(from_account, to_account, amount):
    with database.transaction():
        if from_account.balance < amount:
            raise InsufficientFundsError()

        from_account.balance -= amount
        to_account.balance += amount

        save_account(from_account)
        save_account(to_account)
```
```

### 案例 2：性能优化建议

**审查代码**：
```python
def get_user_posts(user_id):
    posts = []
    for post in Post.objects.all():
        if post.user_id == user_id:
            posts.append(post)
    return posts
```

**优化建议**：
```markdown
💡 性能优化建议：
当前实现会加载所有帖子到内存，建议使用数据库查询：

```python
def get_user_posts(user_id):
    return Post.objects.filter(user_id=user_id)
```

这样可以：
1. 利用数据库索引
2. 减少内存使用
3. 提高查询速度
```

### 案例 3：安全漏洞发现

**审查代码**：
```python
def reset_password(email, new_password):
    user = User.objects.get(email=email)
    user.password = hash_password(new_password)
    user.save()
    send_password_reset_email(email)
```

**安全问题**：
```markdown
🚨 安全问题：
1. 没有验证用户身份就重置密码
2. 应该发送重置链接，而不是直接重置

建议实现标准的密码重置流程：
1. 用户请求重置
2. 系统发送带 token 的邮件
3. 用户点击链接验证 token
4. 用户设置新密码
```

## 📚 学习资源

### 书籍
1. **《代码整洁之道》** - 第 13 章：并发
2. **《软件工艺》** - 第 6 章：代码审查
3. **《Effective Code Review》** - Trisha Gee

### 在线资源
- [Google Code Review Guide](https://google.github.io/eng-practices/review/)
- [Microsoft Code Review Guidelines](https://docs.microsoft.com/en-us/azure/devops/pullrequests/code-review-pull-requests)
- [GitHub Code Review Best Practices](https://guides.github.com/pulls/)

---

**下一步**：[AI 辅助开发指南](../modern/ai-assisted-development.md)
