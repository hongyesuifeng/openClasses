# 对象模型与 ClassDB

> Godot 引擎的整个类系统建立在 `Object` 基类之上，通过 `ClassDB` 实现运行时反射。本章深入分析 Object 类层次、ClassDB 注册机制，以及 GDCLASS/GDVIRTUAL 等核心宏。

---

## 目录

- [Object 类层次结构](#object-类层次结构)
- [Object 内部机制](#object-内部机制)
- [ClassDB 注册系统](#classdb-注册系统)
- [GDCLASS 宏详解](#gdclass-宏详解)
- [GDVIRTUAL 宏详解](#gdvirtual-宏详解)
- [动态属性访问：\_set/\_get/\_notification](#动态属性访问)
- [注册自定义类示例](#注册自定义类示例)
- [源码分析](#源码分析)

---

## Object 类层次结构

Godot 的所有核心类都继承自 `Object`。整个继承树分为两大分支：**RefCounted 分支**和 **Node 分支**。

```
                          Object
                       ┌────┴────┐
                       │         │
                   RefCounted    Node
                   ┌────┴────┐   ├── CanvasItem
                   │         │   │    ├── Control
                Resource  Reference │    └── Node2D
                ┌──┴──┐           │        └── Sprite2D
                │     │           ├── Node3D
            Texture Material      │    ├── MeshInstance3D
            ┌──┘                  │    └── Camera3D
        ImageTexture               └── Timer
                                           ...

    另一分支:
    Object
     └── MainLoop
          └── SceneTree
```

### Object 基类

`Object` 是所有 Godot 类的根基，定义在 `core/object/object.h` 中：

```cpp
// core/object/object.h (简化)
class Object {
    // 类型标识
    static _ClassTags get_class_static();

    // 核心虚函数
    virtual String get_class() const;
    virtual String get_parent_class() const;
    virtual bool _is_class(const String &p_class) const;
    virtual bool _is_class_inline(const StringName &p_class) const;

    // 动态属性
    virtual bool _set(const StringName &p_name, const Variant &p_value);
    virtual bool _get(const StringName &p_name, Variant &r_ret) const;
    virtual void _get_property_list(List<PropertyInfo> *p_list) const;

    // 通知系统
    virtual void _notification(int p_notification);

    // 脚本实例
    ScriptInstance *script_instance = nullptr;

    // 元数据
    HashMap<StringName, Variant> metadata;

    // 信号系统
    struct SignalData {
        struct Connection {
            Callable callable;
            uint32_t flags = 0;
        };
        Vector<Connection> connections;
    };
    HashMap<StringName, SignalData> signal_map;

    // 唯一 ID
    ObjectID instance_id;
};
```

### 两条继承路线的设计意图

```
┌─────────────────────────────────────────────────────────────┐
│                    Object 生命周期设计                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Object → Node (手动管理)                                    │
│  ├── Node 属于场景树，有明确的父子关系                        │
│  ├── 通过 memnew 创建，queue_free() 或 memdelete 销毁        │
│  ├── 生命周期由场景树或程序员管理                              │
│  └── 典型：Node、Node3D、Control、Camera3D                   │
│                                                             │
│  Object → RefCounted (引用计数)                              │
│  ├── 不属于场景树，通过 Ref<T> 智能指针管理                   │
│  ├── 引用计数归零时自动销毁                                  │
│  ├── 多处可安全共享引用                                      │
│  └── 典型：Resource、Texture、Material、ArrayMesh            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Object 内部机制

### ObjectID 与实例追踪

每个 Object 实例在创建时都会获得一个全局唯一的 `ObjectID`：

```cpp
// core/object/object.h
class Object {
    ObjectID instance_id;

    Object() {
        // 从全局计数器获取唯一 ID
        instance_id = ObjectDB::add_instance(this);
    }
};
```

```
ObjectDB 内部维护所有活着的 Object 实例：

  ObjectDB::instances (HashMap<ObjectID, Object*>)
  ┌─────────────────────────────────────────────┐
  │  ID=1 → Object* (Node "root")              │
  │  ID=2 → Object* (Camera3D)                 │
  │  ID=3 → Object* (Texture2D "icon")         │
  │  ...                                       │
  │  ID=1048576 → Object* (Button "start")     │
  └─────────────────────────────────────────────┘

  用途：
  1. ObjectDB::get_instance(id) — 通过 ID 查找对象
  2. 调试和性能分析（追踪所有活跃对象）
  3. 信号系统中的弱引用验证
```

### 通知系统

`_notification` 是 Object 的核心虚函数，用于接收各种引擎事件：

```cpp
// 通知类型示例 (core/object/object.h)
enum Notification {
    NOTIFICATION_POSTINITIALIZE = 0,
    // Node 通知
    NOTIFICATION_ENTER_TREE = 10,
    NOTIFICATION_EXIT_TREE = 11,
    NOTIFICATION_READY = 13,
    NOTIFICATION_PAUSED = 14,
    NOTIFICATION_UNPAUSED = 15,
    NOTIFICATION_PROCESS = 17,
    NOTIFICATION_PHYSICS_PROCESS = 16,
    // CanvasItem 通知
    NOTIFICATION_DRAW = 30,
    NOTIFICATION_VISIBILITY_CHANGED = 31,
};
```

```
通知分发流程：

  SceneTree._process_nodes()
       │
       ▼
  node->_notification(NOTIFICATION_PROCESS)
       │
       ▼
  Node::_notification(int p_what)
       switch(p_what) {
           case NOTIFICATION_PROCESS:
               _process(get_process_delta_time());
               break;
           case NOTIFICATION_ENTER_TREE:
               _enter_tree();
               break;
           ...
       }
```

---

## ClassDB 注册系统

`ClassDB` 是 Godot 反射系统的核心，定义在 `core/object/class_db.h` 中。

### ClassDB 内部数据结构

```cpp
// core/object/class_db.h (简化)
class ClassDB {
    struct ClassInfo {
        StringName name;
        StringName parent_class;
        GDExtensionClassCreationInfo3 gdextension_info;

        // 方法映射
        HashMap<StringName, MethodBind *> method_map;
        // 属性列表
        List<PropertyInfo> property_list;
        HashMap<StringName, PropertyInfo> property_map;
        // 信号映射
        HashMap<StringName, MethodInfo> signal_map;
        // 常量映射
        HashMap<StringName, int64_t> constant_map;
        // 枚举映射
        HashMap<StringName, HashMap<StringName, int64_t>> enum_map;

        bool disabled = false;
        bool exposed = false;
    };

    // 全局类注册表
    static HashMap<StringName, ClassInfo> classes;
    // 类型构造器
    static HashMap<StringName, Object *(*)(bool)> constructors;
};
```

```
ClassDB 注册表结构：

┌──────────────────────────────────────────────────────────────┐
│  ClassDB::classes                                            │
│                                                              │
│  "Object" ──► { parent: "", methods: {...}, props: {...} }  │
│  "Node" ────► { parent: "Object", methods: {...}, ... }     │
│  "Node3D" ──► { parent: "Node", methods: {...}, ... }       │
│  "RefCounted" ► { parent: "Object", ... }                   │
│  "Resource" ►► { parent: "RefCounted", ... }                │
│  ...                                                         │
│                                                              │
│  方法查找过程（支持继承链向上查找）：                           │
│                                                              │
│  查找 "Node3D.get_position":                                 │
│  1. 查 Node3D.method_map → 找到 ✓                           │
│                                                              │
│  查找 "Node3D.get_name":                                     │
│  1. 查 Node3D.method_map → 未找到                            │
│  2. 查 Node.method_map → 未找到                              │
│  3. 查 Object.method_map → 找到 ✓                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 方法绑定：bind_method

```cpp
// 注册方法的标准方式
void Node3D::_bind_methods() {
    // 绑定一个方法
    ClassDB::bind_method(D_METHOD("set_position", "position"),
                         &Node3D::set_position);

    ClassDB::bind_method(D_METHOD("get_position"),
                         &Node3D::get_position);

    // 绑定属性（关联 setter 和 getter）
    ADD_PROPERTY(PropertyInfo(Variant::VECTOR3, "position",
                  PROPERTY_HINT_NONE, "", PROPERTY_USAGE_DEFAULT),
                 "set_position", "get_position");

    // 绑定信号
    ADD_SIGNAL(MethodInfo("tree_entered"));
    ADD_SIGNAL(MethodInfo("tree_exited"));

    // 绑定常量
    BIND_CONSTANT(NOTIFICATION_ENTER_TREE);
    BIND_ENUM_CONSTANT(Axis::AXIS_X);
}
```

### MethodBind 类型

Godot 为不同签名的方法提供了不同的 `MethodBind` 子类：

```
MethodBind 类层次：

  MethodBind (抽象基类)
   ├── MethodBindVarArg       ← 可变参数方法 (如 Object::call)
   ├── MethodBindT<C, R, P...> ← 模板化的固定参数方法
   │    ├── 0 参数: MethodBindTC<C, R>
   │    ├── 1 参数: MethodBindTC<C, R, P1>
   │    ├── 2 参数: MethodBindTC<C, R, P1, P2>
   │    └── ... 最多到 N 个参数
   └── MethodBindPtrCall       ← 直接指针调用（更高性能）

  关键方法：
  virtual Variant call(Object *p_obj, const Variant **p_args, int p_arg_count) = 0;
  virtual void ptrcall(Object *p_obj, const void **p_args, void *r_ret) = 0;
```

```cpp
// MethodBind::call 的简化实现
// 将 Variant 参数解包为 C++ 类型，调用实际方法
Variant MethodBindTC<MyClass, void, int, String>::call(
    Object *p_obj, const Variant **p_args, int p_arg_count)
{
    MyClass *obj = static_cast<MyClass *>(p_obj);

    // 从 Variant 提取 C++ 类型
    int arg0 = p_args[0]->operator int();
    String arg1 = p_args[1]->operator String();

    // 调用实际方法
    (obj->*method)(arg0, arg1);

    return Variant();
}
```

---

## GDCLASS 宏详解

`GDCLASS` 是 Godot 中每个自定义类必须使用的宏，定义在 `core/object/object.h` 中。

### 宏展开

```cpp
// 使用：
class MyNode : public Node {
    GDCLASS(MyNode, Node);
    // ...
};

// GDCLASS(MyNode, Node) 展开后：
public:
    // 1. 静态类型标识
    static _ClassTags get_class_static() {
        static _ClassTags tags = { "MyNode" };
        return tags;
    }

    // 2. 运行时类名
    String get_class() const override { return "MyNode"; }

    // 3. 父类名
    String get_parent_class() const override { return "Node"; }

    // 4. 类型检查（支持继承链）
    bool _is_class(const String &p_class) const override {
        return (p_class == "MyNode") ? true : Node::_is_class(p_class);
    }
    bool _is_class_inline(const StringName &p_class) const override {
        return (p_class == get_class_static().class_name)
            ? true : Node::_is_class_inline(p_class);
    }

    // 5. 静态绑定方法声明
    static void _bind_methods();

    // 6. 禁用 C++ 拷贝（Godot 对象不应被拷贝）
    MyNode(const MyNode &) = delete;
    MyNode &operator=(const MyNode &) = delete;

    // 7.Friend 声明（允许内部访问）
    friend class ClassDB;
```

### 为什么需要 GDCLASS

```
没有 GDCLASS 的情况：
  class MyNode : public Node { };
  → get_class() 返回 "Node"（基类的实现）
  → ClassDB 不知道这个子类的存在
  → 脚本无法通过类名查找
  → 编辑器不认识这个类型
  → 无法在场景文件中序列化

有 GDCLASS 的情况：
  class MyNode : public Node { GDCLASS(MyNode, Node); };
  → get_class() 正确返回 "MyNode"
  → ClassDB 注册了完整类型信息
  → _bind_methods() 注册方法和属性
  → 编辑器和脚本完全可用
```

---

## GDVIRTUAL 宏详解

`GDVIRTUAL` 宏用于定义可从 GDScript 覆盖的虚函数。

### 宏命名规则

```
GDVIRTUAL 命名模式：
  GDVIRTUAL<参数数量><是否返回值>(方法名, 参数类型...)

  GDVIRTUAL0(name)                     — 0 参数，无返回值
  GDVIRTUAL1(name, ArgType1)           — 1 参数，无返回值
  GDVIRTUAL1R(RetType, name, ArgType1) — 1 参数，有返回值
  GDVIRTUAL2(name, Arg1, Arg2)         — 2 参数，无返回值
  GDVIRTUAL2R(Ret, name, Arg1, Arg2)   — 2 参数，有返回值
  ...                                    最多支持到 GDVIRTUAL5/5R
```

### 展开过程

```cpp
// 使用：
class Control : public CanvasItem {
    GDVIRTUAL1R(bool, has_point, Vector2);
};

// 展开后大致为：
protected:
    // 默认 C++ 实现（可被覆盖）
    virtual bool _has_point(const Vector2 &p_point) const { return false; }

    // 静态绑定声明
    static void _bind_has_point();

public:
    // 调用入口：先尝试脚本，再回退到 C++
    bool has_point(const Vector2 &p_point) const {
        // 检查是否有脚本覆盖
        GDVIRTUAL_CALL(has_point, p_point, ret);
        if (ret) return *ret;
        // 回退到 C++ 默认实现
        return _has_point(p_point);
    }
```

### 调用流程

```
has_point(Vector2(50, 50))
         │
         ▼
  ┌───────────────────────────────┐
  │ GDVIRTUAL_CALL(has_point, pt) │
  │                               │
  │  1. 检查 script_instance      │
  │     ├─ 无脚本 → 返回空        │
  │     └─ 有脚本 → 继续检查      │
  │                               │
  │  2. 查找脚本中的 has_point     │
  │     ├─ 未定义 → 返回空        │
  │     └─ 已定义 → 调用脚本方法  │
  │                               │
  │  3. 执行 GDScript 方法        │
  │     → 将参数打包为 Variant    │
  │     → 调用 GDScript 解释器    │
  │     → 返回结果解包为 C++ 类型 │
  └───────────────────────────────┘
         │
         ├── 有返回值 → 使用脚本返回值
         │
         └── 无返回值 → 调用 C++ _has_point()
```

---

## 动态属性访问

### _set / _get / _get_property_list

当通过 ClassDB 查找属性名失败时，Object 会回退到 `_set`/`_get` 虚函数：

```cpp
// core/object/object.h
class Object {
    // 当 ClassDB 找不到属性时调用
    virtual bool _set(const StringName &p_name, const Variant &p_value);
    virtual bool _get(const StringName &p_name, Variant &r_ret) const;

    // 返回动态属性列表
    virtual void _get_property_list(List<PropertyInfo> *p_list) const;

    // 属性变更通知
    virtual void _property_list_changed();
};
```

### 使用示例：动态属性

```cpp
// 一个支持动态属性的类
class FlexibleData : public Resource {
    GDCLASS(FlexibleData, Resource);

    // 自定义属性存储
    HashMap<StringName, Variant> custom_properties;

protected:
    bool _set(const StringName &p_name, const Variant &p_value) override {
        // 以 "data_" 开头的属性都接受
        if (String(p_name).begins_with("data_")) {
            custom_properties[p_name] = p_value;
            return true;
        }
        return false;  // 让基类处理
    }

    bool _get(const StringName &p_name, Variant &r_ret) const override {
        auto it = custom_properties.find(p_name);
        if (it != custom_properties.end()) {
            r_ret = it->value;
            return true;
        }
        return false;
    }

    void _get_property_list(List<PropertyInfo> *p_list) const override {
        // 告诉编辑器这些动态属性的存在
        for (auto &E : custom_properties) {
            p_list->push_back(PropertyInfo(E.value.get_type(), E.key));
        }
    }
};
```

```
属性查找优先级：

  obj->set("position", Vector3(1,2,3))
       │
       ▼
  1. 查 ClassDB 已注册属性 ("position" 是否在 property_map 中)
     ├── 找到 → 调用 setter 方法 (set_position)
     └── 未找到 → 继续
  2. 调用 obj->_set("position", Vector3(1,2,3))
     ├── 返回 true → 设置成功
     └── 返回 false → 报错：属性不存在
```

---

## 注册自定义类示例

完整的自定义 Godot 类注册流程：

```cpp
// my_custom_node.h
#pragma once

#include "core/object/object.h"
#include "scene/main/node.h"

class MyCustomNode : public Node {
    GDCLASS(MyCustomNode, Node);

private:
    int health = 100;
    String player_name;
    bool invincible = false;

protected:
    static void _bind_methods();

public:
    void set_health(int p_health);
    int get_health() const;

    void set_player_name(const String &p_name);
    String get_player_name() const;

    void take_damage(int p_amount);
    void heal(int p_amount);

    MyCustomNode();
    ~MyCustomNode();
};
```

```cpp
// my_custom_node.cpp
#include "my_custom_node.h"

void MyCustomNode::_bind_methods() {
    // 绑定方法
    ClassDB::bind_method(D_METHOD("set_health", "health"),
                         &MyCustomNode::set_health);
    ClassDB::bind_method(D_METHOD("get_health"),
                         &MyCustomNode::get_health);
    ClassDB::bind_method(D_METHOD("take_damage", "amount"),
                         &MyCustomNode::take_damage);
    ClassDB::bind_method(D_METHOD("heal", "amount"),
                         &MyCustomNode::heal);

    // 绑定属性（关联 setter/getter，编辑器可见）
    ADD_PROPERTY(PropertyInfo(Variant::INT, "health",
                  PROPERTY_HINT_RANGE, "0,1000,1"),
                 "set_health", "get_health");
    ADD_PROPERTY(PropertyInfo(Variant::STRING, "player_name",
                  PROPERTY_HINT_NONE, ""),
                 "set_player_name", "get_player_name");

    // 绑定信号
    ADD_SIGNAL(MethodInfo("health_changed",
                 PropertyInfo(Variant::INT, "new_health")));
    ADD_SIGNAL(MethodInfo("died"));

    // 绑定常量
    BIND_CONSTANT(MAX_HEALTH);
    BIND_ENUM_CONSTANT(DamageType::PHYSICAL);
    BIND_ENUM_CONSTANT(DamageType::MAGIC);
}

void MyCustomNode::take_damage(int p_amount) {
    if (invincible) return;
    health = MAX(0, health - p_amount);
    emit_signal("health_changed", health);
    if (health == 0) {
        emit_signal("died");
    }
}
```

```
注册流程图：

  main/main.cpp
       │
       ▼
  register_types.cpp
       │
       ├── Module 注册入口
       │   void initialize_my_module(ModuleRegistrationLevel p_level) {
       │       if (p_level == MODULE_REGISTRATION_LEVEL_SCENE) {
       │           ClassDB::register_class<MyCustomNode>();
       │       }
       │   }
       │
       ▼
  ClassDB::register_class<MyCustomNode>()
       │
       ├── 创建 ClassInfo 条目
       ├── 调用 MyCustomNode::_bind_methods()
       │    ├── 注册方法到 method_map
       │    ├── 注册属性到 property_map
       │    └── 注册信号到 signal_map
       │
       └── 类现在可通过 ClassDB 查找
           → GDScript: MyCustomNode.new()
           → 编辑器: 创建 MyCustomNode 节点
           → 场景文件: [ext_resource type="MyCustomNode" ...]
```

---

## 源码分析

### 关键文件列表

| 文件 | 行数（约） | 说明 |
|------|-----------|------|
| `core/object/object.h` | 1200+ | Object 基类、信号数据结构、GDCLASS 宏 |
| `core/object/object.cpp` | 1500+ | Object 实现、信号分发、属性系统 |
| `core/object/class_db.h` | 400+ | ClassDB 类声明 |
| `core/object/class_db.cpp` | 2000+ | ClassDB 实现、方法绑定 |
| `core/object/method_bind.h` | 600+ | MethodBind 模板类层次 |
| `core/object/script_language.h` | 800+ | ScriptInstance 接口 |
| `core/variant/variant.h` | 300+ | Variant 类型（GDVIRTUAL 依赖） |
| `core/core/string_name.h` | 200+ | StringName 驻留字符串 |

### Object::emit_signal 核心逻辑

```cpp
// core/object/object.cpp (简化)
void Object::emit_signal(const StringName &p_name, const Variant **p_args, int p_argcount) {
    // 1. 在 signal_map 中查找信号数据
    SignalData *s = signal_map.getptr(p_name);
    if (!s) return;  // 无连接，直接返回

    // 2. 遍历所有连接
    for (const SignalData::Connection &conn : s->connections) {
        if (conn.flags & CONNECT_DEFERRED) {
            // 延迟调用：排入 MessageQueue
            MessageQueue::get_singleton()->push_call(
                conn.callable.get_object(), conn.callable.get_method(),
                p_args, p_argcount);
        } else {
            // 立即调用
            conn.callable.call(p_args, p_argcount);
        }
    }
}
```

### ClassDB::get_method 查找链

```cpp
// core/object/class_db.cpp (简化)
MethodBind *ClassDB::get_method(const StringName &p_class, const StringName &p_method) {
    // 从子类向上查找继承链
    StringName class_name = p_class;
    while (class_name != StringName()) {
        ClassInfo *ci = classes.getptr(class_name);
        if (ci) {
            MethodBind *mb = ci->method_map.getptr(p_method);
            if (mb) {
                return mb;  // 找到了
            }
            class_name = ci->parent_class;  // 向上查找
        } else {
            break;
        }
    }
    return nullptr;  // 未找到
}
```

---

## 小结

| 概念 | 核心文件 | 关键机制 |
|------|---------|---------|
| Object 基类 | `core/object/object.h` | 通知、信号、动态属性 |
| ClassDB 反射 | `core/object/class_db.h` | 运行时类型注册和查找 |
| GDCLASS 宏 | `core/object/object.h` | 注入类型信息和 _bind_methods |
| GDVIRTUAL 宏 | `core/object/object.h` | 脚本可覆盖的虚函数 |
| 方法绑定 | `core/object/method_bind.h` | Variant 参数到 C++ 类型转换 |
| 实例追踪 | `core/object/object_db.h` | ObjectID → Object* 全局映射 |

---

> 下一节：[02-Variant 动态类型系统](./02-variant-system.md)
