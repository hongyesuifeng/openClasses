# 源码结构导览

本文档详细介绍 Cocos Creator 3.8.8 引擎的目录结构和文件组织。

## 目录

- [顶层目录结构](#顶层目录结构)
- [核心目录详解](#核心目录详解)
- [重要配置文件](#重要配置文件)
- [源码阅读优先级](#源码阅读优先级)

---

## 顶层目录结构

```
cocos-engine/
├── cocos/                # 🎯 引擎核心 TypeScript 源代码（重点）
├── pal/                  # 平台抽象层 (Platform Abstraction Layer)
├── exports/              # 模块导出配置（控制引擎裁剪）
├── external/             # 外部依赖库
├── native/               # C++ 原生实现
├── platforms/            # 平台特定工程文件
├── editor/               # 编辑器相关代码
├── extensions/           # 编辑器扩展
├── @types/               # TypeScript 类型定义
├── vendor/               # 第三方库源码
├── scripts/              # 构建和工具脚本
├── tests/                # 测试代码
├── docs/                 # 引擎官方文档
├── templates/            # 项目模板
├── cc.config.json        # 🎯 引擎模块配置（重要）
├── tsconfig.json         # TypeScript 编译配置
└── package.json          # npm 包配置
```

---

## 核心目录详解

### cocos/ - 引擎核心（最重要的目录）

这是引擎的核心实现，**99% 的阅读时间都应该花在这里**。

```
cocos/
├── core/                    # 基础设施层
│   ├── math/                # 数学库（Vec3, Mat4, Quat 等）
│   ├── data/                # 数据管理（CCObject, CCClass）
│   ├── event/               # 事件系统
│   ├── memop/               # 内存操作（对象池）
│   ├── geometry/            # 几何计算（射线、包围盒）
│   ├── curves/              # 曲线系统
│   ├── algorithm/           # 通用算法
│   ├── platform/            # 平台检测
│   ├── utils/               # 工具函数
│   ├── value-types/         # 值类型基类
│   ├── scheduler.ts         # 🎯 调度器（重要）
│   └── system.ts            # 系统基类
│
├── scene-graph/             # 场景图系统
│   ├── node.ts              # 🎯 节点类（最核心，108KB）
│   ├── component.ts         # 🎯 组件基类
│   ├── scene.ts             # 场景管理
│   ├── layers.ts            # 图层系统
│   ├── prefab/              # 预制体系统
│   └── node-event.ts        # 节点事件
│
├── game/                    # 游戏主控制
│   ├── game.ts              # 🎯 游戏主控制器（入口点）
│   ├── director.ts          # 🎯 导演类（场景管理）
│   └── splash-screen.ts     # 启动画面
│
├── gfx/                     # 图形抽象层
│   ├── base/                # 抽象接口定义
│   ├── webgl/               # WebGL 1.0 后端
│   ├── webgl2/              # WebGL 2.0 后端
│   └── webgpu/              # WebGPU 后端
│
├── rendering/               # 渲染系统
│   ├── render-pipeline.ts   # 🎯 渲染管线
│   ├── render-queue.ts      # 渲染队列
│   ├── define.ts            # 渲染定义
│   ├── pipeline-ubo/        # UBO 管理
│   ├── custom/              # 自定义管线
│   └── post-process/        # 后处理
│
├── render-scene/            # 渲染场景
│   ├── core/                # 核心类
│   │   └── render-scene.ts  # 渲染场景
│   └── scene/               # 场景对象
│       ├── camera.ts        # 相机
│       ├── model.ts         # 模型
│       ├── light.ts         # 光源
│       └── skybox.ts        # 天空盒
│
├── 2d/                      # 2D 框架
│   ├── framework/           # 2D 框架核心
│   ├── assets/              # 2D 资源
│   ├── components/          # 2D 组件
│   └── renderer/            # 🎯 2D 渲染器
│       └── batcher-2d.ts    # 批处理器（重要）
│
├── 3d/                      # 3D 框架
│   ├── assets/              # 3D 资源
│   ├── framework/           # 3D 框架核心
│   ├── lights/              # 光源组件
│   ├── models/              # 模型组件
│   ├── skeletal-animation/  # 骨骼动画
│   └── skinned-mesh-renderer/ # 蒙皮渲染器
│
├── animation/               # 动画系统
│   ├── animation-component.ts  # 动画组件
│   ├── animation-clip.ts    # 🎯 动画剪辑（56KB）
│   ├── animation-state.ts   # 动画状态
│   ├── tracks/              # 轨道类型
│   └── marionette/          # 状态机动画
│
├── physics/                 # 3D 物理系统
│   ├── framework/           # 物理框架
│   ├── spec/                # 接口规范
│   ├── cannon/              # Cannon.js 后端
│   ├── bullet/              # Bullet 后端
│   └── physx/               # PhysX 后端
│
├── physics-2d/              # 2D 物理系统
│   ├── framework/           # 2D 物理框架
│   └── box2d/               # Box2D 后端
│
├── asset/                   # 资产管理
│   ├── asset-manager/       # 🎯 资源管理器
│   │   ├── asset-manager.ts # 核心类
│   │   ├── bundle.ts        # 资源包
│   │   ├── cache.ts         # 缓存
│   │   ├── downloader.ts    # 下载器
│   │   └── pipeline.ts      # 加载管线
│   └── assets/              # 资源类型定义
│       ├── texture.ts       # 纹理
│       ├── material.ts      # 材质
│       ├── mesh.ts          # 网格
│       └── ...
│
├── audio/                   # 音频系统
├── input/                   # 输入系统
├── ui/                      # UI 组件
│   ├── button.ts            # 按钮
│   ├── scroll-view.ts       # 滚动视图
│   ├── layout.ts            # 布局
│   └── ...
│
├── particle/                # 3D 粒子系统
├── particle-2d/             # 2D 粒子系统
├── tween/                   # 缓动系统
├── terrain/                 # 地形系统
├── tiledmap/                # 瓦片地图
├── spine/                   # Spine 骨骼动画
├── dragon-bones/            # DragonBones 骨骼动画
├── video/                   # 视频播放
├── web-view/                # WebView
├── gi/                      # 全局光照
├── xr/                      # VR/AR 支持
├── profiler/                # 性能分析
│
├── serialization/           # 序列化系统
├── native-binding/          # 原生绑定辅助
└── root.ts                  # 🎯 渲染器根管理
```

---

## 重要配置文件

### cc.config.json - 引擎模块配置

```json
{
    "engine": {
        "modules": [
            "base",
            "2d",
            "3d",
            "animation",
            "audio",
            "physics-framework",
            // ... 更多模块
        ]
    }
}
```

**作用**：
- 控制哪些模块被编译到引擎中
- 实现引擎裁剪，减少包体大小

### tsconfig.json - TypeScript 配置

```json
{
    "compilerOptions": {
        "target": "ES2015",
        "module": "ESNext",
        "strict": true,
        "sourceMap": true,
        "declaration": true,
        // ...
    }
}
```

---

## 源码阅读优先级

### 第一优先级（必读）

这些文件是引擎的核心，理解它们对掌握整个引擎至关重要：

| 文件 | 大小 | 说明 |
|------|------|------|
| `cocos/scene-graph/node.ts` | ~108KB | 节点系统，场景图核心 |
| `cocos/core/scheduler.ts` | ~46KB | 调度器，帧循环核心 |
| `cocos/animation/animation-clip.ts` | ~56KB | 动画剪辑 |
| `cocos/rendering/define.ts` | ~51KB | 渲染定义 |
| `cocos/game/game.ts` | - | 游戏主控制器 |
| `cocos/game/director.ts` | - | 导演类 |

### 第二优先级（重要）

| 文件 | 说明 |
|------|------|
| `cocos/2d/renderer/batcher-2d.ts` | 2D 批处理 (~48KB) |
| `cocos/rendering/render-pipeline.ts` | 渲染管线 (~34KB) |
| `cocos/scene-graph/component.ts` | 组件基类 |
| `cocos/core/event/eventify.ts` | 事件系统 |
| `cocos/asset/asset-manager/asset-manager.ts` | 资源管理器 |
| `cocos/root.ts` | 渲染器根管理 |

### 第三优先级（按需）

根据你的学习目标选择：
- **渲染方向**：`cocos/gfx/`, `cocos/rendering/`
- **动画方向**：`cocos/animation/`, `cocos/3d/skeletal-animation/`
- **物理方向**：`cocos/physics/`
- **UI 方向**：`cocos/ui/`, `cocos/2d/`

---

## 阅读建议

### 从入口开始

1. **引擎启动**：`cocos/game/game.ts` → `init()` 方法
2. **游戏循环**：`cocos/game/game.ts` → `run()` 方法
3. **场景管理**：`cocos/game/director.ts`
4. **节点系统**：`cocos/scene-graph/node.ts`

### 按功能模块阅读

如果你想了解特定功能，直接跳到对应目录：
- 想了解 Sprite 如何渲染 → `cocos/2d/`
- 想了解动画系统 → `cocos/animation/`
- 想了解物理碰撞 → `cocos/physics/`

---

## 下一步

了解源码结构后，继续阅读 [03-阅读方法](./03-reading-methodology.md) 学习高效的源码阅读技巧。
