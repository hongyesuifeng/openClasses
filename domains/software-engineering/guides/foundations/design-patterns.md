# 设计模式基础指南

> 软件设计模式的核心概念和实践应用

## 📚 学习目标

完成本指南后，你将能够：
- 理解设计模式的核心概念和价值
- 掌握常用的创建型、结构型、行为型模式
- 学会在实际项目中正确应用设计模式
- 避免设计模式的滥用

## 🎯 设计模式概述

### 什么是设计模式？

设计模式是软件设计中常见问题的典型解决方案。它们是被反复使用、多数人知晓的、经过分类编目的、代码设计经验的总结。

### 为什么学习设计模式？

1. **共享词汇**：提供开发者之间的沟通语言
2. **最佳实践**：封装了经过验证的解决方案
3. **代码质量**：提高代码的可维护性和可扩展性
4. **学习曲线**：帮助理解优秀架构的设计思想

### 设计模式的分类

```
设计模式 (23种)
├── 创建型模式 (5种) - 对象创建机制
├── 结构型模式 (7种) - 类和对象组合
└── 行为型模式 (11种) - 对象间通信和职责分配
```

## 1. 创建型模式

### 1.1 单例模式 (Singleton)

**意图**：确保一个类只有一个实例，并提供全局访问点。

**适用场景**：
- 配置管理器
- 日志记录器
- 数据库连接池

**Python 示例**：
```python
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

config = Singleton()
config2 = Singleton()
assert config is config2  # True
```

**注意事项**：
- 增加代码耦合度
- 难以进行单元测试
- 考虑多线程安全性

### 1.2 工厂方法模式 (Factory Method)

**意图**：定义创建对象的接口，让子类决定实例化哪个类。

**适用场景**：
- 无法预知对象的确切类型
- 希望通过子类指定创建对象

**Python 示例**：
```python
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def speak(self):
        pass

class Dog(Animal):
    def speak(self):
        return "Woof!"

class Cat(Animal):
    def speak(self):
        return "Meow!"

class AnimalFactory:
    @staticmethod
    def create_animal(animal_type):
        if animal_type == "dog":
            return Dog()
        elif animal_type == "cat":
            return Cat()
        raise ValueError(f"Unknown animal type: {animal_type}")

# 使用
dog = AnimalFactory.create_animal("dog")
print(dog.speak())  # Woof!
```

### 1.3 建造者模式 (Builder)

**意图**：分步骤创建复杂对象。

**适用场景**：
- 创建复杂对象的算法应该独立于组成部分
- 构造过程允许不同表示

**Python 示例**：
```python
class House:
    def __init__(self):
        self.walls = None
        self.roof = None
        self.windows = []

class HouseBuilder:
    def __init__(self):
        self.house = House()

    def build_walls(self, count):
        self.house.walls = count
        return self

    def build_roof(self, material):
        self.house.roof = material
        return self

    def build_windows(self, count):
        self.house.windows = [None] * count
        return self

    def build(self):
        return self.house

# 使用
house = (HouseBuilder()
         .build_walls(4)
         .build_roof("tile")
         .build_windows(6)
         .build())
```

## 2. 结构型模式

### 2.1 适配器模式 (Adapter)

**意图**：让不兼容的接口能够协同工作。

**适用场景**：
- 需要使用现有类，但其接口与需求不匹配
- 创建可复用的类，与其他不相关的类协作

**Python 示例**：
```python
class GermanSocket:
    def plug_in(self):
        return "German socket plugged in"

class ChineseSocket:
    def connect(self):
        return "Chinese socket connected"

class SocketAdapter:
    def __init__(self, socket):
        self.socket = socket

    def plug_in(self):
        if hasattr(self.socket, 'connect'):
            self.socket.connect()
            return "Adapted Chinese socket to German interface"
        return self.socket.plug_in()

# 使用
chinese = ChineseSocket()
adapter = SocketAdapter(chinese)
print(adapter.plug_in())  # Adapted...
```

### 2.2 装饰器模式 (Decorator)

**意图**：动态地为对象添加额外行为。

**适用场景**：
- 在不修改代码的情况下扩展功能
- 通过组合而非继承扩展功能

**Python 示例**：
```python
def timing_decorator(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f}s")
        return result
    return wrapper

@timing_decorator
def slow_function():
    import time
    time.sleep(1)
    return "Done"

result = slow_function()  # slow_function took 1.00s
```

### 2.3 代理模式 (Proxy)

**意图**：为对象提供代理以控制访问。

**适用场景**：
- 远程代理（RPC）
- 虚拟代理（延迟加载）
- 保护代理（访问控制）

**Python 示例**：
```python
class RealImage:
    def __init__(self, filename):
        self.filename = filename
        self.load_from_disk()

    def load_from_disk(self):
        print(f"Loading {self.filename}")

    def display(self):
        print(f"Displaying {self.filename}")

class ProxyImage:
    def __init__(self, filename):
        self.filename = filename
        self.real_image = None

    def display(self):
        if self.real_image is None:
            self.real_image = RealImage(self.filename)
        self.real_image.display()

# 使用
proxy = ProxyImage("large_image.jpg")
proxy.display()  # Loads and displays
proxy.display()  # Only displays (already loaded)
```

## 3. 行为型模式

### 3.1 策略模式 (Strategy)

**意图**：定义一系列算法，封装每个算法，使它们可互换。

**适用场景**：
- 多种方式解决同一个问题
- 需要在运行时切换算法

**Python 示例**：
```python
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount):
        pass

class CreditCardPayment(PaymentStrategy):
    def pay(self, amount):
        return f"Paid ${amount} with Credit Card"

class PayPalPayment(PaymentStrategy):
    def pay(self, amount):
        return f"Paid ${amount} with PayPal"

class ShoppingCart:
    def __init__(self, payment_strategy):
        self.payment_strategy = payment_strategy

    def checkout(self, amount):
        return self.payment_strategy.pay(amount)

# 使用
cart = ShoppingCart(CreditCardPayment())
print(cart.checkout(100))  # Paid $100 with Credit Card

cart.payment_strategy = PayPalPayment()
print(cart.checkout(100))  # Paid $100 with PayPal
```

### 3.2 观察者模式 (Observer)

**意图**：定义对象间的一对多依赖关系，当一个对象状态改变时，所有依赖者都会收到通知。

**适用场景**：
- 事件处理系统
- MVC 架构中的模型-视图通信
- 消息订阅系统

**Python 示例**：
```python
class Subject:
    def __init__(self):
        self._observers = []

    def attach(self, observer):
        self._observers.append(observer)

    def detach(self, observer):
        self._observers.remove(observer)

    def notify(self, message):
        for observer in self._observers:
            observer.update(message)

class Observer:
    def update(self, message):
        print(f"Received: {message}")

# 使用
subject = Subject()
observer1 = Observer()
observer2 = Observer()

subject.attach(observer1)
subject.attach(observer2)

subject.notify("Hello!")  # 两个观察者都会收到通知
```

### 3.3 命令模式 (Command)

**意图**：将请求封装为对象，允许用不同的请求对客户进行参数化。

**适用场景**：
- 需要将调用者和接收者解耦
- 需要支持撤销/重做操作
- 需要支持事务操作

**Python 示例**：
```python
class Command(ABC):
    @abstractmethod
    def execute(self):
        pass

    @abstractmethod
    def undo(self):
        pass

class Light:
    def turn_on(self):
        print("Light is ON")

    def turn_off(self):
        print("Light is OFF")

class LightOnCommand(Command):
    def __init__(self, light):
        self.light = light

    def execute(self):
        self.light.turn_on()

    def undo(self):
        self.light.turn_off()

class RemoteControl:
    def __init__(self):
        self.command = None
        self.history = []

    def set_command(self, command):
        self.command = command

    def press_button(self):
        if self.command:
            self.command.execute()
            self.history.append(self.command)

    def press_undo(self):
        if self.history:
            self.history.pop().undo()

# 使用
remote = RemoteControl()
light = Light()
remote.set_command(LightOnCommand(light))
remote.press_button()  # Light is ON
remote.press_undo()    # Light is OFF
```

## 4. 设计原则

### SOLID 原则

1. **S**ingle Responsibility Principle (单一职责)
   - 一个类应该只有一个引起它变化的原因

2. **O**pen/Closed Principle (开闭原则)
   - 软件实体应该对扩展开放，对修改关闭

3. **L**iskov Substitution Principle (里氏替换)
   - 子类必须能够替换其基类

4. **I**nterface Segregation Principle (接口隔离)
   - 客户端不应该依赖它不需要的接口

5. **D**ependency Inversion Principle (依赖倒置)
   - 高层模块不应该依赖低层模块

### 其他重要原则

- **DRY** (Don't Repeat Yourself): 避免重复
- **KISS** (Keep It Simple): 保持简单
- **YAGNI** (You Aren't Gonna Need It): 不要过度设计

## 5. 实践建议

### 何时使用设计模式？

✅ **适合使用的场景**：
- 问题与模式意图匹配
- 团队成员都了解该模式
- 简化解决方案而非增加复杂度
- 提高代码可维护性

❌ **避免使用的情况**：
- 为了使用而使用
- 增加不必要的复杂度
- 简单问题复杂化
- 团队不熟悉该模式

### 学习路径

1. **理解意图**：理解模式解决的问题
2. **学习结构**：掌握模式的类图和关系
3. **实践应用**：在真实项目中应用
4. **反思总结**：总结使用经验和教训

## 6. 游戏开发中的应用

### 游戏开发常用模式

1. **对象池模式**：重用对象减少 GC
2. **状态模式**：角色状态管理
3. **命令模式**：输入处理和撤销
4. **观察者模式**：事件系统
5. **单例模式**：游戏管理器

### Unity 中实现状态模式

```csharp
public interface IState
{
    void Enter();
    void Execute();
    void Exit();
}

public class IdleState : IState
{
    private Player player;

    public IdleState(Player player)
    {
        this.player = player;
    }

    public void Enter() { }
    public void Execute() { }
    public void Exit() { }
}

public class Player : MonoBehaviour
{
    private IState currentState;

    public void ChangeState(IState newState)
    {
        if (currentState != null)
            currentState.Exit();

        currentState = newState;
        currentState.Enter();
    }

    void Update()
    {
        if (currentState != null)
            currentState.Execute();
    }
}
```

## 7. 参考资源

- [设计模式：可复用面向对象软件的基础](https://refactoring.guru/design-patterns)
- [Refactoring.Guru](https://refactoring.guru/)
- [游戏编程模式](https://gameprogrammingpatterns.com/)

---

**下一步**：[代码质量指南](./code-quality.md)
