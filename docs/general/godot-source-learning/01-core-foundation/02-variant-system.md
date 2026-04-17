# Variant 动态类型系统

> Variant 是 Godot 引擎中 C++ 与脚本语言之间的类型桥梁。它使用标签联合体（Tagged Union）实现高效的动态类型，使得 GDScript 的 `var` 可以持有任意类型的值，同时保持可接受的性能开销。

---

## 目录

- [Variant::Type 枚举](#varianttype-枚举)
- [内部存储：标签联合体](#内部存储标签联合体)
- [类型转换与强制转换](#类型转换与强制转换)
- [Variant 运算符](#variant-运算符)
- [Callable 和 Signal 作为 Variant](#callable-和-signal-作为-variant)
- [性能特征](#性能特征)
- [Variant 如何桥接 C++ 与 GDScript](#variant-如何桥接-c-与-gdscript)
- [源码分析](#源码分析)

---

## Variant::Type 枚举

Variant 定义了 Godot 引擎支持的所有运行时类型，共计 30+ 种：

```cpp
// core/variant/variant.h
enum Type {
    NIL = 0,          // null

    // 基础类型
    BOOL,             // bool
    INT,              // int64_t
    FLOAT,            // double
    STRING,           // String

    // 数学类型
    VECTOR2,          // Vector2 (x, y)
    VECTOR2I,         // Vector2i (x, y) — 整数
    RECT2,            // Rect2 (position, size)
    RECT2I,           // Rect2i — 整数版
    VECTOR3,          // Vector3 (x, y, z)
    VECTOR3I,         // Vector3i — 整数版
    TRANSFORM2D,      // Transform2D (3x3 矩阵)
    VECTOR4,          // Vector4 (x, y, z, w)
    VECTOR4I,         // Vector4i — 整数版
    PLANE,            // Plane (normal, d)
    QUATERNION,       // Quaternion (x, y, z, w)
    AABB,             // AABB (position, size)
    BASIS,            // Basis (3x3 矩阵)
    TRANSFORM3D,      // Transform3D (Basis + origin)

    // 引擎类型
    COLOR,            // Color (r, g, b, a)
    STRING_NAME,      // StringName (驻留字符串)
    NODE_PATH,        // NodePath
    RID,              // RID (资源 ID)
    OBJECT,           // Object* (指针)
    CALLABLE,         // Callable (回调封装)
    SIGNAL,           // Signal (信号引用)
    DICTIONARY,       // Dictionary
    ARRAY,            // Array (Variant 数组)

    // 类型化数组
    PACKED_BYTE_ARRAY,      // PackedByteArray
    PACKED_INT32_ARRAY,     // PackedInt32Array
    PACKED_INT64_ARRAY,     // PackedInt64Array
    PACKED_FLOAT32_ARRAY,   // PackedFloat32Array
    PACKED_FLOAT64_ARRAY,   // PackedFloat64Array
    PACKED_STRING_ARRAY,    // PackedStringArray
    PACKED_VECTOR2_ARRAY,   // PackedVector2Array
    PACKED_VECTOR3_ARRAY,   // PackedVector3Array
    PACKED_COLOR_ARRAY,     // PackedColorArray

    VARIANT_MAX = PACKED_COLOR_ARRAY + 1,
};
```

### 类型分类

```
┌─────────────────────────────────────────────────────────────┐
│                   Variant 类型全景                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  基础类型 (4)                                               │
│  ├── NIL, BOOL, INT, FLOAT, STRING                         │
│  │                                                         │
│  数学类型 (17)                                              │
│  ├── 2D: Vector2, Vector2i, Rect2, Rect2i, Transform2D     │
│  ├── 3D: Vector3, Vector3i, Plane, Quaternion, AABB        │
│  ├── 3D: Basis, Transform3D                                │
│  └── 4D: Vector4, Vector4i                                 │
│                                                             │
│  引擎类型 (9)                                               │
│  ├── 引用: Object, RID                                     │
│  ├── 回调: Callable, Signal                                │
│  ├── 标识: StringName, NodePath                            │
│  └── 容器: Dictionary, Array                               │
│                                                             │
│  类型化数组 (9)                                             │
│  └── PackedXXXArray (紧凑内存布局的批量数据)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 内部存储：标签联合体

Variant 的核心设计是**标签联合体**（Tagged Union）——一个类型标签加上一个数据联合体：

```cpp
// core/variant/variant.h (简化)
class Variant {
    // 类型标签
    Type type = NIL;

    // 数据存储：通过 _data 联合体或直接内嵌存储
    // 对于小类型，直接存在对象内部
    // 对于大类型，存储指针

    union _Data {
        bool _bool;
        int64_t _int;
        double _float;
        // 较大的值类型直接嵌入（非指针）
        // 通过 Placement New 在 Variant 内部构造
        uint8_t _mem[sizeof(void *) == 8 ? 24 : 16]; // 预留空间
        Object *_object;
        // ... 其他类型的指针形式
    } _data;
};
```

### 不同类型的存储策略

```
┌─────────────────────────────────────────────────────────────┐
│              Variant 存储策略分类                              │
├──────────────┬──────────────────┬───────────────────────────┤
│ 类型         │ 存储方式          │ 大小                      │
├──────────────┼──────────────────┼───────────────────────────┤
│ NIL          │ 无数据            │ 0 bytes                   │
│ BOOL         │ 直接值            │ 1 byte (padding to 8)     │
│ INT          │ 直接值            │ 8 bytes (int64_t)         │
│ FLOAT        │ 直接值            │ 8 bytes (double)          │
│ STRING       │ 内嵌对象          │ sizeof(String) ≈ 8 bytes  │
│ VECTOR2      │ 内嵌对象          │ 8 bytes (两个 float)      │
│ VECTOR3      │ 内嵌对象          │ 12 bytes (三个 float)     │
│ COLOR        │ 内嵌对象          │ 16 bytes (四个 float)     │
│ OBJECT       │ 指针              │ 8 bytes (Object*)         │
│ CALLABLE     │ 内嵌对象          │ ~24 bytes                 │
│ SIGNAL       │ 内嵌对象          │ ~16 bytes                 │
│ DICTIONARY   │ 内嵌对象          │ ~8 bytes (内部指针)       │
│ ARRAY        │ 内嵌对象          │ ~8 bytes (内部指针)       │
│ TRANSFORM3D  │ 内嵌对象          │ 48 bytes (12 float)       │
│ PACKED_*     │ 内嵌对象          │ ~8 bytes (CowData 指针)   │
└──────────────┴──────────────────┴───────────────────────────┘
```

### Variant 的构造与析构

```cpp
// Variant 构造不同类型的值
Variant::Variant(int64_t p_int) {
    type = INT;
    _data._int = p_int;
}

Variant::Variant(double p_float) {
    type = FLOAT;
    _data._float = p_float;
}

Variant::Variant(const String &p_string) {
    type = STRING;
    // Placement new: 在 _data._mem 的位置构造 String
    memnew_placement(&_data._mem[0], String(p_string));
}

Variant::Variant(Object *p_object) {
    type = OBJECT;
    _data._object = p_object;
}

// 析构：需要根据类型正确清理
Variant::~Variant() {
    switch (type) {
        case STRING:
            // 手动调用析构函数
            reinterpret_cast<String *>(&_data._mem[0])->~String();
            break;
        case ARRAY:
            reinterpret_cast<Array *>(&_data._mem[0])->~Array();
            break;
        // ... 其他需要析构的类型
        default:
            break;  // 基础类型无需析构
    }
}
```

```
Variant 生命周期：

  构造：
  ┌─────────────────────────────────────┐
  │ type = INT                          │
  │ _data._int = 42                     │
  └─────────────────────────────────────┘
  → 无堆分配，全在栈上

  构造 String 类型：
  ┌─────────────────────────────────────┐
  │ type = STRING                       │
  │ _data._mem 中 placement new String  │
  │   → String 内部可能有堆分配         │
  └─────────────────────────────────────┘
  → Variant 本身在栈上，String 的字符数据在堆上

  析构：
  ┌─────────────────────────────────────┐
  │ switch(type)                        │
  │   STRING → ~String() (手动调用)     │
  │   ARRAY  → ~Array()  (手动调用)     │
  │   INT    → 无需操作                 │
  └─────────────────────────────────────┘
```

---

## 类型转换与强制转换

Variant 提供了完整的类型转换矩阵。任何类型都可以尝试转换为其他类型：

```cpp
// core/variant/variant.cpp (简化)
Variant::operator int64_t() const {
    switch (type) {
        case INT:    return _data._int;
        case FLOAT:  return (int64_t)_data._float;
        case BOOL:   return _data._bool ? 1 : 0;
        case STRING: return ((String *)&_data._mem[0])->to_int();
        default:     return 0;
    }
}

Variant::operator String() const {
    switch (type) {
        case STRING: return *(String *)&_data._mem[0];
        case INT:    return String::num_int64(_data._int);
        case FLOAT:  return String::num(_data._float);
        case BOOL:   return _data._bool ? "true" : "false";
        case NIL:    return "";
        default:     return "<unknown>";
    }
}
```

### 类型转换规则表

```
转换规则（部分）：

  源\目标   INT      FLOAT    STRING    BOOL     VECTOR2
  ──────────────────────────────────────────────────────
  INT      =值      =值      数字字符串  0→false  x=值,y=0
  FLOAT    截断     =值      数字字符串  0→false  x=值,y=0
  STRING   解析整数  解析浮点  =值       非空true  解析"x,y"
  BOOL     0/1      0.0/1.0  "false"/"true" =值   0/1,0/1
  NIL      0        0.0      ""        false    (0,0)
```

### Variant::construct / Variant::evaluate

```cpp
// 从类型和参数构造 Variant
// core/variant/variant.cpp
void Variant::construct(Type p_type, Variant &r_base, const Variant **p_args, int p_argcount) {
    switch (p_type) {
        case VECTOR2:
            if (p_argcount == 2) {
                r_base = Vector2(p_args[0]->operator float(),
                                  p_args[1]->operator float());
            }
            break;
        case COLOR:
            if (p_argcount == 4) {
                r_base = Color(p_args[0]->operator float(),
                               p_args[1]->operator float(),
                               p_args[2]->operator float(),
                               p_args[3]->operator float());
            }
            break;
        // ... 其他类型
    }
}
```

---

## Variant 运算符

Variant 支持完整的运算符集，定义在 `core/variant/variant_op.h` 中：

```cpp
// core/variant/variant_op.h
enum Operator {
    OP_EQUAL,          // ==
    OP_NOT_EQUAL,      // !=
    OP_LESS,           // <
    OP_LESS_EQUAL,     // <=
    OP_GREATER,        // >
    OP_GREATER_EQUAL,  // >=
    OP_ADD,            // +
    OP_SUBTRACT,       // -
    OP_MULTIPLY,       // *
    OP_DIVIDE,         // /
    OP_NEGATE,         // -
    OP_POSITIVE,       // +
    OP_MODULE,         // %
    OP_POWER,          // **
    OP_SHIFT_LEFT,     // <<
    OP_SHIFT_RIGHT,    // >>
    OP_BIT_AND,        // &
    OP_BIT_OR,         // |
    OP_BIT_XOR,        // ^
    OP_BIT_NEGATE,     // ~
    OP_AND,            // and
    OP_OR,             // or
    OP_XOR,            // xor
    OP_NOT,            // not
    OP_IN,             // in
    OP_MAX
};
```

### 运算符执行表

```
Variant::evaluate 为每种 (运算符, 左类型, 右类型) 三元组定义行为：

  ADD 运算符：
  ┌─────────────┬─────────┬──────────┬──────────┬──────────┐
  │ 左\右       │ INT     │ FLOAT    │ STRING   │ VECTOR2  │
  ├─────────────┼─────────┼──────────┼──────────┼──────────┤
  │ INT         │ a + b   │ double   │ 错误     │ (a,0)+(b)│
  │ FLOAT       │ double  │ a + b    │ 错误     │ (a,0)+(b)│
  │ STRING      │ 拼接    │ 拼接     │ 拼接     │ 拼接     │
  │ VECTOR2     │ (a.x+b) │ (a.x+b) │ 错误     │ a + b    │
  │ VECTOR3     │ (a.x+b) │ (a.x+b) │ 错误     │ 错误     │
  │ COLOR       │ 错误    │ 错误     │ 错误     │ 错误     │
  └─────────────┴─────────┴──────────┴──────────┴──────────┘

  MULTIPLY 运算符：
  ┌─────────────┬─────────┬──────────┬──────────┬──────────┐
  │ 左\右       │ INT     │ FLOAT    │ VECTOR2  │ MATRIX   │
  ├─────────────┼─────────┼──────────┼──────────┼──────────┤
  │ INT         │ a * b   │ double   │ 缩放     │ 错误     │
  │ FLOAT       │ double  │ a * b    │ 缩放     │ 错误     │
  │ VECTOR2     │ 缩放    │ 缩放     │ 错误     │ 点乘     │
  │ VECTOR3     │ 缩放    │ 缩放     │ 错误     │ 错误     │
  │ TRANSFORM3D │ 错误    │ 错误     │ 变换     │ 矩阵乘   │
  └─────────────┴─────────┴──────────┴──────────┴──────────┘
```

### 运算符实现机制

```cpp
// core/variant/variant_op.h
// 使用模板和宏生成的巨大 switch-case 表

Variant Variant::evaluate(const Operator &p_op, const Variant &p_a, const Variant &p_b) {
    // 根据 p_a.type 和 p_b.type 分派到具体实现
    // 例如 p_a.type == INT, p_b.type == FLOAT, p_op == OP_ADD:
    //   return (double)p_a._data._int + p_b._data._float;

    // 这个函数是通过宏自动生成的
    // 宏展开为 switch(type_a) { switch(type_b) { switch(op) { ... } } }
    // 覆盖所有类型组合
}
```

---

## Callable 和 Signal 作为 Variant

Callable 和 Signal 是 Variant 中的两种特殊类型，它们让回调和信号可以像值一样传递：

### Callable

```cpp
// core/variant/callable.h (简化)
class Callable {
    ObjectID object;        // 目标对象 ID
    StringName method;      // 方法名
    // 或者自定义 callable
    CallableCustom *custom = nullptr;

    Variant call(const Variant **p_args, int p_argcount, Callable::CallError &r_error);
    Callable bind(const Variant **p_args, int p_argcount); // 返回绑定参数的新 Callable
};
```

```
Callable 作为 Variant 的使用场景：

  # GDScript
  var callback = Callable(self, "on_click")
  var bound = callback.bind(button_id)  # 预绑定参数
  button.connect("pressed", bound)

  # C++ 等价
  Callable cb(this, "on_click");
  Callable bound = cb.bind(button_id);
  button->connect("pressed", bound);
```

### Signal

```cpp
// core/variant/callable.h
struct Signal {
    ObjectID object;
    StringName name;

    // 发射信号
    Error emit(const Variant **p_args, int p_argcount);
    // 连接信号
    Error connect(const Callable &p_callable, uint32_t p_flags = 0);
    // 断开连接
    void disconnect(const Callable &p_callable);
};
```

```
Signal 作为 Variant 允许：

  # GDScript
  var sig = $Button.pressed  # 获取信号引用
  sig.connect(func(): print("clicked"))

  # 信号可以存储、传递、比较
  var signals = [$Button.pressed, $Button.mouse_entered]
```

---

## 性能特征

### 内存占用

```
Variant 大小分析（64 位平台）：

  ┌───────────────────────────────────────────────┐
  │  Type 枚举字段:    4 bytes                    │
  │  _data 联合体:     最大 24 bytes               │
  │  对齐填充:         可能 4 bytes                │
  │  ─────────────────────────────                │
  │  总计:             约 24-32 bytes              │
  │                                               │
  │  对比：                                         │
  │  int64_t:          8 bytes                    │
  │  double:           8 bytes                    │
  │  Object*:          8 bytes                    │
  │  std::any:         通常 32-64 bytes            │
  └───────────────────────────────────────────────┘
```

### 性能对比

| 操作 | Variant 开销 | 原生 C++ | 比值 |
|------|-------------|---------|------|
| 整数加法 | 类型检查 + switch + 计算 | 直接 add | ~5-10x |
| 浮点加法 | 同上 | 直接 add | ~5-10x |
| 方法调用 | 查表 + 参数转换 + 调用 | 直接调用 | ~20-50x |
| 属性访问 | 查表 + 类型检查 | 直接访问 | ~10-30x |
| 构造/析构 | switch + 可能的 placement new | 构造/析构 | ~2-5x |
| 赋值 | 类型检查 + 可能的析构 + 构造 | 直接赋值 | ~3-8x |

### 优化策略

```
Godot 减少 Variant 开销的策略：

  1. 栈分配
     Variant 本身始终在栈上（24-32 bytes）
     避免了 new/delete 的堆分配开销

  2. ptrcall（指针调用）
     对于已知类型的调用，跳过 Variant 包装：
     MethodBind::ptrcall 直接传递 C++ 类型指针
     → 编辑器内部调用大量使用此路径

  3. 紧凑数组
     PackedByteArray 等使用连续内存存储原始数据
     不使用 Variant 包装每个元素
     → 渲染数据传输的关键优化

  4. StringName 驻留
     方法名、属性名使用 StringName（驻留字符串）
     → 比较操作变成指针比较（O(1)）

  5. 内联小类型
     Vector2、Vector3 等直接内嵌在 Variant 中
     不通过指针间接访问
```

---

## Variant 如何桥接 C++ 与 GDScript

### 调用链：从 GDScript 到 C++

```
GDScript 调用 node.get_child_count()
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ 1. GDScript 解释器                                      │
│    解析表达式: node.get_child_count()                    │
│    node → Variant(OBJECT, Node*)                        │
│    "get_child_count" → StringName                       │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Variant::call()                                      │
│    type == OBJECT                                       │
│    → Object::call("get_child_count", args, argc)        │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Object::call()                                       │
│    在 ClassDB 中查找 MethodBind                          │
│    → ClassDB::get_method("Node", "get_child_count")    │
│    → 返回 MethodBind*                                   │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. MethodBind::call()                                   │
│    解包 Variant 参数 → 调用 C++ 方法                     │
│    → ((Node*)obj)->get_child_count()                    │
│    → int result = 3                                     │
│    → 打包为 Variant(INT, 3) 返回                        │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. GDScript 接收返回值                                   │
│    Variant(INT, 3) → GDScript int 3                    │
└─────────────────────────────────────────────────────────┘
```

### 从 C++ 返回值到 GDScript

```cpp
// C++ 方法返回值如何变成 GDScript 值
int Node::get_child_count() const {
    return children.size();  // 返回 int
}

// MethodBind 自动包装返回值
// MethodBindTC<Node, int>::call():
Variant MethodBindTC::call(Object *p_obj, const Variant **p_args, int p_argcount) {
    int ret = (static_cast<Node *>(p_obj)->*method)();
    return Variant(ret);  // int → Variant(INT, value)
}
```

---

## 源码分析

### 关键文件列表

| 文件 | 行数（约） | 说明 |
|------|-----------|------|
| `core/variant/variant.h` | 500+ | Variant 类定义、Type 枚举 |
| `core/variant/variant.cpp` | 3000+ | Variant 实现、类型转换、构造/析构 |
| `core/variant/variant_op.h` | 2000+ | 运算符实现（宏生成） |
| `core/variant/variant_utility.h` | 300+ | Variant 工具函数 |
| `core/variant/callable.h` | 300+ | Callable 类定义 |
| `core/variant/callable.cpp` | 400+ | Callable 实现 |
| `core/variant/dictionary.h` | 200+ | Dictionary 定义 |
| `core/variant/array.h` | 200+ | Array 定义 |

### Variant::clear 实现细节

```cpp
// core/variant/variant.cpp
void Variant::clear() {
    // 根据类型执行不同的清理逻辑
    switch (type) {
        case STRING: {
            String *s = reinterpret_cast<String *>(&_data._mem[0]);
            s->~String();
            break;
        }
        case OBJECT: {
            // 不引用计数（Variant 不拥有 Object）
            _data._object = nullptr;
            break;
        }
        case ARRAY: {
            Array *a = reinterpret_cast<Array *>(&_data._mem[0]);
            a->~Array();
            break;
        }
        case DICTIONARY: {
            Dictionary *d = reinterpret_cast<Dictionary *>(&_data._mem[0]);
            d->~Dictionary();
            break;
        }
        case PACKED_BYTE_ARRAY: {
            PackedByteArray *a = reinterpret_cast<PackedByteArray *>(&_data._mem[0]);
            a->~PackedByteArray();
            break;
        }
        // ... 所有需要析构的类型
        default:
            break;  // 基础类型无需清理
    }
    type = NIL;
}
```

### Variant 的类型注册宏

```cpp
// Godot 使用宏注册 Variant 支持的类型
// core/variant/variant.h

#define VARIANT_ENUM_CLASS(m_class, m_enum)      \
    // 为枚举类型定义 Variant 转换

#define VARIANT_BITFIELD(m_class, m_enum)         \
    // 为位域枚举定义 Variant 转换

// 在 ClassDB 中注册类型构造器
// core/variant/variant.cpp
void register_variant_types() {
    // 为每个 Variant::Type 注册构造信息
    for (int i = 0; i < Variant::VARIANT_MAX; i++) {
        // 构造函数表
        Variant::_construct_funcs[i].construct_func = ...;
        // 属性信息
        Variant::_construct_funcs[i].properties = ...;
    }
}
```

---

## 小结

| 概念 | 要点 |
|------|------|
| Type 枚举 | 30+ 种运行时类型，覆盖基础、数学、引擎和数组类型 |
| 标签联合体 | 类型标签 + union 数据，栈上 24-32 bytes |
| 类型转换 | 任何类型间可转换，通过 switch-case 实现 |
| 运算符 | 完整运算符集，宏生成的类型组合分派表 |
| Callable/Signal | 作为 Variant 类型，回调和信号可以像值一样传递 |
| 性能 | 比原生 C++ 慢 5-50 倍，但栈分配和 ptrcall 优化缓解开销 |
| 脚本桥接 | GDScript var → Variant → ClassDB 查找 → C++ 方法调用 |

---

> 下一节：[03-内存管理与引用计数](./03-memory-management.md)
