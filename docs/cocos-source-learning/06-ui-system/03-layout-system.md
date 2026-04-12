# 布局系统

布局系统提供 UI 元素的自动排列和屏幕适配能力，包括 Widget（对齐组件）和 Layout（自动布局组件）。

## 目录

- [Widget 对齐组件](#widget-对齐组件)
- [Layout 自动布局](#layout-自动布局)
- [WidgetManager 管理器](#widgetmanager-管理器)
- [技术原理](#技术原理)

---

## Widget 对齐组件

Widget 用于将 UI 元素相对于父容器对齐，是实现屏幕适配的基础。

```typescript
// cocos/ui/widget.ts

export class Widget extends Component {
    // ─── 对齐模式 ───
    alignMode: AlignMode;
    // ONCE            - 只对齐一次
    // ALWAYS          - 每帧对齐
    // ON_WINDOW_RESIZE - 窗口大小变化时对齐

    // ─── 四边对齐 ───
    isAlignTop: boolean;        // 对齐顶部
    isAlignBottom: boolean;     // 对齐底部
    isAlignLeft: boolean;       // 对齐左边
    isAlignRight: boolean;      // 对齐右边

    // ─── 边距 ───
    top: number;                // 顶部边距
    bottom: number;             // 底部边距
    left: number;               // 左边距
    right: number;              // 右边距

    // ─── 百分比模式 ───
    isAlignTopThreshold: boolean;   // 顶部使用百分比
    isAbsoluteTop: boolean;         // 是否绝对像素值

    // ─── 方法 ───
    updateAlignment(): void;    // 立即执行对齐
}
```

### 对齐示例

```
┌─── Parent ────────────────────────────────┐
│                                            │
│  ┌─ Top Widget ────────────────────────┐   │
│  │  isAlignTop=true, top=10            │   │
│  │  isAlignLeft=true, isAlignRight=true│   │
│  └─────────────────────────────────────┘   │
│                                            │
│                    │                       │
│                    ▼                       │
│  ┌─ Center Widget ──┐                     │
│  │  无对齐，自由定位  │                     │
│  └──────────────────┘                     │
│                                            │
│  ┌─ Bottom Widget ────────────────────┐    │
│  │  isAlignBottom=true, bottom=20     │    │
│  └────────────────────────────────────┘    │
└────────────────────────────────────────────┘
```

---

## Layout 自动布局

Layout 自动排列子节点，支持水平、垂直和网格三种布局模式。

```typescript
// cocos/ui/layout.ts

export class Layout extends Component {
    // ─── 布局类型 ───
    type: LayoutType;
    // NONE       - 无布局
    // HORIZONTAL - 水平排列
    // VERTICAL   - 垂直排列
    // GRID       - 网格排列

    // ─── 间距 ───
    spacingX: number;           // 水平间距
    spacingY: number;           // 垂直间距

    // ─── 内边距 ───
    paddingTop: number;
    paddingBottom: number;
    paddingLeft: number;
    paddingRight: number;

    // ─── 缩放模式 ───
    resizeMode: LayoutResizeMode;
    // NONE      - 不调整
    // CONTAINER - 调整容器大小
    // CHILDREN  - 调整子节点大小

    // ─── 水平/垂直排列方向 ───
    horizontalDirection: HorizontalDirection;
    // LEFT_TO_RIGHT / RIGHT_TO_LEFT

    verticalDirection: VerticalDirection;
    // TOP_TO_BOTTOM / BOTTOM_TO_TOP

    // ─── 网格排列 ───
    startAxis: AxisDirection;
    // HORIZONTAL / VERTICAL
    gridConstraint: ConstraintType;
    // NONE / FIXED_ROW / FIXED_COLUMN

    // ─── 方法 ───
    updateLayout(): void;       // 立即更新布局
}
```

### 水平布局

```
Layout (type=HORIZONTAL, spacingX=10, paddingLeft=10)
┌────────────────────────────────────────┐
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  │
│  │  A  │  │  B  │  │  C  │  │  D  │  │
│  └─────┘  └─────┘  └─────┘  └─────┘  │
│  ←10→                                  │
└────────────────────────────────────────┘
```

### 垂直布局

```
Layout (type=VERTICAL, spacingY=5, paddingTop=10)
┌─────────────────┐
│  ← 10 →         │
│  ┌─────────────┐│
│  │     A       ││
│  └─────────────┘│
│       ↕ 5       │
│  ┌─────────────┐│
│  │     B       ││
│  └─────────────┘│
│       ↕ 5       │
│  ┌─────────────┐│
│  │     C       ││
│  └─────────────┘│
└─────────────────┘
```

### 网格布局

```
Layout (type=GRID, startAxis=HORIZONTAL)
┌───────────────────────┐
│  ┌───┐ ┌───┐ ┌───┐   │
│  │ 1 │ │ 2 │ │ 3 │   │
│  └───┘ └───┘ └───┘   │
│  ┌───┐ ┌───┐ ┌───┐   │
│  │ 4 │ │ 5 │ │ 6 │   │
│  └───┘ └───┘ └───┘   │
│  ┌───┐               │
│  │ 7 │   (不完整的行)  │
│  └───┘               │
└───────────────────────┘
```

---

## WidgetManager 管理器

`WidgetManager` 是全局单例，统一管理所有 Widget 的对齐更新。

```typescript
// cocos/ui/widget-manager.ts

export class WidgetManager {
    // ─── 核心职责 ───
    // 1. 收集所有活跃的 Widget 组件
    // 2. 在屏幕尺寸变化时触发对齐更新
    // 3. 按 Widget 的 alignMode 决定更新时机
}
```

### 更新时机

| AlignMode | 触发时机 |
|-----------|---------|
| `ONCE` | 组件启用时执行一次 |
| `ALWAYS` | 每帧执行 |
| `ON_WINDOW_RESIZE` | 窗口大小变化时 |

### 更新流程

```
窗口大小变化
    │
    ▼
Screen.emit('resize')
    │
    ▼
WidgetManager.onScreenResized()
    │
    ├── 遍历所有 ON_WINDOW_RESIZE 模式的 Widget
    │   └── widget.updateAlignment()
    │
    └── 遍历所有 ALWAYS 模式的 Widget
        └── widget.updateAlignment()

updateAlignment():
    ├── 获取父节点尺寸
    ├── 计算对齐后的位置和大小
    └── 设置节点 transform
```

---

## 技术原理

### 1. Widget 的数学计算

```typescript
// 以顶部对齐为例
if (isAlignTop) {
    // 新 Y 坐标 = 父高度/2 - top边距 - 锚点偏移
    node.y = parentHeight / 2 - top - anchorOffsetY;
}

// 同时对齐上下（拉伸高度）
if (isAlignTop && isAlignBottom) {
    // 新高度 = 父高度 - top边距 - bottom边距
    uiTransform.height = parentHeight - top - bottom;
}
```

### 2. Layout 的排列算法

```
水平布局计算:
    startX = paddingLeft
    y = parentHeight / 2 - paddingTop

    for each child:
        child.x = startX + childWidth / 2
        child.y = y
        startX += childWidth + spacingX

    if (resizeMode == CONTAINER):
        container.width = startX + paddingRight
```

### 3. 布局脏标记

Layout 使用脏标记避免不必要的重计算：

```
子节点变化:
  ├── 子节点数量变化 → 标记脏
  ├── 子节点尺寸变化 → 标记脏
  └── 属性变化 → 标记脏

每帧:
  if (layout._dirty) {
      layout.updateLayout();
      layout._dirty = false;
  }
```

---

## 下一步

完成 UI 系统章节后，继续学习 [07-平台抽象层](../07-platform-layer/README.md)。
