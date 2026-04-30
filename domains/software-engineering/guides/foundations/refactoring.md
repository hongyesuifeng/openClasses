# 代码重构完整指南

> 基于 Martin Fowler 《重构》和 Refactoring.Guru 的权威指南

## 📚 核心资源

- **《重构：改善既有代码的设计》** - Martin Fowler
- **Refactoring.Guru** - 在线重构参考
- **《重构到模式》** - Joshua Kerievsky

## 🎯 重构的定义

### 什么是重构？

**重构**（Refactoring）是对软件内部结构的一种调整，目的是在不改变软件可观察行为的前提下，提高其可理解性、降低其修改成本。

**关键特征**：
1. **不改变行为**：重构后的代码功能完全相同
2. **提高质量**：改善代码的内部结构
3. **小步进行**：每次修改都很小，降低风险
4. **持续测试**：每步都有测试保护

### 重构 vs. 性能优化

| 维度 | 重构 | 性能优化 |
|-----|------|---------|
| 目标 | 提高可维护性 | 提高运行效率 |
| 可见性 | 行为不变 | 行为不变 |
| 侧重点 | 代码结构 | 资源使用 |
| 验证方式 | 功能测试 | 性能测试 |

## 🔍 代码坏味道（Code Smells）

### 1. 臃肿代码（Bloaters）

#### 1.1 长方法（Long Method）

**问题**：方法过长，难以理解和维护。

**重构方法**：
- **提取方法（Extract Method）**：将部分逻辑提取到独立方法
- **以查询取代临时变量（Replace Temp with Query）**：减少临时变量
- **引入参数对象（Introduce Parameter Object）**：合并参数

**示例**：
```python
# ❌ 重构前：长方法
def calculate_order_total(customer, items, tax_rate):
    # 计算小计
    subtotal = 0
    for item in items:
        price = item['price']
        quantity = item['quantity']
        discount = 0
        if quantity > 10:
            discount = price * 0.1
        elif quantity > 5:
            discount = price * 0.05
        subtotal += (price - discount) * quantity

    # 计算税费
    tax = subtotal * tax_rate

    # 应用客户折扣
    customer_discount = 0
    if customer['years'] > 5:
        customer_discount = subtotal * 0.15
    elif customer['years'] > 3:
        customer_discount = subtotal * 0.1

    # 计算总计
    total = subtotal + tax - customer_discount
    return total

# ✅ 重构后：分解为多个方法
def calculate_order_total(customer, items, tax_rate):
    subtotal = calculate_subtotal(items)
    tax = calculate_tax(subtotal, tax_rate)
    customer_discount = calculate_customer_discount(customer, subtotal)
    return subtotal + tax - customer_discount

def calculate_subtotal(items):
    subtotal = 0
    for item in items:
        item_total = calculate_item_total(item)
        subtotal += item_total
    return subtotal

def calculate_item_total(item):
    price = item['price']
    quantity = item['quantity']
    discount = calculate_quantity_discount(price, quantity)
    return (price - discount) * quantity

def calculate_quantity_discount(price, quantity):
    if quantity > 10:
        return price * 0.1
    elif quantity > 5:
        return price * 0.05
    return 0

def calculate_tax(subtotal, tax_rate):
    return subtotal * tax_rate

def calculate_customer_discount(customer, subtotal):
    years = customer['years']
    if years > 5:
        return subtotal * 0.15
    elif years > 3:
        return subtotal * 0.1
    return 0
```

#### 1.2 大类（Large Class）

**问题**：类承担过多职责，变得庞大复杂。

**重构方法**：
- **提取类（Extract Class）**：将部分职责分离到新类
- **提取接口（Extract Interface）**：分离接口和实现
- **提炼超类（Extract Superclass）**：提取共同逻辑到父类

#### 1.3 长参数列表（Long Parameter List）

**问题**：方法参数过多，难以使用和理解。

**重构方法**：
- **引入参数对象（Introduce Parameter Object）**
- **保留整个对象（Preserve Whole Object）**
- **用参数对象替换参数（Replace Parameter with Methods）**

**示例**：
```python
# ❌ 重构前：长参数列表
def create_customer(name, email, phone, address, city, state, zip_code, country):
    pass

# ✅ 重构后：使用参数对象
@dataclass
class CustomerData:
    name: str
    email: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    country: str

def create_customer(customer_data: CustomerData):
    pass
```

### 2. 面向对象滥用（Object-Orientation Abusers）

#### 2.1 过多的 Switch/Case

**问题**：大量条件分支，难以扩展。

**重构方法**：
- **用多态取代条件式（Replace Conditional with Polymorphism）**
- **用策略模式取代类型码（Replace Type Code with Strategy）**

**示例**：
```python
# ❌ 重构前：大量 switch
def calculate_payroll(employee):
    employee_type = employee['type']
    if employee_type == 'COMMISSIONED':
        return employee['salary'] + employee['commission'] * employee['sales']
    elif employee_type == 'HOURLY':
        return employee['hourly_rate'] * employee['hours_worked']
    elif employee_type == 'SALARIED':
        return employee['salary']
    else:
        raise ValueError(f"Unknown employee type: {employee_type}")

# ✅ 重构后：使用多态
from abc import ABC, abstractmethod

class Employee(ABC):
    @abstractmethod
    def calculate_pay(self):
        pass

class CommissionedEmployee(Employee):
    def __init__(self, salary, commission, sales):
        self.salary = salary
        self.commission = commission
        self.sales = sales

    def calculate_pay(self):
        return self.salary + self.commission * self.sales

class HourlyEmployee(Employee):
    def __init__(self, hourly_rate, hours_worked):
        self.hourly_rate = hourly_rate
        self.hours_worked = hours_worked

    def calculate_pay(self):
        return self.hourly_rate * self.hours_worked

class SalariedEmployee(Employee):
    def __init__(self, salary):
        self.salary = salary

    def calculate_pay(self):
        return self.salary
```

### 3. 变更阻碍器（Change Preventers）

#### 3.1 发散式变化（Divergent Change）

**问题**：一个类需要因多种原因而修改。

**重构方法**：
- **提炼类（Extract Class）**：将不同的变化原因分离到不同类

#### 3.2 霰弹式修改（Shotgun Surgery）

**问题**：每次修改都需要在多个类中进行。

**重构方法**：
- **移动方法（Move Method）**：将方法集中到合适的类
- **内联类（Inline Class）**：合并过于分散的类

### 4. 不必要的复杂性（Dispensables）

#### 4.1 重复代码（Duplicate Code）

**问题**：相同或相似的代码出现在多处。

**重构方法**：
- **提炼方法（Extract Method）**
- **上移方法（Pull Up Method）**
- **提炼超类（Extract Superclass）**

**示例**：
```python
# ❌ 重构前：重复代码
class OrderProcessor:
    def validate_email(self, email):
        if '@' not in email:
            return False
        if '.' not in email.split('@')[1]:
            return False
        return True

class UserRegistration:
    def validate_email(self, email):
        if '@' not in email:
            return False
        if '.' not in email.split('@')[1]:
            return False
        return True

# ✅ 重构后：提取到公共类
class EmailValidator:
    @staticmethod
    def validate(email):
        if '@' not in email:
            return False
        if '.' not in email.split('@')[1]:
            return False
        return True

class OrderProcessor:
    def validate_email(self, email):
        return EmailValidator.validate(email)

class UserRegistration:
    def validate_email(self, email):
        return EmailValidator.validate(email)
```

## 🛠️ 核心重构技巧

### 1. 提取方法（Extract Method）

**动机**：
- 提高代码可读性
- 创建细粒度的可复用组件
- 便于理解和测试

**步骤**：
1. 创建新方法，以"做什么"命名
2. 将提取的代码复制到新方法
3. 检查提取代码中的变量
4. 处理局部变量
5. 编译测试

### 2. 内联方法（Inline Method）

**动机**：
- 方法层次过多
- 方法功能简单，不值得单独存在

**步骤**：
1. 检查方法是否被重写
2. 找到方法所有调用点
3. 将方法调用替换为方法体
4. 删除方法定义

### 3. 提取类（Extract Class）

**动机**：
- 类承担过多职责
- 部分功能可以独立

**步骤**：
1. 考虑如何分解类的职责
2. 创建新类
3. 将相关字段和方法移动到新类
4. 建立新旧类之间的关系
5. 编译测试

### 4. 移动方法（Move Method）

**动机**：
- 方法在当前类中使用其他类的功能更多
- 方法更适合放在其他类中

**步骤**：
1. 检查方法中使用的特性
2. 考虑方法应该放在哪个类
3. 如果目标类不存在，创建它
4. 移动方法
5. 更新调用点

## 📋 重构清单

### 开始重构前

- [ ] 是否有完善的测试套件？
- [ ] 是否理解代码的功能？
- [ ] 是否有明确的重构目标？
- [ ] 是否有时间限制？

### 重构过程中

- [ ] 每次修改是否很小？
- [ ] 是否频繁运行测试？
- [ ] 是否保持代码可编译？
- [ ] 是否记录重要的中间步骤？

### 重构完成后

- [ ] 所有测试是否通过？
- [ ] 代码是否更清晰？
- [ ] 是否消除了所有坏味道？
- [ ] 是否更新了文档？

## 🎯 实战案例

### 案例：订单处理系统重构

**场景**：一个混乱的订单处理类，需要重构为清晰的结构。

```python
# ❌ 重构前：混乱的 OrderProcessor
class OrderProcessor:
    def process_order(self, order_data):
        # 验证数据
        if not order_data.get('customer_id'):
            raise ValueError("Missing customer_id")
        if not order_data.get('items'):
            raise ValueError("No items in order")
        if not order_data.get('shipping_address'):
            raise ValueError("Missing shipping address")

        # 计算金额
        subtotal = 0
        for item in order_data['items']:
            subtotal += item['price'] * item['quantity']

        # 应用折扣
        discount = 0
        if subtotal > 1000:
            discount = subtotal * 0.1
        elif subtotal > 500:
            discount = subtotal * 0.05

        # 计算税费
        tax = (subtotal - discount) * 0.08

        # 计算运费
        shipping = 0
        if subtotal < 50:
            shipping = 9.99
        elif subtotal < 100:
            shipping = 5.99

        # 计算总计
        total = subtotal - discount + tax + shipping

        # 保存订单
        order = {
            'customer_id': order_data['customer_id'],
            'items': order_data['items'],
            'subtotal': subtotal,
            'discount': discount,
            'tax': tax,
            'shipping': shipping,
            'total': total,
            'status': 'pending'
        }

        # 发送确认邮件
        self.send_confirmation_email(order)

        return order

    def send_confirmation_email(self, order):
        # 发送邮件逻辑
        pass

# ✅ 重构后：清晰的职责分离
class OrderValidator:
    def validate(self, order_data):
        errors = []
        if not order_data.get('customer_id'):
            errors.append("Missing customer_id")
        if not order_data.get('items'):
            errors.append("No items in order")
        if not order_data.get('shipping_address'):
            errors.append("Missing shipping address")

        if errors:
            raise ValueError("; ".join(errors))

class OrderPricing:
    def calculate_subtotal(self, items):
        return sum(item['price'] * item['quantity'] for item in items)

    def calculate_discount(self, subtotal):
        if subtotal > 1000:
            return subtotal * 0.1
        elif subtotal > 500:
            return subtotal * 0.05
        return 0

    def calculate_tax(self, amount):
        return amount * 0.08

    def calculate_shipping(self, subtotal):
        if subtotal < 50:
            return 9.99
        elif subtotal < 100:
            return 5.99
        return 0

    def calculate_total(self, subtotal, discount, tax, shipping):
        return subtotal - discount + tax + shipping

class OrderRepository:
    def save(self, order):
        # 保存到数据库
        pass

class EmailService:
    def send_order_confirmation(self, order):
        # 发送邮件
        pass

class OrderProcessor:
    def __init__(self):
        self.validator = OrderValidator()
        self.pricing = OrderPricing()
        self.repository = OrderRepository()
        self.email_service = EmailService()

    def process_order(self, order_data):
        # 验证
        self.validator.validate(order_data)

        # 计算价格
        subtotal = self.pricing.calculate_subtotal(order_data['items'])
        discount = self.pricing.calculate_discount(subtotal)
        taxable_amount = subtotal - discount
        tax = self.pricing.calculate_tax(taxable_amount)
        shipping = self.pricing.calculate_shipping(subtotal)
        total = self.pricing.calculate_total(subtotal, discount, tax, shipping)

        # 创建订单
        order = {
            'customer_id': order_data['customer_id'],
            'items': order_data['items'],
            'subtotal': subtotal,
            'discount': discount,
            'tax': tax,
            'shipping': shipping,
            'total': total,
            'status': 'pending'
        }

        # 保存和通知
        self.repository.save(order)
        self.email_service.send_order_confirmation(order)

        return order
```

## 📚 学习资源

### 经典书籍
1. **《重构：改善既有代码的设计》** - Martin Fowler
2. **《重构到模式》** - Joshua Kerievsky
3. **《代码整洁之道》** - Robert C. Martin

### 在线资源
- [Refactoring.Guru](https://refactoring.guru/) - 全面重构参考
- [Refactoring Catalog](https://refactoring.guru/refactoring) - 重构技巧目录

### 工具
- **IDE 重构功能**：IntelliJ IDEA, VS Code, PyCharm
- **静态分析工具**：SonarQube, ESLint, Pylint

---

**下一步**：[设计模式深入指南](./design-patterns-advanced.md)
