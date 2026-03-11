# UI 系统设计 (@nova/ui)

## 概述

UI 系统提供游戏界面组件，包括按钮、文本、容器、布局等，支持事件交互和样式定制。

## 设计目标

1. **组件化**: 可复用的 UI 组件
2. **事件驱动**: 点击、悬停、拖拽等交互
3. **布局系统**: 自动排列和对齐
4. **样式分离**: 支持主题和样式定制

## 核心类型

### UIComponent - UI 组件基类

```typescript
// ui-component.ts
export abstract class UIComponent {
  readonly id: number;
  name: string;

  // 变换
  x: number = 0;
  y: number = 0;
  width: number = 100;
  height: number = 100;
  pivotX: number = 0.5;
  pivotY: number = 0.5;

  // 可见性
  visible: boolean = true;
  alpha: number = 1;

  // 交互
  interactive: boolean = false;
  enabled: boolean = true;

  // 层级
  zIndex: number = 0;

  // 父子关系
  parent: UIComponent | null = null;
  children: UIComponent[] = [];

  // 样式
  style: UIStyle = {