# UI 系统

UI 系统提供了游戏界面开发所需的所有组件，包括基础框架（UITransform、Canvas）、交互组件（Button、ScrollView、EditBox）和布局系统（Widget、Layout）。

## 目录

- [01-UI 基础框架](./01-ui-basics.md) - UITransform、Canvas、UIRenderer
- [02-UI 组件详解](./02-ui-components.md) - Button、ScrollView、Toggle 等
- [03-布局系统](./03-layout-system.md) - Widget 对齐与 Layout 自动布局

---

## 核心概念

### UI 架构层次

```
┌─────────────────────────────────────────────────────────┐
│                    UI 架构层次                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          交互组件层                                │   │
│  │  Button · ScrollView · Toggle · EditBox          │   │
│  │  Slider · ProgressBar · PageView · SafeArea      │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────┴─────────────────────────────┐   │
│  │          布局系统层                                │   │
│  │  Widget (对齐) · Layout (自动布局)                 │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────┴─────────────────────────────┐   │
│  │          基础框架层                                │   │
│  │  UITransform · UIRenderer · Canvas · Root2D      │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────┴─────────────────────────────┐   │
│  │          2D 渲染层                                 │   │
│  │  Batcher2D · Sprite · Label · Graphics            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| UITransform | `cocos/2d/framework/ui-transform.ts` | UI 变换组件 |
| UIRenderer | `cocos/2d/framework/ui-renderer.ts` | UI 渲染基类 |
| Canvas | `cocos/2d/framework/canvas.ts` | 画布组件 |
| Button | `cocos/ui/button.ts` | 按钮组件 |
| ScrollView | `cocos/ui/scroll-view.ts` | 滚动视图 |
| Toggle | `cocos/ui/toggle.ts` | 开关组件 |
| EditBox | `cocos/ui/edit-box.ts` | 输入框 |
| Layout | `cocos/ui/layout.ts` | 自动布局 |
| Widget | `cocos/ui/widget.ts` | 对齐组件 |
| WidgetManager | `cocos/ui/widget-manager.ts` | 对齐管理器 |

---

## 学习目标

完成本章节后，你将能够：

1. 理解 UI 基础框架的设计
2. 掌握各 UI 组件的使用和实现
3. 理解布局系统的工作原理

---

## 预计时间

- UI 基础框架：1 天
- UI 组件详解：1-2 天
- 布局系统：1 天

**总计：3-4 天**

---

## 下一步

准备好后，开始学习 [01-UI 基础框架](./01-ui-basics.md)。
