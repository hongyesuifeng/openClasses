# 准备工作

本章节帮助你搭建 Godot 引擎源码阅读环境，了解源码结构，建立对引擎架构的宏观认知。

## 目录

- **[00-技术原理](./00-technical-principles.md) - 游戏引擎架构基础、游戏循环、Server 模式、跨平台设计原理（建议首先阅读）**
- [01-环境配置](./01-environment-setup.md) - 开发环境搭建与编译
- [02-源码结构](./02-source-structure.md) - 源码目录导览与导航指南

---

## 学习目标

完成本章节后，你将能够：

1. 理解游戏引擎的核心架构原理和设计动机
2. 成功编译 Godot 引擎的 Debug 版本
3. 配置 IDE 获得源码跳转和调试能力
4. 了解引擎的整体目录结构，能够快速定位感兴趣的模块
5. 掌握高效的 C++ 源码阅读方法

---

## 快速开始

### 1. 获取源码

```bash
# 克隆 Godot 引擎仓库
git clone https://github.com/godotengine/godot.git

# 切换到 4.x 稳定分支
cd godot
git checkout 4.x-stable
```

### 2. 编译引擎

```bash
# Linux 编译 Debug 版本（最简单的方式）
scons platform=linuxbsd dev_build=yes -j$(nproc)

# macOS
scons platform=macos dev_build=yes -j$(sysctl -n hw.logicalcpu)

# Windows（需要 Visual Studio）
scons platform=windows dev_build=yes -j%NUMBER_OF_PROCESSORS%
```

### 3. 运行引擎

```bash
# 编译产物位于 bin/ 目录
./bin/godot.linuxbsd.editor.dev.x86_64
```

### 4. 配置调试

参考 [01-环境配置](./01-environment-setup.md) 配置 VSCode + GDB 调试环境。

---

## 前置知识

阅读 Godot 源码需要以下基础知识：

| 领域 | 最低要求 | 推荐水平 |
|------|----------|----------|
| C++ | 了解类、继承、模板 | 熟悉 RAII、智能指针、移动语义 |
| 数据结构 | 数组、链表、哈希表 | 树、图、堆 |
| 图形学 | 基本渲染流程 | 了解 GPU 管线、着色器 |
| 操作系统 | 进程、线程概念 | 了解系统 API、内存管理 |
| 设计模式 | 单例、观察者 | 工厂、策略、命令模式 |

> 不需要全部精通，可以在阅读源码过程中边学边补。最重要的是 C++ 基础和面向对象设计思想。

---

## 预计时间

- 技术原理阅读：2-3 小时
- 环境配置与编译：2-4 小时
- 源码结构了解：1-2 小时

**总计：约 1 天**

---

## 下一步

完成准备工作后，继续学习 [核心基础层](../01-core-foundation/README.md)，深入了解 Godot 的 Object 系统、Variant 类型和内存管理。
