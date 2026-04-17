# JSB 原生绑定

JSB（JavaScript Binding）是 Cocos Creator 实现 TypeScript 与 C++ 原生代码通信的桥接机制。它使引擎能够利用 C++ 的高性能处理渲染、物理等计算密集型任务。

## 目录

- [JSB 桥接机制](#jsb-桥接机制)
- [Native 目录结构](#native-目录结构)
- [CMake 构建系统](#cmake-构建系统)
- [TS 与 C++ 通信](#ts-与-c-通信)
- [技术原理](#技术原理)

---

## JSB 桥接机制

### 双层架构

```
┌─────────────────────────────────────────────────────────┐
│                   TypeScript 层                          │
│                                                         │
│  cocos/gfx/base/device.ts (抽象类)                       │
│  cocos/physics/framework/ (物理接口)                     │
│  cocos/audio/audio-source.ts (音频源)                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                   JSB 绑定层                             │
│                                                         │
│  自动生成的绑定代码                                       │
│  JavaScript 对象 ←→ C++ 对象                             │
│  JS 函数调用 ←→ C++ 方法执行                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                   C++ 原生层                             │
│                                                         │
│  native/cocos/renderer/ (GFX 渲染)                       │
│  native/cocos/physics/ (物理引擎)                        │
│  native/cocos/audio/ (音频引擎)                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                   平台 SDK                               │
│  OpenGL ES / Metal / Vulkan / D3D                       │
│  OpenAL / ALSA                                          │
└─────────────────────────────────────────────────────────┘
```

### 数据流向

```
TS 调用: device.createBuffer(info)
    │
    ▼ JSB 绑定
C++ 执行: Device->createBuffer(info)
    │
    ├── 创建 GPU Buffer
    └── 返回 Buffer 指针
    │
    ▼ JSB 绑定
TS 获得: Buffer 实例 (JS 包装对象)
```

---

## Native 目录结构

```
native/
├── cocos/                 # Cocos C++ 引擎
│   ├── 2d/                # 2D 渲染绑定
│   ├── 3d/                # 3D 渲染绑定
│   ├── application/       # 应用程序生命周期
│   ├── audio/             # 音频引擎 (OpenAL)
│   ├── base/              # 基础模块
│   ├── bindings/          # JSB 绑定文件
│   │   └── jswrapper/     # JS 引擎抽象层
│   ├── core/              # 核心功能
│   ├── engine/            # 引擎管理
│   ├── math/              # 数学库 (Vec3, Mat4 等)
│   ├── network/           # 网络模块
│   ├── physics/           # 物理引擎
│   │   ├── bullet/        # Bullet 物理后端
│   │   └── physx/         # PhysX 物理后端
│   ├── platform/          # 平台适配
│   │   ├── android/       # Android 平台
│   │   ├── ios/           # iOS 平台
│   │   ├── mac/           # macOS 平台
│   │   └── win32/         # Windows 平台
│   ├── renderer/          # 渲染器 (GFX C++ 实现)
│   │   └── gfx/           # GFX 后端
│   │       ├── gl/        # OpenGL ES
│   │       ├── metal/     # Metal (iOS/macOS)
│   │       └── vulkan/    # Vulkan
│   ├── scene/             # 场景管理
│   ├── storage/           # 存储
│   └── ui/                # UI 绑定
├── extensions/            # 扩展
├── tests/                 # 测试
├── tools/                 # 工具
├── vendor/                # 第三方库
│   ├── bullet/            # Bullet 物理引擎源码
│   ├── physx/             # PhysX 源码
│   └── ...                # 其他依赖
├── cmake/                 # CMake 模块
└── CMakeLists.txt         # 主构建文件
```

---

## CMake 构建系统

Native 层使用 CMake 构建：

```
native/CMakeLists.txt
    │
    ├── 定义引擎源文件
    ├── 链接第三方库
    │   ├── Bullet / PhysX (物理)
    │   ├── OpenAL (音频)
    │   └── OpenGL / Metal / Vulkan (渲染)
    │
    ├── 按平台条件编译
    │   ├── Android: NDK, Gradle
    │   ├── iOS: Xcode, Metal
    │   └── Windows: MSVC, D3D
    │
    └── 生成产物
        ├── Android: .so 动态库
        ├── iOS: .framework
        └── Windows: .dll
```

---

## TS 与 C++ 通信

### JSB 绑定代码生成

```
C++ 类定义:
  class Device {
      Buffer* createBuffer(const BufferInfo& info);
  }

          ↓ 绑定代码生成器

JS 绑定:
  se::Class* cls = se::Class::create("Device", ...);
  cls->defineFunction("createBuffer", _SE(js_device_createBuffer));
  cls->install();
```

### 数据类型映射

| TypeScript | JSB | C++ |
|-----------|-----|-----|
| `number` | `number` | `int`, `float`, `double` |
| `string` | `string` | `std::string` |
| `boolean` | `boolean` | `bool` |
| `Object` | `object` | `se::Object*` |
| `ArrayBuffer` | `ArrayBuffer` | `uint8_t*` |
| `Function` | `function` | `se::Value` (回调) |

### 调用流程

```
1. TS 层调用
   device.createBuffer({ size: 1024, usage: VERTEX });

2. JSB 桥接
   js_device_createBuffer(se::State& s) {
       // 从 JS 参数提取 C++ 数据
       BufferInfo info;
       info.size = s.args()[0].toNumber("size");
       info.usage = s.args()[0].toNumber("usage");

       // 调用 C++ 方法
       Buffer* buffer = nativeDevice->createBuffer(info);

       // 将 C++ 结果包装为 JS 对象返回
       se::Object* jsObj = wrapNativeObject(buffer);
       s.rval().setObject(jsObj);
   }

3. C++ 层执行
   Buffer* Device::createBuffer(const BufferInfo& info) {
       // 创建 OpenGL/Vulkan/Metal Buffer
       GLuint glBuffer;
       glGenBuffers(1, &glBuffer);
       glBufferData(GL_ARRAY_BUFFER, info.size, NULL, GL_STATIC_DRAW);
       return new GLBuffer(glBuffer);
   }
```

---

## 技术原理

### 1. JS 引擎抽象层（jswrapper）

Cocos 使用 `jswrapper` 抽象不同 JS 引擎的差异：

```
jswrapper (抽象层)
├── v8/          Chrome V8 (Android)
├── jsc/         JavaScriptCore (iOS/macOS)
└── spidermonkey/  SpiderMonkey (部分平台)

统一的 API:
  se::Class::create()
  se::Object::setProperty()
  se::Value::toNumber()
```

### 2. 对象生命周期管理

```
JS 对象与 C++ 对象的生命周期绑定:

JS 对象创建 → C++ 对象创建
JS 对象引用 → C++ 对象存活
JS GC 回收 → C++ 析构函数调用

通过 WeakRef 和 Finalizer 实现:
  se::Object::setFinalizeCallback([](se::Object* obj) {
      // C++ 对象清理
      delete nativePtr;
  });
```

### 3. Web 平台降级

在 Web 平台（无 JSB），C++ 功能由 TypeScript 重新实现：

```
原生平台: TS → JSB → C++ → OpenGL/Metal
Web 平台:  TS → WebGL/WebGPU 直接调用

gfx/base/ 中的抽象类在 Web 平台使用
gfx/webgl/ 或 gfx/webgl2/ 的纯 TS 实现
```

---

## 下一步

完成平台抽象层章节后，继续学习 [08-高级主题](../08-advanced-topics/README.md)。
