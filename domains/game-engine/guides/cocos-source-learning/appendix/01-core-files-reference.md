# 核心文件参考

本文档列出了 Cocos Creator 3.8.8 引擎的核心源文件，按模块分类并标注优先级。

## 目录

- [入口与初始化](#entry-and-initialization)
- [核心基础层](#core-foundation)
- [场景图系统](#scene-graph)
- [渲染系统](#rendering-system)
- [动画系统](#animation-system)
- [物理系统](#physics-system)
- [资源管理](#asset-management)
- [UI 系统](#ui-system)

---

## 入口与初始化

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/game/game.ts` | 中 | ⭐⭐⭐ | 游戏主控制器，引擎入口 |
| `cocos/game/director.ts` | 中 | ⭐⭐⭐ | 导演类，场景和系统管理 |
| `cocos/root.ts` | 中 | ⭐⭐ | 渲染器根管理 |

### 关键方法

```typescript
// cocos/game/game.ts
Game.init(config)      // 初始化引擎
Game.run()             // 启动游戏循环
Game.tick(dt)          // 每帧更新

// cocos/game/director.ts
Director.loadScene()   // 加载场景
Director.runScene()    // 运行场景
Director.tick(dt)      // 每帧更新
```

---

## 核心基础层

### 数学库

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/core/math/vec3.ts` | ~15KB | ⭐⭐ | 三维向量 |
| `cocos/core/math/mat4.ts` | ~20KB | ⭐⭐ | 4x4 矩阵 |
| `cocos/core/math/quat.ts` | ~12KB | ⭐⭐ | 四元数 |
| `cocos/core/math/color.ts` | 小 | ⭐ | 颜色 |

### 事件与调度

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/core/event/eventify.ts` | 小 | ⭐⭐ | 事件混合器 |
| `cocos/core/event/callbacks-invoker.ts` | 中 | ⭐⭐ | 回调调用器 |
| `cocos/core/scheduler.ts` | ~46KB | ⭐⭐⭐ | 调度器 |
| `cocos/core/system.ts` | 小 | ⭐⭐ | 系统基类 |

### 内存管理

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/core/memop/pool.ts` | 小 | ⭐⭐ | 对象池 |
| `cocos/core/memop/recycle-pool.ts` | 小 | ⭐ | 回收池 |
| `cocos/core/memop/cached-array.ts` | 小 | ⭐ | 缓存数组 |

---

## 场景图系统

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/scene-graph/node.ts` | ~108KB | ⭐⭐⭐ | 节点类（最重要） |
| `cocos/scene-graph/component.ts` | 中 | ⭐⭐⭐ | 组件基类 |
| `cocos/scene-graph/scene.ts` | 中 | ⭐⭐ | 场景管理 |
| `cocos/scene-graph/component-scheduler.ts` | 中 | ⭐⭐ | 组件调度器 |
| `cocos/scene-graph/layers.ts` | 小 | ⭐ | 图层系统 |

### Node 关键属性

```typescript
// 变换
_lpos: Vec3         // 本地位置
_lrot: Quat         // 本地旋转
_lscale: Vec3       // 本地缩放
_worldMatrix: Mat4  // 世界矩阵

// 层级
_parent: Node       // 父节点
_children: Node[]   // 子节点
_components: Component[]  // 组件列表
```

---

## 渲染系统

### GFX 抽象层

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/gfx/base/device.ts` | 中 | ⭐⭐ | 设备基类 |
| `cocos/gfx/base/buffer.ts` | 小 | ⭐ | 缓冲区 |
| `cocos/gfx/base/texture.ts` | 小 | ⭐ | 纹理 |
| `cocos/gfx/base/shader.ts` | 小 | ⭐ | 着色器 |
| `cocos/gfx/webgl/` | 大 | ⭐ | WebGL 实现 |
| `cocos/gfx/webgl2/` | 大 | ⭐ | WebGL2 实现 |

### 渲染管线

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/rendering/render-pipeline.ts` | ~34KB | ⭐⭐⭐ | 渲染管线 |
| `cocos/rendering/define.ts` | ~51KB | ⭐⭐⭐ | 渲染定义 |
| `cocos/rendering/render-queue.ts` | 中 | ⭐⭐ | 渲染队列 |
| `cocos/rendering/custom/pipeline.ts` | 中 | ⭐⭐ | 自定义管线 |

### 渲染场景

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/render-scene/core/render-scene.ts` | 中 | ⭐⭐ | 渲染场景 |
| `cocos/render-scene/scene/camera.ts` | 中 | ⭐⭐ | 相机 |
| `cocos/render-scene/scene/model.ts` | 中 | ⭐⭐ | 模型 |
| `cocos/render-scene/scene/light.ts` | 中 | ⭐ | 光源 |

---

## 动画系统

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/animation/animation-clip.ts` | ~56KB | ⭐⭐⭐ | 动画剪辑 |
| `cocos/animation/animation-component.ts` | 中 | ⭐⭐ | 动画组件 |
| `cocos/animation/animation-state.ts` | 中 | ⭐⭐ | 动画状态 |
| `cocos/animation/marionette/` | 大 | ⭐⭐ | 状态机动画 |

---

## 物理系统

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/physics/framework/physics-system.ts` | 中 | ⭐⭐ | 物理系统 |
| `cocos/physics/framework/rigid-body.ts` | 中 | ⭐⭐ | 刚体 |
| `cocos/physics/spec/` | 小 | ⭐ | 接口规范 |

---

## 资源管理

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/asset/asset-manager/asset-manager.ts` | 中 | ⭐⭐ | 资源管理器 |
| `cocos/asset/asset-manager/bundle.ts` | 中 | ⭐ | 资源包 |
| `cocos/asset/asset-manager/cache.ts` | 小 | ⭐ | 缓存 |
| `cocos/asset/asset-manager/pipeline.ts` | 中 | ⭐ | 加载管线 |

---

## UI 系统

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/ui/button.ts` | 中 | ⭐ | 按钮 |
| `cocos/ui/scroll-view.ts` | 大 | ⭐ | 滚动视图 |
| `cocos/ui/layout.ts` | 大 | ⭐ | 布局 |
| `cocos/ui/widget.ts` | 中 | ⭐ | 对齐组件 |

---

## 2D 渲染

| 文件 | 大小 | 优先级 | 说明 |
|------|------|--------|------|
| `cocos/2d/renderer/batcher-2d.ts` | ~48KB | ⭐⭐ | 2D 批处理 |
| `cocos/2d/framework/sprite.ts` | 中 | ⭐ | 精灵组件 |
| `cocos/2d/framework/label.ts` | 大 | ⭐ | 文本组件 |

---

## 阅读建议

### 初学者

1. 先阅读入口文件：`game.ts` → `director.ts`
2. 然后阅读核心：`node.ts` → `component.ts`
3. 再阅读基础：`scheduler.ts` → 事件系统

### 进阶者

1. 深入渲染系统
2. 理解动画系统
3. 学习资源管理

### 高级者

1. 研究原生层（native/）
2. 理解 JSB 绑定
3. 贡献引擎代码
