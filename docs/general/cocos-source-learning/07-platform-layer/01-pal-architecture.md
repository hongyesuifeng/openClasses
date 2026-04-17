# PAL 平台抽象层

PAL（Platform Abstraction Layer）将平台相关的底层功能抽象为统一接口，使引擎核心代码与具体平台解耦。

## 目录

- [PAL 目录结构](#pal-目录结构)
- [核心模块](#核心模块)
- [cocos/core/platform 平台 API](#cocoscoreplatform-平台-api)
- [多平台实现策略](#多平台实现策略)
- [技术原理](#技术原理)

---

## PAL 目录结构

```
pal/
├── audio/                    # 音频抽象
│   ├── audio-buffer-manager.ts
│   ├── audio-timer.ts
│   ├── web/                 # Web 平台 (Web Audio API)
│   ├── native/              # 原生平台 (OpenAL)
│   └── minigame/            # 小游戏平台
├── input/                    # 输入抽象
│   ├── input-source.ts
│   ├── keycodes.ts
│   ├── touch-manager.ts
│   ├── web/
│   ├── native/
│   └── minigame/
├── screen-adapter/          # 屏幕适配
│   ├── web/
│   ├── native/
│   └── minigame/
├── system-info/             # 系统信息
│   ├── web/
│   ├── native/
│   └── minigame/
├── env/                     # 环境检测
├── pacer/                   # 节流器
├── minigame/                # 小游戏通用
├── wasm/                    # WebAssembly 支持
├── integrity-check.ts       # 完整性检查
└── utils.ts                 # 工具函数
```

---

## 核心模块

### 1. Audio 音频 PAL

```typescript
// pal/audio/ 提供统一的音频播放接口

// Web 平台: 使用 Web Audio API
// - AudioContext → AudioBufferSourceNode → GainNode → destination
// - 支持精确的音频控制和低延迟

// Native 平台: 使用 OpenAL
// - ALDevice → ALContext → ALSource → ALBuffer
// - 高性能原生音频

// Minigame 平台: 使用平台 Audio API
// - wx.createInnerAudioContext()
// - 平台特定的音频接口
```

### 2. Input 输入 PAL

```typescript
// pal/input/ 提供统一的输入事件接口

// Web 平台:
//   document.addEventListener('keydown/keyup')
//   canvas.addEventListener('mousedown/mousemove/mouseup')
//   canvas.addEventListener('touchstart/touchmove/touchend')

// Native 平台:
//   iOS: UIResponder → touchBegan/moved/ended
//   Android: MotionEvent/KeyEvent → JNI → TS

// Minigame 平台:
//   wx.onTouchStart/onTouchMove/onTouchEnd
```

### 3. Screen Adapter 屏幕适配

```typescript
// pal/screen-adapter/ 管理屏幕分辨率和适配

// Web:
//   window.innerWidth / innerHeight
//   window.devicePixelRatio
//   canvas 尺寸调整

// Native:
//   UIScreen.main.bounds (iOS)
//   DisplayMetrics (Android)

// Minigame:
//   wx.getSystemInfoSync().screenWidth/Height
```

### 4. System Info 系统信息

```typescript
// pal/system-info/ 提供设备和系统信息

interface SystemInfo {
    os: string;           // 操作系统
    osVersion: string;    // 系统版本
    browserType: string;  // 浏览器类型
    networkType: string;  // 网络类型
    isNative: boolean;    // 是否原生平台
    isMobile: boolean;    // 是否移动设备
    language: string;     // 系统语言
}
```

---

## cocos/core/platform 平台 API

`cocos/core/platform/` 提供引擎级别的平台 API：

### sys 全局对象

```typescript
// cocos/core/platform/sys.ts (~13827行)

export const sys = {
    // ─── 平台信息 ───
    isNative: boolean;         // 是否原生
    isMobile: boolean;         // 是否移动端
    os: OS;                    // 操作系统枚举
    osVersion: string;         // 系统版本
    browserType: BrowserType;  // 浏览器类型

    // ─── 语言 ───
    language: string;          // 系统语言

    // ─── 功能检测 ───
    hasFeature(feature): boolean;  // 检测设备特性

    // ─── 平台枚举 ───
    // OS: ANDROID, IOS, WINDOWS, MACOS, LINUX, OHOS
    // BrowserType: CHROME, FIREFOX, SAFARI, WECHAT, BYTEDANCE
};
```

### screen 屏幕管理

```typescript
// cocos/core/platform/screen.ts (~10385行)

export const screen = {
    windowSize: Size;           // 窗口大小
    devicePixelRatio: number;   // 设备像素比
    orientation: Orientation;   // 屏幕方向

    // ─── 方法 ───
    adaptToWindow(): void;      // 适配到窗口
    init(): void;               // 初始化
};
```

### debug 调试系统

```typescript
// cocos/core/platform/debug.ts (~14475行)

export const debug = {
    // ─── 日志级别 ───
    log(...msg): void;          // 普通日志
    warn(...msg): void;         // 警告
    error(...msg): void;        // 错误
    assert(condition, msg): void;  // 断言

    // ─── 性能 ───
    setStatisticDisplay(show): void;  // 显示统计信息
    getDisplayStats(): boolean;
};
```

---

## 多平台实现策略

### 编译时选择

```typescript
// 通过条件导入选择平台实现

// pal/audio/index.ts
import { Audio } from './web/audio';        // Web
import { Audio } from './native/audio';     // Native
import { Audio } from './minigame/audio';   // Minigame

// 构建时由打包工具根据目标平台选择正确的实现
```

### 运行时检测

```typescript
// 部分功能在运行时根据环境选择实现

if (sys.isNative) {
    // 使用原生实现
} else if (typeof wx !== 'undefined') {
    // 使用微信小游戏实现
} else {
    // 使用 Web 实现
}
```

---

## 技术原理

### 1. 适配器模式（Adapter Pattern）

PAL 层本质上是适配器模式的应用：

```
Target (统一接口)
    │
    └── Adapter (PAL 层)
        ├── WebAdapter     ──→ Web Audio API / DOM Event
        ├── NativeAdapter  ──→ OpenAL / JNI
        └── MinigameAdapter ──→ wx Audio / wx Touch
```

### 2. 接口隔离

每个 PAL 模块只暴露必要的接口，避免平台特定 API 泄漏到上层：

```
PAL Audio 暴露的接口:
  play(), pause(), stop(), setVolume(), setCurrentTime()

隐藏的平台差异:
  Web: AudioContext, AudioBufferSourceNode
  Native: ALDevice, ALContext, ALSource
  Minigame: InnerAudioContext
```

### 3. WASM 加速

部分计算密集型功能通过 WebAssembly 加速：

```typescript
// pal/wasm/ 提供 WASM 加载和管理

// 使用场景:
// - 物理计算 (PhysX WASM)
// - 图片解码
// - 纹理压缩/解压
```

---

## 下一步

完成 PAL 架构的学习后，继续学习 [02-JSB 原生绑定](./02-jsb-binding.md)。
