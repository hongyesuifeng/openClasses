# 技术原理：游戏引擎核心基础

> 在阅读 Godot 引擎核心源码之前，先理解对象模型、反射系统、动态类型、内存管理、事件驱动架构和容器数据结构背后的计算机科学原理。

---

## 目录

- [1. 对象模型与反射系统](#1-对象模型与反射系统)
- [2. 动态类型系统原理](#2-动态类型系统原理)
- [3. 内存管理策略](#3-内存管理策略)
- [4. 事件驱动架构](#4-事件驱动架构)
- [5. 容器与数据结构](#5-容器与数据结构)

---

## 1. 对象模型与反射系统

### 为什么游戏引擎需要反射

游戏引擎面临一个其他领域少有的挑战：**运行时需要知道自身代码的结构**。

具体场景包括：

| 场景 | 没有反射 | 有反射 |
|------|---------|--------|
| 编辑器属性面板 | 手写每个属性的 UI 代码 | 自动扫描类属性生成面板 |
| 序列化/反序列化 | 为每个类手写 save/load | 通用序列化器遍历属性 |
| 脚本调用 C++ 方法 | 为每个方法写绑定代码 | 自动暴露方法给脚本 |
| 信号连接 | 手动编写回调绑定 | 字符串名查找并连接 |

反射（Reflection）让程序在运行时能够：
- 查询一个类有哪些属性、方法、信号
- 通过字符串名调用方法或访问属性
- 动态创建对象实例
- 检查类型继承关系

### 引擎反射方案对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    三大引擎反射方案对比                           │
├──────────┬─────────────────┬─────────────────┬─────────────────┤
│ 特性     │ Godot           │ Unity           │ Cocos Creator   │
├──────────┼─────────────────┼─────────────────┼─────────────────┤
│ 实现方式 │ 宏 + ClassDB    │ C# 反射 + IL    │ TypeScript      │
│          │ 手动注册        │ 自动提取        │ 装饰器 + 元数据  │
│ 注册时机 │ _bind_methods() │ 编译时自动      │ 装饰器执行时     │
│ 性能     │ 高（查表）      │ 中（C# 反射慢） │ 中（JS 开销）    │
│ 类型安全 │ 运行时检查      │ 编译时 + 运行时 │ TypeScript 层面  │
└──────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Godot 的反射设计：ClassDB

Godot 选择了**显式注册**的方式。每个类通过 `ClassDB` 手动注册其方法、属性和信号：

```
注册流程：

GDCLASS(MyClass, Parent)
       │
       ▼
static void _bind_methods() {
    ClassDB::bind_method(D_METHOD("my_func", "arg"), &MyClass::my_func);
    ADD_PROPERTY(PropertyInfo(Variant::INT, "my_prop"), "set_my_prop", "get_my_prop");
    ADD_SIGNAL(MethodInfo("my_signal", PropertyInfo(Variant::STRING, "data")));
}
       │
       ▼
ClassDB 内部数据结构：
┌──────────────────────────────────────────────┐
│ class_list: HashMap<StringName, ClassInfo>   │
│                                              │
│  "MyClass" → {                               │
│    method_map: { "my_func": MethodBind* }    │
│    property_list: [ PropertyInfo{...} ]      │
│    signal_map: { "my_signal": MethodInfo{} } │
│    parent_class: "Parent"                    │
│  }                                           │
└──────────────────────────────────────────────┘
```

这种设计的优势：
1. **编译时代价为零**——反射数据只在启动时构建
2. **运行时效率高**——直接查 HashMap，无需复杂的元编程
3. **完全可控**——开发者精确决定暴露什么

### GDCLASS 宏的必要性

C++ 本身不支持反射。Godot 通过宏在每个类中注入模板代码：

```cpp
// GDCLASS(MyClass, Object) 展开后大致为：
class MyClass : public Object {
    // 添加一个静态成员，用于类型检查
    static void _bind_methods();

public:
    // 虚函数：返回是否为某类的实例
    bool _is_class(const String &p_class) const override {
        return p_class == "MyClass" || Object::_is_class(p_class);
    }

    // 静态获取类名
    static _ClassTags get_class_static() {
        return { "MyClass" };
    }

    // 虚函数：获取运行时类名
    String get_class() const override { return "MyClass"; }
    String get_parent_class() const override { return "Object"; }

    // 支持 static_cast 风格的类型转换
    static bool _get_class_cv() const { return true; }
};
```

### GDVIRTUAL 宏：可被脚本覆盖的虚函数

```
C++ 层定义虚函数:
    GDVIRTUAL1R(bool, has_point, Vector2)

GDScript 层覆盖:
    func has_point(point):
        return point.x > 0

调用流程:
    ┌──────────────┐
    │ C++ 调用      │
    │ has_point()  │
    └──────┬───────┘
           ▼
    GDVIRTUAL_CALL(has_point, point, result)
           │
           ├── 脚本有覆盖？──→ 调用 GDScript 方法
           │
           └── 脚本未覆盖？──→ 调用 C++ 默认实现（_has_point）
```

---

## 2. 动态类型系统原理

### 为什么引擎需要动态类型

游戏引擎的底层是 C++（强类型、编译型），但脚本层（GDScript、C#）是动态类型的。两者之间需要一个**类型桥梁**：

```
C++ 层 (强类型)                    GDScript 层 (动态类型)
┌─────────────────────┐           ┌─────────────────────┐
│ int x = 42;         │           │ var x = 42          │
│ String s = "hello"; │  ←桥接→  │ x = "hello"         │
│ Vector2 v(1,2);     │           │ x = Vector2(1, 2)   │
│ Object* obj;        │           │ x = Node.new()      │
└─────────────────────┘           └─────────────────────┘
                      │
              ┌───────┴────────┐
              │    Variant     │
              │  统一类型容器   │
              └────────────────┘
```

### 标签联合体（Tagged Union）

实现动态类型的经典方式是**标签联合体**：

```
┌────────────────────────────────────────────────┐
│              Variant 内存布局                    │
│                                                │
│  ┌──────────────────┐                          │
│  │ type: Type (枚举) │  ← 类型标签 (4 bytes)   │
│  │  NIL = 0         │                          │
│  │  BOOL = 1        │                          │
│  │  INT = 2         │                          │
│  │  FLOAT = 3       │                          │
│  │  STRING = 4      │                          │
│  │  VECTOR2 = 5     │                          │
│  │  ...             │                          │
│  └──────────────────┘                          │
│  ┌──────────────────┐                          │
│  │   _data (联合体)  │  ← 数据存储              │
│  │                  │                          │
│  │  union {         │                          │
│  │    bool _bool;   │  1 byte                  │
│  │    int64_t _int; │  8 bytes                 │
│  │    double _float;│  8 bytes                 │
│  │    Object* _obj; │  8 bytes (指针)          │
│  │    // 较大类型    │                          │
│  │    // 如 String,  │                          │
│  │    // Vector2 等  │                          │
│  │    // 通过布局    │                          │
│  │    // 直接存于    │                          │
│  │    // _data 中    │                          │
│  │  };              │                          │
│  └──────────────────┘                          │
│                                                │
│  总大小：约 24-40 bytes (取决于平台和配置)       │
└────────────────────────────────────────────────┘
```

### Variant 在引擎中的角色

```
┌─────────────────────────────────────────────────────────┐
│                  Variant 的三大角色                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 脚本桥梁                                            │
│     GDScript var → Variant → C++ 类型                   │
│     C++ 返回值 → Variant → GDScript var                 │
│                                                         │
│  2. 通用参数传递                                        │
│     ClassDB::bind_method 参数和返回值都是 Variant        │
│     Signal 发射参数是 Variant 数组                       │
│                                                         │
│  3. 序列化格式                                          │
│     JSON/ConfigFile 的值类型就是 Variant                 │
│     编辑器属性面板的所有值都是 Variant                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 性能考量

| 特性 | 影响 |
|------|------|
| 每个 Variant 24-40 bytes | 比 int64_t 大 3-5 倍 |
| 栈上分配 | 避免堆分配，但占用栈空间 |
| 类型检查在运行时 | 比模板慢，但有编译器优化 |
| 隐式类型转换 | Variant 提供完整的类型转换矩阵 |
| 数学运算有分支 | `a + b` 需要先检查类型再执行运算 |

> 源码位置：`core/variant/variant.h` — Variant 定义；`core/variant/variant_op.h` — 运算符实现。

---

## 3. 内存管理策略

### C++ 内存管理的基本问题

C++ 没有自动垃圾回收。Godot 需要自行管理对象的生命周期：

```
内存区域：

┌──────────────────────────────────────────────────┐
│ Stack（栈）                                       │
│  - 编译时确定大小                                  │
│  - 自动释放（RAII）                               │
│  - 速度快                                         │
│  - 容量有限（通常 1-8 MB）                         │
│                                                  │
│  适用：局部变量、小型值类型                         │
│  Godot 中：Variant、Vector2、StringName           │
├──────────────────────────────────────────────────┤
│ Heap（堆）                                        │
│  - 运行时动态分配                                  │
│  - 必须手动释放                                    │
│  - 速度较慢                                       │
│  - 容量大                                         │
│                                                  │
│  适用：大对象、生命周期不确定的对象                  │
│  Godot 中：Object、Node、Resource                 │
└──────────────────────────────────────────────────┘
```

### RAII（Resource Acquisition Is Initialization）

Godot 大量使用 RAII 模式：资源的获取和释放在对象的生命周期内自动管理。

```
RAII 原理：

构造函数中获取资源  →  使用资源  →  析构函数中释放资源
     │                              │
     ▼                              ▼
 Ref<T>::Ref(obj)              Ref<T>::~Ref()
   → ref_count++                 → ref_count--
                                  → if (ref_count == 0) memdelete
```

### 引用计数（Reference Counting）

Godot 对需要共享所有权的对象使用引用计数：

```
引用计数工作原理：

  Ref<Resource> a = memnew(Resource);   // ref_count = 1
  Ref<Resource> b = a;                  // ref_count = 2
  Ref<Resource> c = a;                  // ref_count = 3

  a.unref();   // ref_count = 2 (对象仍存活)
  b.unref();   // ref_count = 1 (对象仍存活)
  c.unref();   // ref_count = 0 → 调用 memdelete 销毁对象

  关键保证：
  ┌─────────────────────────────────────────┐
  │ 引用计数降至 0 时，自动销毁对象           │
  │ 引用计数操作是原子的（线程安全）          │
  │ 避免了悬空指针和内存泄漏                  │
  └─────────────────────────────────────────┘
```

### SafeRefCount：线程安全的引用计数

```
SafeRefCount 内部实现（简化）：

  class SafeRefCount {
      // 原子整数
      std::atomic<int> count;

      // 原子递增
      bool ref() {
          return count.fetch_add(1, memory_order_relaxed) >= 0;
      }

      // 原子递减，返回是否为 0
      bool unref() {
          int old = count.fetch_sub(1, memory_order_acq_rel);
          return old == 1;  // 递减前为 1，递减后为 0
      }
  };

  线程安全保证：
  Thread A: ref()  → count 0→1  ✓
  Thread B: ref()  → count 1→2  ✓
  Thread A: unref() → count 2→1  (不销毁)
  Thread B: unref() → count 1→0  (销毁) ✓
```

### Object vs RefCounted 生命周期管理

```
┌─────────────────────────────────────────────────────────────┐
│              Godot 对象生命周期管理策略                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Object (手动管理)                                           │
│  ├── 通过 memnew 创建                                       │
│  ├── 通过 memdelete 销毁                                    │
│  ├── 也可以调用 ->queue_free() 延迟销毁（Node）              │
│  └── 适用于：Node、场景树中的对象                            │
│                                                             │
│  RefCounted (自动管理)                                       │
│  ├── 通过 Ref<T> 智能指针持有                               │
│  ├── 引用计数归零时自动销毁                                  │
│  ├── 不要对 RefCounted 对象调用 memdelete                    │
│  └── 适用于：Resource、Texture、Material 等共享资源          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### memnew / memdelete 宏

Godot 封装了 C++ 的 `new`/`delete`：

```cpp
// memnew 展开大致为：
#define memnew(m_class) \
    new (Memory::alloc_static(sizeof(m_class), false)) m_class

// 带自定义初始化：
#define memnew_placement(m_placement, m_class) \
    new (m_placement) m_class

// memdelete:
#define memdelete(m_obj) \
    { if (m_obj) { m_obj->~Object(); Memory::free_static(m_obj, false); } }
```

这些宏让 Godot 可以在全局层面追踪内存分配，用于调试和统计。

> 源码位置：`core/object/ref_counted.h` — RefCounted；`core/templates/safe_refcount.h` — SafeRefCount；`core/os/memory.h` — memnew/memdelete。

---

## 4. 事件驱动架构

### 观察者模式（Observer Pattern）

事件驱动架构的核心是观察者模式：

```
┌─────────────┐       通知        ┌──────────────────┐
│   Subject   │ ───────────────► │  Observer A      │
│   (信号源)   │                  │  (订阅者 A)      │
└─────────────┘                  ├──────────────────┤
       │                          │  Observer B      │
       │   遍历连接列表            │  (订阅者 B)      │
       └─────────────────────────►├──────────────────┤
                                  │  Observer C      │
                                  │  (订阅者 C)      │
                                  └──────────────────┘
```

### Godot 信号系统的设计

Godot 的信号系统比传统的观察者模式更加灵活：

```
信号连接模型：

  emitter.connect("signal_name", target, "method_name")
       │              │                │          │
       ▼              ▼                ▼          ▼
    Object*      StringName        Object*    StringName
     (源)        (信号名)          (目标)    (方法名)

  存储为：
  emitter.signal_map["signal_name"].connections = [
      Connection{ target, Callable(target, "method_name"), flags }
  ]
```

### 延迟调用：MessageQueue

游戏引擎中常见的问题：**在事件回调中修改正在被遍历的数据结构**。

```
问题场景：
  遍历节点树 ──→ 触发信号 ──→ 回调中删除节点 ──→ 迭代器失效！💥

解决方案：MessageQueue（延迟调用）

  ┌──────────────────────────────┐
  │         游戏帧循环            │
  │                              │
  │  1. 处理输入                  │
  │  2. 处理物理                  │
  │  3. 处理脚本                  │
  │  4. 处理信号                  │  ← 信号回调中调用 call_deferred
  │  5. 处理 MessageQueue ←──────│  ← 在安全的时机执行延迟调用
  │  6. 渲染                     │
  └──────────────────────────────┘

  call_deferred("queue_free")  →  不立即删除，排入 MessageQueue
                                →  在帧末尾安全时机执行删除
```

### Connection Flags

Godot 信号支持多种连接模式：

| 标志 | 说明 |
|------|------|
| `CONNECT_DEFERRED` | 延迟到帧末尾通过 MessageQueue 调用 |
| `CONNECT_ONE_SHOT` | 触发一次后自动断开连接 |
| `CONNECT_PERSIST` | 连接在序列化时保存（场景文件中） |
| `CONNECT_REFERENCE_COUNTED` | 连接本身被引用计数管理 |

### Callable：统一的回调封装

```
Callable 可以表示多种回调形式：

┌────────────────────────────────────────────────────┐
│                    Callable                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. 对象方法调用                                    │
│     Callable(obj, "method_name")                   │
│     → 保存 Object* + StringName                    │
│     → 调用时通过 ClassDB 查找并执行方法              │
│                                                    │
│  2. 绑定参数的 Callable                             │
│     callable.bind(arg1, arg2)                      │
│     → 返回新 Callable，附带预设参数                  │
│                                                    │
│  3. 自定义 Callable (CallableCustom)                │
│     → 可包装任意 C++ lambda / 函数对象              │
│     → 引擎内部大量使用                              │
│                                                    │
└────────────────────────────────────────────────────┘
```

> 源码位置：`core/object/object.h` — signal_map；`core/variant/callable.h` — Callable；`core/object/message_queue.h` — MessageQueue。

---

## 5. 容器与数据结构

### Copy-on-Write (COW) 模式

COW 是一种延迟复制的优化策略：

```
COW 原理：

  Vector<int> a = {1, 2, 3};
  Vector<int> b = a;   // 不复制数据！共享同一块内存

  ┌─────────┐     ┌─────────────────┐
  │ a ──────┼────►│ data: [1, 2, 3] │ ← ref_count = 2
  │ b ──────┼────►│                 │
  └─────────┘     └─────────────────┘

  b.write[0] = 99;   // 此时才复制！写操作触发 COW

  ┌─────────┐     ┌─────────────────┐
  │ a ──────┼────►│ data: [1, 2, 3] │ ← ref_count = 1
  └─────────┘     └─────────────────┘
  ┌─────────┐     ┌─────────────────┐
  │ b ──────┼────►│ data: [99,2, 3] │ ← ref_count = 1
  └─────────┘     └─────────────────┘

  优势：
    - 赋值和传参零拷贝
    - 只读共享极其高效
    - 写操作才付出拷贝代价

  注意：
    - 必须通过 .write[] 写入（触发 COW）
    - 直接 [] 是只读的
```

### Robin Hood 哈希

Godot 的 HashMap 使用 Robin Hood 哈希算法，它解决了传统开放寻址哈希的一个关键问题——**查询时间不均匀**：

```
传统开放寻址的问题：
  插入顺序: hash(A)=0, hash(B)=0, hash(C)=0
  ┌───┬───┬───┬───┬───┬───┬───┬───┐
  │ A │ B │ C │   │   │   │   │   │
  └───┴───┴───┴───┴───┴───┴───┴───┘
  查找 A: 1 次比较 ✓
  查找 B: 2 次比较 (先碰 A，再找到 B)
  查找 C: 3 次比较 (先碰 A，再碰 B，再找到 C)
  → 不公平！某些元素查找很慢

Robin Hood 的解决方案：
  让每个元素到其理想位置的距离(DIB)尽量均匀
  插入时，如果新元素的 DIB > 已有元素的 DIB，就"抢"位置

  插入 C(hash=0) 时：
  ┌───┬───┬───┬───┬───┬───┬───┬───┐
  │ A │ C │ B │   │   │   │   │   │
  └───┴───┴───┴───┴───┴───┴───┴───┘
  A 的 DIB = 0 (在理想位置)
  C 的 DIB = 1 (偏移1位，抢了 B 的位置)
  B 的 DIB = 1 (被挤到下一位)
  → 所有元素的 DIB 接近，查询时间均匀

  查询时：如果当前元素的 DIB < 我们要找的 DIB → 停止查找
  → 最坏情况显著改善
```

### 容器选型指南

| 容器 | 底层结构 | 适用场景 | 不适用场景 |
|------|---------|---------|-----------|
| `Vector<T>` | 动态数组 + COW | 需要频繁复制/传参的数组 | 频繁随机插入/删除 |
| `LocalVector<T>` | 动态数组（无COW） | 局部临时数组，不需要复制 | 需要跨函数共享 |
| `HashMap<K,V>` | Robin Hood 哈希 | 键值查找，O(1) 均摊 | 需要有序遍历 |
| `List<T>` | 双向链表 | 频繁在中间插入/删除 | 随机访问 |
| `RBSet<T>` | 红黑树 | 有序集合，范围查询 | 仅需简单查找 |
| `VMap<K,V>` | 排序向量 | 小量键值对（< 50 个） | 大量数据 |

### 性能对比

```
操作时间复杂度对比：

  操作          Vector   LocalVector  HashMap   List    RBSet
  ────────────────────────────────────────────────────────────
  随机访问      O(1)     O(1)        O(1)*     O(n)    O(log n)
  尾部插入      O(1)摊   O(1)摊      N/A       O(1)    N/A
  头部插入      O(n)     O(n)        N/A       O(1)    N/A
  中间插入      O(n)     O(n)        N/A       O(1)**  N/A
  查找元素      O(n)     O(n)        O(1)摊    O(n)    O(log n)
  有序遍历      ✓        ✓           ✗         ✗       ✓
  复制开销      低(COW)  全量复制     全量复制   全量复制 全量复制

  * 哈希冲突时退化为 O(n)
  ** 需已知节点位置
```

> 源码位置：`core/templates/vector.h`、`core/templates/local_vector.h`、`core/templates/hash_map.h`、`core/templates/list.h`、`core/templates/rb_set.h`。

---

## 延伸阅读

- [Game Engine Architecture, 3rd Edition](https://www.gameenginebook.com/) — Jason Gregory
- [Robin Hood Hashing](https://cs.uwaterloo.ca/research/tr/1986/CS-86-14.pdf) — 原始论文
- [Copy-on-Write in C++](https://en.cppreference.com/w/cpp/concepts) — COW 模式参考
- [Observer Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/observer.html)
- Godot 源码仓库：[https://github.com/godotengine/godot](https://github.com/godotengine/godot)

---

> 理解了这些原理后，继续阅读 [01-对象模型与 ClassDB](./01-object-model.md) 查看 Godot 的具体实现。
