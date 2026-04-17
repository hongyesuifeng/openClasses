# 知识点索引

本文档按主题分类整理 Cocos Creator 引擎的核心知识点。

## 目录

- [基础概念](#basic-concepts)
- [数学与几何](#math-and-geometry)
- [场景与节点](#scene-and-node)
- [组件系统](#component-system)
- [渲染系统](#rendering-system)
- [动画系统](#animation-system)
- [物理系统](#physics-system)
- [资源管理](#asset-management)
- [性能优化](#performance-optimization)

---

## 基础概念

### 引擎架构

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| 双层架构 | TypeScript + C++ 双层设计 | `cocos/`, `native/` |
| 组件化 | Node-Component 架构 | `node.ts`, `component.ts` |
| 模块化 | 按需加载引擎模块 | `exports/` |
| 平台抽象 | PAL 平台抽象层 | `pal/` |

### 生命周期

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| 游戏初始化 | `Game.init()` 流程 | `game.ts` |
| 游戏循环 | `Game.tick()` 主循环 | `game.ts` |
| 场景生命周期 | `onLoad` → `start` → `update` → `onDestroy` | `component.ts` |
| 组件调度 | `ComponentScheduler` 调度器 | `component-scheduler.ts` |

---

## 数学与几何

### 向量运算

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Vec2/Vec3/Vec4 | 2D/3D/4D 向量 | `core/math/vec*.ts` |
| 向量加/减/乘 | 基本运算 | `vec*.ts` |
| 点积/叉积 | 向量乘法 | `Vec3.dot()`, `Vec3.cross()` |
| 归一化 | 单位向量 | `Vec3.normalize()` |
| 线性插值 | Lerp 插值 | `Vec3.lerp()` |

### 矩阵变换

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Mat3/Mat4 | 3x3/4x4 矩阵 | `core/math/mat*.ts` |
| 平移矩阵 | Translation | `Mat4.fromTranslation()` |
| 旋转矩阵 | Rotation | `Mat4.fromQuat()` |
| 缩放矩阵 | Scale | `Mat4.fromScaling()` |
| TRS 组合 | Translation-Rotation-Scale | `Mat4.fromRTS()` |
| 矩阵乘法 | 变换组合 | `Mat4.multiply()` |
| 逆矩阵 | 逆变换 | `Mat4.invert()` |

### 四元数

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Quat | 四元数 | `core/math/quat.ts` |
| 欧拉角转换 | Euler ↔ Quat | `Quat.fromEuler()` |
| 轴角转换 | Axis-Angle ↔ Quat | `Quat.fromAxisAngle()` |
| 球面插值 | SLERP | `Quat.slerp()` |

### 几何计算

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Ray | 射线 | `core/geometry/ray.ts` |
| AABB | 轴对齐包围盒 | `core/geometry/aabb.ts` |
| OBB | 方向包围盒 | `core/geometry/obb.ts` |
| 视锥体 | Frustum | `core/geometry/frustum.ts` |
| 射线检测 | Ray-AABB, Ray-Triangle | `geometry/` |

---

## 场景与节点

### 节点系统

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Node 基类 | 场景节点基类 | `scene-graph/node.ts` |
| 层级管理 | parent/children 关系 | `Node.addChild()` |
| 空间变换 | position/rotation/scale | `node.ts` |
| 世界坐标 | worldPosition/worldMatrix | `node.ts` |
| 脏标志 | TransformBit 延迟更新 | `node.ts` |
| 图层系统 | Layers 32位掩码 | `layers.ts` |

### 组件系统

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Component | 组件基类 | `scene-graph/component.ts` |
| 生命周期 | onLoad/start/update/... | `component.ts` |
| 获取组件 | getComponent/getComponents | `component.ts` |
| 组件调度 | ComponentScheduler | `component-scheduler.ts` |

### 场景管理

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Scene | 场景类 | `scene-graph/scene.ts` |
| Director | 场景管理器 | `game/director.ts` |
| 场景加载 | loadScene/runScene | `director.ts` |
| 预制体 | Prefab 实例化 | `scene-graph/prefab/` |

---

## 组件系统

### 内置组件

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Sprite | 2D 精灵 | `2d/framework/sprite.ts` |
| Label | 文本 | `2d/framework/label.ts` |
| Mask | 遮罩 | `2d/framework/mask.ts` |
| Camera | 相机 | `3d/framework/camera-component.ts` |
| MeshRenderer | 3D 网格渲染器 | `3d/framework/mesh-renderer.ts` |
| Light | 光源组件 | `3d/lights/` |

### 自定义组件

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| @ccclass | 类装饰器 | `core/data/decorators/` |
| @property | 属性装饰器 | `core/data/decorators/` |
| 生命周期 | 实现生命周期方法 | `component.ts` |

---

## 渲染系统

### GFX 抽象层

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Device | GPU 设备 | `gfx/base/device.ts` |
| Buffer | 缓冲区 | `gfx/base/buffer.ts` |
| Texture | 纹理 | `gfx/base/texture.ts` |
| Shader | 着色器 | `gfx/base/shader.ts` |
| PipelineState | 管线状态 | `gfx/base/pipeline-state.ts` |
| CommandBuffer | 命令缓冲 | `gfx/base/command-buffer.ts` |
| Framebuffer | 帧缓冲 | `gfx/base/framebuffer.ts` |

### 渲染管线

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| RenderPipeline | 渲染管线 | `rendering/render-pipeline.ts` |
| RenderPass | 渲染通道 | `rendering/render-pass.ts` |
| RenderQueue | 渲染队列 | `rendering/render-queue.ts` |
| Forward 渲染 | 前向渲染 | `rendering/` |
| Deferred 渲染 | 延迟渲染 | `rendering/` |
| 阴影 | Shadow Mapping | `rendering/shadow/` |

### 2D 渲染

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| Batcher2D | 2D 批处理 | `2d/renderer/batcher-2d.ts` |
| 合批 | 减少 DrawCall | `batcher-2d.ts` |
| 顶点数据 | Vertex Buffer | `2d/renderer/` |
| 图集 | Sprite Atlas | `2d/assets/` |

---

## 动画系统

### 动画基础

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| AnimationClip | 动画剪辑 | `animation/animation-clip.ts` |
| AnimationState | 动画状态 | `animation/animation-state.ts` |
| AnimationComponent | 动画组件 | `animation/animation-component.ts` |
| 关键帧 | Keyframe | `animation/` |
| 轨道 | Track | `animation/tracks/` |

### 高级动画

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| 骨骼动画 | Skeletal Animation | `3d/skeletal-animation/` |
| 蒙皮 | Skinning | `3d/skinned-mesh-renderer/` |
| 状态机 | Animation Graph | `animation/marionette/` |
| 混合 | Blend Tree | `animation/marionette/` |

---

## 物理系统

### 3D 物理

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| PhysicsSystem | 物理系统 | `physics/framework/physics-system.ts` |
| RigidBody | 刚体 | `physics/framework/rigid-body.ts` |
| Collider | 碰撞器 | `physics/framework/collider.ts` |
| 射线检测 | Raycast | `physics/framework/` |
| 物理引擎 | Cannon/Bullet/PhysX | `physics/cannon/`, `physics/bullet/` |

---

## 资源管理

### 资源加载

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| AssetManager | 资源管理器 | `asset/asset-manager/asset-manager.ts` |
| Bundle | 资源包 | `asset/asset-manager/bundle.ts` |
| Pipeline | 加载管线 | `asset/asset-manager/pipeline.ts` |
| Cache | 缓存 | `asset/asset-manager/cache.ts` |
| 依赖解析 | Dependency | `asset/asset-manager/depend-util.ts` |

---

## 性能优化

### 内存优化

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| 对象池 | Pool | `core/memop/pool.ts` |
| 引用计数 | Ref Count | `core/data/object.ts` |
| 资源释放 | Release | `asset/asset-manager/release-manager.ts` |

### 渲染优化

| 知识点 | 说明 | 相关文件 |
|--------|------|----------|
| 视锥剔除 | Frustum Culling | `render-scene/` |
| 批处理 | Batching | `2d/renderer/batcher-2d.ts` |
| LOD | Level of Detail | `3d/` |
| 合批 | DrawCall 合并 | `rendering/` |

---

## 快速查找

### 按问题查找

| 问题 | 解决方案 | 相关文档 |
|------|----------|----------|
| 如何添加子节点 | `node.addChild()` | [节点系统](../02-scene-graph/01-node-system.md) |
| 如何获取组件 | `getComponent()` | [组件系统](../02-scene-graph/02-component-system.md) |
| 如何加载场景 | `director.loadScene()` | [场景生命周期](../02-scene-graph/03-scene-lifecycle.md) |
| 如何加载资源 | `assetManager.load()` | [资源管理](../05-asset-management/01-asset-manager.md) |
| 如何播放动画 | `animation.play()` | [动画系统](../04-functional-modules/01-animation-system.md) |
| 如何优化内存 | 使用对象池 | [内存管理](../01-core-foundation/03-memory-management.md) |
| 如何优化渲染 | 合批、剔除 | [渲染系统](../03-rendering/) |
