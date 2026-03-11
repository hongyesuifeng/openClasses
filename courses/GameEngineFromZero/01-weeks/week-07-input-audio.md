# 第7周: 输入系统 + 音频系统

## 目标

- 键盘输入
- 鼠标输入
- 触摸输入
- Web Audio API 封装
- :video_game: **游戏 #2: Asteroids**

## 任务清单

### 1. 输入系统 (@nova/input)

#### Keyboard
- [ ] 按键状态追踪 (down, up, held)
- [ ] 按键映射
- [ ] 组合键支持 (可选)

```typescript
const keyboard = new Keyboard();

// 初始化 (绑定 window 事件)
keyboard.attach(window);

// 在游戏循环中使用
if (keyboard.isKeyDown('KeyW')) {
  player.velocity.y = -speed;
}
if (keyboard.isKeyPressed('Space')) {
  player.shoot();
}
```

#### Mouse
- [ ] 位置追踪
- [ ] 按键状态
- [ ] 滚轮
- [ ] 坐标转换 (屏幕 -> 世界)

```typescript
const mouse = new Mouse();

mouse.attach(canvas);

// 获取世界坐标
const worldPos = camera.screenToWorld(mouse.position);

if (mouse.isButtonDown('left')) {
  const target = mouse.worldPosition;
  projectile.moveTo(target);
}

if (mouse.wheelY !== 0) {
  camera.zoom += mouse.wheelY * 0.1;
}
```

#### Touch
- [ ] 单指触摸
- [ ] 多指触摸
- [ ] 手势识别 (可选)

```typescript
const touch = new Touch();

touch.attach(canvas);

if (touch.touches.length > 0) {
  const firstTouch = touch.touches[0];
  player.moveTo(firstTouch.position);
}

// 双指缩放
if (touch.touches.length === 2) {
  const scale = touch.getPinchScale();
  camera.zoom *= scale;
}
```

#### Gamepad (可选)
- [ ] 手柄连接检测
- [ ] 按钮状态
- [ ] 摇杆输入

### 2. 输入管理器

```typescript
class InputManager {
  keyboard: Keyboard;
  mouse: Mouse;
  touch: Touch;

  // 虚拟按键 (可重映射)
  private bindings: Map<string, InputBinding>;

  isActionDown(action: string): boolean { /* ... */ }
  isActionPressed(action: string): boolean { /* ... */ }
  getActionValue(action: string): number { /* ... */ }
}

// 使用示例
input.bind('move_left', [
  { type: 'keyboard', key: 'KeyA' },
  { type: 'keyboard', key: 'ArrowLeft' },
  { type: 'gamepad', button: 'dpad_left' }
]);

if (input.isActionDown('move_left')) {
  player.moveLeft();
}
```

### 3. 音频系统 (@nova/audio)

#### AudioEngine
- [ ] Web Audio API 上下文
- [ ] 主音量控制
- [ ] 音频分类 (SFX, Music, Voice)

```typescript
const audio = new AudioEngine();

// 初始化
await audio.init();

// 音量控制
audio.setMasterVolume(0.8);
audio.setCategoryVolume('music', 0.5);
```

#### Sound
- [ ] 音效加载
- [ ] 一次播放 / 循环播放
- [ ] 音量 / 声相

```typescript
class Sound {
  static async load(url: string): Promise<Sound>;

  play(options?: {
    volume?: number;
    loop?: boolean;
    rate?: number;
  }): void;

  stop(): void;
  pause(): void;
  resume(): void;
}

// 使用
const jumpSound = await Sound.load('jump.mp3');
jumpSound.play({ volume: 0.5 });
```

#### Music
- [ ] 背景音乐
- [ ] 淡入淡出
- [ ] 循环点 (Loop Points)

```typescript
const bgm = new Music('background.mp3');

// 淡入播放
bgm.play({ fadeIn: 1000 });

// 切换音乐 (淡出当前，淡入新音乐)
bgm.crossfade('boss_music.mp3', 2000);
```

### 4. 游戏项目: Asteroids

```
games/02-asteroids/
├── src/
│   ├── main.ts
│   ├── components/
│   │   ├── Position.ts
│   │   ├── Velocity.ts
│   │   ├── Rotation.ts
│   │   ├── Ship.ts
│   │   ├── Asteroid.ts
│   │   ├── Bullet.ts
│   │   └── Collider.ts
│   ├── systems/
│   │   ├── InputSystem.ts       # 处理键盘输入
│   │   ├── MovementSystem.ts    # 物理移动
│   │   ├── WrapSystem.ts        # 屏幕环绕
│   │   ├── CollisionSystem.ts   # 碰撞检测
│   │   ├── SpawnSystem.ts       # 生成小行星
│   │   ├── ParticleSystem.ts    # 爆炸粒子
│   │   └── RenderSystem.ts
│   └── Game.ts
├── assets/
│   ├── ship.png
│   ├── asteroid.png
│   ├── shoot.mp3
│   └── explosion.mp3
└── index.html
```

**游戏功能**:
- [ ] 玩家飞船 (旋转 + 推进)
- [ ] 随机生成的小行星
- [ ] 子弹发射
- [ ] 圆形碰撞检测
- [ ] 屏幕环绕
- [ ] 分数系统
- [ ] 粒子爆炸效果
- [ ] 音效反馈

## 学习资源

- MDN Web Audio API
- Phaser Input 源码
- Howler.js 音频库

## 交付物

- `@nova/input` 包
- `@nova/audio` 包
- **可玩的 Asteroids 游戏!**

## 验证标准

1. 键盘能正确控制飞船
2. 音效能正确播放
3. 小行星和子弹碰撞正确
4. 屏幕环绕工作正常

```bash
cd games/02-asteroids
pnpm dev
# 使用方向键控制飞船，空格发射
```
