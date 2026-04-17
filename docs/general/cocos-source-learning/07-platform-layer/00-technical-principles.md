# 技术原理：跨平台引擎的底层机制

> 平台抽象层（PAL）和 JSB 桥接是 Cocos Creator 实现跨平台的核心。在阅读源码之前，先理解硬件抽象层、JS 绑定技术和跨平台编译的原理。

---

## 目录

- [1. 硬件抽象层（HAL）原理](#1-硬件抽象层hal原理)
- [2. JavaScript 引擎与绑定技术](#2-javascript-引擎与绑定技术)
- [3. 跨平台编译与条件加载](#3-跨平台编译与条件加载)
- [4. 原生渲染后端](#4-原生渲染后端)

---

## 1. 硬件抽象层（HAL）原理

### 什么是 HAL

硬件抽象层（Hardware Abstraction Layer）是操作系统和硬件之间的中间层。在游戏引擎中，**平台抽象层（PAL）** 是类似的概念：

```
问题：
  引擎需要在不同平台运行，但各平台的 API 完全不同：

  音频：
    Web:    Web Audio API
    Android: MediaPlayer / OpenSL ES
    iOS:    AVAudioEngine
    微信:   wx.createInnerAudioContext()

  文件：
    Web:    fetch() / XMLHttpRequest
    Android: java.io.File
    iOS:    NSFileManager
    微信:   wx.getFileSystemManager()

  解决：PAL 提供统一接口
```

### PAL 的设计模式

```
              ┌──────────────────────────┐
              │     统一接口层 (Interface) │
              │     pal/audio.ts          │
              │     pal/input.ts          │
              │     pal/screen.ts         │
              └────────────┬─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │  Web 实现     │ │ 原生实现      │ │ 小游戏实现    │
  │  (Web Audio) │ │ (C++ Audio)  │ │ (wx API)    │
  └──────────────┘ └──────────────┘ └──────────────┘
```

### PAL 的接口设计原则

```
1. 最小公共接口
   只定义所有平台都能实现的功能
   特定平台的扩展功能通过能力查询暴露

2. 运行时检测
   if (sys.platform === Platform.WECHAT_GAME) {
       // 使用微信特有 API
   }

3. 编译时替换
   构建时只打包目标平台的实现代码
   减少包体积
```

> 源码 `pal/` 目录下的每个模块都有 `web/`、`minigame/`、`native/` 等子目录，分别对应不同平台的实现

---

## 2. JavaScript 引擎与绑定技术

### JavaScript 引擎概述

```
JavaScript 引擎的工作流程：

JavaScript 源码
    │
    ▼ 解析
AST (抽象语法树)
    │
    ▼ 编译
字节码 (Bytecode)
    │
    ▼ 执行
机器码 (Machine Code)

主流 JS 引擎：
  V8 (Chrome, Node.js)     ← Cocos 原生平台使用
  JavaScriptCore (Safari)  ← iOS 默认
  SpiderMonkey (Firefox)
  QuickJS (轻量级)
```

### JSB (JavaScript Binding) 原理

#### 为什么需要 JSB

```
Web 平台：JavaScript 直接调用 WebGL
  JS 代码 → WebGL API → GPU

原生平台：JavaScript 不能直接调用 OpenGL/Metal
  JS 代码 → ??? → GPU

解决方案：JSB
  JS 代码 → JSB 桥接 → C++ 代码 → OpenGL/Metal → GPU
```

#### JSB 的工作机制

```
┌─────────────────────────────────────────────────┐
│                 JavaScript 层                    │
│                                                 │
│   device.copyTexture(srcTex, dstTex)            │
│          │                                      │
├──────────┼──────────────────────────────────────┤
│          ▼                                      │
│   JSB 绑定层 (自动生成的胶水代码)                  │
│                                                 │
│   1. JS 函数调用 → 提取参数                       │
│   2. JS 值 → C++ 类型转换                        │
│      jsval → int, float, string, object...      │
│   3. 调用对应的 C++ 方法                          │
│   4. C++ 返回值 → JS 值                          │
│      int, float → jsval                         │
│                                                 │
├─────────────────────────────────────────────────┤
│                 C++ 原生层                        │
│                                                 │
│   Device::copyTexture(srcTex, dstTex)           │
│       │                                         │
│       ├── OpenGL ES / Metal / Vulkan            │
│       └── 平台特定的 GPU 调用                     │
└─────────────────────────────────────────────────┘
```

#### 值类型转换

```
JSB 中的关键挑战——JS 和 C++ 的类型映射：

JavaScript          C++
─────────           ──────
number         →    int / float / double
string         →    std::string / const char*
boolean        →    bool
null/undefined →    nullptr
Array          →    std::vector / se::Array
Object         →    自定义 C++ 对象指针
Function       →    std::function / se::Function

反方向同理：C++ 返回值需要转换为 JS 类型
```

#### 自动绑定生成

```
手动写绑定代码 = 极其繁琐（引擎有数千个 API）

Cocos 使用工具自动生成绑定：

  C++ 头文件 → 绑定生成器 → JSB 胶水代码

  // C++ 头文件
  class Device {
      void copyTexture(Texture* src, Texture* dst);
  };

  // 自动生成的 JSB 代码（简化）
  SE_BIND_FUNC(Device_copyTexture) {
      Texture* src = (Texture*)args[0]->getNativePtr();
      Texture* dst = (Texture*)args[1]->getNativePtr();
      self->copyTexture(src, dst);
      return true;
  }
```

> 源码 `native/cocos/bindings/` 目录包含自动生成的 JSB 绑定代码。工具本身在 `native/tools/` 中

### JSB 的性能特征

```
JSB 调用的开销：

  一次 JSB 调用 ≈ 0.001ms（微秒级）
  60 FPS 时每帧 ≈ 16.67ms
  如果每帧有 1000 次 JSB 调用 → 1ms → 约 6% 的帧预算

优化策略：
  1. 批量操作：一次 JSB 调用处理多个对象
  2. 减少跨层调用：在 C++ 层做更多逻辑
  3. 缓存结果：避免重复的 JSB 查询
```

---

## 3. 跨平台编译与条件加载

### 条件编译

```
TypeScript 没有原生的条件编译（如 C 的 #ifdef）
Cocos 使用以下技术实现类似效果：

1. 构建时替换：
   构建工具根据目标平台选择不同的文件
   import { Audio } from 'pal/audio/web'
   → 构建时替换为 pal/audio/minigame

2. 运行时判断：
   if (sys.platform === sys.Platform.WECHAT_GAME) {
       // 小游戏特定代码
   }

3. 模块系统：
   @ccclass('cc.AudioSource')  // 跨平台公共 API
   内部根据平台选择不同实现
```

### 平台特性适配

```
不同平台的能力差异：

              Web   iOS   Android  微信
  WebGL       ✅    ❌     ❌      ❌
  WebGL2      ✅    ❌     ❌      ❌
  WebGPU      🔶    ❌     ❌      ❌
  OpenGL ES   ❌    ✅     ✅      ❌
  Metal       ❌    ✅     ❌      ❌
  Vulkan      ❌    ❌     ✅      ❌
  Web Audio   ✅    ❌     ❌      ❌
  OpenSL ES   ❌    ❌     ✅      ❌
  wx API      ❌    ❌     ❌      ✅

PAL 层的作用就是屏蔽这些差异
```

---

## 4. 原生渲染后端

### C++ 原生渲染架构

```
┌─────────────────────────────────────────────────┐
│              TypeScript 渲染接口                  │
│         (cocos/gfx/base/ 抽象接口)                │
└──────────────────┬──────────────────────────────┘
                   │ JSB 桥接
┌──────────────────▼──────────────────────────────┐
│              C++ GFX 实现                         │
│         (native/cocos/gfx/)                      │
│                                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│   │  GLES3   │ │  Metal   │ │  Vulkan  │        │
│   │ (Android │ │  (iOS/   │ │(Android/ │        │
│   │  /Web)   │ │  macOS)  │ │  Win)    │        │
│   └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────┘
```

### 为什么原生渲染更快

```
Web 平台渲染路径：
  TS 代码 → JS 引擎 → WebGL JS 绑定 → 浏览器 → GPU

原生平台渲染路径：
  TS 代码 → JSB → C++ → 直接调用 GPU API

原生更快的理由：
  1. 无浏览器中间层
  2. C++ 直接控制 GPU，无 JS 开销
  3. 可以使用多线程渲染
  4. 内存管理更高效（无 GC）
  5. 可使用底层优化（如 Metal 的统一内存架构）
```

---

## 延伸阅读

- [V8 Engine Internals](https://v8.dev/blog) — V8 引擎官方博客
- [JSB 2.0 Architecture](https://docs.cocos.com/creator/manual/zh/advanced-topics/JSB.html) — Cocos JSB 文档
- [HAL (Hardware Abstraction Layer)](https://en.wikipedia.org/wiki/Hardware_abstraction) — HAL 概念

---

> 理解了这些原理后，继续阅读 [01-PAL 架构](./01-pal-architecture.md) 查看对应的源码实现。
