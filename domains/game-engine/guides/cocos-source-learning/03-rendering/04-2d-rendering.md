# 2D 渲染

2D 渲染系统是 Cocos Creator 引擎中负责精灵、文本、图形等 2D 元素渲染的核心模块。它通过高效的批处理机制（Batcher2D）将大量 2D 渲染对象合并为少量绘制调用。

## 目录

- [架构概述](#架构概述)
- [Batcher2D 批处理器](#batcher2d-批处理器)
- [DrawBatch2D 绘制批次](#drawbatch2d-绘制批次)
- [MeshBuffer 网格缓冲](#meshbuffer-网格缓冲)
- [组装器模式](#组装器模式)
- [Canvas 与 RenderRoot2D](#canvas-与-renderroot2d)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    2D 渲染架构                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Canvas / RenderRoot2D            │   │
│  │            (2D 渲染根节点，管理渲染流程)            │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │                                 │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   Batcher2D                      │   │
│  │            (批处理器，合并绘制调用)                  │   │
│  │                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │MeshBuffer│  │MeshBuffer│  │MeshBuffer│  ...  │   │
│  │  │  (VB+IB) │  │  (VB+IB) │  │  (VB+IB) │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘       │   │
│  └─────────────────────┬────────────────────────────┘   │
│                        │ 生成                           │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │               DrawBatch2D[]                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │Batch 0  │ │Batch 1  │ │Batch N  │            │   │
│  │  │Sprite批 │ │Label批  │ │UI批     │            │   │
│  │  └─────────┘ └─────────┘ └─────────┘            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                Assembler 组装器                   │   │
│  │  SpriteAssembler │ LabelAssembler │ GraphicsAsm  │   │
│  │  (精灵顶点组装)   │ (文本顶点组装)   │ (图形组装)   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 2D 批处理器 | `cocos/2d/renderer/batcher-2d.ts` | 批处理核心 |
| 绘制批次 | `cocos/2d/renderer/draw-batch.ts` | 批次数据 |
| 渲染数据 | `cocos/2d/renderer/render-data.ts` | 顶点/索引数据 |
| 渲染实体 | `cocos/2d/renderer/render-entity.ts` | 渲染实体 |
| Canvas | `cocos/2d/framework/canvas.ts` | 画布组件 |
| RenderRoot2D | `cocos/2d/framework/render-root-2d.ts` | 2D 渲染根节点 |
| UI 渲染器管理 | `cocos/2d/framework/ui-renderer-manager.ts` | 渲染器管理 |

---

## Batcher2D 批处理器

`Batcher2D` 是 2D 渲染系统的核心，负责将所有 2D 渲染对象合并为尽量少的 Draw Call。

### 核心结构

```typescript
// cocos/2d/renderer/batcher-2d.ts

export class Batcher2D {
    // ─── 批次管理 ───
    _batches: DrawBatch2D[];          // 当前帧的所有绘制批次
    _meshBuffers: MeshBuffer[];       // 网格缓冲数组
    _currentMeshBuffer: MeshBuffer;   // 当前活跃的网格缓冲

    // ─── 渲染状态 ───
    _currTexture: Texture | null;     // 当前绑定的纹理
    _currMaterial: Material | null;   // 当前绑定的材质
    _currDepth: number;               // 当前深度值
    _currStencilStage: number;        // 当前模板阶段

    // ─── 核心方法 ───
    update();                         // 更新所有脏标记的渲染器
    fillBuffers(renderEntity);        // 填充顶点/索引缓冲
    flush();                          // 刷新当前批次
    draw(renderEntity);               // 添加渲染实体
    commitComp(renderData, ...);      // 提交组件渲染数据
}
```

### 批处理流程

```
每帧渲染：

1. Batcher2D.update()
    │
    ├── 遍历所有脏标记的 UIRenderer
    │   ├── 调用 Assembler 填充顶点数据
    │   └── 更新 RenderEntity
    │
    ├── 2. 合并批次（Batch 合并条件）
    │   ├── 相同材质（Material）
    │   ├── 相同纹理（Texture）
    │   ├── 未超过顶点缓冲上限
    │   └── 深度连续（无穿插）
    │
    ├── 3. 生成 DrawBatch2D
    │   ├── 每个合并组 → 一个 DrawBatch2D
    │   └── 包含: MeshBuffer + Material + IA
    │
    └── 4. 提交到 RenderScene
        └── scene.addBatch(batch)
```

### 批次合并条件

```
┌─ Batch 0 ─────────────────────────────────────┐
│  SpriteA + SpriteB + SpriteC                   │
│  (相同材质 + 相同纹理 + 深度连续)                │
│  → 合并为 1 个 Draw Call                       │
├─ Batch 1 ─────────────────────────────────────┤
│  LabelD                                         │
│  (不同材质/纹理 → 无法合并)                      │
│  → 单独 1 个 Draw Call                         │
├─ Batch 2 ─────────────────────────────────────┤
│  SpriteE + SpriteF                              │
│  (相同材质 + 相同纹理 → 合并)                    │
│  → 合并为 1 个 Draw Call                       │
└────────────────────────────────────────────────┘

总 Draw Calls = 3（而非 6）
```

---

## DrawBatch2D 绘制批次

`DrawBatch2D` 封装了一个 2D 绘制调用的所有信息。

```typescript
// cocos/2d/renderer/draw-batch.ts

export class DrawBatch2D {
    // ─── 渲染资源 ───
    meshBuffer: MeshBuffer;           // 顶点/索引缓冲
    material: Material;               // 材质
    inputAssembler: InputAssembler;   // GFX 输入汇集器
    descriptorSet: DescriptorSet;     // 描述符集

    // ─── 渲染状态 ───
    depth: number;                    // 深度值
    stencilStage: number;             // 模板阶段
    visFlags: number;                 // 可见性标志
}
```

---

## MeshBuffer 网格缓冲

`MeshBuffer` 管理顶点缓冲（VB）和索引缓冲（IB），是批处理的数据容器。

```
MeshBuffer
├── VertexBuffer (VB)
│   ├── [SpriteA: x,y,u,v,r,g,b,a]  ← 4 个顶点
│   ├── [SpriteB: x,y,u,v,r,g,b,a]  ← 4 个顶点
│   └── [SpriteC: x,y,u,v,r,g,b,a]  ← 4 个顶点
│
└── IndexBuffer (IB)
    ├── [0,1,2, 0,2,3]  ← SpriteA 的 6 个索引
    ├── [4,5,6, 4,6,7]  ← SpriteB 的 6 个索引
    └── [8,9,10, 8,10,11] ← SpriteC 的 6 个索引

当 VB/IB 空间不足时，自动分配新的 MeshBuffer
```

### 顶点格式

```typescript
// 2D 渲染的标准顶点格式
interface Vertex2D {
    x: number;      // 位置 X
    y: number;      // 位置 Y
    u: number;      // 纹理 U
    v: number;      // 纹理 V
    r: number;      // 颜色 R
    g: number;      // 颜色 G
    b: number;      // 颜色 B
    a: number;      // 颜色 A
}
```

---

## 组装器模式

Assembler（组装器）负责将 2D 渲染组件的几何数据组装到 MeshBuffer 中。

### 组装器类型

| 组装器 | 路径 | 说明 |
|--------|------|------|
| SimpleSpriteAssembler | `cocos/2d/assembler/sprite/` | 简单精灵（1个quad） |
| SlicedSpriteAssembler | `cocos/2d/assembler/sprite/` | 九宫格精灵（9个quad） |
| TiledSpriteAssembler | `cocos/2d/assembler/sprite/` | 平铺精灵 |
| LabelAssembler | `cocos/2d/assembler/label/` | 文本渲染 |
| GraphicsAssembler | `cocos/2d/assembler/graphics/` | 图形绘制 |
| MaskAssembler | `cocos/2d/assembler/` | 遮罩 |

### 组装器接口

```typescript
interface IAssembler {
    updateUVs(renderData): void;         // 更新纹理坐标
    updateColor(renderData, color): void; // 更新顶点颜色
    fillBuffers(renderData, batcher): void; // 填充顶点/索引数据
    reset(renderData): void;             // 重置数据
}
```

### 精灵组装示例

```
SimpleSprite (4 顶点, 2 三角形)

v3 ──────── v2
│  ╲      ╱ │
│    ╲  ╱   │
│     ╲╱    │
│     ╱╲    │
│    ╱  ╲   │
│  ╱      ╲ │
v0 ──────── v1

顶点: [v0, v1, v2, v3]
索引: [0, 1, 2,  0, 2, 3]
```

---

## Canvas 与 RenderRoot2D

### RenderRoot2D

`RenderRoot2D` 是所有 2D 渲染的根节点，管理 2D 渲染流程：

```typescript
// cocos/2d/framework/render-root-2d.ts

export class RenderRoot2D extends Component {
    // 管理子树中所有 UIRenderer 的渲染
    // 负责收集、排序、提交 2D 渲染数据
}
```

### Canvas

`Canvas` 继承自 `RenderRoot2D`，增加了屏幕适配和相机绑定：

```typescript
// cocos/2d/framework/canvas.ts

export class Canvas extends RenderRoot2D {
    cameraComponent: CameraComponent;  // 关联的 2D 相机
    designResolution: Size;            // 设计分辨率
    fitHeight: boolean;                // 适配高度
    fitWidth: boolean;                 // 适配宽度
}
```

### 2D 渲染流程

```
Canvas / RenderRoot2D
    │
    ├── 收集子树中所有 UIRenderer
    │   ├── Sprite
    │   ├── Label
    │   ├── Graphics
    │   └── 其他 UI 组件
    │
    ├── 按渲染顺序排序
    │   └── siblingIndex → renderOrder → depth
    │
    ├── 提交到 Batcher2D
    │   ├── 填充顶点缓冲
    │   └── 合并批次
    │
    └── 生成 DrawBatch2D[] 提交到 RenderScene
```

---

## 技术原理

### 1. 动态合批（Dynamic Batching）

2D 渲染的核心优化是动态合批，将使用相同材质和纹理的多个精灵合并为一个 Draw Call。关键规则：
- 相同材质（Material）
- 相同纹理（Texture）
- 顶点缓冲未满
- 渲染顺序连续（无穿插的半透明对象）

### 2. 渲染顺序与深度

2D 元素通过 `siblingIndex`（在父节点子列表中的顺序）决定渲染顺序。Batcher2D 按此顺序分配深度值，确保前后关系正确。

### 3. 模板缓冲与遮罩

Mask 组件使用模板缓冲（Stencil Buffer）实现裁剪效果：
1. Mask 区域写入模板值
2. 子节点渲染时测试模板值
3. 模板测试失败的区域被裁剪

---

## 下一步

完成 2D 渲染的学习后，继续学习 [05-3D 渲染](./05-3d-rendering.md)。
