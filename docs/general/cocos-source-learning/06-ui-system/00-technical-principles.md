# 技术原理：游戏 UI 系统基础

> UI 系统提供了游戏界面开发所需的所有组件。在阅读 Cocos Creator 的 UITransform、Canvas、布局系统源码之前，先理解游戏 UI 的设计模式、布局算法和事件处理原理。

---

## 目录

- [1. 即时模式 vs 保留模式 GUI](#1-即时模式-vs-保留模式-gui)
- [2. UI 坐标系与变换](#2-ui-坐标系与变换)
- [3. 布局算法原理](#3-布局算法原理)
- [4. UI 事件与射线检测](#4-ui-事件与射线检测)
- [5. UI 渲染优化](#5-ui-渲染优化)

---

## 1. 即时模式 vs 保留模式 GUI

### 两种 GUI 架构范式

```
即时模式 GUI (Immediate Mode GUI, IMGUI)：
  - 每帧重新声明和绘制所有 UI 元素
  - 不保留 UI 状态（"即时"绘制）
  - 代码驱动（无编辑器）

  伪代码：
    if (button("Click Me")) { ... }  // 每帧调用
    label("Score: " + score);

  代表：Dear ImGui, Unity 的 IMGUI

保留模式 GUI (Retained Mode GUI, RMGUI)：
  - UI 元素是持久化的对象
  - 只创建一次，之后只修改属性
  - 数据驱动（编辑器构建）

  伪代码：
    let btn = createButton("Click Me");
    btn.onClick = () => { ... };  // 只设置一次
    btn.text = "New Text";        // 更新属性

  代表：Cocos Creator UI, Unity UGUI, Web DOM
```

### Cocos Creator 的选择

Cocos Creator 使用**保留模式 GUI**，原因：

```
✅ 支持可视化编辑器（所见即所得）
✅ 性能更好（只更新变化的部分）
✅ 支持动画和过渡效果
✅ 支持复杂布局（嵌套、滚动等）
✅ 开发者熟悉（类似 Web 前端开发）
```

### 与 Web 前端的类比

```
Cocos Creator UI          Web 前端
───────────────           ───────────
Node                      DOM Element
UITransform               CSS Transform
Widget                    CSS Position (fixed/absolute)
Layout                    CSS Flexbox/Grid
ScrollView                CSS overflow: scroll + JS
Label                     <span>
Sprite                    <img>
Button                    <button>
EditBox                   <input>
Toggle                    <input type="checkbox">
```

> 理解这个类比后，阅读 Cocos UI 源码会更容易——很多概念是相通的

---

## 2. UI 坐标系与变换

### UI 的坐标系

```
屏幕坐标系（Cocos UI）：

  (0, H) ─────────────────────── (W, H)
    │                                │
    │          屏幕空间              │
    │       (左下角为原点)           │
    │                                │
  (0, 0) ─────────────────────── (W, 0)

  与屏幕像素坐标不同：
  - Cocos UI：Y 轴向上
  - 屏幕像素：Y 轴向下
  - 转换时需要翻转 Y
```

### Canvas 的作用

```
Canvas = UI 的渲染根节点

职责：
  1. 定义 UI 的设计分辨率（如 960×640）
  2. 处理屏幕适配策略
  3. 管理 UI 相机

适配策略：
  ┌─────────────┬──────────────────────────────┐
  │ 策略        │ 行为                         │
  ├─────────────┼──────────────────────────────┤
  │ SHOW_ALL    │ 保持比例，可能有黑边           │
  │ EXACT_FIT   │ 拉伸填满，可能变形             │
  │ NO_BORDER   │ 保持比例，裁剪超出部分         │
  │ FIXED_HEIGHT│ 高度固定，宽度自适应           │
  │ FIXED_WIDTH │ 宽度固定，高度自适应           │
  └─────────────┴──────────────────────────────┘
```

### UITransform 组件

```
每个 UI 节点必须有 UITransform 组件

UITransform 定义：
  - width / height：UI 元素的尺寸
  - anchorX / anchorY：锚点（0~1）

锚点的作用：
  锚点 (0.5, 0.5) = 中心：
    位置是元素中心点的坐标

  锚点 (0, 0) = 左下角：
    位置是元素左下角的坐标

  锚点 (0.5, 1) = 顶部中心：
    位置是元素顶部中心点的坐标

  旋转和缩放都围绕锚点进行
```

> 源码 `cocos/2d/framework/ui-transform.ts` 实现了 UITransform 组件，`convertToWorldSpace` 和 `convertToNodeSpace` 方法处理坐标转换

---

## 3. 布局算法原理

### Widget 对齐系统

```
Widget 组件：让 UI 元素对齐到父容器的边缘

  ┌─────────────────────────────────┐
  │  Parent (UITransform)           │
  │                                 │
  │  ┌──────────────────────────┐   │
  │  │  Child + Widget          │   │
  │  │                          │   │
  │  │  top: 10px               │   │
  │  │  left: 20px              │   │
  │  │  right: 20px             │   │
  │  │  bottom: 10px            │   │
  │  │                          │   │
  │  └──────────────────────────┘   │
  │                                 │
  └─────────────────────────────────┘

工作原理：
  1. 读取父节点的 UITransform 尺寸
  2. 根据对齐参数计算子节点的位置和大小
  3. 父节点尺寸变化时重新计算
```

### Layout 自动布局

```
Layout 组件：自动排列子节点

水平布局 (Horizontal)：
  ┌──┬──┬──┬──┬──┐
  │A │B │C │D │E │
  └──┴──┴──┴──┴──┘

垂直布局 (Vertical)：
  ┌───────┐
  │   A   │
  ├───────┤
  │   B   │
  ├───────┤
  │   C   │
  └───────┘

网格布局 (Grid)：
  ┌──┬──┬──┐
  │A │B │C │
  ├──┼──┼──┤
  │D │E │F │
  └──┴──┴──┘
```

#### Layout 布局算法

```
水平布局计算：

  可用宽度 = Layout 容器宽度 - paddingLeft - paddingRight
  可用间距 = (子节点数 - 1) × spacingX

  if (固定大小模式) {
    子节点宽度 = (可用宽度 - 可用间距) / 子节点数
  } else {
    // 自适应模式
    当前X = paddingLeft
    for each 子节点 {
      子节点.x = 当前X + 子节点.width × 子节点.anchorX
      当前X += 子节点.width + spacingX
    }
  }

关键：Layout 在每帧检查子节点数量变化，自动重新排列
```

> 源码 `cocos/ui/layout.ts` 实现了自动布局。注意它继承了 `update()` 方法——布局计算在每帧执行以响应变化

---

## 4. UI 事件与射线检测

### UI 触摸事件的处理流程

```
1. 获取触摸屏幕坐标 (screenX, screenY)

2. 坐标转换：
   屏幕坐标 → UI 坐标 → 各节点本地坐标

3. 射线检测（Raycasting）：
   从触摸点发射一条射线
   检测射线与哪些 UI 元素相交

4. 找到最前方的命中节点

5. 事件派发：
   目标节点 → 冒泡到父节点
```

### UI 射线检测实现

```
2D 矩形检测（最常见）：

  触摸点 (tx, ty) 转换为节点本地坐标 (lx, ly)

  if (lx >= 0 && lx <= width && ly >= 0 && ly <= height) {
    // 命中
  }

3D 模型射线检测（更复杂）：

  Ray-AABB：射线与轴对齐包围盒的交点
  Ray-Triangle：射线与三角形面的交点（精确检测）
```

### 事件冒泡

```
触摸事件的冒泡路径：

Canvas
└── Panel
    └── ScrollView
        └── Content
            └── Button  ← 触摸命中

事件传播顺序：
  Button.onTouchStart → ScrollView.onTouchStart → Panel.onTouchStart → ...

处理方式：
  - 消费事件：stopPropagation() → 不再冒泡
  - 不处理：继续冒泡

ScrollView 利用这个机制：
  - 如果触摸在滚动区域内，ScrollView 自己处理（消费事件）
  - 如果触摸在 Button 上，Button 响应点击
```

> 源码 `cocos/2d/framework/ui-transform.ts` 中的 `hitTest` 方法实现了触摸命中检测

---

## 5. UI 渲染优化

### UI 的 DrawCall 优化

```
UI 渲染的性能瓶颈与 2D 渲染相同——DrawCall 数量

优化策略：

1. 图集（Atlas）：
   将多个小图合并为一张大图
   使用相同图集的 UI 元素可以合并为一个 DrawCall

   ┌─────────────────────────┐
   │  Atlas (1024×1024)      │
   │  ┌──┐ ┌──┐ ┌──────┐    │
   │  │A │ │B │ │  C   │    │
   │  └──┘ └──┘ └──────┘    │
   │       ┌─────┐          │
   │       │  D  │          │
   │       └─────┘          │
   └─────────────────────────┘
   Sprite A, B, C, D 共享一个 DrawCall

2. 渲染顺序：
   相同材质的 UI 元素需要连续排列才能合并
   穿插不同材质会打断合并

3. 动静分离：
   频繁变化的 UI 和静态 UI 放在不同的 Canvas 下
   静态 UI 不需要每帧重新提交
```

### 文字渲染

```
Label 渲染方式：

1. BMFont（位图字体）：
   预渲染所有字符到纹理
   渲染时查表取对应的 UV 坐标
   适合：固定文本、大量文字

2. SystemFont（系统字体）：
   使用 Canvas API 渲染文字 → 生成纹理
   每次文字变化都需要重新生成纹理
   适合：动态文本

3. TTFFont（TrueType 字体）：
   使用 FreeType 库解析字体文件
   按需渲染字形（Glyph）→ 缓存到纹理图集
   适合：高质量文字渲染
```

---

## 延伸阅读

- [Immediate Mode GUI vs Retained Mode](https://blog.codinghorror.com/immediate-mode-guis-vs-retained-mode-guis/) — 两种模式对比
- [CSS Flexbox 规范](https://www.w3.org/TR/css-flexbox-1/) — Layout 的灵感来源
- [UI Architecture Patterns](https://martinfowler.com/eaaDev/uiArchs.html) — UI 架构模式深度讨论

---

> 理解了这些原理后，继续阅读 [01-UI 基础框架](./01-ui-basics.md) 查看对应的源码实现。
