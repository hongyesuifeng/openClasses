# NovaEngine 整体架构

## 设计原则

1. **模块化**: 各包独立，通过明确接口通信
2. **可扩展**: 核心稳定，功能可插拔
3. **性能优先**: 数据导向设计，缓存友好
4. **类型安全**: TypeScript 全面覆盖

## 架构图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Game Layer                                   │
│                     (User Code, Game Logic)                               │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            @nova/engine                                   │
│                    (Engine, Game, Scene Management)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         @nova/scene                                  │ │
│  │                  (SceneGraph, Transform, Nodes)                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   @nova/ecs     │  │   @nova/render  │  │  @nova/input    │
│ (World,System)  │  │ (WebGL2,Shader) │  │ (Keyboard,Mouse)│
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ @nova/physics2d │  │ @nova/animation │  │   @nova/audio   │
│ (Collision,Body)│  │ (Tween,Clip)    │  │ (WebAudio API)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   @nova/core    │
                    │ (Math,Event,    │
                    │  Pool, Time)    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │@nova/resource   │
                    │(Loader, Cache)  │
                    └─────────────────┘
```

## 包依赖关系

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'

# 依赖图
engine:
  - ecs
  - scene
  - render
  - input
  - audio
  - animation
  - physics2d
  - resource

ecs:
  - core

scene:
  - core

render:
  - core
  - resource

physics2d:
  - core
  - ecs

animation:
  - core
  - ecs

input:
  - core

audio:
  - core
  - resource

resource:
  - core

ui:
  - core
  - render
  - input

core:
  - (无依赖，纯数学和工具)
```

## 核心流程

### 游戏循环

```typescript
class Engine {
  private world: World;
  private renderer: Renderer;
  private time: Time;

  start(): void {
    this.init();
    this.loop();
  }

  private loop = (): void => {
    const dt = this.time.update();

    // 固定时间步长更新
    while (this.time.accumulator >= this.time.fixedDeltaTime) {
      this.world.fixedUpdate(this.time.fixedDeltaTime);
      this.time.accumulator -= this.time.fixedDeltaTime;
    }

    // 变长时间更新
    this.world.update(dt);

    // 渲染
    this.render();

    requestAnimationFrame(this.loop);
  };

  private render(): void {
    this.renderer.clear();

    // 渲染场景
    this.world.render(this.renderer);

    // 后处理
    // this.postProcess();
  }
}
```

### 事件流

```
Input Events (Keyboard, Mouse)
          │
          ▼
    Input System
          │
          ▼
    Emit Game Events
          │
          ▼
    ┌─────┴─────┐
    │           │
    ▼           ▼
 Game Logic   Animation
 System       System
    │           │
    └─────┬─────┘
          │
          ▼
    Render System
          │
          ▼
    GPU Rendering
```

## 数据流

### 资源加载

```
URL Request
     │
     ▼
 Resource Loader
     │
     ▼
┌────┴────┐
│ Parser  │ (Image/JSON/Audio/GLTF)
└────┬────┘
     │
     ▼
   Cache
     │
     ▼
 Game Object (Sprite, Mesh, Sound)
```

### 组件更新

```
World.update(dt)
     │
     ▼
┌────┴────────────────────────┐
│ System 1: InputSystem       │
│   Query: [Input, Velocity]  │
└────┬────────────────────────┘
     │
     ▼
┌────┴────────────────────────┐
│ System 2: PhysicsSystem     │
│   Query: [Position, Collider]│
└────┬────────────────────────┘
     │
     ▼
┌────┴────────────────────────┐
│ System 3: RenderSystem      │
│   Query: [Position, Sprite] │
└─────────────────────────────┘
```

## 扩展点

### 自定义组件

```typescript
// 用户定义新组件
const Health = defineComponent({
  current: Types.f32,
  max: Types.f32
});

const Damage = defineComponent({
  amount: Types.f32
});

// 注册到世界
world.registerComponent(Health);
world.registerComponent(Damage);
```

### 自定义系统

```typescript
// 用户定义新系统
class HealthSystem extends System {
  private query = this.createQuery({
    all: [Health, Damage]
  });

  update(dt: number): void {
    for (const entity of this.query) {
      Health.current[entity] -= Damage.amount[entity];
      if (Health.current[entity] <= 0) {
        this.world.destroyEntity(entity);
      }
    }
  }
}

world.addSystem(new HealthSystem());
```

### 自定义渲染

```typescript
class CustomRenderSystem extends System {
  private shader: Shader;
  private mesh: Mesh;

  update(dt: number): void {
    this.shader.bind();
    this.shader.setMat4('u_mvp', this.camera.viewProjection);
    this.mesh.bind();
    this.renderer.drawIndexed(this.mesh.indexCount);
  }
}
```

## 配置系统

```typescript
// engine.config.ts
export const config = {
  renderer: {
    backend: 'webgl2',
    antialias: true,
    alpha: false,
    width: 1280,
    height: 720
  },

  physics: {
    fixedDeltaTime: 1 / 60,
    gravity: { x: 0, y: -9.8 }
  },

  audio: {
    masterVolume: 1.0,
    categoryVolumes: {
      sfx: 0.8,
      music: 0.5
    }
  }
};

// 使用
const engine = new Engine(config);
```

## 调试支持

```typescript
// 开发模式下启用
if (process.env.NODE_ENV === 'development') {
  // Debug 渲染
  engine.debug.enabled = true;
  engine.debug.showColliders = true;
  engine.debug.showFPS = true;

  // 性能统计
  engine.stats.enabled = true;
  engine.stats.track('drawCalls');
  engine.stats.track('entities');
}
```

## 未来扩展

1. **WebGPU 后端**: 保持 API 兼容，切换底层实现
2. **3D 物理引擎**: 集成或自研 3D 碰撞检测
3. **网络模块**: WebSocket 封装，状态同步
4. **编辑器扩展**: Inspector 组件，场景编辑
