# 3D 渲染

3D 渲染系统处理场景中的三维模型、光照、阴影、骨骼动画等高级渲染特性。它在渲染管线的基础上增加了深度感知、光照计算和空间变换。

## 目录

- [架构概述](#架构概述)
- [3D 模型系统](#3d-模型系统)
- [光照系统详解](#光照系统详解)
- [骨骼动画渲染](#骨骼动画渲染)
- [蒙皮网格渲染器](#蒙皮网格渲染器)
- [LOD 系统](#lod-系统)
- [反射探针](#反射探针)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    3D 渲染架构                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              3D 模型管线                           │   │
│  │                                                  │   │
│  │  MeshAsset → Model → SubModel[]                  │   │
│  │                  ├── Pass (Forward/Shadow)        │   │
│  │                  ├── Shader (编译后)               │   │
│  │                  └── InputAssembler (顶点数据)     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  光照系统     │  │  骨骼动画     │  │  高级特性     │  │
│  │  Directional │  │  Skeletal    │  │  LOD         │  │
│  │  Point       │  │  Animation   │  │  Reflection  │  │
│  │  Spot        │  │  Skinning    │  │  Probe       │  │
│  │  Sphere      │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 3D 框架 | `cocos/3d/framework/` | 3D 模型管理 |
| 模型 | `cocos/render-scene/scene/model.ts` | 可渲染模型 |
| 光照 | `cocos/3d/lights/` | 光源组件 |
| 骨骼动画 | `cocos/3d/skeletal-animation/` | 骨骼动画系统 |
| 蒙皮渲染器 | `cocos/3d/skinned-mesh-renderer/` | 蒙皮网格 |
| LOD | `cocos/3d/lod/` | 细节层次 |
| 反射探针 | `cocos/3d/reflection-probe/` | 环境反射 |
| 阴影 | `cocos/rendering/shadow/` | 阴影渲染 |

---

## 3D 模型系统

### Model 类型

```typescript
// cocos/render-scene/scene/model.ts

enum ModelType {
    DEFAULT,       // 默认静态模型
    SKINNING,      // 骨骼动画模型
    BATCH_2D,      // 2D 批次模型
    LINE,          // 线条模型
    PARTICLE,      // 粒子模型
    TERRAIN,       // 地形模型
}
```

### SubModel 子模型

一个 Model 由多个 SubModel 组成，每个 SubModel 对应一个材质：

```
Model (角色模型)
├── SubModel[0] (身体)
│   ├── ia: InputAssembler       ─── 几何数据（顶点+索引）
│   ├── passes: Pass[]           ─── 渲染通道
│   ├── shaders: Shader[]        ─── 编译后的着色器
│   ├── descriptorSet            ─── 资源绑定
│   └── priority: number         ─── 渲染优先级
│
├── SubModel[1] (武器)
│   └── ...
│
└── SubModel[2] (头盔)
    └── ...

_worldBounds: AABB              ─── 世界空间包围盒
_modelBounds: AABB              ─── 模型空间包围盒
```

### 包围盒

```
        ┌──────────┐
       /│          /│
      / │         / │  AABB (Axis-Aligned Bounding Box)
     ┌──────────┐  │  用于视锥剔除和碰撞检测
     │  └───────│──┘
     │ /        │ /
     │/         │/
     └──────────┘
```

---

## 光照系统详解

### 光源组件

3D 光照系统位于 `cocos/3d/lights/` 目录，每个光源都是一个 Component。

| 光源 | 组件类 | 特征 |
|------|--------|------|
| 方向光 | `DirectionalLight` | 平行光线，模拟太阳 |
| 球面光 | `SphereLight` | 向四周发光，有范围限制 |
| 聚光灯 | `SpotLight` | 锥形光束，有角度和范围 |
| 点光源 | `PointLight` | 理论上无限远的小型光源 |
| 范围方向光 | `RangedDirectionalLight` | 有范围限制的方向光 |

### 方向光（主光源）

```typescript
// cocos/render-scene/scene/directional-light.ts

export class DirectionalLight extends Light {
    illuminance: number;         // 照度（lux，默认 65000）
    shadowEnabled: boolean;      // 是否启用阴影
    shadowPcf: number;           // PCF 模糊度
    shadowBias: number;          // 阴影偏移
    shadowNormalBias: number;    // 阴影法线偏移
    shadowSaturation: number;    // 阴影饱和度
    shadowDistance: number;      // 阴影可视距离
}
```

### PBR 光照模型

Cocos Creator 使用基于物理的渲染（PBR），遵循以下光照模型：

```
最终颜色 = 自发光 + 漫反射 + 镜面反射

漫反射 (Lambertian):
  diffuse = albedo × lightColor × max(0, dot(N, L)) / π

镜面反射 (Cook-Torrance):
  specular = D(h) × F(v, h) × G(l, v) / (4 × dot(N, L) × dot(N, V))

其中:
  D - 法线分布函数 (GGX)
  F - 菲涅尔方程 (Schlick)
  G - 几何遮蔽函数 (Smith)
```

---

## 骨骼动画渲染

骨骼动画系统位于 `cocos/3d/skeletal-animation/`，支持基于骨骼的动画驱动。

### 核心文件

| 文件 | 说明 |
|------|------|
| `skeletal-animation.ts` | 骨骼动画组件 |
| `skeletal-animation-state.ts` | 骨骼动画状态 |
| `skeletal-animation-blending.ts` | 动画混合 |
| `skeletal-animation-data-hub.ts` | 数据管理 |

### Socket 系统

Socket 允许将节点绑定到骨骼关节上，跟随骨骼运动：

```typescript
// cocos/3d/skeletal-animation/skeletal-animation.ts

class Socket {
    path: string;    // 骨骼路径（如 "Hips/Spine/RightHand"）
    target: Node;    // 目标节点（跟随骨骼变换）
}
```

### 骨骼动画渲染流程

```
1. SkeletalAnimation.update(dt)
    │
    ├── 更新动画状态（AnimationState）
    │   ├── 采样关键帧
    │   └── 插值计算骨骼变换
    │
    ├── 2. 计算骨骼矩阵
    │   ├── 读取骨骼绑定姿态（inverseBindPose）
    │   ├── 计算当前骨骼世界变换
    │   └── boneMatrix = worldTransform × inverseBindPose
    │
    ├── 3. 上传骨骼数据
    │   └── 更新 Uniform Buffer (UBOSkinning)
    │       └── 最多支持约 256 根骨骼
    │
    └── 4. GPU 蒙皮计算
        └── 在顶点着色器中执行
            vec4 pos = boneWeight.x * boneMat[boneIdx.x] * position
                     + boneWeight.y * boneMat[boneIdx.y] * position
                     + boneWeight.z * boneMat[boneIdx.z] * position
                     + boneWeight.w * boneMat[boneIdx.w] * position;
```

---

## 蒙皮网格渲染器

蒙皮网格渲染器（`SkinnedMeshRenderer`）是骨骼动画专用的渲染器组件。

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 蒙皮渲染器 | `cocos/3d/skinned-mesh-renderer/` | 蒙皮网格渲染组件 |

### 蒙皮网格 vs 静态网格

| 特性 | StaticMesh | SkinnedMesh |
|------|-----------|-------------|
| 顶点数据 | 固定不变 | 每帧由骨骼驱动变化 |
| 渲染器 | MeshRenderer | SkinnedMeshRenderer |
| 着色器 | 标准 PBR | 带骨骼权重 |
| 性能 | 较高 | 较低（需计算骨骼） |
| 适用 | 场景物体 | 角色动画 |

---

## LOD 系统

LOD（Level of Detail）根据相机距离自动切换模型的精细度，优化远处物体的渲染性能。

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| LODGroup | `cocos/render-scene/scene/lod-group.ts` | LOD 组 |
| LOD | `cocos/3d/lod/` | LOD 级别 |

### LOD 工作原理

```
距离近                    距离中                    距离远
┌──────────┐         ┌──────────┐         ┌──────────┐
│  LOD 0   │  ───→   │  LOD 1   │  ───→   │  LOD 2   │
│ 10000 面  │  过渡点  │  3000 面  │  过渡点  │   500 面  │
└──────────┘         └──────────┘         └──────────┘

当相机距离 < threshold[0] → 使用 LOD 0（最高精度）
当相机距离 < threshold[1] → 使用 LOD 1
当相机距离 ≥ threshold[1] → 使用 LOD 2（最低精度）
```

---

## 反射探针

反射探针（Reflection Probe）用于捕获环境反射，增强 PBR 材质的真实感。

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 反射探针 | `cocos/3d/reflection-probe/` | 环境反射组件 |
| 渲染 | `cocos/rendering/reflection-probe/` | 探针渲染 |

### 反射探针类型

| 类型 | 说明 |
|------|------|
| Cubemap | 六面体捕获，适合室内 |
| Planar | 平面反射，适合地面/水面 |

---

## 技术原理

### 1. 前向渲染 vs 延迟渲染

```
前向渲染（Forward）:
  对每个像素，逐光源计算光照
  ┌─────────────────────────────────────────┐
  │ for each object:                        │
  │     for each light:                     │
  │         compute lighting → 写入颜色缓冲 │
  └─────────────────────────────────────────┘
  优点：简单，兼容 WebGL 1
  缺点：多光源时性能下降（光源数 × 物体数）

延迟渲染（Deferred）:
  先输出几何信息到 G-Buffer，再统一计算光照
  ┌─────────────────────────────────────────┐
  │ Pass 1: 输出 G-Buffer (位置/法线/材质)   │
  │ Pass 2: 基于 G-Buffer 计算所有光照       │
  └─────────────────────────────────────────┘
  优点：光源数量独立于物体数量
  缺点：需要 WebGL2+，内存开销大
```

### 2. GPU 蒙皮（GPU Skinning）

骨骼动画的计算在 GPU 端完成，避免 CPU 端逐顶点计算的瓶颈：

```
CPU 端:
  1. 采样动画关键帧
  2. 计算骨骼矩阵数组 (最多 ~256 根)
  3. 上传到 Uniform Buffer

GPU 端（顶点着色器）:
  1. 读取顶点的骨骼权重和索引
  2. 矩阵加权混合
  3. 输出变换后的顶点位置
```

### 3. 场景剔除与可见性

3D 渲染的关键优化是尽量减少需要绘制的对象：
- **AABB 视锥测试**：用包围盒与 6 个裁剪面做相交测试
- **距离剔除**：超过最大可视距离的对象不渲染
- **LOD 选择**：根据距离选择合适的精度级别

---

## 下一步

完成 3D 渲染的学习后，继续学习 [04-功能模块](../04-functional-modules/README.md)。
