# 第10周: UI 系统

## 目标

- UI 组件基础
- 布局系统
- UI 事件系统
- 文字渲染 (Bitmap Font)
- 基础控件 (Button, Slider)

## 任务清单

### 1. UI 基础架构 (@nova/ui)

#### UIComponent

- [ ] 基础组件类
- [ ] 锚点 (Anchor)
- [ ] 偏移 (Offset)
- [ ] 层级 (Z-Index)

```typescript
abstract class UIComponent {
  anchor: Anchor;          // 锚点 (0-1)
  offset: Vec2;            // 偏移像素
  size: Vec2;              // 尺寸
  pivot: Vec2;             // 中心点
  visible: boolean;
  interactive: boolean;

  abstract render(renderer: Renderer): void;

  getWorldPosition(): Vec2 {
    // 根据锚点和偏移计算屏幕位置
  }
}

type Anchor = {
  x: number;  // 0 = left, 0.5 = center, 1 = right
  y: number;  // 0 = top, 0.5 = center, 1 = bottom
};
```

### 2. 布局系统

#### 基础布局

- [ ] Absolute Layout (绝对定位)
- [ ] Horizontal Layout (水平排列)
- [ ] Vertical Layout (垂直排列)

```typescript
class HorizontalLayout extends UIComponent {
  spacing: number = 10;
  padding: number = 10;

  children: UIComponent[];

  updateLayout(): void {
    let x = this.padding;
    for (const child of this.children) {
      child.offset.x = x;
      x += child.size.x + this.spacing;
    }
  }
}
```

### 3. UI 事件

- [ ] 点击 (Click)
- [ ] 悬停 (Hover)
- [ ] 拖拽 (Drag)
- [ ] 焦点 (Focus)

```typescript
class UIMouseHandler {
  private hovered: UIComponent | null = null;

  update(mouse: Mouse): void {
    const worldPos = mouse.position;

    // 检测悬停
    const newHovered = this.hitTest(worldPos);
    if (newHovered !== this.hovered) {
      this.hovered?.onMouseLeave();
      this.hovered = newHovered;
      this.hovered?.onMouseEnter();
    }

    // 检测点击
    if (mouse.isButtonPressed('left') && this.hovered) {
      this.hovered.onClick();
    }
  }

  private hitTest(pos: Vec2): UIComponent | null {
    // 从上到下遍历 UI 组件，返回第一个命中的
  }
}
```

### 4. 文字渲染

#### Bitmap Font

- [ ] 字体图集加载
- [ ] 字符映射表
- [ ] 文本布局

```typescript
class BitmapFont {
  // 字体图集
  texture: Texture;

  // 字符信息
  chars: Map<string, CharInfo>;

  static async load(url: string): Promise<BitmapFont>;
}

interface CharInfo {
  x: number;       // 图集中的位置
  y: number;
  width: number;
  height: number;
  xOffset: number; // 渲染偏移
  yOffset: number;
  xAdvance: number; // 下一个字符的 X 偏移
}

class Text extends UIComponent {
  font: BitmapFont;
  text: string;
  color: Color;
  fontSize: number;

  render(renderer: Renderer): void {
    let x = 0;
    for (const char of this.text) {
      const info = this.font.chars.get(char);
      if (info) {
        renderer.drawChar(this.font.texture, info, x, 0, this.color);
        x += info.xAdvance;
      }
    }
  }
}
```

### 5. 基础控件

#### Button

```typescript
class Button extends UIComponent {
  private normal: Texture;
  private hovered: Texture;
  private pressed: Texture;
  private label: Text;

  onClick: () => void;

  onMouseEnter(): void {
    this.currentTexture = this.hovered;
  }

  onMouseLeave(): void {
    this.currentTexture = this.normal;
  }

  onMouseDown(): void {
    this.currentTexture = this.pressed;
  }

  onMouseUp(): void {
    this.onClick?.();
    this.currentTexture = this.hovered;
  }
}
```

#### Slider

```typescript
class Slider extends UIComponent {
  min: number = 0;
  max: number = 100;
  value: number = 50;

  private track: Texture;
  private handle: Texture;
  private isDragging: boolean = false;

  onChange: (value: number) => void;

  onMouseDown(): void {
    this.isDragging = true;
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  update(mouse: Mouse): void {
    if (this.isDragging) {
      const localX = mouse.x - this.getWorldPosition().x;
      this.value = this.min + (localX / this.size.x) * (this.max - this.min);
      this.onChange?.(this.value);
    }
  }
}
```

### 6. UI 容器

```typescript
class Canvas extends UIComponent {
  children: UIComponent[];
  camera: Camera;  // 正交相机，专门用于 UI

  render(renderer: Renderer): void {
    // 使用 UI 相机渲染所有子元素
    renderer.setCamera(this.camera);
    for (const child of this.children) {
      if (child.visible) {
        child.render(renderer);
      }
    }
  }
}
```

## 文件结构

```
@nova/ui/
├── src/
│   ├── index.ts
│   ├── UIComponent.ts
│   ├── Canvas.ts
│   ├── layout/
│   │   ├── Layout.ts
│   │   ├── HorizontalLayout.ts
│   │   └── VerticalLayout.ts
│   ├── components/
│   │   ├── Text.ts
│   │   ├── Button.ts
│   │   ├── Slider.ts
│   │   └── Image.ts
│   ├── events/
│   │   └── UIEventHandler.ts
│   └── font/
│       ├── BitmapFont.ts
│       └── TextRenderer.ts
└── index.ts
```

## 示例项目

`examples/06-ui-demo/`:
- 主菜单界面
- 暂停菜单
- HUD (生命值、分数)
- 设置界面 (音量滑块)

## 学习资源

- Unity UI 系统
- Phaser UI 插件
- Figma 布局概念

## 交付物

- `@nova/ui` 包
- UI 示例

## 验证标准

```typescript
// 创建主菜单
const canvas = new Canvas();

// 标题
const title = new Text(titleFont, 'Nova Game');
title.anchor = { x: 0.5, y: 0.3 };
title.fontSize = 48;
canvas.addChild(title);

// 开始按钮
const startBtn = new Button('Start Game');
startBtn.anchor = { x: 0.5, y: 0.5 };
startBtn.onClick = () => game.start();
canvas.addChild(startBtn);

// 渲染
canvas.render(renderer);
```
