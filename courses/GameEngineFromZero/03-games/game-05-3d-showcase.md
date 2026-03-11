# 游戏 #5: 3D Showcase (3D 技术展示)

## 概述

**难度**: :star::star::star::star:

**周次**: 第 15 周

**技术点**: 3D 渲染、骨骼动画、动态光照、阴影、后处理

## 项目目标

创建一个展示 NovaEngine 3D 能力的技术演示项目，包含:
- 复杂 3D 场景
- 骨骼动画角色
- 动态光照和阴影
- 后处理效果
- 交互式场景切换

## 项目结构

```
games/05-3d-showcase/
├── src/
│   ├── main.ts
│   ├── Game.ts
│   ├── CameraController.ts
│   │
│   ├── scenes/
│   │   ├── BaseScene.ts
│   │   ├── SponzaScene.ts       # 建筑场景 (展示光照)
│   │   ├── CharacterScene.ts    # 角色场景 (展示动画)
│   │   ├── ParticlesScene.ts    # 粒子场景
│   │   └── LightingScene.ts     # 光照演示
│   │
│   ├── components/
│   │   ├── Rotate.ts            # 自动旋转
│   │   ├── Float.ts             # 漂浮效果
│   │   └── Interactive.ts       # 可交互
│   │
│   └── ui/
│       ├── DebugUI.ts           # 性能统计
│       ├── SceneSelector.ts     # 场景选择
│       └── Controls.ts          # 控制说明
│
├── assets/
│   ├── models/
│   │   ├── sponza.glb
│   │   ├── character.glb
│   │   └── cube.glb
│   ├── textures/
│   │   ├── environment.hdr
│   │   └── ...
│   ├── shaders/
│   │   └── custom/
│   └── audio/
│       └── ambient.mp3
│
└── index.html
```

## 场景设计

### 1. Sponza Scene (建筑场景)

展示:
- 复杂几何体渲染
- 多光源照明
- 实时阴影
- 天空盒反射

```typescript
class SponzaScene extends BaseScene {
  async load(): Promise<void> {
    // 加载模型
    const sponza = await this.loader.loadGLTF('sponza.glb');
    this.add(sponza);

    // 添加光源
    this.addDirectionalLight({
      position: [10, 20, 5],
      intensity: 1.0,
      castShadow: true
    });

    // 天空盒
    this.skybox = await Skybox.fromHDR('environment.hdr');
  }

  update(dt: number): void {
    // 动态时间变化
    this.timeOfDay += dt * 0.1;
    this.updateLighting();
  }
}
```

### 2. Character Scene (角色场景)

展示:
- 骨骼动画
- 动画混合
- 角色控制

```typescript
class CharacterScene extends BaseScene {
  private character: Entity;
  private animator: AnimationController;

  async load(): Promise<void> {
    // 加载角色模型
    this.character = await this.loader.loadGLTF('character.glb');

    // 获取动画控制器
    this.animator = this.character.getComponent(AnimationController);

    // 添加动画
    this.animator.addClip('idle', idleClip);
    this.animator.addClip('walk', walkClip);
    this.animator.addClip('run', runClip);
    this.animator.addClip('jump', jumpClip);

    // 地面
    this.addGround();
  }

  update(dt: number): void {
    // 玩家控制
    if (this.input.isKeyDown('KeyW')) {
      this.animator.play('walk');
      this.character.moveForward(dt);
    } else {
      this.animator.play('idle');
    }

    if (this.input.isKeyPressed('Space')) {
      this.animator.play('jump');
    }
  }
}
```

### 3. Particles Scene (粒子场景)

展示:
- GPU 粒子系统
- 大量粒子渲染
- 自定义着色器效果

```typescript
class ParticlesScene extends BaseScene {
  private particleSystem: GPUParticleSystem;

  async load(): Promise<void> {
    // 创建大型粒子系统
    this.particleSystem = new GPUParticleSystem({
      maxParticles: 100000,
      emissionRate: 1000,
      lifetime: { min: 2, max: 5 },
      size: { start: 0.1, end: 0 },
      color: { start: [1, 0.5, 0], end: [0.5, 0, 1] }
    });

    this.add(this.particleSystem);
  }

  update(dt: number): void {
    // 动态调整粒子参数
    const t = this.time * 0.5;
    this.particleSystem.emissionShape = {
      type: 'torus',
      radius: 5 + Math.sin(t) * 2,
      tube: 0.5
    };
  }
}
```

### 4. Lighting Scene (光照演示)

展示:
- 多种光源类型
- 动态光照
- PBR 材质

```typescript
class LightingScene extends BaseScene {
  async load(): Promise<void> {
    // 添加多个光源
    this.addPointLight({ position: [-5, 2, 0], color: [1, 0, 0], intensity: 10 });
    this.addPointLight({ position: [5, 2, 0], color: [0, 1, 0], intensity: 10 });
    this.addPointLight({ position: [0, 2, 5], color: [0, 0, 1], intensity: 10 });

    // 展示球体
    for (let i = 0; i < 10; i++) {
      const sphere = this.createSphere(0.5);
      sphere.position.set(i - 5, 0, 0);
      sphere.material.metallic = i / 10;
      sphere.material.roughness = 0.5;
      this.add(sphere);
    }
  }
}
```

## 交互功能

### 相机控制

```typescript
class ShowcaseCameraController {
  // 轨道控制
  orbitControls: OrbitControls;

  // 预设视角
  presets = [
    { name: 'Front', position: [0, 2, 10], target: [0, 1, 0] },
    { name: 'Top', position: [0, 15, 0], target: [0, 0, 0] },
    { name: 'Side', position: [15, 2, 0], target: [0, 1, 0] }
  ];

  // 平滑切换视角
  async transitionTo(preset: CameraPreset): Promise<void> {
    const start = this.camera.position.clone();
    const end = new Vec3(...preset.position);
    const duration = 1000;
    const startTime = performance.now();

    return new Promise(resolve => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = Easing.easeInOutCubic(t);

        this.camera.position = Vec3.lerp(start, end, eased);
        this.camera.lookAt(...preset.target);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }
}
```

### 场景切换

```typescript
class SceneManager {
  private scenes: Map<string, BaseScene> = new Map();
  private currentScene: BaseScene | null = null;

  async switchTo(name: string): Promise<void> {
    // 淡出当前场景
    if (this.currentScene) {
      await this.fadeOut();
      this.currentScene.unload();
    }

    // 加载新场景
    this.currentScene = this.scenes.get(name);
    await this.currentScene.load();

    // 淡入
    await this.fadeIn();
  }
}
```

## UI 设计

```
┌─────────────────────────────────────────────────────────────┐
│  NovaEngine 3D Showcase                          [?] Help   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                                                             │
│                      [3D 场景渲染区域]                        │
│                                                             │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FPS: 60 │ Draw Calls: 45 │ Triangles: 12,345               │
├─────────────────────────────────────────────────────────────┤
│ [Sponza] [Character] [Particles] [Lighting]                │
│                                                             │
│ Controls: Mouse drag to rotate, Scroll to zoom             │
└─────────────────────────────────────────────────────────────┘
```

## 性能目标

| 指标 | 目标值 |
|------|--------|
| FPS | 60 (桌面) / 30 (移动) |
| Draw Calls | < 100 |
| 内存 | < 256MB |
| 加载时间 | < 5s |

## 扩展功能

1. **XR 模式**: WebXR 支持
2. **截图**: 保存当前画面
3. **录制**: 录制 GIF/视频
4. **配置面板**: 动态调整渲染参数

## 验收标准

- [ ] 所有场景正常渲染
- [ ] 骨骼动画流畅播放
- [ ] 阴影效果正确
- [ ] 后处理效果明显
- [ ] 性能达到目标
- [ ] 场景切换流畅
