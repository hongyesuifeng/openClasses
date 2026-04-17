# GDScript 虚拟机

> GDScript 虚拟机 (GDScriptVM) 是 GDScript 字节码的执行引擎。它采用基于栈的架构，负责指令的取指、译码和执行，并提供了函数调用、协程、内建函数支持等运行时特性。

---

## 目录

- [1. 虚拟机架构](#1-虚拟机架构)
- [2. 执行引擎](#2-执行引擎)
- [3. 函数调用机制](#3-函数调用机制)
- [4. ScriptInstance：C++ 与脚本的桥梁](#4-scriptinstancec-与脚本的桥梁)
- [5. 内建函数](#5-内建函数)
- [6. 协程与 await](#6-协程与-await)
- [7. 源码导航](#7-源码导航)

---

## 1. 虚拟机架构

### 1.1 整体结构

```
┌─────────────────────────────────────────────────────────────┐
│                    GDScriptVM 架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               GDScriptFunctionState                   │  │
│  │  协程状态管理（挂起、恢复、返回值传递）                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               GDScriptInstance                         │  │
│  │  脚本实例（Object 与脚本的桥梁）                        │  │
│  │  ├── members: Dict<StringName, Variant>  成员变量      │  │
│  │  ├── script: Ref<GDScript>              所属脚本       │  │
│  │  ├── owner: Object*                     C++ 对象       │  │
│  │  └── call() / set() / get()             接口方法       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               GDScriptFunction                         │  │
│  │  字节码容器                                            │  │
│  │  ├── code: Vector<uint8_t>     字节码指令序列          │  │
│  │  ├── constants: Vector<Variant> 常量表                 │  │
│  │  ├── default_arguments         默认参数                │  │
│  │  ├── argument_count            参数数量                │  │
│  │  └── stack_size                栈大小需求              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               GDScriptVM (执行函数)                     │  │
│  │  核心执行循环                                          │  │
│  │                                                        │  │
│  │  CallFrame 结构：                                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  stack: Variant*      栈帧基指针                  │  │  │
│  │  │  stack_size: int      栈大小                      │  │  │
│  │  │  ip: const uint8_t*   指令指针                    │  │  │
│  │  │  line: int            当前行号                    │  │  │
│  │  │  function: GDScriptFunction* 当前函数             │  │  │
│  │  │  instance: GDScriptInstance* 当前实例              │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  执行栈：                                              │  │
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐       │  │
│  │  │arg│arg│loc│loc│loc│ . │ . │ . │ . │ . │ . │       │  │
│  │  │ 0 │ 1 │ 0 │ 1 │ 2 │   │   │   │   │   │   │       │  │
│  │  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘       │  │
│  │  ├─ arguments ─┤├── locals ──┤├── workspace ──→       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 栈帧布局

GDScriptVM 使用连续的内存区域作为执行栈，每个函数调用占据一个栈帧：

```
执行栈内存布局：

┌──────────────────────────────────────────────────────────────┐
│  完整执行栈                                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CallFrame 0 (最外层函数，如 _ready)                          │
│  ┌────────┬────────┬────────┬────────┬────────────────────┐  │
│  │ arg[0] │ arg[1] │ loc[0] │ loc[1] │  工作空间          │  │
│  │ self   │ delta  │ vel    │ dir    │  表达式求值临时值   │  │
│  └────────┴────────┴────────┴────────┴────────────────────┘  │
│                                                              │
│  CallFrame 1 (被调函数，如 move_and_slide)                    │
│  ┌────────┬────────┬────────────────────────────────────────┐│
│  │ arg[0] │ loc[0] │  工作空间                               ││
│  └────────┴────────┴────────────────────────────────────────┘│
│                                                              │
│  CallFrame 2 (更深层的调用)                                   │
│  ┌────────┬────────┬─────────────────────┐                   │
│  │ arg[0] │ loc[0] │  工作空间            │                   │
│  └────────┴────────┴─────────────────────┘                   │
│                                                              │
│  → 栈向下增长                                                │
│  → 每个栈帧包含：参数区 + 局部变量区 + 工作空间               │
│  → 栈帧大小 = function->stack_size                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

栈帧切换过程：
1. 函数调用时：
   - 计算新栈帧基址 = 当前栈顶 + 当前函数 stack_size
   - 保存当前 CallFrame（ip, stack, function）
   - 将参数复制到新栈帧的参数区
   - 设置新 ip = 被调函数的 code.data()

2. 函数返回时：
   - 保存返回值
   - 恢复上一个 CallFrame（ip, stack, function）
   - 将返回值压入调用者的工作栈
```

---

## 2. 执行引擎

### 2.1 核心执行循环

GDScriptVM 的核心是一个巨大的 switch-case 分发循环：

```cpp
// modules/gdscript/gdscript_vm.cpp (简化伪代码)
Variant GDScriptFunction::call(GDScriptInstance *p_instance,
                                const Variant **p_args, int p_arg_count,
                                Callable::CallError &r_err) {

    // 1. 初始化执行栈
    Variant *stack = (Variant *)alloca(stack_size * sizeof(Variant));
    // 初始化栈上的 Variant 对象...

    // 2. 复制参数到栈
    for (int i = 0; i < arg_count; i++) {
        stack[i] = *p_args[i];
    }

    // 3. 设置指令指针
    const uint8_t *ip = code.ptr();

    // 4. 执行循环
    while (true) {
        // 取指令
        uint32_t opcode = *ip;
        ip++;

        switch (opcode) {
            case OP_CONSTANT: {
                int idx = read_argument(ip);
                // 将 constants[idx] 压栈
                *top++ = constants[idx];
                break;
            }
            case OP_ADD: {
                Variant b = *--top;  // 弹出
                Variant a = *--top;  // 弹出
                *top++ = a + b;      // 压入结果
                break;
            }
            case OP_GET_LOCAL: {
                int slot = read_argument(ip);
                *top++ = stack[slot];
                break;
            }
            case OP_SET_LOCAL: {
                int slot = read_argument(ip);
                stack[slot] = *--top;
                break;
            }
            case OP_JUMP: {
                int offset = read_argument(ip);
                ip = code.ptr() + offset;
                break;
            }
            case OP_RETURN: {
                Variant ret = *--top;
                // 清理栈...
                return ret;
            }
            // ... 数百个操作码处理
        }
    }
}
```

### 2.2 指令执行详解

```
常见指令的执行过程：

OP_CONSTANT idx:
┌────────────────────────────────────────────┐
│ 读取参数：常量索引 idx                      │
│ 操作：*top = constants[idx]; top++         │
│                                            │
│ 栈变化：                                    │
│ [... ]      →   [... | const_val ]         │
└────────────────────────────────────────────┘

OP_GET_LOCAL slot:
┌────────────────────────────────────────────┐
│ 读取参数：栈槽位 slot                       │
│ 操作：*top = stack[slot]; top++            │
│                                            │
│ 栈变化：                                    │
│ [... ]      →   [... | stack[slot] ]       │
└────────────────────────────────────────────┘

OP_SET_MEMBER name_idx:
┌────────────────────────────────────────────┐
│ 读取参数：成员名索引 name_idx               │
│ 操作：value = *--top                       │
│       instance->members[name] = value      │
│                                            │
│ 栈变化：                                    │
│ [... | value ]  →  [...]                   │
└────────────────────────────────────────────┘

OP_ADD:
┌────────────────────────────────────────────┐
│ 无额外参数                                  │
│ 操作：b = *--top; a = *--top              │
│       *top++ = a + b (Variant 运算)        │
│                                            │
│ 栈变化：                                    │
│ [... | a | b ]  →  [... | a+b ]           │
└────────────────────────────────────────────┘

OP_CALL_METHOD argc:
┌────────────────────────────────────────────┐
│ 参数：argc (参数数量), method_name          │
│ 栈布局：[... | obj | arg0 | arg1 | ... ]   │
│ 操作：弹出 obj 和 argc 个参数              │
│       result = obj->call(method, args)     │
│       *top++ = result                      │
│                                            │
│ 栈变化：                                    │
│ [... | obj | a0 | a1 ] → [... | result ]  │
└────────────────────────────────────────────┘

OP_JUMP_IF_FALSE offset:
┌────────────────────────────────────────────┐
│ 参数：跳转偏移 offset                       │
│ 操作：cond = *--top                        │
│       if (!cond) ip = code.ptr() + offset  │
│                                            │
│ 栈变化：                                    │
│ [... | cond ]  →  [...]                    │
└────────────────────────────────────────────┘
```

### 2.3 性能优化技巧

```
GDScriptVM 的性能优化策略：

1. alloca 栈分配
   ┌────────────────────────────────────────────┐
   │ 使用 alloca() 在 C 栈上分配执行栈          │
   │ 避免堆分配（malloc/new），减少 GC 压力     │
   │ 函数返回时自动释放                         │
   │                                            │
   │ 注意：alloca 有栈溢出风险                  │
   │ Godot 限制了最大栈大小                     │
   └────────────────────────────────────────────┘

2. 原地初始化 Variant
   ┌────────────────────────────────────────────┐
   │ 栈上的 Variant 使用 placement new          │
   │ 避免默认构造后再赋值                       │
   │                                            │
   │ for (int i = 0; i < stack_size; i++)       │
   │     memnew_placement(&stack[i], Variant);  │
   └────────────────────────────────────────────┘

3. 内联缓存 (Inline Cache)
   ┌────────────────────────────────────────────┐
   │ 对频繁调用的方法缓存查找结果               │
   │ 避免每次调用都进行名称查找                 │
   │ 当类型不变时直接使用缓存的方法指针          │
   └────────────────────────────────────────────┘

4. Variant 特化运算
   ┌────────────────────────────────────────────┐
   │ 常见类型组合（int+int, float+float）       │
   │ 有专门的快速路径                           │
   │ 不需要通用的 Variant 类型分发               │
   └────────────────────────────────────────────┘
```

---

## 3. 函数调用机制

### 3.1 调用流程

```
函数调用的完整流程：

GDScript 代码：
    var result = my_func(1, 2)

执行过程：

┌──────────────────────────────────────────────────────────────┐
│  1. 字节码准备参数                                            │
│     OP_CONSTANT idx_1         // 压入参数 1                  │
│     OP_CONSTANT idx_2         // 压入参数 2                  │
│     OP_CALL_FUNC "my_func" argc=2                           │
│                                                              │
│  2. VM 查找函数                                              │
│     ├── 在当前脚本的 member_functions 中查找                  │
│     ├── 如果未找到，查找基类脚本                              │
│     └── 如果仍未找到，尝试 Object::call()                    │
│                                                              │
│  3. 创建新栈帧                                               │
│     ├── 保存当前 CallFrame (ip, stack, function)             │
│     ├── 分配新栈帧空间                                       │
│     └── 将参数复制到新栈帧的参数区                            │
│                                                              │
│  4. 执行被调函数                                             │
│     └── ip 跳转到被调函数的字节码起始位置                     │
│                                                              │
│  5. 函数返回                                                 │
│     ├── OP_RETURN 指令                                       │
│     ├── 将返回值压入调用者的工作栈                            │
│     └── 恢复调用者的 CallFrame                               │
│                                                              │
│  6. 结果存储                                                 │
│     OP_SET_LOCAL slot_result                                 │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 方法解析顺序

当一个方法被调用时，Godot 按照以下顺序查找：

```
方法解析顺序 (Method Resolution Order, MRO)：

调用 self.some_method(args)

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  1. 查找脚本方法                                             │
│     ├── 当前脚本的 member_functions                          │
│     │   (GDScript 字节码函数)                                │
│     └── 如果找到 → GDScriptVM 执行字节码                    │
│                                                              │
│  2. 查找基类脚本方法                                         │
│     ├── script->get_base_script()                           │
│     ├── 递归向上查找                                        │
│     └── 如果找到 → 对应 VM 执行                             │
│                                                              │
│  3. 查找 C++ 绑定方法                                       │
│     ├── ClassDB::get_method(owner->get_class(), method)     │
│     ├── 查找引擎内建方法                                    │
│     └── 如果找到 → 直接调用 C++ 方法                        │
│                                                              │
│  4. 查找 _notification / _set / _get 等 virtual 方法         │
│     └── 通过 ScriptInstance 的虚函数调用                     │
│                                                              │
│  5. 未找到 → 报错                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 不同调用类型的性能

```
调用类型性能比较（相对估算）：

┌──────────────────────┬──────────┬──────────────────────────────┐
│ 调用类型              │ 相对开销 │ 原因                          │
├──────────────────────┼──────────┼──────────────────────────────┤
│ C++ 内部调用          │ 1x (基准)│ 直接函数指针调用              │
│ GDScript → C++ 方法  │ ~3-5x   │ 名称查找 + 参数 marshaling   │
│ GDScript → GDScript  │ ~2-4x   │ 栈帧切换 + 字节码执行        │
│ GDScript 内建函数     │ ~2-3x   │ 直接查表调用                  │
│ eval() / call()      │ ~10-20x │ 字符串解析 + 动态查找        │
└──────────────────────┴──────────┴──────────────────────────────┘

优化建议：
- 热路径代码优先使用内建函数
- 减少不必要的脚本间调用
- 考虑使用 GDExtension 处理计算密集型逻辑
```

---

## 4. ScriptInstance：C++ 与脚本的桥梁

### 4.1 ScriptInstance 接口

`ScriptInstance` 是 C++ 对象与脚本实例之间的桥梁接口：

```
┌──────────────────────────────────────────────────────────────┐
│                  ScriptInstance 接口                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  class ScriptInstance {                                      │
│  public:                                                     │
│      // 属性访问                                             │
│      virtual bool set(const StringName &p_name,             │
│                       const Variant &p_value) = 0;          │
│      virtual bool get(const StringName &p_name,             │
│                       Variant &r_ret) const = 0;            │
│      virtual void get_property_list(List<PropertyInfo> *    │
│                                     p_properties) const = 0;│
│      virtual Variant::Type get_property_type(               │
│              const StringName &p_name,                       │
│              bool *r_is_valid) const = 0;                    │
│                                                              │
│      // 方法调用                                             │
│      virtual Variant call(const StringName &p_method,       │
│                          const Variant **p_args,             │
│                          int p_arg_count,                    │
│                          Callable::CallError &r_error) = 0;  │
│                                                              │
│      // 通知                                                 │
│      virtual void notification(int p_notification) = 0;     │
│                                                              │
│      // 脚本信息                                             │
│      virtual Ref<Script> get_script() const = 0;            │
│      virtual Object *get_owner() = 0;                       │
│      virtual ScriptLanguage *get_language() = 0;             │
│                                                              │
│      // ... 更多方法                                        │
│  };                                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 GDScriptInstance 实现

```
GDScriptInstance 关键实现：

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  set(name, value):                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. 查找成员变量表 members[name]                         │  │
│  │    └── 如果找到 → members[name] = value → return true  │  │
│  │                                                         │  │
│  │ 2. 查找脚本的属性列表                                   │  │
│  │    └── 检查类型是否匹配                                 │  │
│  │                                                         │  │
│  │ 3. 回退到 C++ Object 的属性系统                         │  │
│  │    └── owner->set(name, value)                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  get(name, r_ret):                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. 查找成员变量表 members[name]                         │  │
│  │    └── 如果找到 → r_ret = members[name] → return true  │  │
│  │                                                         │  │
│  │ 2. 查找常量表                                           │  │
│  │    └── 如果找到 → 返回常量值                             │  │
│  │                                                         │  │
│  │ 3. 回退到 C++ Object 的属性系统                         │  │
│  │    └── r_ret = owner->get(name)                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  call(method, args, argc):                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. 查找 member_functions[method]                        │  │
│  │    └── 如果找到 → 调用 GDScriptVM 执行字节码           │  │
│  │                                                         │  │
│  │ 2. 查找基类脚本的方法                                   │  │
│  │    └── 递归向上查找                                     │  │
│  │                                                         │  │
│  │ 3. 内建函数检查                                         │  │
│  │                                                         │  │
│  │ 4. 返回 CALL_ERROR_INVALID_METHOD                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  notification(what):                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 查找与通知对应的脚本方法并调用                           │  │
│  │ NOTIFICATION_READY → call("_ready")                     │  │
│  │ NOTIFICATION_PROCESS → call("_process")                 │  │
│  │ NOTIFICATION_PHYSICS_PROCESS → call("_physics_process") │  │
│  │ NOTIFICATION_ENTER_TREE → call("_enter_tree")           │  │
│  │ NOTIFICATION_EXIT_TREE → call("_exit_tree")             │  │
│  │ ... 其他通知                                           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 属性绑定流程

```
脚本变量与 C++ 属性的统一访问：

GDScript 代码：
    position.x = 100       ← 访问 C++ 属性
    health -= 10           ← 访问脚本成员变量

执行过程：

position.x = 100:
┌──────────────────────────────────────────────────────────────┐
│ 1. OP_GET_MEMBER "position"                                 │
│    └── ScriptInstance::get("position")                       │
│        └── 未在 members 中找到                               │
│        └── 回退到 owner->get("position")                     │
│            └── Node2D::get("position") → Vector2(0, 0)      │
│                                                              │
│ 2. OP_GET_FIELD "x"                                         │
│    └── 从 Vector2 获取 x 分量 → 0.0                        │
│                                                              │
│ 3. OP_CONSTANT 100                                          │
│                                                              │
│ 4. OP_SET_FIELD "x"                                         │
│    └── 设置 Vector2 的 x 分量 → Vector2(100, 0)            │
│                                                              │
│ 5. OP_SET_MEMBER "position"                                 │
│    └── ScriptInstance::set("position", Vector2(100, 0))     │
│        └── 未在 members 中找到                               │
│        └── 回退到 owner->set("position", Vector2(100, 0))   │
│            └── Node2D::set_position(Vector2(100, 0))        │
│                └── 更新变换矩阵，标记为需要更新              │
└──────────────────────────────────────────────────────────────┘

health -= 10:
┌──────────────────────────────────────────────────────────────┐
│ 1. OP_GET_MEMBER "health"                                   │
│    └── ScriptInstance::get("health")                         │
│        └── 在 members 中找到 → 100                          │
│                                                              │
│ 2. OP_CONSTANT 10                                           │
│                                                              │
│ 3. OP_SUBTRACT                                               │
│    └── 100 - 10 = 90                                        │
│                                                              │
│ 4. OP_SET_MEMBER "health"                                   │
│    └── ScriptInstance::set("health", 90)                     │
│        └── 在 members 中找到 → members["health"] = 90      │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 内建函数

### 5.1 内建函数分类

GDScript 提供了丰富的内建函数，这些函数在 VM 中有专门的快速路径：

```
┌──────────────────────────────────────────────────────────────┐
│                    内建函数分类                                │
├──────────────────┬───────────────────────────────────────────┤
│  数学函数        │ sin, cos, tan, asin, acos, atan,         │
│                  │ sqrt, pow, log, abs, floor, ceil, round,  │
│                  │ min, max, clamp, lerp, sign, stepify      │
│                  │                                           │
│  随机数          │ randi, randf, randi_range, randf_range,  │
│                  │ rand_weighted, seed, rand_from_seed       │
│                  │                                           │
│  类型转换        │ int(), float(), bool(), String(),         │
│                  │ Vector2(), Color(), type_convert()        │
│                  │                                           │
│  类型检查        │ typeof(), type_string(), is_instance_of() │
│                  │                                           │
│  集合操作        │ len(), empty(), hash(),                   │
│                  │ Array: push_back, pop_back, find, ...    │
│                  │ Dict: has, keys, values, ...              │
│                  │                                           │
│  字符串          │ str(), print(), print_rich(), push_error,│
│                  │ push_warning, var_to_str(), str_to_var() │
│                  │                                           │
│  对象操作        │ is_instance_valid(), instance_from_id()  │
│                  │                                           │
│  时间/性能       │ Time.get_ticks_msec(), Performance,      │
│                  │ OS.get_ticks_msec()                       │
│                  │                                           │
│  调试            │ assert(), breakpoint(), print_stack()     │
└──────────────────┴───────────────────────────────────────────┘
```

### 5.2 内建函数调用路径

```
内建函数调用流程对比：

普通函数调用：
GDScript → OP_CALL → 名称查找 → 栈帧创建 → 字节码执行 → 返回
开销：较高

内建函数调用：
GDScript → OP_CALL_BUILT_IN → 函数表索引 → 直接调用 C++ 函数 → 返回
开销：较低（跳过名称查找和栈帧创建）

Variant 方法调用（如 str.length()）：
GDScript → OP_CALL_METHOD → Variant::call_method() → 返回
开销：中等（需要 Variant 类型分发）
```

---

## 6. 协程与 await

### 6.1 协程原理

GDScript 通过 `await` 关键字实现协程（Coroutine），允许函数暂停执行并在稍后恢复：

```
协程执行模型：

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  普通函数调用：                                               │
│  ┌────────┐    call()    ┌──────────┐                       │
│  │ 调用者  │ ──────────► │ 被调函数  │                       │
│  │        │              │ 执行完毕  │                       │
│  │        │ ◄────────── │ 返回结果  │                       │
│  └────────┘    return()  └──────────┘                       │
│                                                              │
│  协程调用：                                                   │
│  ┌────────┐    call()    ┌──────────────┐                   │
│  │ 调用者  │ ──────────► │ 被调协程函数  │                   │
│  │        │              │              │                    │
│  │ (继续  │ ◄── await ── │ 暂停执行     │                   │
│  │  执行) │    返回       │ 保存状态     │                   │
│  │        │  FunctionState│              │                   │
│  │  ...   │              │    ... 等待  │                   │
│  │        │              │   信号触发   │                    │
│  │        │   resume()   │              │                    │
│  │        │ ──────────► │ 恢复执行     │                    │
│  │        │              │  ...         │                    │
│  │        │ ◄────────── │ 继续执行     │                    │
│  └────────┘    return()  └──────────────┘                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 await 实现

```
await 的字节码实现：

GDScript:
    func fade_out():
        var tween = create_tween()
        tween.tween_property(self, "modulate:a", 0.0, 1.0)
        await tween.finished
        queue_free()

字节码：
┌──────────┬──────────────────────────────────────────────┐
│ 偏移     │ 指令                                          │
├──────────┼──────────────────────────────────────────────┤
│ 0x00     │ ;; tween = create_tween()                     │
│          │ OP_CALL_METHOD "create_tween" argc=0          │
│          │ OP_SET_LOCAL slot_tween                       │
│          │                                               │
│ 0x10     │ ;; tween.tween_property(...)                  │
│          │ OP_GET_LOCAL slot_tween                       │
│          │ OP_CONSTANT "modulate:a"                      │
│          │ OP_CONSTANT 0.0                               │
│          │ OP_CONSTANT 1.0                               │
│          │ OP_CALL_METHOD "tween_property" argc=4        │
│          │ OP_POP                                        │
│          │                                               │
│ 0x25     │ ;; await tween.finished                       │
│          │ OP_GET_LOCAL slot_tween                       │
│          │ OP_CONSTANT "finished"                        │
│          │ OP_AWAIT      ← 关键：创建协程状态            │
│          │                                               │
│ 0x2A     │ ;; （恢复点：await 返回后从这里继续）          │
│          │                                               │
│ 0x2A     │ ;; queue_free()                               │
│          │ OP_GET_SELF                                   │
│          │ OP_CALL_METHOD "queue_free" argc=0            │
│          │ OP_RETURN                                     │
└──────────┴──────────────────────────────────────────────┘

OP_AWAIT 执行过程：

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  1. 从栈中获取等待的对象和信号名                              │
│     object = tween                                           │
│     signal = "finished"                                      │
│                                                              │
│  2. 创建 GDScriptFunctionState 对象                          │
│     ├── 保存当前执行状态                                     │
│     │   ├── 当前 ip (下一条指令地址 = 0x2A)                  │
│     │   ├── 当前栈帧                                        │
│     │   └── 所有局部变量值                                   │
│     ├── 设置 script_instance 引用                            │
│     └── 设置 function 引用                                   │
│                                                              │
│  3. 连接信号到 FunctionState 的 resume 方法                  │
│     tween.finished.connect(func_state.resume)                │
│                                                              │
│  4. 返回 FunctionState 给调用者                              │
│     └── 调用者可以继续执行其他代码                            │
│                                                              │
│  5. 当信号触发时（tween 完成）：                              │
│     ├── FunctionState::resume() 被调用                       │
│     ├── 恢复保存的执行状态                                    │
│     │   ├── 恢复 ip = 0x2A                                  │
│     │   ├── 恢复栈帧和局部变量                               │
│     │   └── 恢复 script_instance                            │
│     └── 从恢复点继续执行字节码                                │
│         → queue_free()                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 GDScriptFunctionState 状态保存

```
GDScriptFunctionState 保存的信息：

┌──────────────────────────────────────────────────────────────┐
│  class GDScriptFunctionState : public RefCounted {           │
│                                                              │
│      // 执行状态                                             │
│      GDScriptFunction *function = nullptr;                   │
│      GDScriptInstance *instance = nullptr;                   │
│                                                              │
│      // 保存的栈帧                                           │
│      Vector<uint8_t> stack;          // 栈内存的完整拷贝     │
│      const uint8_t *ip = nullptr;    // 保存的指令指针       │
│      int stack_size = 0;             // 栈大小               │
│                                                              │
│      // 等待信息                                             │
│      ObjectID await_signal_object;    // 等待信号的对象 ID   │
│      StringName await_signal_name;    // 等待的信号名        │
│                                                              │
│      // 结果                                                 │
│      Variant result;                  // 协程的最终返回值    │
│      bool first_resume = true;        // 是否第一次恢复      │
│                                                              │
│      // 方法                                                 │
│      Variant resume(const Variant **p_args, int p_arg_count);│
│      bool is_valid() const;                                  │
│  };                                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.4 常见 await 模式

```
GDScript 中的常见 await 用法：

1. await 等待信号
   await $AnimationPlayer.animation_finished

2. await 等待时间
   await get_tree().create_timer(2.0).timeout

3. await 等待物理帧
   await get_tree().physics_frame

4. await 等待下一帧
   await get_tree().process_frame

5. await 等待协程完成
   var result = await my_coroutine()

对应的内部信号连接：
┌──────────────────────┬─────────────────────────────┐
│ await 表达式          │ 等待的信号                   │
├──────────────────────┼─────────────────────────────┤
│ await obj.signal     │ 连接到 obj.signal            │
│ await timer.timeout  │ 连接到 Timer 的 timeout 信号 │
│ await frame          │ 连接到 SceneTree.process_frame│
│ await coroutine()    │ 等待协程的 completed 信号    │
└──────────────────────┴─────────────────────────────┘
```

---

## 7. 源码导航

### 关键文件列表

| 文件 | 路径 | 说明 |
|------|------|------|
| 虚拟机 | `modules/gdscript/gdscript_vm.h` | VM 执行引擎主文件 |
| 字节码函数 | `modules/gdscript/gdscript_function.h` | 函数对象与操作码定义 |
| 脚本实例 | `modules/gdscript/gdscript.h` | GDScriptInstance 定义 |
| 协程状态 | `modules/gdscript/gdscript_function.h` | FunctionState 定义 |
| 脚本基类 | `core/object/script.h` | Script / ScriptInstance 接口 |
| 脚本语言 | `core/object/script_language.h` | ScriptLanguage 抽象 |

### 调试技巧

```
调试 GDScriptVM 的技巧：

1. 启用字节码调试输出
   // 在 gdscript_vm.cpp 中搜索 DEBUG_TOKENS
   // 或添加自定义调试输出

2. 跟踪函数调用
   // 在 GDScriptFunction::call() 入口添加断点
   // 查看 function->name 确认调用目标

3. 检查执行栈
   // 在 switch(opcode) 前添加条件断点
   // 条件：opcode == OP_CALL_METHOD

4. 分析性能瓶颈
   // 使用 Godot 内置的性能分析器
   // 或在 VM 循环中添加计时代码

5. 使用 GDB
   break GDScriptFunction::call
   condition 1 strcmp(function->name, "problematic_func") == 0
   run --path /path/to/project
```

---

## 小结

| 组件 | 职责 | 关键类 |
|------|------|--------|
| 执行引擎 | 字节码取指-译码-执行 | GDScriptVM (在 GDScriptFunction::call 中) |
| 栈帧管理 | 管理函数调用栈 | CallFrame, alloca 分配 |
| 脚本实例 | 桥接 C++ Object 和脚本 | GDScriptInstance |
| 内建函数 | 常用操作的快速路径 | Built-in function table |
| 协程 | 函数暂停与恢复 | GDScriptFunctionState |

GDScript 虚拟机是脚本系统的运行时核心。基于栈的设计使得字节码紧凑且易于生成，而 ScriptInstance 的桥接机制则实现了 C++ 对象与脚本的无缝互操作。协程机制通过保存和恢复执行状态，使得异步编程变得直观。

---

## 下一步

理解虚拟机后，继续学习 [03-GDExtension 机制](./03-gdextension.md)，了解如何通过原生代码扩展引擎功能。
