# UI 组件详解

Cocos Creator 提供了丰富的 UI 组件库，涵盖按钮、滚动视图、输入框、开关等常用交互控件。

## 目录

- [Button 按钮](#button-按钮)
- [ScrollView 滚动视图](#scrollview-滚动视图)
- [Toggle 开关](#toggle-开关)
- [EditBox 输入框](#editbox-输入框)
- [其他组件](#其他组件)
- [技术原理](#技术原理)

---

## Button 按钮

Button 是最常用的交互组件，支持多种过渡效果和状态切换。

```typescript
// cocos/ui/button.ts

export class Button extends Component {
    // ─── 过渡模式 ───
    transition: Transition;
    // NONE    - 无过渡效果
    // COLOR   - 颜色变化
    // SPRITE  - 精灵切换
    // SCALE   - 缩放效果

    // ─── 状态颜色（COLOR 模式） ───
    normalColor: Color;
    pressedColor: Color;
    hoverColor: Color;
    disabledColor: Color;

    // ─── 状态精灵（SPRITE 模式） ───
    normalSprite: SpriteFrame;
    pressedSprite: SpriteFrame;
    hoverSprite: SpriteFrame;
    disabledSprite: SpriteFrame;

    // ─── 缩放（SCALE 模式） ───
    duration: number;         // 过渡时间
    zoomScale: number;        // 缩放比例

    // ─── 交互 ───
    interactable: boolean;    // 是否可交互
    target: Node;             // 过渡效果作用的目标节点

    // ─── 事件 ───
    clickEvents: EventEntry[]; // 点击事件列表
}
```

### 状态切换

```
NORMAL ──→ 鼠标按下 ──→ PRESSED
  │                        │
  │←── 鼠标抬起 ───────────┘
  │
  ├──→ 鼠标悬停 ──→ HOVER
  │                    │
  │←── 鼠标离开 ───────┘
  │
  └──→ interactable=false ──→ DISABLED
```

---

## ScrollView 滚动视图

ScrollView 提供可滚动的区域，支持惯性、弹性效果和滚动条。

```typescript
// cocos/ui/scroll-view.ts

export class ScrollView extends Component {
    // ─── 滚动内容 ───
    content: Node;              // 可滚动的容器节点

    // ─── 方向 ───
    horizontal: boolean;        // 允许水平滚动
    vertical: boolean;          // 允许垂直滚动

    // ─── 惯性与弹性 ───
    brake: number;              // 制动系数 (0~1)
    elasticity: number;         // 弹性系数 (>0)
    inertia: boolean;           // 是否启用惯性

    // ─── 滚动事件 ───
    scrollEvents: EventEntry[];

    // ─── 方法 ───
    scrollToOffset(offset, time?, attenuate?): void;
    scrollToChild(child, time?): void;
    getScrollOffset(): Vec2;
    isScrolling(): boolean;
}
```

### ScrollView 结构

```
ScrollView (带 Mask 裁剪)
└── content (可滚动容器，尺寸超出 ScrollView)
    ├── Item 1
    ├── Item 2
    ├── Item 3
    ├── ...
    └── Item N

滚动时:
  content 位置变化 → Item 可见/隐藏 → Mask 裁剪超出部分
```

---

## Toggle 开关

Toggle 是可选中/取消选中的开关组件。

```typescript
// cocos/ui/toggle.ts

export class Toggle extends Component {
    isChecked: boolean;          // 是否选中
    checkMark: Sprite;           // 选中标记精灵
    checkEvents: EventEntry[];   // 状态变化事件
}
```

### ToggleContainer

```typescript
// Toggle 容器，实现单选组
export class ToggleContainer extends Component {
    toggleItems: Toggle[];      // Toggle 列表
    allowSwitchOff: boolean;    // 是否允许全部取消

    // 同一时刻只能有一个 Toggle 被选中
}
```

---

## EditBox 输入框

EditBox 提供文本输入功能。

```typescript
// cocos/ui/edit-box.ts

export class EditBox extends Component {
    // ─── 文本属性 ───
    string: string;              // 当前文本
    placeholder: string;         // 占位文本
    textColor: Color;            // 文本颜色
    placeholderColor: Color;     // 占位文本颜色
    fontSize: number;            // 字号
    maxLength: number;           // 最大长度

    // ─── 输入模式 ───
    inputMode: InputMode;
    // ANY         - 任意文本
    // EMAIL_ADDR  - 邮箱
    // NUMERIC     - 数字
    // PHONE_NUMBER - 电话
    // URL         - 网址
    // DECIMAL     - 小数
    // SINGLE_LINE - 单行

    // ─── 输入标志 ───
    inputFlag: InputFlag;
    // DEFAULT     - 默认
    // PASSWORD    - 密码（显示为 ***）
    // SENSITIVE   - 敏感信息

    // ─── 事件 ───
    editingDidBegin: EventEntry;   // 开始编辑
    textChanged: EventEntry;       // 文本变化
    editingDidEnd: EventEntry;     // 结束编辑
    editingReturn: EventEntry;     // 按下回车
}
```

---

## 其他组件

### ProgressBar 进度条

```typescript
export class ProgressBar extends Component {
    barSprite: Sprite;         // 进度条精灵
    progress: number;          // 进度 (0~1)
    reverse: boolean;          // 反向
    totalCount: number;        // 总数（用于 fill mode）
    fillRange: number;         // 填充范围
}
```

### Slider 滑块

```typescript
export class Slider extends Component {
    slider: Button;            // 滑块按钮
    progress: number;          // 进度 (0~1)
    direction: Direction;      // 方向 (HORIZONTAL/VERTICAL)
    slideEvents: EventEntry[];
}
```

### PageView 分页视图

```typescript
export class PageView extends ScrollView {
    currentPage: number;       // 当前页索引
    pageCount: number;         // 总页数
    pageTurningEvent: EventEntry;
}
```

### SafeArea 安全区域

```typescript
// 适配 iPhone 刘海屏等异形屏幕
export class SafeArea extends Component {
    // 自动调整节点位置和大小
    // 避开系统 UI（刘海、底部横条等）
}
```

---

## 技术原理

### 1. 事件系统交互

UI 组件通过引擎事件系统处理交互：

```
Input (触摸/鼠标)
    │
    ▼
事件冒泡（从最上层节点开始）
    │
    ├── Button 节点?
    │   ├── 检查 isHit (UITransform.isHit)
    │   ├── 更新状态 (NORMAL → PRESSED)
    │   └── 触发 clickEvent
    │
    ├── ScrollView 节点?
    │   ├── 记录触摸起点
    │   ├── 计算偏移
    │   └── 更新 content 位置
    │
    └── 继续冒泡到父节点
```

### 2. 渲染更新优化

UI 组件使用脏标记减少不必要的渲染更新：

```
Button 状态变化:
  NORMAL → PRESSED → 标记 Sprite/Color 脏
  → 下帧 updateRenderer → 更新顶点颜色/纹理
  → 提交到 Batcher2D
```

---

## 下一步

完成 UI 组件的学习后，继续学习 [03-布局系统](./03-layout-system.md)。
