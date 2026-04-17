# Godot 引擎源码学习指南

> 本文档帮助你系统性地学习 Godot 引擎（4.x）源代码，从基础到高级，循序渐进。Godot 采用 C++ 编写，其独特的 Server 架构和节点-场景设计使其成为一款优秀的开源游戏引擎。

## 目录

- [学习路径](#学习路径)
- [前置知识](#前置知识)
- [文档结构](#文档结构)
- [学习建议](#学习建议)
- [快速导航](#快速导航)

---

## 学习路径

```
                    ┌─────────────────────────────────────┐
                    │         00-preparation              │
                    │         (准备工作)                   │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         01-core-foundation          │
                    │         (核心基础层)                 │
                    │  对象模型 · Variant · 容器 · 信号     │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │                                     │
                    ▼                                     ▼
    ┌───────────────────────────┐     ┌───────────────────────────┐
    │     02-scene-system       │     │      03-rendering         │
    │     (场景系统)             │     │      (渲染系统)            │
    │  节点 · 场景树 · 视口      │     │  RD · 管线 · 着色器        │
    └───────────┬───────────────┘     └───────────┬───────────────┘
                │                                 │
                └─────────────────┬───────────────┘
                                  │
                                  ▼
                ┌─────────────────────────────────────┐
                │       04-functional-modules         │
                │         (功能模块)                   │
                │  动画 · 物理 · 音频 · 输入 · 粒子     │
                └─────────────────┬───────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │  05-asset-management  │   │   06-scripting-system  │
    │    (资源管理)          │   │     (脚本系统)         │
    └───────────┬───────────┘   └───────────┬───────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                ┌─────────────────────────────────────┐
                │     07-editor-extension              │
                │       (编辑器与扩展)                  │
                │    编辑器架构 · 插件 · Inspector      │
                └─────────────────┬───────────────────┘
                                  │
                                  ▼
                ┌─────────────────────────────────────┐
                │       08-platform-driver             │
                │         (平台与驱动)                  │
                │   OS 抽象 · DisplayServer · GPU 驱动  │
                └─────────────────────────────────────┘
```

---

## 前置知识

### 必备技能

- **C++**：引擎使用 C++17 编写，需熟悉面向对象、模板、智能指针
- **面向对象编程**：理解继承、多态、虚函数、RAII
- **游戏开发基础**：了解游戏循环、场景树、组件等概念
- **基本数据结构**：向量、哈希表、树、图

### 推荐了解

- **图形学基础**：顶点、片元、着色器、渲染管线、GPU 工作原理
- **设计模式**：观察者模式、单例模式、工厂模式、Server 模式
- **线性代数**：向量、矩阵、四元数
- **Vulkan / 现代图形 API**：命令缓冲、描述符集、管线状态

---

## 文档结构

| 章节 | 目录 | 内容概述 | 预计时间 |
|------|------|----------|----------|
| **准备** | `00-preparation/` | 引擎架构概览、环境配置、源码结构 | 1-2 天 |
| **核心基础** | `01-core-foundation/` | Object、ClassDB、Variant、容器、信号 | 3-5 天 |
| **场景系统** | `02-scene-system/` | Node、SceneTree、Viewport、PackedScene | 3-5 天 |
| **渲染** | `03-rendering/` | RenderingDevice、渲染管线、着色器、材质 | 7-10 天 |
| **功能模块** | `04-functional-modules/` | 动画、物理、音频、输入、粒子 | 5-7 天 |
| **资源管理** | `05-asset-management/` | Resource、加载管线、缓存、导入系统 | 2-3 天 |
| **脚本系统** | `06-scripting-system/` | GDScript 编译器、VM、脚本接口、GDExtension | 3-5 天 |
| **编辑器与扩展** | `07-editor-extension/` | 编辑器架构、插件系统、Inspector | 2-3 天 |
| **平台与驱动** | `08-platform-driver/` | OS 抽象、DisplayServer、GPU/音频驱动 | 3-5 天 |

---

## 学习建议

### 阅读源码的技巧

1. **从入口开始**：先理解 `main/main.cpp` 和 `main/main_loop.cpp`，掌握引擎启动流程
2. **跟踪 Server 架构**：Godot 的核心是 Server 模式，理解 RenderingServer、PhysicsServer3D 等的设计
3. **使用 GDCLASS 宏**：搜索 `GDCLASS(ClassName` 可以找到所有注册的引擎类
4. **断点调试**：在关键函数设置断点，观察运行时状态
5. **使用 `class_db`**：运行时通过 `--headless --script` 调试引擎内部

### 推荐的调试配置

```bash
# 编译调试版本（Linux）
scons platform=linuxbsd dev_build=yes -j$(nproc)

# GDB 调试
gdb ./bin/godot.linuxbsd.editor.dev.x86_64
(gdb) break Main::setup
(gdb) run --path /path/to/project
```

### 学习优先级

根据你的目标选择重点：

| 目标 | 重点章节 |
|------|----------|
| 游戏开发者 | 场景系统 → 功能模块 → 脚本系统 → 资源管理 |
| 渲染工程师 | 核心基础 → 渲染系统 → 平台与驱动 |
| 引擎贡献者 | 全部章节，按顺序学习 |
| 工具开发者 | 核心基础 → 编辑器与扩展 → 脚本系统 |

---

## 快速导航

### 核心文件速查

| 文件 | 路径 | 重要性 |
|------|------|--------|
| 引擎入口 | `main/main.cpp` | ⭐⭐⭐ |
| 主循环 | `main/main_loop.cpp` | ⭐⭐⭐ |
| 对象基类 | `core/object/object.h` | ⭐⭐⭐ |
| 类注册系统 | `core/object/class_db.h` | ⭐⭐⭐ |
| 动态类型 | `core/variant/variant.h` | ⭐⭐⭐ |
| 节点基类 | `scene/main/node.h` | ⭐⭐⭐ |
| 场景树 | `scene/main/scene_tree.h` | ⭐⭐⭐ |
| 渲染服务器 | `servers/rendering/rendering_server.h` | ⭐⭐ |
| 渲染设备 | `servers/rendering/rendering_device.h` | ⭐⭐ |
| 物理服务器 | `servers/physics_3d/physics_server_3d.h` | ⭐⭐ |
| GDScript 解析器 | `modules/gdscript/gdscript_parser.h` | ⭐⭐ |
| 资源加载器 | `core/io/resource_loader.h` | ⭐⭐ |

### 章节链接

- [准备工作](./00-preparation/README.md)
- [核心基础层](./01-core-foundation/README.md)
- [场景系统](./02-scene-system/README.md)
- [渲染系统](./03-rendering/README.md)
- [功能模块](./04-functional-modules/README.md)
- [资源管理](./05-asset-management/README.md)
- [脚本系统](./06-scripting-system/README.md)
- [编辑器与扩展](./07-editor-extension/README.md)
- [平台与驱动](./08-platform-driver/README.md)

---

## 相关资源

- [Godot 官方文档](https://docs.godotengine.org/)
- [Godot API 参考](https://docs.godotengine.org/en/stable/classes/)
- [Godot 贡献指南](https://docs.godotengine.org/en/stable/contributing/)
- [Godot 源码](https://github.com/godotengine/godot)

---

## 贡献与反馈

如果你在学习过程中发现问题或有改进建议，欢迎反馈！
