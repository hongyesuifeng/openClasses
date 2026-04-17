# 自定义渲染管线

自定义渲染管线（Custom Pipeline）是 Cocos Creator 3.8 提供的高级渲染架构，允许开发者使用渲染图（Render Graph）灵活定义渲染流程。

## 目录

- [架构概述](#架构概述)
- [核心概念](#核心概念)
- [Render Graph 渲染图](#render-graph-渲染图)
- [Scene Culling 场景剔除](#scene-culling-场景剔除)
- [如何使用自定义管线](#如何使用自定义管线)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                Custom Pipeline 架构                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Pipeline                        │   │
│  │              (管线主控制器)                        │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────┴─────────────────────────────────────┐   │
│  │              Compiler (编译器)                    │   │
│  │  将渲染图编译为可执行的计划                        │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────┴─────────────────────────────────────┐   │
│  │              Executor (执行器)                    │   │
│  │  执行编译后的渲染计划                              │   │
│  └────────────┬─────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────┴─────────────────────────────────────┐   │
│  │           Render Graph (渲染图)                    │   │
│  │  数据驱动的渲染流程定义                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 管线 | `cocos/rendering/custom/pipeline.ts` | 自定义管线 |
| 编译器 | `cocos/rendering/custom/compiler.ts` | 编译器 |
| 执行器 | `cocos/rendering/custom/executor.ts` | 执行器 |
| 渲染图 | `cocos/rendering/custom/render-graph.ts` | Render Graph |
| 图系统 | `cocos/rendering/custom/graph.ts` | 基础图结构 |
| 布局图 | `cocos/rendering/custom/layout-graph.ts` | 资源布局 |
| 场景剔除 | `cocos/rendering/custom/scene-culling.ts` | 高级剔除 |
| 类型定义 | `cocos/rendering/custom/types.ts` | 类型系统 |
| Web 管线 | `cocos/rendering/custom/web-pipeline.ts` | Web 平台管线 |
| 程序库 | `cocos/rendering/custom/web-program-library.ts` | Shader 程序管理 |

---

## 核心概念

### Compiler → Executor → Pipeline

```
                    ┌───────────┐
                    │  Pipeline │
                    │  (配置)   │
                    └─────┬─────┘
                          │
                          ▼
                    ┌───────────┐
                    │ Compiler  │
                    │ (编译)    │
                    │           │
                    │ 将渲染图   │
                    │ 编译为    │
                    │ 执行计划  │
                    └─────┬─────┘
                          │
                          ▼
                    ┌───────────┐
                    │ Executor  │
                    │ (执行)    │
                    │           │
                    │ 按计划    │
                    │ 录制      │
                    │ GPU命令   │
                    └─────┬─────┘
                          │
                          ▼
                    提交到 GPU 执行
```

---

## Render Graph 渲染图

Render Graph 是自定义管线的核心数据结构，以有向无环图（DAG）描述渲染流程。

### 渲染图节点类型

```
RenderGraph (DAG)
├── RenderPass 节点
│   ├── 输入: Texture[] (依赖的纹理)
│   ├── 输出: Texture[] (生成的纹理)
│   ├── 子Pass: SubPass[]
│   └── 执行: 绘制命令
│
├── ComputePass 节点
│   ├── 输入: Buffer[] / Texture[]
│   ├── 输出: Buffer[] / Texture[]
│   └── 执行: Compute Shader
│
└── CopyPass 节点
    ├── 源: Texture
    └── 目标: Texture
```

### 渲染图示例

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Shadow  │     │ Geometry │     │ UI       │
│ Pass    │     │ Pass     │     │ Pass     │
│         │     │          │     │          │
│ 输出:   │     │ 输出:    │     │ 输出:    │
│ Shadow  │────→│ Color,   │────→│ Final    │
│ Map     │     │ Normal,  │     │ Color    │
│         │     │ Depth    │     │          │
└─────────┘     └────┬─────┘     └──────────┘
                     │
                     ▼
                ┌──────────┐
                │PostProcess│
                │ Pass      │
                │           │
                │ 输出:     │
                │ Screen    │
                └──────────┘
```

### 自动资源管理

```
渲染图自动管理临时资源:

1. 分析所有 Pass 的输入输出
2. 计算纹理生命周期
3. 在需要时创建，不需要时释放
4. 复用相同规格的纹理

例如:
  ShadowMap: Pass 0 输出 → Pass 1 输入 → 可释放
  ColorRT:   Pass 1 输出 → Pass 2 输入 → Pass 3 输入 → 可释放
```

---

## Scene Culling 场景剔除

自定义管线提供了更高级的场景剔除策略。

```typescript
// cocos/rendering/custom/scene-culling.ts

// 高级剔除策略:
// 1. 视锥剔除 (Frustum Culling) - 基础
// 2. 遮挡剔除 (Occlusion Culling) - 高级
// 3. 光源剔除 (Light Culling) - 只保留影响可见区域的光源
// 4. 层级剔除 (Layer Culling) - 基于可见性掩码

function sceneCulling(camera, scene) {
    // PVS (Potentially Visible Set) 计算
    // 基于 BVH (Bounding Volume Hierarchy) 加速
    // 返回可见模型列表
}
```

---

## 如何使用自定义管线

### 切换到自定义管线

```typescript
// 在项目设置中选择渲染管线
// Project Settings → Rendering → Render Pipeline

// 或在代码中设置
const pipeline = director.root.pipeline;
// 切换为自定义管线
```

### 编写自定义渲染 Pass

```typescript
// 自定义渲染 Pass 的基本结构

class CustomRenderPass {
    // 定义输入输出
    inputs: string[] = ['sceneColor', 'sceneDepth'];
    outputs: string[] = ['outputColor'];

    // 执行渲染
    execute(context) {
        // 1. 获取输入纹理
        const colorRT = context.getTexture('sceneColor');
        const depthRT = context.getTexture('sceneDepth');

        // 2. 创建全屏 Pass
        // 3. 设置材质和 Shader
        // 4. 录制绘制命令
        // 5. 输出到目标纹理
    }
}
```

---

## 技术原理

### 1. 数据驱动渲染

自定义管线的核心思想是数据驱动：

```
传统管线: 硬编码的渲染流程
  ShadowFlow → MainFlow → PostProcessFlow

自定义管线: 数据驱动的渲染图
  RenderGraph (DAG)
  → Compiler 编译为执行计划
  → Executor 执行
  → 灵活可扩展
```

### 2. 布局图（Layout Graph）

布局图管理渲染资源的布局和生命周期：

```
LayoutGraph
├── 资源描述
│   ├── Texture: { format, width, height, usage }
│   └── Buffer: { size, usage }
│
├── Pass 连接
│   └── Pass 的输入/输出槽位映射
│
└── 资源别名和复用
    └── 相同规格的资源自动复用
```

### 3. 编译优化

Compiler 在编译时进行多种优化：

```
1. 资源屏障插入
   自动在 Pass 之间插入内存屏障
   确保数据依赖正确

2. Pass 合并
   将不冲突的 Pass 合并执行
   减少 RenderPass 切换

3. 资源复用
   生命周期不重叠的纹理复用同一块内存

4. 并行化
   无依赖关系的 Pass 可以并行执行
```

---

## 下一步

完成自定义渲染管线的的学习后，继续学习 [03-地形系统](./03-terrain-system.md)。
