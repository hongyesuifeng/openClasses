# 第9周: 粒子系统 + 资源管理

## 目标

- 粒子发射器
- 粒子生命周期
- GPU Instancing 渲染
- 资源加载系统
- :video_game: **游戏 #3: Platformer**

## 任务清单

### 1. 粒子系统 (@nova/particles)

#### ParticleEmitter

- [ ] 发射器配置
  - [ ] 发射率 (rate)
  - [ ] 发射位置 (point, box, circle)
  - [ ] 发射方向 (cone, sphere)
  - [ ] 最大粒子数

- [ ] 粒子属性
  - [ ] 初始速度
  - [ ] 生命周期
  - [ ] 初始大小 / 结束大小
  - [ ] 初始颜色 / 结束颜色
  - [ ] 重力影响

```typescript
const emitter = new ParticleEmitter({
  rate: 50,           // 每秒发射数量
  lifetime: { min: 0.5, max: 1.5 },
  speed: { min: 50, max: 150 },
  angle: { min: 0, max: Math.PI * 2 },
  size: { start: 10, end: 0 },
  color: { start: [1, 0.5, 0, 1], end: [1, 0, 0, 0] },
  gravity: 100,
  maxParticles: 500
});
```

#### Particle System

- [ ] 粒子更新逻辑
- [ ] 粒子池管理
- [ ] 空间分区 (可选)

```typescript
class ParticleSystem extends System {
  update(dt: number): void {
    for (const emitter of this.emitters) {
      // 发射新粒子
      emitter.emit(dt);

      // 更新现有粒子
      for (const particle of emitter.particles) {
        particle.life -= dt;
        if (particle.life <= 0) {
          emitter.recycle(particle);
          continue;
        }

        // 更新位置
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += emitter.gravity * dt;

        // 插值大小和颜色
        const t = particle.life / particle.maxLife;
        particle.size = lerp(emitter.size.end, emitter.size.start, t);
        particle.color = lerpColor(emitter.color.end, emitter.color.start, t);
      }
    }
  }
}
```

#### GPU Instancing 渲染

- [ ] 实例化着色器
- [ ] 动态更新实例数据
- [ ] 性能优化

```glsl
// particle_instanced.vert
#version 300 es

in vec2 a_position;     // 单位四边形顶点
in vec2 a_offset;       // 实例: 粒子位置
in float a_size;        // 实例: 粒子大小
in vec4 a_color;        // 实例: 粒子颜色

uniform mat4 u_projection;

out vec4 v_color;

void main() {
  vec2 pos = a_position * a_size + a_offset;
  gl_Position = u_projection * vec4(pos, 0.0, 1.0);
  v_color = a_color;
}
```

### 2. 资源管理 (@nova/resource)

#### ResourceLoader

- [ ] 异步加载队列
- [ ] 加载进度回调
- [ ] 错误处理

```typescript
const loader = new ResourceLoader();

loader.add('player', 'assets/player.png');
loader.add('jump', 'assets/jump.mp3');
loader.add('level', 'assets/level.json');

loader.onProgress((loaded, total) => {
  console.log(`Loading: ${loaded}/${total}`);
});

await loader.load();
```

#### ResourceCache

- [ ] 内存缓存
- [ ] 引用计数
- [ ] 资源释放

```typescript
const cache = new ResourceCache();

// 获取或加载
const texture = await cache.get<Texture>('player', () =>
  Texture.fromURL('assets/player.png')
);

// 释放
cache.release('player');
```

#### 资源解析器

- [ ] ImageParser (PNG, JPG)
- [ ] AudioParser (MP3, WAV, OGG)
- [ ] JSONParser
- [ ] GLTFParser (后期)

```typescript
// 自定义解析器
loader.registerParser('.png', new ImageParser());
loader.registerParser('.mp3', new AudioParser());
```

### 3. 游戏项目: Platformer

```
games/03-platformer/
├── src/
│   ├── main.ts
│   ├── Game.ts
│   │
│   ├── components/
│   │   ├── Position.ts
│   │   ├── Velocity.ts
│   │   ├── Player.ts
│   │   ├── Platform.ts
│   │   ├── Collider.ts
│   │   ├── Gravity.ts
│   │   ├── AnimatedSprite.ts
│   │   └── Jump.ts
│   │
│   ├── systems/
│   │   ├── PlayerInputSystem.ts
│   │   ├── GravitySystem.ts
│   │   ├── MovementSystem.ts
│   │   ├── CollisionSystem.ts     # 平台碰撞
│   │   ├── JumpSystem.ts
│   │   ├── AnimationSystem.ts     # 根据状态播放动画
│   │   ├── ParticleSystem.ts      # 跑步尘土、跳跃特效
│   │   └── RenderSystem.ts
│   │
│   └── levels/
│       └── level1.json
│
├── assets/
│   ├── player/
│   │   ├── idle_1.png
│   │   ├── idle_2.png
│   │   ├── walk_1.png
│   │   ├── walk_2.png
│   │   └── jump.png
│   ├── tileset.png
│   ├── jump.mp3
│   └── land.mp3
│
└── index.html
```

**游戏功能**:
- [ ] 角色移动 (左右)
- [ ] 跳跃 (可变高度)
- [ ] 平台碰撞 (单向平台)
- [ ] 重力系统
- [ ] 帧动画 (idle, walk, jump)
- [ ] 粒子效果 (跑步尘土)
- [ ] 音效

## 学习资源

- Unity Particle System 文档
- PixiJS Particle Container
- Phaser Loader 源码

## 交付物

- 粒子系统
- 资源管理系统
- **可玩的 Platformer 游戏!**

## 验证标准

```bash
cd games/03-platformer
pnpm dev
# 使用方向键移动，空格跳跃
```

粒子效果应该:
- 跳跃时产生尘土
- 落地时产生落地特效
- 渲染性能良好 (>100 粒子不卡顿)
