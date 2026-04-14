# 技术原理：资源管理基础

> 资源管理系统负责游戏中所有资源的加载、缓存和释放。在阅读 Cocos Creator 的 AssetManager、Bundle 和加载管线源码之前，先理解异步加载、引用计数和资源管线的技术原理。

---

## 目录

- [1. 异步加载与并发控制](#1-异步加载与并发控制)
- [2. 引用计数与垃圾回收](#2-引用计数与垃圾回收)
- [3. 资源管线模式](#3-资源管线模式)
- [4. 资源包与依赖图](#4-资源包与依赖图)

---

## 1. 异步加载与并发控制

### 为什么游戏资源加载必须是异步的

```
同步加载的问题：

帧循环中：
  frameStart()
  loadAsset("big_texture.png")  ← 加载 500ms
  render()                       ← 帧被阻塞 500ms
  frameEnd()

结果：游戏卡死 500ms，帧率从 60 FPS 骤降到 2 FPS

异步加载的方案：

帧循环中：
  frameStart()
  requestLoad("big_texture.png", callback)  ← 立即返回
  render()                                   ← 正常渲染
  frameEnd()

  ... 几十帧之后 ...

  callback(asset)  ← 加载完成，资源可用
```

### 异步加载模型

```
                发起加载
                  │
                  ▼
         ┌────────────────┐
         │  请求进入队列   │ ← 多个加载请求排队
         └────────┬───────┘
                  │
         ┌────────▼───────┐
         │  并发控制器     │ ← 限制同时加载数量（如最多 6 个）
         └────────┬───────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
  加载任务1     加载任务2     加载任务3
  (下载纹理)   (解析 JSON)   (解码音频)
    │             │             │
    ▼             ▼             ▼
  回调通知     回调通知      回调通知
```

### Promise 与回调

Cocos 的加载接口支持两种异步风格：

```typescript
// 回调风格
assetManager.loadAny('path', (err, asset) => { ... });

// Promise 风格（更现代）
const asset = await assetManager.loadAny('path');
```

> 源码 `cocos/asset/asset-manager/task.ts` 中 Task 类封装了异步操作。加载管线通过 Pipeline 类串联多个异步步骤

---

## 2. 引用计数与垃圾回收

### 两种内存管理策略

```
策略 1：垃圾回收（GC）
  JavaScript 引擎自动管理
  优点：开发者无需关心
  缺点：不可控，可能造成卡顿

策略 2：引用计数（Reference Counting）
  手动管理资源的生命周期
  优点：可控、确定性的释放
  缺点：需要开发者配合（addRef / decRef）
```

### Cocos 的混合方案

```
Cocos 使用 引用计数 + 缓存 的混合方案：

AssetManager.assets (缓存表)
  UUID → Asset 实例

  加载资源时：
    1. 查缓存（命中则增加引用计数，返回）
    2. 未命中 → 加载 → 放入缓存 → 引用计数 = 1

  引用资源时：
    asset.addRef()  → 引用计数 +1

  不再需要时：
    asset.decRef()  → 引用计数 -1
    if (引用计数 == 0) → 从缓存移除 → GC 回收
```

### 引用计数的陷阱

```
循环引用问题：

  资源 A 引用资源 B
  资源 B 引用资源 A
  → 两者引用计数永远不为 0 → 永远不会被释放

Cocos 的解决方案：
  - 使用弱引用标记非拥有关系
  - ReleaseManager 跟踪完整的引用图
  - 通过依赖分析检测可释放的资源组
```

> 源码 `cocos/asset/asset-manager/release-manager.ts` 实现了基于引用计数的资源释放

---

## 3. 资源管线模式

### 管线（Pipeline）设计模式

```
Pipeline = 一系列有序的处理阶段，数据流经每个阶段

  输入 → [阶段1] → [阶段2] → [阶段3] → 输出

每个阶段：
  - 接收上一步的输出
  - 执行自己的处理逻辑
  - 将结果传递给下一步
```

### Cocos 的加载管线

```
用户请求加载资源
    │
    ▼
┌──────────────┐
│  下载阶段     │ ← download pipeline
│  (Download)  │
└──────┬───────┘
       │ 原始数据（文件内容）
       ▼
┌──────────────┐
│  解析阶段     │ ← parse pipeline
│  (Parse)     │
└──────┬───────┘
       │ 中间格式（JSON 对象等）
       ▼
┌──────────────┐
│  工厂阶段     │ ← factory
│  (Factory)   │
└──────┬───────┘
       │ Asset 实例
       ▼
  缓存 + 回调返回
```

### 各阶段的实现

```
Download 阶段：
  根据 URL 和类型选择下载方式：
  - Web：fetch() 或 XMLHttpRequest
  - 原生：文件系统读取
  - 远程：HTTP 下载
  - Bundle：从包内读取

Parse 阶段：
  根据文件类型解析：
  - JSON：JSON.parse()
  - 图片：创建 Image 对象 → 解码
  - 音频：AudioContext.decodeAudioData()
  - 二进制：ArrayBuffer 处理

Factory 队段：
  根据资源类型创建对应 Asset 实例：
  - Texture2D：上传图片数据到 GPU
  - Material：创建材质实例，设置着色器
  - Prefab：创建节点树模板
  - AnimationClip：创建动画数据
```

> 源码 `cocos/asset/asset-manager/pipeline.ts` 实现了通用管线。`asset-manager.ts` 中注册了 download 和 parse 两个子管线

---

## 4. 资源包与依赖图

### Bundle 的概念

```
Bundle = 一组相关资源的集合

为什么需要 Bundle？

1. 分包加载：
   游戏启动时只加载核心 Bundle（~5MB）
   进入关卡时再加载该关卡的 Bundle（~20MB）
   → 减少首屏加载时间

2. 热更新：
   只更新变化的 Bundle
   → 不需要重新发布整个游戏

3. 多渠道：
   不同渠道可以有不同的 Bundle 配置
```

### Bundle 的结构

```
一个 Bundle 包含：

  config.json       ← 资源索引（路径 → UUID 映射、依赖关系）
  assets/
    ├── textures/
    │   ├── abc123.jpg      ← 以 UUID 命名的资源文件
    │   └── def456.png
    ├── scenes/
    │   └── scene001.json
    └── prefabs/
        └── enemy001.json
```

### 资源依赖图

```
一个场景可能依赖大量其他资源：

  Scene "Level1"
    ├── Prefab "Player"
    │   ├── Material "PlayerMat"
    │   │   ├── Effect "PBR"
    │   │   └── Texture "PlayerTex"
    │   │       └── Image "player.png"
    │   └── Animation "Idle"
    │       └── Skeleton "PlayerSkel"
    ├── Prefab "Enemy"
    │   └── ...
    └── Audio "BGM"

依赖图保证了：
  1. 加载场景时自动加载所有依赖
  2. 释放场景时正确处理共享依赖的引用计数
```

### 依赖解析流程

```
加载 Scene "Level1"：

1. 读取 config.json → 获取 Level1 的 UUID
2. 加载 Level1.scene → 解析发现依赖 Player Prefab
3. 加载 Player Prefab → 发现依赖 PlayerMat
4. 加载 PlayerMat → 发现依赖 PBR Effect 和 PlayerTex
5. ... 递归加载所有依赖

这个过程是自动的：
  - 用户只需要 assetManager.loadScene("Level1")
  - 引擎自动解析并加载整个依赖树
  - 共享资源只加载一次（缓存命中）
```

> 源码 `cocos/asset/asset-manager/bundle.ts` 管理 Bundle 内的资源索引，`asset-manager.ts` 的 `loadAny` 方法递归处理依赖

---

## 延伸阅读

- [Pipeline Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/double-buffer.html) — 虽然讲双缓冲，但管线思想类似
- [Asset Management in Game Engines](https://www.gamedev.tv/) — 游戏资源管理通用讨论
- [Web Fundamentals - Performance](https://web.dev/performance/) — Web 异步加载最佳实践

---

> 理解了这些原理后，继续阅读 [01-AssetManager 核心](./01-asset-manager.md) 查看对应的源码实现。
