# 软件架构设计指南

> 基于 Martin Fowler、Robert C. Martin 等专家的架构设计原则

## 📚 核心资源

- **《软件架构模式》** - Mark Richards & Neal Ford
- **《架构整洁之道》** - Robert C. Martin
- **《企业应用架构模式》** - Martin Fowler
- **《DDDS》（领域驱动设计精粹）** - Vaughn Vernon

## 🎯 软件架构的定义

### 什么是软件架构？

**软件架构** 是软件系统的高层结构，它定义了：

1. **系统的组成部分**
2. **各部分之间的关系**
3. **指导设计和演进的原则**

**核心关注点**：
- 系统的**质量属性**（性能、可扩展性、安全性等）
- 技术和框架的**选型**
- 开发团队的**组织结构**

### 架构 vs. 设计

```
┌─────────────────────────────────────┐
│         软件架构（高层）              │
│  - 分层架构、微服务等架构模式        │
│  - 技术选型、框架选择               │
│  - 系统边界、接口定义               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         设计（中层）                 │
│  - 设计模式（工厂、观察者等）        │
│  - 模块划分、职责分配               │
│  - API 设计、数据模型               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         实现（底层）                 │
│  - 算法、数据结构                   │
│  - 代码风格、命名                   │
│  - 具体实现细节                     │
└─────────────────────────────────────┘
```

## 🏗️ 经典架构模式

### 1. 分层架构 (Layered Architecture)

**结构**：
```
┌─────────────────────────────────┐
│    表现层 (Presentation)         │  ← 用户界面
├─────────────────────────────────┤
│    业务逻辑层 (Business Logic)   │  ← 业务规则
├─────────────────────────────────┤
│    数据访问层 (Data Access)      │  ← 数据库操作
├─────────────────────────────────┤
│    数据库层 (Database)           │  ← 数据存储
└─────────────────────────────────┘
```

**原则**：
- **依赖向下**：上层依赖下层，下层不依赖上层
- **单向调用**：调用从上到下，不跨层调用

**优点**：
- ✅ 结构清晰，易于理解
- ✅ 职责分离明确
- ✅ 易于测试和维护

**缺点**：
- ❌ 层次过多可能导致性能损失
- ❌ 可能过度设计

**实现示例**：
```python
# 表现层
class OrderController:
    def __init__(self, order_service):
        self.order_service = order_service

    def create_order(self, request):
        # 数据验证
        order_data = self.validate_request(request)
        # 调用业务逻辑
        order = self.order_service.create_order(order_data)
        # 返回响应
        return self.to_response(order)

# 业务逻辑层
class OrderService:
    def __init__(self, order_repository, inventory_service):
        self.order_repository = order_repository
        self.inventory_service = inventory_service

    def create_order(self, order_data):
        # 业务规则验证
        if not self.is_valid_order(order_data):
            raise ValidationError("Invalid order")

        # 检查库存
        self.inventory_service.check_availability(order_data.items)

        # 创建订单
        order = Order(order_data)
        order.calculate_total()

        # 保存订单
        return self.order_repository.save(order)

# 数据访问层
class OrderRepository:
    def __init__(self, db_session):
        self.db_session = db_session

    def save(self, order):
        self.db_session.add(order)
        self.db_session.commit()
        return order
```

### 2. 六边形架构 (Hexagonal Architecture)

**核心思想**：将应用核心与外部依赖隔离

```
        ┌──────────────────┐
        │   应用核心       │
        │  (业务逻辑)      │
        └──────────────────┘
              ↕  ↕  ↕
    ┌───────┐  ┌───────┐  ┌───────┐
    │ 适配器│  │ 适配器│  │ 适配器│
    │(驱动) │  │(驱动) │  │(驱动) │
    └───────┘  └───────┘  └───────┘
       ↓          ↓          ↓
    ┌───────┐  ┌───────┐  ┌───────┐
    │ 数据库 │  │  API  │  │ 消息队列│
    └───────┘  └───────┘  └───────┘
```

**实现示例**：
```python
# 核心业务逻辑（不依赖任何外部实现）
class OrderService:
    def __init__(self, order_repository: OrderRepositoryPort):
        self.order_repository = order_repository

    def create_order(self, order_data):
        # 纯业务逻辑，不关心具体实现
        order = Order(order_data)
        return self.order_repository.save(order)

# 端口（接口）
class OrderRepositoryPort(ABC):
    @abstractmethod
    def save(self, order):
        pass

# 适配器（实现）
class SQLAlchemyOrderRepository(OrderRepositoryPort):
    def __init__(self, db_session):
        self.db_session = db_session

    def save(self, order):
        # SQLAlchemy 具体实现
        self.db_session.add(order)
        self.db_session.commit()
        return order

class MongoOrderRepository(OrderRepositoryPort):
    def __init__(self, mongo_client):
        self.mongo_client = mongo_client

    def save(self, order):
        # MongoDB 具体实现
        return self.mongo_client.orders.insert_one(order)
```

### 3. 微服务架构 (Microservices Architecture)

**定义**：将应用拆分为一组小型、独立的服务

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ 服务 A  │  │ 服务 B  │  │ 服务 C  │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  ↓
         ┌────────────────┐
         │   API 网关     │
         └────────────────┘
```

**优点**：
- ✅ 独立部署和扩展
- ✅ 技术栈灵活
- ✅ 故障隔离

**缺点**：
- ❌ 分布式系统复杂性
- ❌ 服务间通信成本
- ❌ 数据一致性挑战

**服务边界划分原则**：
```python
# ✅ 好的服务边界 - 单一职责
class OrderService:
    """订单服务 - 只处理订单相关逻辑"""
    def create_order(self, data): pass
    def get_order(self, order_id): pass
    def cancel_order(self, order_id): pass

class InventoryService:
    """库存服务 - 只处理库存相关逻辑"""
    def check_stock(self, product_id): pass
    def reserve_stock(self, product_id, quantity): pass

# ❌ 不好的服务边界 - 职责混乱
class OrderAndInventoryService:
    """订单和库存混合在一起"""
    def create_order(self, data): pass
    def check_stock(self, product_id): pass  # 应该在库存服务
```

## 🎯 架构设计原则

### 1. SOLID 原则在架构中的应用

**单一职责原则 (SRP)**
```python
# ❌ 违反 SRP - 一个模块负责太多
class UserModule:
    def register_user(self, data): pass
    def send_email(self, user): pass
    def log_activity(self, user): pass
    def generate_report(self, user): pass

# ✅ 遵循 SRP - 职责分离
class UserService:
    def register_user(self, data): pass

class EmailService:
    def send_email(self, user): pass

class ActivityService:
    def log_activity(self, user): pass

class ReportService:
    def generate_report(self, user): pass
```

**开闭原则 (OCP)**
```python
# ❌ 违反 OCP - 每次添加新支付方式都要修改
class PaymentProcessor:
    def process_payment(self, payment_type, amount):
        if payment_type == "credit_card":
            # 信用卡处理逻辑
            pass
        elif payment_type == "paypal":
            # PayPal 处理逻辑
            pass
        # 每次添加新方式都要修改这里

# ✅ 遵循 OCP - 扩展而非修改
class PaymentStrategy(ABC):
    @abstractmethod
    def process(self, amount):
        pass

class CreditCardPayment(PaymentStrategy):
    def process(self, amount):
        # 信用卡处理逻辑
        pass

class PayPalPayment(PaymentStrategy):
    def process(self, amount):
        # PayPal 处理逻辑
        pass

class PaymentProcessor:
    def __init__(self, strategy: PaymentStrategy):
        self.strategy = strategy

    def process_payment(self, amount):
        return self.strategy.process(amount)

# 添加新支付方式只需创建新类
class WeChatPayment(PaymentStrategy):
    def process(self, amount):
        # 微信支付处理逻辑
        pass
```

**依赖倒置原则 (DIP)**
```python
# ❌ 违反 DIP - 高层依赖低层
class OrderService:
    def __init__(self):
        self.repository = SQLOrderRepository()  # 直接依赖具体实现

# ✅ 遵循 DIP - 依赖抽象
class OrderService:
    def __init__(self, repository: OrderRepository):
        self.repository = repository  # 依赖接口

# 具体实现通过依赖注入提供
service = OrderService(SQLOrderRepository())
service = OrderService(MongoOrderRepository())  # 轻松切换
```

### 2. CAP 定理

在分布式系统中，只能同时满足以下两个特性：

```
         C - 一致性 (Consistency)
        /↖\
       /   ↖\
      /     ↖\
     /       ↖\
  A - 可用性  P - 分区容错性
  (Availability) (Partition Tolerance)
```

**权衡**：
- **CP**：保证一致性，牺牲可用性（如传统数据库）
- **AP**：保证可用性，牺牲强一致性（如 DNS）
- **CA**：理论上的理想状态（在分布式系统不可能）

### 3. 其他重要原则

**DRY（Don't Repeat Yourself）**
```python
# ❌ 重复代码
def validate_user(user):
    if not user.email or '@' not in user.email:
        return False
    return True

def validate_admin(admin):
    if not admin.email or '@' not in admin.email:
        return False
    return True

# ✅ 提取公共逻辑
def validate_email(email):
    return email and '@' in email

def validate_user(user):
    return validate_email(user.email)

def validate_admin(admin):
    return validate_email(admin.email)
```

**KISS（Keep It Simple, Stupid）**
```python
# ❌ 过于复杂
def process_data(data):
    result = []
    for i in range(len(data)):
        for j in range(len(data[i])):
            if isinstance(data[i][j], int):
                if data[i][j] > 0:
                    result.append(data[i][j] * 2)
    return result

# ✅ 简单直接
def process_data(data):
    return [item * 2 for row in data for item in row if isinstance(item, int) and item > 0]
```

**YAGNI（You Aren't Gonna Need It）**
```python
# ❌ 过度设计 - 当前不需要的功能
class PaymentProcessor:
    def __init__(self):
        self.cryptocurrency_handler = CryptocurrencyHandler()  # 目前不需要
        self.blockchain_integration = BlockchainIntegration()  # 未来可能需要
        self.quantum_encryption = QuantumEncryption()  # 完全不需要

# ✅ 按需设计 - 只实现当前需要的功能
class PaymentProcessor:
    def __init__(self):
        self.credit_card_handler = CreditCardHandler()
        # 等真正需要时再添加其他功能
```

## 🎨 架构设计方法

### 1. 领域驱动设计 (DDD)

**核心概念**：

**战略设计**：
```
核心域 (Core Domain)
    ↓
支撑域 (Supporting Domain)
    ↓
通用域 (Generic Domain)
```

**战术设计**：
```python
# 值对象 (Value Object) - 不可变，通过值判断相等
@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

    def __add__(self, other):
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount + other.amount, self.currency)

# 实体 (Entity) - 有唯一标识，可变
class Order:
    def __init__(self, order_id: str):
        self.order_id = order_id  # 唯一标识
        self.items = []
        self.status = OrderStatus.PENDING

    def add_item(self, item: OrderItem):
        self.items.append(item)

    def calculate_total(self) -> Money:
        return sum(item.total_price for item in self.items)

# 聚合 (Aggregate) - 一致性边界
class Order:
    """订单聚合根"""
    def __init__(self, order_id: str):
        self.order_id = order_id
        self.items = []  # OrderItem 是聚合的一部分
        self.shipping_info = None

    def add_item(self, product_id: str, quantity: int, price: Money):
        self.items.append(OrderItem(product_id, quantity, price))

    def set_shipping_info(self, address: str):
        self.shipping_info = ShippingInfo(address)

# 仓储 (Repository) - 持久化抽象
class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order):
        pass

    @abstractmethod
    def find_by_id(self, order_id: str) -> Order:
        pass

# 领域服务 (Domain Service) - 不属于任何实体的领域逻辑
class OrderDomainService:
    def calculate_discount(self, order: Order, customer: Customer) -> Money:
        """跨实体的业务逻辑"""
        if customer.is_vip():
            return order.total * Decimal('0.1')
        return Money.zero()
```

### 2. 事件驱动架构 (EDA)

**核心思想**：服务间通过事件通信

```python
# 事件定义
@dataclass
class OrderCreatedEvent:
    order_id: str
    customer_id: str
    total: Money
    timestamp: datetime

# 事件发布者
class OrderService:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus

    def create_order(self, order_data):
        order = Order(order_data)
        order.calculate_total()

        # 发布领域事件
        event = OrderCreatedEvent(
            order_id=order.id,
            customer_id=order.customer_id,
            total=order.total,
            timestamp=datetime.now()
        )
        self.event_bus.publish(event)

        return order

# 事件订阅者
class InventoryEventHandler:
    def __init__(self, inventory_service):
        self.inventory_service = inventory_service

    @subscribe(OrderCreatedEvent)
    def handle(self, event: OrderCreatedEvent):
        """自动扣减库存"""
        # 查询订单商品
        order_items = self.get_order_items(event.order_id)
        # 扣减库存
        for item in order_items:
            self.inventory_service.reserve_stock(
                item.product_id,
                item.quantity
            )

class NotificationEventHandler:
    @subscribe(OrderCreatedEvent)
    def handle(self, event: OrderCreatedEvent):
        """发送订单创建通知"""
        send_email(
            to=event.customer_id,
            subject="订单创建成功",
            body=f"您的订单 {event.order_id} 已创建"
        )
```

### 3. CQRS（命令查询职责分离）

**核心思想**：将读和写操作分离

```python
# 命令（写操作）
class CreateOrderCommand:
    def __init__(self, customer_id, items):
        self.customer_id = customer_id
        self.items = items

class OrderCommandHandler:
    def handle(self, command: CreateOrderCommand):
        order = Order(command.customer_id, command.items)
        self.order_repository.save(order)
        return order.id

# 查询（读操作）
class OrderQueryHandler:
    def get_order(self, order_id):
        # 从优化的读模型查询
        return self.order_read_model.find_by_id(order_id)

    def get_customer_orders(self, customer_id):
        # 从优化的视图查询
        return self.customer_orders_view.find_by_customer(customer_id)

# 写模型（规范化）
class OrderWriteModel:
    order_id: PK
    customer_id: FK
    status: Enum
    items: OneToMany
    # ... 其他字段

# 读模型（反规范化，优化查询）
class OrderReadModel:
    order_id: str
    customer_name: str  # 冗余，避免 JOIN
    total_amount: Decimal  # 预计算
    status: str
    item_count: int  # 冗余
    # ... 按查询需求优化
```

## 📊 架构评估方法

### 1. ATAM（架构权衡分析方法）

**步骤**：
1. 收集场景（用例、质量属性需求）
2. 描述架构
3. 分析架构方法
4. 识别敏感点
5. 评估权衡

### 2. 架构 Fitness 检查清单

```python
class ArchitectureFitness:
    def evaluate(self, system):
        results = {
            'maintainability': self.check_maintainability(system),
            'scalability': self.check_scalability(system),
            'testability': self.check_testability(system),
            'security': self.check_security(system),
            'performance': self.check_performance(system)
        }
        return results

    def check_maintainability(self, system):
        """可维护性检查"""
        return {
            'modularity': self.check_modularity(system),
            'coupling': self.check_coupling(system),
            'cohesion': self.check_cohesion(system),
            'code_quality': self.check_code_quality(system)
        }

    def check_scalability(self, system):
        """可扩展性检查"""
        return {
            'horizontal_scaling': self.can_scale_horizontally(system),
            'vertical_scaling': self.can_scale_vertically(system),
            'bottlenecks': self.identify_bottlenecks(system)
        }
```

## 🎯 实战案例

### 案例：电商系统架构设计

**需求分析**：
- 支持高并发（10k+ QPS）
- 快速功能迭代
- 多端支持（Web、App、小程序）

**架构选择**：微服务架构

```
┌─────────────────────────────────────────┐
│              API 网关                    │
└─────────────────────────────────────────┘
              ↓
    ┌─────────┴─────────┐
    │                   │
┌───┴────┐        ┌────┴───┐
│ 服务A  │        │ 服务B  │
│(订单)  │        │(商品)  │
└────────┘        └────────┘
    │                   │
    └─────────┬─────────┘
              ↓
    ┌─────────┴─────────┐
    │   共享基础设施     │
    │ - 消息队列         │
    │ - 缓存 (Redis)     │
    │ - 数据库集群       │
    └───────────────────┘
```

**服务划分**：
```python
# 用户服务
class UserService:
    """用户相关功能"""
    def register(self, data): pass
    def login(self, username, password): pass
    def get_profile(self, user_id): pass

# 商品服务
class ProductService:
    """商品相关功能"""
    def list_products(self, filters): pass
    def get_product(self, product_id): pass
    def update_stock(self, product_id, quantity): pass

# 订单服务
class OrderService:
    """订单相关功能"""
    def create_order(self, order_data): pass
    def get_order(self, order_id): pass
    def cancel_order(self, order_id): pass

# 支付服务
class PaymentService:
    """支付相关功能"""
    def create_payment(self, order_id, amount): pass
    def handle_callback(self, payment_id, status): pass
```

## 📚 学习资源

### 经典书籍
1. **《软件架构模式》** - Mark Richards & Neal Ford
2. **《架构整洁之道》** - Robert C. Martin
3. **《企业应用架构模式》** - Martin Fowler
4. **《领域驱动设计》** - Eric Evans

### 在线资源
- [Martin Fowler's Blog](https://martinfowler.com/)
- [The Software Architecture Map](https://tomasz.jakut.me/2019/05/20/software-architecture-maps/)
- [AWS Architecture Center](https://aws.amazon.com/architecture/)

---

**下一步**：[设计模式深入指南](./design-patterns-advanced.md)
