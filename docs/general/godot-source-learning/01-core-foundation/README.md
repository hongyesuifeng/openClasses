# 核心基础层

核心基础层（Core Foundation）是 Godot 引擎的地基，所有上层模块——场景系统、渲染器、物理引擎、脚本语言——都依赖于此。理解这一层是掌握整个 Godot 源码的关键第一步。

## 目录

- **[00-技术原理](./00-technical-principles.md)** — 对象模型、反射系统、动态类型、内存管理、事件驱动、容器数据结构原理（建议首先阅读）
- **[01-对象模型与 ClassDB](./01-object-model.md)** — Object 类层次、ClassDB 注册系统、GDCLASS/GDVIRTUAL 宏
- **[02-Variant 动态类型系统](./02-variant-system.md)** — Variant 类型枚举、标签联合体、类型桥接
- **[03-内存管理与引用计数](./03-memory-management.md)** — RefCounted、Ref\<T\>、SafeRefCount、RID
- **[04-容器模板库](./04-containers.md)** — Vector、HashMap、LocalVector、List、RBSet
- **[05-信号与回调系统](./05-signal-system.md)** — Signal、Callable、MessageQueue、延迟调用

---

## 核心概念

### 1. 对象模型与反射

Godot 的核心类层次以 `Object` 为根基，通过 `ClassDB` 实现完整的运行时类型反射：

```
Object
 ├── RefCounted
 │    ├── Resource
 │    ├── Reference
 │    └── Script
 ├── Node
 │    ├── CanvasItem
 │    ├── Node3D
 │    └── ...
 └── MainLoop
      └── SceneTree
```

### 2. Variant 动态类型

`Variant` 是 C++ 与脚本语言之间的桥梁，使用标签联合体（Tagged Union）实现高效的动态类型：

```
┌─────────────────────────────────────┐
│           Variant (24-40 bytes)      │
├─────────────────────────────────────┤
│  Type tag (4 bytes)                 │
│  +                                  │
│  Union _data (最大 24 bytes)        │
│    int64_t / double / Object* /     │
│    String / Vector2 / Callable ...  │
└─────────────────────────────────────┘
```

### 3. 内存管理

```
RefCounted ─── 原子引用计数（SafeRefCount）
     │
Ref<T> ─────── 智能指针，自动 ref/unref
     │
memnew ──────── 统一内存分配宏
memdelete
```

### 4. 信号系统

```
Object.signal_map
     │
     ├── SignalData { connections[] }
     │       └── Connection { callable, flags }
     │
     └── Callable (object + method / custom callable)
             │
             └── MessageQueue → 延迟调用
```

### 5. 容器库

```
Vector<T>      ── COW (Copy-on-Write)，写时复制
LocalVector<T> ── 无 COW，更轻量
HashMap<K,V>   ── Robin Hood 哈希
List<T>        ── 双向链表
RBSet<T>       ── 红黑树
```

---

## 核心源码文件

| 文件路径 | 说明 |
|---------|------|
| `core/object/object.h` | Object 基类定义 |
| `core/object/class_db.h` | ClassDB 反射注册系统 |
| `core/object/ref_counted.h` | RefCounted 引用计数基类 |
| `core/variant/variant.h` | Variant 动态类型核心 |
| `core/variant/callable.h` | Callable 回调封装 |
| `core/templates/vector.h` | Vector\<T\> COW 容器 |
| `core/templates/hash_map.h` | HashMap Robin Hood 实现 |
| `core/templates/safe_refcount.h` | 原子引用计数 |
| `core/templates/cow_data.h` | COW 数据存储 |
| `core/core/string_name.h` | 字符串驻留（信号/方法名） |
| `core/object/message_queue.h` | 延迟调用队列 |

---

## 学习目标

完成本章节后，你将能够：

1. 理解 Godot 的 Object 类层次结构和 ClassDB 反射系统
2. 掌握 GDCLASS、GDVIRTUAL 等核心宏的工作原理
3. 理解 Variant 动态类型系统的实现机制
4. 掌握 RefCounted/Ref\<T\> 引用计数内存管理
5. 理解 Vector\<T\> 的 COW 机制和 HashMap 的 Robin Hood 哈希
6. 掌握信号系统、Callable 回调和 MessageQueue 延迟调用

---

## 预计学习时间

| 小节 | 预计时间 |
|------|---------|
| 技术原理 | 2 小时 |
| 对象模型与 ClassDB | 3-4 小时 |
| Variant 动态类型系统 | 2-3 小时 |
| 内存管理与引用计数 | 2-3 小时 |
| 容器模板库 | 2 小时 |
| 信号与回调系统 | 2-3 小时 |

**总计：约 3-5 天**

---

## 架构总览

```
┌───────────────────────────────────────────────────────────────┐
│                    Godot Core Foundation                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Object     │  │   Variant    │  │   ClassDB    │        │
│  │   类层次     │  │   动态类型   │  │   反射系统   │        │
│  └──────┬───────┘  └──────────────┘  └──────────────┘        │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ RefCounted   │  │   Signal     │  │   Callable   │        │
│  │ 引用计数     │  │   信号系统   │  │   回调封装   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Vector<T>   │  │  HashMap     │  │  StringName  │        │
│  │   COW 容器   │  │  哈希表      │  │  字符串驻留  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ MessageQueue │  │ SafeRefCount │                          │
│  │ 延迟调用队列 │  │  原子计数    │                          │
│  └──────────────┘  └──────────────┘                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────┐
│                   所有上层引擎模块                             │
│  Scene System / Rendering / Physics / Scripting / Editor     │
└───────────────────────────────────────────────────────────────┘
```

---

## 导航

| 上一章 | 下一章 |
|--------|--------|
| [00-准备工作](../00-preparation/README.md) | [02-场景系统](../02-scene-system/README.md) |

---

> 准备好后，建议先阅读 **[技术原理](./00-technical-principles.md)** 了解核心基础背后的计算机科学原理。
