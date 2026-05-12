# 设计模式深入指南

> 基于 GoF 《设计模式》和 Refactoring.Guru 的权威指南

## 📚 核心资源

- **《设计模式：可复用面向对象软件的基础》** - GoF (Gang of Four)
- **Refactoring.Guru** - 在线设计模式参考
- **《Head First 设计模式》** - 初学者友好
- **《游戏编程模式》** - Robert Nystrom

## 🎯 设计模式深度理解

### 设计模式的本质

**设计模式** 不是代码模板，而是解决特定设计问题的**思维方式**。每个模式都包含：

1. **意图**：解决什么问题
2. **动机**：为什么需要这个模式
3. **结构**：类之间的协作关系
4. **参与者**：各个类的职责
5. **协作**：对象间如何交互
6. **效果**：权衡和取舍

### 设计模式的分类体系

```
23种经典设计模式
├── 创建型模式 (Creational) - 5种
│   ├── 单例模式 (Singleton)
│   ├── 工厂方法 (Factory Method)
│   ├── 抽象工厂 (Abstract Factory)
│   ├── 建造者 (Builder)
│   └── 原型 (Prototype)
│
├── 结构型模式 (Structural) - 7种
│   ├── 适配器 (Adapter)
│   ├── 桥接 (Bridge)
│   ├── 组合 (Composite)
│   ├── 装饰器 (Decorator)
│   ├── 外观 (Facade)
│   ├── 代理 (Proxy)
│   └── 享元 (Flyweight)
│
└── 行为型模式 (Behavioral) - 11种
    ├── 策略 (Strategy)
    ├── 观察者 (Observer)
    ├── 命令 (Command)
    ├── 模板方法 (Template Method)
    ├── 迭代器 (Iterator)
    ├── 责任链 (Chain of Responsibility)
    ├── 中介者 (Mediator)
    ├── 备忘录 (Memento)
    ├── 状态 (State)
    ├── 访问者 (Visitor)
    └── 解释器 (Interpreter)
```

## 1. 创建型模式深度解析

### 1.1 抽象工厂模式 (Abstract Factory)

**问题**：需要创建一系列相关或相互依赖的对象，但不希望指定它们的具体类。

**UML 结构**：
```
        +-------------------+
        |  AbstractFactory  |
        +-------------------+
        | +CreateProductA() |
        | +CreateProductB() |
        +-------------------+
                 ^
                 |
        +--------+--------+
        |                 |
+---------------+  +---------------+
|ConcreteFactory1|  |ConcreteFactory2|
+---------------+  +---------------+
```

**完整示例**：

```python
from abc import ABC, abstractmethod

# 抽象产品接口
class Button(ABC):
    @abstractmethod
    def render(self):
        pass

class Checkbox(ABC):
    @abstractmethod
    def render(self):
        pass

# 具体产品 - Windows 风格
class WindowsButton(Button):
    def render(self):
        return "Windows Button rendered"

class WindowsCheckbox(Checkbox):
    def render(self):
        return "Windows Checkbox rendered"

# 具体产品 - macOS 风格
class MacButton(Button):
    def render(self):
        return "Mac Button rendered"

class MacCheckbox(Checkbox):
    def render(self):
        return "Mac Checkbox rendered"

# 抽象工厂
class GUIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button:
        pass

    @abstractmethod
    def create_checkbox(self) -> Checkbox:
        pass

# 具体工厂
class WindowsFactory(GUIFactory):
    def create_button(self) -> Button:
        return WindowsButton()

    def create_checkbox(self) -> Checkbox:
        return WindowsCheckbox()

class MacFactory(GUIFactory):
    def create_button(self) -> Button:
        return MacButton()

    def create_checkbox(self) -> Checkbox:
        return MacCheckbox()

# 客户端代码
class Application:
    def __init__(self, factory: GUIFactory):
        self.factory = factory
        self.button = None
        self.checkbox = None

    def create_ui(self):
        self.button = self.factory.create_button()
        self.checkbox = self.factory.create_checkbox()

    def render(self):
        print(self.button.render())
        print(self.checkbox.render())

# 使用示例
def client_code(os_type: str):
    if os_type == "windows":
        app = Application(WindowsFactory())
    elif os_type == "mac":
        app = Application(MacFactory())
    else:
        raise ValueError(f"Unknown OS: {os_type}")

    app.create_ui()
    app.render()

client_code("windows")
# Windows Button rendered
# Windows Checkbox rendered
```

**优点**：
- 确保产品系列的一致性
- 避免客户端与具体产品耦合
- 符合开闭原则

**缺点**：
- 难以支持新种类的产品
- 增加系统复杂性

**适用场景**：
- 系统需要独立于产品的创建、组合和表示
- 系统需要多个产品系列中的一个
- 产品系列需要一起使用

### 1.2 原型模式 (Prototype)

**问题**：通过复制现有对象来创建新对象，而不是通过实例化。

```python
from abc import ABC, abstractmethod
import copy

class Prototype(ABC):
    @abstractmethod
    def clone(self):
        pass

class ConcretePrototype(Prototype):
    def __init__(self, field):
        self.field = field

    def clone(self):
        # 浅拷贝
        return copy.copy(self)
        # 深拷贝: return copy.deepcopy(self)

    def __str__(self):
        return f"ConcretePrototype(field={self.field})"

# 使用
original = ConcretePrototype("original_value")
copy1 = original.clone()
copy1.field = "copied_value"

print(original)  # ConcretePrototype(field=original_value)
print(copy1)     # ConcretePrototype(field=copied_value)
```

**应用场景**：
- 对象创建成本高（如需要数据库查询）
- 需要避免与对象类层次耦合
- 需要动态创建和修改对象

### 1.3 建造者模式 (Builder) - 进阶

**Fluent Interface 实现**：

```python
from dataclasses import dataclass
from typing import List

@dataclass
class Pizza:
    dough: str = "regular"
    sauce: str = "tomato"
    toppings: List[str] = None
    cheese: str = "mozzarella"
    baking_time: int = 15

    def __post_init__(self):
        if self.toppings is None:
            self.toppings = []

class PizzaBuilder:
    def __init__(self):
        self.pizza = Pizza()

    def set_dough(self, dough: str):
        self.pizza.dough = dough
        return self

    def set_sauce(self, sauce: str):
        self.pizza.sauce = sauce
        return self

    def add_topping(self, topping: str):
        self.pizza.toppings.append(topping)
        return self

    def set_cheese(self, cheese: str):
        self.pizza.cheese = cheese
        return self

    def set_baking_time(self, minutes: int):
        self.pizza.baking_time = minutes
        return self

    def build(self) -> Pizza:
        return self.pizza

# Director 类封装常见构建流程
class PizzaDirector:
    def __init__(self, builder: PizzaBuilder):
        self.builder = builder

    def make_margherita(self) -> Pizza:
        return (self.builder
                .set_dough("thin")
                .set_sauce("tomato")
                .set_cheese("mozzarella")
                .set_baking_time(12)
                .build())

    def make_pepperoni(self) -> Pizza:
        return (self.builder
                .set_dough("regular")
                .set_sauce("tomato")
                .add_topping("pepperoni")
                .add_topping("mushrooms")
                .set_cheese("mozzarella")
                .set_baking_time(18)
                .build())

# 使用
builder = PizzaBuilder()
director = PizzaDirector(builder)

margherita = director.make_margherita()
print(margherita)
# Pizza(dough='thin', sauce='tomato', toppings=[''], cheese='mozzarella', baking_time=12)

# 自定义构建
custom = (PizzaBuilder()
          .set_dough("thick")
          .set_sauce("bbq")
          .add_topping("chicken")
          .add_topping("corn")
          .set_cheese("cheddar")
          .set_baking_time(20)
          .build())
```

## 2. 结构型模式深度解析

### 2.1 桥接模式 (Bridge)

**问题**：将抽象部分与实现部分分离，使它们可以独立变化。

**核心思想**：组合优于继承

```python
from abc import ABC, abstractmethod

# 实现接口
class Device(ABC):
    @abstractmethod
    def turn_on(self):
        pass

    @abstractmethod
    def turn_off(self):
        pass

    @abstractmethod
    def set_volume(self, percent: int):
        pass

# 具体实现
class TV(Device):
    def turn_on(self):
        print("TV: Turning ON")

    def turn_off(self):
        print("TV: Turning OFF")

    def set_volume(self, percent: int):
        print(f"TV: Setting volume to {percent}%")

class Radio(Device):
    def turn_on(self):
        print("Radio: Turning ON")

    def turn_off(self):
        print("Radio: Turning OFF")

    def set_volume(self, percent: int):
        print(f"Radio: Setting volume to {percent}%")

# 抽象
class Remote(ABC):
    def __init__(self, device: Device):
        self.device = device

    @abstractmethod
    def turn_on(self):
        pass

    @abstractmethod
    def turn_off(self):
        pass

    @abstractmethod
    def set_volume(self, percent: int):
        pass

# 具体抽象
class BasicRemote(Remote):
    def turn_on(self):
        self.device.turn_on()

    def turn_off(self):
        self.device.turn_off()

    def set_volume(self, percent: int):
        self.device.set_volume(percent)

class AdvancedRemote(Remote):
    def turn_on(self):
        self.device.turn_on()

    def turn_off(self):
        self.device.turn_off()

    def set_volume(self, percent: int):
        self.device.set_volume(min(100, max(0, percent)))

    def mute(self):
        print("Muting device")
        self.device.set_volume(0)

# 使用
tv = TV()
radio = Radio()

basic_remote = BasicRemote(tv)
basic_remote.turn_on()
basic_remote.set_volume(50)

advanced_remote = AdvancedRemote(radio)
advanced_remote.turn_on()
advanced_remote.set_volume(75)
advanced_remote.mute()
```

**桥接 vs 适配器**：
- **桥接**：分离抽象和实现，在设计时使用
- **适配器**：连接不兼容的接口，在后期维护时使用

### 2.2 组合模式 (Composite)

**问题**：将对象组合成树形结构来表示"部分-整体"层次结构。

```python
from abc import ABC, abstractmethod
from typing import List

class Component(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def operation(self):
        pass

    @abstractmethod
    def add(self, component: 'Component'):
        pass

    @abstractmethod
    def remove(self, component: 'Component'):
        pass

    @abstractmethod
    def is_composite(self) -> bool:
        pass

class Leaf(Component):
    def operation(self):
        return f"Leaf {self.name}"

    def add(self, component: Component):
        raise NotImplementedError("Cannot add to leaf")

    def remove(self, component: Component):
        raise NotImplementedError("Cannot remove from leaf")

    def is_composite(self) -> bool:
        return False

class Composite(Component):
    def __init__(self, name: str):
        super().__init__(name)
        self.children: List[Component] = []

    def add(self, component: Component):
        self.children.append(component)

    def remove(self, component: Component):
        self.children.remove(component)

    def is_composite(self) -> bool:
        return True

    def operation(self):
        results = [f"Composite {self.name}"]
        for child in self.children:
            results.append(f"  {child.operation()}")
        return "\n".join(results)

# 使用 - 构建文件系统
root = Composite("root")
home = Composite("home")
user = Composite("user")

file1 = Leaf("file1.txt")
file2 = Leaf("file2.txt")
file3 = Leaf("file3.txt")

root.add(home)
home.add(user)
user.add(file1)
user.add(file2)
home.add(file3)

print(root.operation())
# Composite root
#   Composite home
#     Composite user
#       Leaf file1.txt
#       Leaf file2.txt
#     Leaf file3.txt
```

### 2.3 外观模式 (Facade)

**问题**：为子系统中的一组接口提供统一的高层接口。

```python
class SubsystemA:
    def operation_a(self):
        return "SubsystemA: Operation A\n"

class SubsystemB:
    def operation_b(self):
        return "SubsystemB: Operation B\n"

class SubsystemC:
    def operation_c(self):
        return "SubsystemC: Operation C\n"

# 外观类
class Facade:
    def __init__(self):
        self.subsystem_a = SubsystemA()
        self.subsystem_b = SubsystemB()
        self.subsystem_c = SubsystemC()

    def operation(self):
        results = []
        results.append("Facade initializes subsystems:")
        results.append(self.subsystem_a.operation_a())
        results.append(self.subsystem_b.operation_b())
        results.append(self.subsystem_c.operation_c())
        results.append("Facade orders subsystems to perform the action:")
        return "".join(results)

# 使用
facade = Facade()
print(facade.operation())
```

**实际应用**：
- 库的 API 入口
- 复杂系统的简化接口
- 遗留代码的现代化包装

### 2.4 享元模式 (Flyweight)

**问题**：通过共享对象来最小化内存使用或计算开销。

```python
from typing import Dict

class TreeType:
    def __init__(self, name: str, color: str, texture: str):
        self.name = name
        self.color = color
        self.texture = texture

    def draw(self, x: int, y: int):
        print(f"Drawing {self.name} tree at ({x}, {y}) with color {self.color}")

class TreeFactory:
    _tree_types: Dict[str, TreeType] = {}

    @classmethod
    def get_tree_type(cls, name: str, color: str, texture: str) -> TreeType:
        key = (name, color, texture)
        if key not in cls._tree_types:
            cls._tree_types[key] = TreeType(name, color, texture)
        return cls._tree_types[key]

class Tree:
    def __init__(self, x: int, y: int, tree_type: TreeType):
        self.x = x
        self.y = y
        self.tree_type = tree_type

    def draw(self):
        self.tree_type.draw(self.x, self.y)

class Forest:
    def __init__(self):
        self.trees = []

    def plant_tree(self, x: int, y: int, name: str, color: str, texture: str):
        tree_type = TreeFactory.get_tree_type(name, color, texture)
        self.trees.append(Tree(x, y, tree_type))

    def draw(self):
        for tree in self.trees:
            tree.draw()

# 使用
forest = Forest()
forest.plant_tree(1, 2, "Oak", "Green", "Rough")
forest.plant_tree(3, 4, "Oak", "Green", "Rough")  # 重用相同的 TreeType
forest.plant_tree(5, 6, "Pine", "Dark Green", "Smooth")
forest.draw()
```

## 3. 行为型模式深度解析

### 3.1 模板方法模式 (Template Method)

**问题**：在基类中定义算法框架，将某些步骤延迟到子类。

```python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    # 模板方法 - 定义算法骨架
    def process(self):
        self.read_data()
        if self.validate_data():
            self.transform_data()
            self.save_data()
            return True
        return False

    def read_data(self):
        print("Reading data from source...")

    @abstractmethod
    def validate_data(self) -> bool:
        pass

    @abstractmethod
    def transform_data(self):
        pass

    def save_data(self):
        print("Saving processed data...")

class CSVProcessor(DataProcessor):
    def validate_data(self) -> bool:
        print("Validating CSV format...")
        return True

    def transform_data(self):
        print("Transforming CSV data...")

class JSONProcessor(DataProcessor):
    def validate_data(self) -> bool:
        print("Validating JSON schema...")
        return True

    def transform_data(self):
        print("Transforming JSON data...")

class XMLProcessor(DataProcessor):
    def validate_data(self) -> bool:
        print("Validating XML structure...")
        return False  # 验证失败

    def transform_data(self):
        print("This won't be called if validation fails")

# 使用
print("Processing CSV:")
csv_processor = CSVProcessor()
csv_processor.process()

print("\nProcessing XML:")
xml_processor = XMLProcessor()
xml_processor.process()  # transform_data 不会被调用
```

**钩子方法（Hook）**：

```python
class DataProcessorWithHook(DataProcessor):
    def transform_data(self):
        print("Default transformation...")

    # 钩子方法 - 子类可选择覆盖
    def custom_operation(self):
        print("Custom operation (optional)")

    def process(self):
        super().process()
        self.custom_operation()  # 可选步骤
```

### 3.2 责任链模式 (Chain of Responsibility)

**问题**：将请求沿着处理链传递，直到有对象处理它。

```python
from abc import ABC, abstractmethod
from typing import Optional

class Handler(ABC):
    def __init__(self):
        self._next_handler: Optional['Handler'] = None

    def set_next(self, handler: 'Handler') -> 'Handler':
        self._next_handler = handler
        return handler  # 返回 handler 便于链式调用

    @abstractmethod
    def handle(self, request: str) -> str:
        if self._next_handler:
            return self._next_handler.handle(request)
        return ""

class MonkeyHandler(Handler):
    def handle(self, request: str) -> str:
        if request == "Banana":
            return f"Monkey: I'll eat the {request}"
        else:
            return super().handle(request)

class SquirrelHandler(Handler):
    def handle(self, request: str) -> str:
        if request == "Nut":
            return f"Squirrel: I'll eat the {request}"
        else:
            return super().handle(request)

class DogHandler(Handler):
    def handle(self, request: str) -> str:
        if request == "MeatBall":
            return f"Dog: I'll eat the {request}"
        else:
            return super().handle(request)

# 使用
monkey = MonkeyHandler()
squirrel = SquirrelHandler()
dog = DogHandler()

# 构建处理链: Monkey -> Squirrel -> Dog
monkey.set_next(squirrel).set_next(dog)

print(monkey.handle("Nut"))        # Squirrel: I'll eat the Nut
print(monkey.handle("Banana"))     # Monkey: I'll eat the Banana
print(monkey.handle("Coffee"))     # (空字符串，无人处理)
```

**实际应用**：
- 日志处理（DEBUG -> INFO -> WARNING -> ERROR）
- 认证和授权中间件
- 事件处理系统

### 3.3 中介者模式 (Mediator)

**问题**：定义一个对象来封装一系列对象的交互方式。

```python
from abc import ABC, abstractmethod
from typing import List

class Mediator(ABC):
    @abstractmethod
    def notify(self, sender: 'Component', event: str):
        pass

class Component:
    def __init__(self, mediator: Mediator = None):
        self._mediator = mediator

    @property
    def mediator(self) -> Mediator:
        return self._mediator

    @mediator.setter
    def mediator(self, mediator: Mediator):
        self._mediator = mediator

class ConcreteMediator(Mediator):
    def __init__(self):
        self._component1 = None
        self._component2 = None

    def set_component1(self, component: 'Component'):
        self._component1 = component

    def set_component2(self, component: 'Component'):
        self._component2 = component

    def notify(self, sender: Component, event: str):
        if event == "A":
            print("Mediator reacts on A and triggers following operations:")
            self._component2.do_c()
        elif event == "D":
            print("Mediator reacts on D and triggers following operations:")
            self._component1.do_b()
            self._component2.do_c()

class ComponentA(Component):
    def do_a(self):
        print("Component A does A.")
        self.mediator.notify(self, "A")

    def do_b(self):
        print("Component A does B.")

class ComponentB(Component):
    def do_c(self):
        print("Component B does C.")
        self.mediator.notify(self, "D")

    def do_d(self):
        print("Component B does D.")

# 使用
mediator = ConcreteMediator()
component_a = ComponentA(mediator)
component_b = ComponentB(mediator)

mediator.set_component1(component_a)
mediator.set_component2(component_b)

print("Client triggers operation A.")
component_a.do_a()

print("\nClient triggers operation D.")
component_b.do_d()
```

### 3.4 状态模式 (State)

**问题**：允许对象在内部状态改变时改变其行为。

```python
from abc import ABC, abstractmethod

class State(ABC):
    @abstractmethod
    def handle(self):
        pass

class ConcreteStateA(State):
    def handle(self):
        print("State A handling action.")
        return "StateB"

class ConcreteStateB(State):
    def handle(self):
        print("State B handling action.")
        return "StateA"

class Context:
    def __init__(self, initial_state: State):
        self._state = initial_state
        self._transitions = {
            "StateA": ConcreteStateA(),
            "StateB": ConcreteStateB()
        }

    def request(self):
        next_state_name = self._state.handle()
        self._state = self._transitions[next_state_name]

# 使用 - 角色状态机
context = Context(ConcreteStateA())
context.request()  # State A handling -> 切换到 B
context.request()  # State B handling -> 切换到 A
context.request()  # State A handling -> 切换到 B
```

**游戏开发中的状态模式**：

```python
# 角色状态机
class PlayerState(ABC):
    @abstractmethod
    def enter(self, player):
        pass

    @abstractmethod
    def update(self, player):
        pass

    @abstractmethod
    def exit(self, player):
        pass

class IdleState(PlayerState):
    def enter(self, player):
        player.velocity = 0

    def update(self, player):
        if player.input.move:
            player.change_state(WalkState())

    def exit(self, player):
        pass

class WalkState(PlayerState):
    def enter(self, player):
        player.velocity = player.walk_speed

    def update(self, player):
        if player.input.sprint:
            player.change_state(RunState())
        elif not player.input.move:
            player.change_state(IdleState())

    def exit(self, player):
        pass

class RunState(PlayerState):
    def enter(self, player):
        player.velocity = player.run_speed

    def update(self, player):
        if not player.input.sprint:
            player.change_state(WalkState())
        elif not player.input.move:
            player.change_state(IdleState())

    def exit(self, player):
        pass

class Player:
    def __init__(self):
        self.state = IdleState()
        self.velocity = 0
        self.walk_speed = 5
        self.run_speed = 10
        self.input = type('Input', (), {'move': False, 'sprint': False})()

    def change_state(self, new_state: PlayerState):
        self.state.exit(self)
        self.state = new_state
        self.state.enter(self)

    def update(self):
        self.state.update(self)
```

### 3.5 访问者模式 (Visitor)

**问题**：在不改变各元素类的前提下定义作用于这些元素的新操作。

```python
from abc import ABC, abstractmethod

class Visitor(ABC):
    @abstractmethod
    def visit_concrete_element_a(self, element: 'ConcreteElementA'):
        pass

    @abstractmethod
    def visit_concrete_element_b(self, element: 'ConcreteElementB'):
        pass

class Element(ABC):
    @abstractmethod
    def accept(self, visitor: Visitor):
        pass

class ConcreteElementA(Element):
    def accept(self, visitor: Visitor):
        visitor.visit_concrete_element_a(self)

    def operation_a(self):
        return "ConcreteElementA operation"

class ConcreteElementB(Element):
    def accept(self, visitor: Visitor):
        visitor.visit_concrete_element_b(self)

    def operation_b(self):
        return "ConcreteElementB operation"

class ConcreteVisitor1(Visitor):
    def visit_concrete_element_a(self, element: ConcreteElementA):
        print(f"{element.operation_a()} + Visitor1")

    def visit_concrete_element_b(self, element: ConcreteElementB):
        print(f"{element.operation_b()} + Visitor1")

class ConcreteVisitor2(Visitor):
    def visit_concrete_element_a(self, element: ConcreteElementA):
        print(f"{element.operation_a()} + Visitor2")

    def visit_concrete_element_b(self, element: ConcreteElementB):
        print(f"{element.operation_b()} + Visitor2")

# 使用
elements = [ConcreteElementA(), ConcreteElementB()]

visitor1 = ConcreteVisitor1()
for element in elements:
    element.accept(visitor1)

visitor2 = ConcreteVisitor2()
for element in elements:
    element.accept(visitor2)
```

**访问者模式优缺点**：
- ✅ 符合开闭原则（增加新操作）
- ✅ 将相关行为集中到访问者类
- ❌ 增加新的元素类困难
- ❌ 依赖元素内部细节

## 4. 设计模式组合应用

### 4.1 MVC 架构中的模式组合

```
Model-View-Controller 使用多种模式：
├── 观察者模式：View 观察 Model 的变化
├── 策略模式：Controller 可以替换不同的控制策略
├── 组合模式：View 树形结构
└── 命令模式：用户操作封装为命令对象
```

### 4.2 游戏引擎中的模式组合

```python
# 实体组件系统 (ECS) 使用组合模式
class Entity:
    def __init__(self, name):
        self.name = name
        self.components = []

    def add_component(self, component):
        self.components.append(component)

    def get_component(self, component_type):
        for comp in self.components:
            if isinstance(comp, component_type):
                return comp
        return None

# 命令模式用于输入处理
class InputCommand(ABC):
    @abstractmethod
    def execute(self, entity):
        pass

class MoveCommand(InputCommand):
    def __init__(self, direction):
        self.direction = direction

    def execute(self, entity):
        transform = entity.get_component(Transform)
        if transform:
            transform.position += self.direction

# 状态模式用于实体状态
class EntityState(ABC):
    @abstractmethod
    def update(self, entity, dt):
        pass

class ActiveState(EntityState):
    def update(self, entity, dt):
        # 更新逻辑
        pass
```

## 5. 反模式和误用

### 5.1 过度使用设计模式

**问题**：为了使用模式而使用模式

```python
# ❌ 过度设计 - 简单的打印功能使用工厂+策略+装饰器
class PrinterFactory:
    def create_printer(self):
        return ConsolePrinter()

class PrintStrategy(ABC):
    @abstractmethod
    def print(self, text):
        pass

class ConsolePrinter(PrintStrategy):
    def print(self, text):
        print(text)

class PrinterDecorator(PrintStrategy):
    def __init__(self, printer):
        self.printer = printer

    def print(self, text):
        self.printer.print(text)

# ✅ 简单直接
def print_text(text):
    print(text)
```

### 5.2 滥用单例模式

**问题**：全局状态导致测试困难

```python
# ❌ 全局单例
class Database:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.connection = connect_to_db()
        return cls._instance

# 测试时无法隔离数据库

# ✅ 使用依赖注入
class Database:
    def __init__(self, connection):
        self.connection = connection

# 测试时可以注入 mock 连接
```

### 5.3 过早抽象

**问题**：在只有一个实现时就创建接口

```python
# ❌ 过早抽象
class PaymentProcessor(ABC):
    @abstractmethod
    def process(self, amount):
        pass

class StripePaymentProcessor(PaymentProcessor):
    def process(self, amount):
        # Stripe 实现
        pass

# ✅ 等到需要第二个实现时再抽象
class StripePaymentProcessor:
    def process(self, amount):
        # Stripe 实现
        pass

# 当需要 PayPal 时，再创建接口
```

## 6. 设计模式选择指南

### 决策树

```
创建对象时遇到困难？
├── 需要独立于创建过程 → 工厂方法/抽象工厂
├── 需要多种表示方式 → 建造者
├── 通过克隆更高效 → 原型
└── 只需要一个实例 → 单例（慎用）

结构需要灵活？
├── 接口不兼容 → 适配器
├── 分离抽象和实现 → 桥接
├── 构建树形结构 → 组合
├── 动态添加职责 → 装饰器
├── 简化复杂接口 → 外观
└── 需要控制访问 → 代理

行为需要变化？
├── 选择算法 → 策略
├── 通知变化 → 观察者
├── 封装请求 → 命令
├── 定义算法骨架 → 模板方法
├── 传递请求 → 责任链
├── 复杂交互 → 中介者
└── 状态依赖行为 → 状态
```

## 7. 学习资源

### 经典书籍
1. **《设计模式：可复用面向对象软件的基础》** - GoF
2. **《Head First 设计模式》** - Freeman
3. **《游戏编程模式》** - Robert Nystrom

### 在线资源
- [Refactoring.Guru](https://refactoring.guru/) - 全面设计模式参考
- [Source Making](https://sourcemaking.com/) - 设计模式和重构
- [Game Programming Patterns](https://gameprogrammingpatterns.com/) - 游戏开发模式

---

**下一步**：[代码重构指南](./refactoring.md)
