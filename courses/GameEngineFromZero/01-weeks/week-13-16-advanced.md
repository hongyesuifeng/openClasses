# 第13-16周: 动画进阶、编辑器、优化与最终项目

## 第13周: 动画系统进阶

### 目标
- 骨骼动画基础
- 动画混合
- 动画层
- IK (逆向动力学) 基础

### 任务清单

#### 骨骼动画
- [ ] Skeleton 数据结构
- [ ] Bone 变换
- [ ] Skin 矩阵计算
- [ ] 顶点蒙皮

```glsl
// skinned.vert
uniform mat4 u_boneMatrices[MAX_BONES];

in vec4 a_boneWeights;
in vec4 a_boneIndices;

void main() {
  mat4 skinMatrix =
    a_boneWeights.x * u_boneMatrices[int(a_boneIndices.x)] +
    a_boneWeights.y * u_boneMatrices[int(a_boneIndices.y)] +
    a_boneWeights.z * u_boneMatrices[int(a_boneIndices.z)] +
    a_boneWeights.w * u_boneMatrices[int(a_boneIndices.w)];

  vec4 skinnedPos = skinMatrix * vec4(a_position, 1.0);
  gl_Position = u_mvp * skinnedPos;
}
```

#### 动画混合
- [ ] 线性混合
- [ ] 混合树 (Blend Tree)
- [ ] 过渡时间

#### IK 基础
- [ ] Two-Bone IK
- [ ] 简单约束

---

## 第14周: 编辑器开发

### 目标
- 场景编辑器 UI
- Inspector 面板
- Hierarchy 面板
- 拖拽操作
- Undo/Redo 系统

### 任务清单

#### 编辑器架构

```typescript
class Editor {
  private scene: Scene;
  private selectedEntity: Entity | null;

  // 面板
  private hierarchyPanel: HierarchyPanel;
  private inspectorPanel: InspectorPanel;
  private viewportPanel: ViewportPanel;

  // 命令系统
  private commandHistory: CommandHistory;

  selectEntity(entity: Entity): void {
    this.selectedEntity = entity;
    this.inspectorPanel.setTarget(entity);
  }

  executeCommand(command: Command): void {
    command.execute();
    this.commandHistory.push(command);
  }

  undo(): void {
    const command = this.commandHistory.undo();
    if (command) command.undo();
  }

  redo(): void {
    const command = this.commandHistory.redo();
    if (command) command.execute();
  }
}
```

#### Inspector 面板
- [ ] 组件列表显示
- [ ] 属性编辑器
- [ ] 自定义编辑器

```typescript
class InspectorPanel {
  render(entity: Entity): void {
    for (const [type, data] of entity.components) {
      const editor = this.getEditor(type);
      editor.render(data);
    }
  }
}

class TransformEditor {
  render(transform: Transform): void {
    // Position
    this.vec3Input('Position', transform.position);
    // Rotation
    this.vec3Input('Rotation', transform.rotation);
    // Scale
    this.vec3Input('Scale', transform.scale);
  }
}
```

#### Undo/Redo 系统

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class MoveEntityCommand implements Command {
  constructor(
    private entity: Entity,
    private oldPos: Vec3,
    private newPos: Vec3
  ) {}

  execute(): void {
    Position.set(this.entity, this.newPos);
  }

  undo(): void {
    Position.set(this.entity, this.oldPos);
  }
}
```

---

## 第15周: 优化与调试

### 目标
- 性能分析工具
- 内存优化
- Draw Call 优化
- Profiler 集成
- Debug 渲染
- :video_game: **游戏 #5: 3D Showcase**

### 任务清单

#### 性能分析工具

```typescript
class Profiler {
  private frames: FrameStats[] = [];
  private currentFrame: FrameStats;

  beginFrame(): void {
    this.currentFrame = {
      startTime: performance.now(),
      drawCalls: 0,
      triangles: 0,
      entities: 0,
      systems: new Map()
    };
  }

  endFrame(): void {
    this.currentFrame.endTime = performance.now();
    this.frames.push(this.currentFrame);
  }

  beginSection(name: string): void {
    this.currentFrame.systems.set(name, { startTime: performance.now() });
  }

  endSection(name: string): void {
    const section = this.currentFrame.systems.get(name);
    section.endTime = performance.now();
    section.duration = section.endTime - section.startTime;
  }
}
```

#### Debug 渲染

- [ ] 碰撞体线框
- [ ] 骨骼可视化
- [ ] 光照范围
- [ ] 性能统计 UI

```typescript
class DebugRenderer {
  drawAABB(aabb: AABB, color: Color): void;
  drawCircle(center: Vec2, radius: number, color: Color): void;
  drawLine(start: Vec3, end: Vec3, color: Color): void;
  drawSkeleton(skeleton: Skeleton): void;
}
```

#### 优化技术

- [ ] 批处理合并
- [ ] 视锥剔除
- [ ] LOD (Level of Detail)
- [ ] 对象池优化

---

## 第16周: 最终整合

### 目标
- 引擎文档完善
- API 文档生成
- 示例项目整理
- 最终项目演示
- 学习总结文档

### 任务清单

#### 文档完善

- [ ] 架构文档更新
- [ ] API 文档 (TypeDoc)
- [ ] 使用指南
- [ ] 示例代码注释

```bash
# 生成 API 文档
typedoc --out docs/api packages/
```

#### 示例整理

| 示例 | 描述 |
|------|------|
| 01-hello-triangle | 第一个三角形 |
| 02-sprite-renderer | Sprite 渲染 |
| 03-ecs-demo | ECS 架构演示 |
| 04-physics-demo | 物理系统演示 |
| 05-audio-demo | 音频系统 |
| 06-animation-demo | 动画系统 |
| 07-3d-advanced | 3D 高级特性 |

#### 游戏 #5: 3D Showcase

```
games/05-3d-showcase/
├── src/
│   ├── main.ts
│   ├── Game.ts
│   ├── scenes/
│   │   ├── SponzaScene.ts      # 展示场景
│   │   ├── AnimationScene.ts   # 骨骼动画展示
│   │   └── LightingScene.ts    # 光照展示
│   └── ui/
│       ├── DebugUI.ts
│       └── SceneSelector.ts
└── assets/
    ├── models/
    ├── textures/
    └── environments/
```

**展示内容**:
- [ ] 复杂 3D 场景渲染
- [ ] 骨骼动画角色
- [ ] 动态光照和阴影
- [ ] 后处理效果
- [ ] 场景切换

---

## 16周项目总结

### 完成的引擎模块

| 模块 | 状态 | 描述 |
|------|------|------|
| @nova/core | ✅ | 数学库、事件系统、工具函数 |
| @nova/ecs | ✅ | ECS 框架 (bitECS 风格) |
| @nova/render | ✅ | WebGL2 渲染、着色器、相机 |
| @nova/scene | ✅ | 场景图、变换组件 |
| @nova/physics2d | ✅ | 2D 碰撞检测 |
| @nova/animation | ✅ | 帧动画、Tween、状态机 |
| @nova/input | ✅ | 键盘、鼠标、触摸 |
| @nova/audio | ✅ | Web Audio API 封装 |
| @nova/resource | ✅ | 资源加载、缓存 |
| @nova/ui | ✅ | UI 组件、布局 |

### 完成的游戏项目

| 游戏 | 难度 | 技术点 |
|------|------|--------|
| Pong | ★☆☆☆☆ | ECS 基础、碰撞检测 |
| Asteroids | ★★☆☆☆ | 物理系统、粒子效果 |
| Platformer | ★★★☆☆ | 角色控制器、动画 |
| Tower Defense | ★★★☆☆ | UI 系统、状态机 |
| 3D Showcase | ★★★★☆ | 3D 渲染、骨骼动画 |

### 学习成果

1. **游戏引擎架构**: 理解 ECS、场景图、渲染管线等核心概念
2. **WebGL2**: 掌握底层图形编程
3. **数据导向设计**: 理解性能优化思维
4. **TypeScript**: 实践大型项目组织
5. **游戏开发**: 完成 5 个可玩游戏
