# UI 基础框架

UI 基础框架是所有 UI 组件的根基，包括 UITransform（变换组件）、UIRenderer（渲染基类）、Canvas（画布）和 RenderRoot2D（渲染根节点）。

## 目录

- [UITransform 变换组件](#uitransform-变换组件)
- [UIRenderer 渲染基类](#uirenderer-渲染基类)
- [Canvas 画布组件](#canvas-画布组件)
- [RenderRoot2D 渲染根节点](#renderroot2d-渲染根节点)
- [技术原理](#技术原理)

---

## UITransform 变换组件

`UITransform` 是 2D/UI 节点必须挂载的组件，定义了节点的尺寸和锚点。

```typescript
// cocos/2d/framework/ui-transform.ts

export class UITransform extends Component {
    // ─── 尺寸 ───
    get contentSize(): Readonly<Size>;    // 内容尺寸
    set contentSize(value: Size);

    // ─── 锚点 ───
    get anchorPoint(): Readonly<Vec2>;    // 锚点 (0~1, 0~1)
    set anchorPoint(value: Vec2);

    // ─── 方法 ───
    getBoundingBoxToWorld(): Rect;        // 世界空间包围盒
    convertToNodeSpaceAR(worldPoint): Vec3;  // 世界坐标→本地坐标
    convertToWorldSpaceAR(localPoint): Vec3; // 本地坐标→世界坐标
    isHit(worldPoint): boolean;           // 点击测试
}
```

### 锚点系统

```
锚点 (0.5, 0.5) - 默认中心       锚点 (0, 0) - 左下角
┌────────────────┐                ┌────────────────┐
│                │                │                │
│       ●        │                │                │
│    (0.5, 0.5)  │                │  ●             │
│                │                │ (0, 0)         │
└────────────────┘                └────────────────┘

锚点影响:
  - 位置定位基准点
  - 缩放中心点
  - 旋转中心点
```

---

## UIRenderer 渲染基类

`UIRenderer` 是所有 2D 渲染组件的基类（Sprite、Label、Graphics 等）。

```typescript
// cocos/2d/framework/ui-renderer.ts

export abstract class UIRenderer extends Component {
    // ─── 材质 ───
    getMaterial(index?): Material;        // 获取材质
    setMaterial(material, index?): void;  // 设置材质
    sharedMaterials: Material[];          // 共享材质数组

    // ─── 颜色 ───
    color: Color;                         // 渲染颜色

    // ─── 渲染数据 ───
    renderData: RenderData;               // 渲染数据
    assembler: IAssembler;                // 组装器

    // ─── 生命周期 ───
    requestRenderData(): RenderData;      // 请求渲染数据
    markForUpdateRenderData(): void;      // 标记需要更新
    updateRenderer(): void;               // 更新渲染数据
}
```

### UIRenderer 继承体系

```
UIRenderer (抽象基类)
├── Sprite           精灵渲染
├── Label            文本渲染
├── Graphics         图形绘制
├── Mask             遮罩
├── TiledMap         瓦片地图
├── SpineSkeleton    Spine 动画
└── DragonBones      龙骨动画
```

---

## Canvas 画布组件

`Canvas` 是 UI 渲染的根节点，管理屏幕适配和相机绑定。

```typescript
// cocos/2d/framework/canvas.ts

export class Canvas extends RenderRoot2D {
    cameraComponent: CameraComponent;   // 关联的 2D 相机
    designResolution: Size;             // 设计分辨率
    fitHeight: boolean;                 // 适配高度
    fitWidth: boolean;                  // 适配宽度
}
```

### 屏幕适配策略

```
设计分辨率: 1280 × 720

策略 1: 适配宽度 (fitWidth = true)
  屏幕更窄时，保证宽度完整显示
  ┌──────────────────────┐
  │    ┌──────────────┐  │
  │    │  Canvas 内容  │  │  ← 上下可能有黑边
  │    └──────────────┘  │
  └──────────────────────┘

策略 2: 适配高度 (fitHeight = true)
  屏幕更矮时，保证高度完整显示
  ┌──────────┬────┬──────────┐
  │          │Canvas│          │  ← 左右可能有黑边
  │          │内容 │          │
  └──────────┴────┴──────────┘

策略 3: 两者都适配 (fitHeight + fitWidth)
  拉伸画面填满屏幕（可能变形）
```

---

## RenderRoot2D 渲染根节点

`RenderRoot2D` 是所有 2D/UI 渲染的根节点，管理渲染流程。

```typescript
// cocos/2d/framework/render-root-2d.ts

export class RenderRoot2D extends Component {
    // 管理 2D 渲染流程
    // 收集子树中所有 UIRenderer
    // 提交到 Batcher2D 进行批处理
}
```

### 渲染流程

```
RenderRoot2D
    │
    ├── 遍历子树所有 UIRenderer
    │   ├── 收集 Sprite 数据
    │   ├── 收集 Label 数据
    │   ├── 收集 Graphics 数据
    │   └── 收集其他 2D 数据
    │
    ├── 按渲染顺序排序
    │
    └── 提交到 Batcher2D
        ├── 填充顶点缓冲
        ├── 合并批次
        └── 生成 DrawBatch2D[]
```

---

## 技术原理

### 1. UI 渲染与 3D 渲染的分离

UI 系统使用独立的 2D 相机和渲染流程：

```
3D 相机          2D/UI 相机
    │                 │
    ▼                 ▼
ForwardStage      UIStage
    │                 │
    ▼                 ▼
3D 渲染          Batcher2D 批处理
    │                 │
    └────────┬────────┘
             ▼
        合成到屏幕
```

### 2. 渲染顺序（Z 轴 vs siblingIndex）

2D 渲染顺序由 `siblingIndex`（在父节点子列表中的顺序）决定，而非 Z 轴：

```
Parent
├── Child[0]  (siblingIndex=0)  ← 最先渲染（最底层）
├── Child[1]  (siblingIndex=1)
└── Child[2]  (siblingIndex=2)  ← 最后渲染（最顶层）
```

### 3. 脏标记系统

UIRenderer 使用脏标记优化渲染更新：

```
仅当属性变化时标记脏
  sprite.spriteFrame = newFrame;  → 脏标记 = true
  label.string = "new text";      → 脏标记 = true

每帧只更新脏标记的渲染器
  for (renderer of dirtyRenderers) {
      renderer.updateRenderer();  // 重新填充顶点数据
  }
```

---

## 下一步

完成 UI 基础框架的学习后，继续学习 [02-UI 组件详解](./02-ui-components.md)。
