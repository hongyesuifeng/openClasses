# 场景管理系统设计

## 概述

场景管理系统负责游戏场景的生命周期管理，包括场景切换、场景堆栈和场景间数据传递。

## 设计目标

1. **生命周期管理**: init, enter, exit, destroy
2. **场景堆栈**: 支持场景叠加 (如暂停菜单覆盖游戏场景)
3. **过渡效果**: 场景切换时的淡入淡出
4. **数据传递**: 场景间传递数据

## 核心类型

### Scene - 场景基类

```typescript
// scene.ts
export abstract class Scene {
  readonly name: string;

  // 场景节点
  protected root: SceneNode;

  // 引擎引用
  protected engine: Engine;

  // 是否已初始化
  private _initialized: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.root = new SceneNode('__root__');
  }

  // 生命周期方法
  abstract init(): Promise<void> | void;
  abstract enter(data?: any): Promise<void> | void;
  abstract exit(): Promise<void> | void;

  // 每帧更新
  update(dt: number): void {
    this.root.update(dt);
  }

  // 渲染
  render(renderer: Renderer): void {
    this.root.render(renderer);
  }

  // 销毁
  destroy(): void {
    this.root.destroy();
    this._initialized = false;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  // 内部方法
  _setEngine(engine: Engine): void {
    this.engine = engine;
  }

  _setInitialized(): void {
    this._initialized = true;
  }
}
```

### SceneNode - 场景节点

```typescript
// scene-node.ts
export class SceneNode {
  readonly id: number;
  name: string;

  // 变换
  transform: Transform;

  // 层级关系
  parent: SceneNode | null = null;
  children: SceneNode[] = [];

  // 可见性
  visible: boolean = true;

  // 渲染顺序
  zIndex: number = 0;

  // 组件
  protected components: Map<string, any> = new Map();

  private static nextId: number = 0;

  constructor(name: string = '') {
    this.id = SceneNode.nextId++;
    this.name = name || `node_${this.id}`;
    this.transform = new Transform();
  }

  // 添加子节点
  addChild(child: SceneNode): this {
    if (child.parent) {
      child.parent.removeChild(child);
    }

    child.parent = this;
    this.children.push(child);

    // 按 zIndex 排序
    this.children.sort((a, b) => a.zIndex - b.zIndex);

    return this;
  }

  // 移除子节点
  removeChild(child: SceneNode): this {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
    return this;
  }

  // 添加组件
  addComponent<T>(component: T): this {
    const type = (component as any).constructor.name;
    this.components.set(type, component);
    return this;
  }

  // 获取组件
  getComponent<T>(type: string): T | undefined {
    return this.components.get(type);
  }

  // 查找子节点
  findByName(name: string): SceneNode | null {
    if (this.name === name) return this;

    for (const child of this.children) {
      const found = child.findByName(name);
      if (found) return found;
    }

    return null;
  }

  // 按路径查找
  findByPath(path: string): SceneNode | null {
    const parts = path.split('/');
    let current: SceneNode = this;

    for (const part of parts) {
      if (part === '..') {
        current = current.parent!;
      } else if (part !== '.') {
        const child = current.children.find(c => c.name === part);
        if (!child) return null;
        current = child;
      }
    }

    return current;
  }

  // 获取世界变换
  getWorldTransform(): Transform {
    const worldTransform = new Transform();

    let node: SceneNode | null = this;
    const transforms: Transform[] = [];

    while (node) {
      transforms.unshift(node.transform);
      node = node.parent;
    }

    for (const t of transforms) {
      worldTransform.multiply(t);
    }

    return worldTransform;
  }

  // 更新
  update(dt: number): void {
    // 更新组件
    for (const component of this.components.values()) {
      if (typeof (component as any).update === 'function') {
        (component as any).update(dt);
      }
    }

    // 更新子节点
    for (const child of this.children) {
      if (child.visible) {
        child.update(dt);
      }
    }
  }

  // 渲染
  render(renderer: Renderer): void {
    if (!this.visible) return;

    // 渲染组件
    for (const component of this.components.values()) {
      if (typeof (component as any).render === 'function') {
        (component as any).render(renderer);
      }
    }

    // 渲染子节点
    for (const child of this.children) {
      child.render(renderer);
    }
  }

  // 销毁
  destroy(): void {
    // 销毁组件
    for (const component of this.components.values()) {
      if (typeof (component as any).destroy === 'function') {
        (component as any).destroy();
      }
    }

    // 销毁子节点
    for (const child of this.children) {
      child.destroy();
    }

    this.children = [];
    this.components.clear();

    // 从父节点移除
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }
}
```

### Transform - 变换组件

```typescript
// transform.ts
export class Transform {
  position: Vec2 = new Vec2();
  rotation: number = 0;
  scale: Vec2 = new Vec2(1, 1);
  skew: Vec2 = new Vec2();

  // 锚点 (0-1)
  anchor: Vec2 = new Vec2(0.5, 0.5);

  // 矩阵缓存
  private _matrix: Mat4 | null = null;
  private _dirty: boolean = true;

  // 父变换 (用于计算世界坐标)
  parent: Transform | null = null;

  setPosition(x: number, y: number): this {
    this.position.set(x, y);
    this._dirty = true;
    return this;
  }

  setRotation(rotation: number): this {
    this.rotation = rotation;
    this._dirty = true;
    return this;
  }

  setScale(x: number, y: number = x): this {
    this.scale.set(x, y);
    this._dirty = true;
    return this;
  }

  // 平移
  translate(x: number, y: number): this {
    this.position.x += x;
    this.position.y += y;
    this._dirty = true;
    return this;
  }

  // 旋转
  rotate(angle: number): this {
    this.rotation += angle;
    this._dirty = true;
    return this;
  }

  // 获取局部变换矩阵
  getMatrix(): Mat4 {
    if (!this._dirty && this._matrix) {
      return this._matrix;
    }

    this._matrix = new Mat4();

    // TRS 顺序: Translate * Rotate * Scale

    // 平移 (考虑锚点)
    this._matrix.translate(
      this.position.x,
      this.position.y,
      0
    );

    // 旋转
    this._matrix.rotateZ(this.rotation);

    // 缩放
    this._matrix.scale(this.scale.x, this.scale.y, 1);

    // 斜切 (如果有)
    if (this.skew.x !== 0 || this.skew.y !== 0) {
      // 应用斜切变换
      // ...
    }

    this._dirty = false;
    return this._matrix;
  }

  // 获取世界变换矩阵
  getWorldMatrix(): Mat4 {
    const local = this.getMatrix();

    if (this.parent) {
      return this.parent.getWorldMatrix().multiply(local);
    }

    return local;
  }

  // 本地坐标转世界坐标
  localToWorld(point: Vec2): Vec2 {
    const matrix = this.getWorldMatrix();
    return matrix.transformPoint(new Vec3(point.x, point.y, 0)).xy;
  }

  // 世界坐标转本地坐标
  worldToLocal(point: Vec2): Vec2 {
    const matrix = this.getWorldMatrix().invert();
    return matrix.transformPoint(new Vec3(point.x, point.y, 0)).xy;
  }

  // 标记为脏
  setDirty(): void {
    this._dirty = true;
  }

  // 复制
  copyFrom(other: Transform): this {
    this.position.copy(other.position);
    this.rotation = other.rotation;
    this.scale.copy(other.scale);
    this.anchor.copy(other.anchor);
    this._dirty = true;
    return this;
  }

  // 克隆
  clone(): Transform {
    const t = new Transform();
    t.copyFrom(this);
    return t;
  }

  // 乘法
  multiply(other: Transform): Transform {
    const result = new Transform();

    // 简化实现 (不考虑旋转和缩放的复杂情况)
    result.position = this.position.add(
      other.position.rotate(this.rotation).multiply(this.scale)
    );
    result.rotation = this.rotation + other.rotation;
    result.scale = new Vec2(
      this.scale.x * other.scale.x,
      this.scale.y * other.scale.y
    );

    return result;
  }
}
```

## 场景管理器

### SceneManager - 场景管理器

```typescript
// scene-manager.ts
export interface SceneTransition {
  type: 'fade' | 'slide' | 'none';
  duration: number;
  color?: Color;
}

export class SceneManager {
  private engine: Engine;
  private scenes: Map<string, Scene> = new Map();
  private sceneStack: Scene[] = [];

  private currentScene: Scene | null = null;
  private nextScene: Scene | null = null;

  // 过渡
  private transition: SceneTransition = { type: 'none', duration: 0 };
  private transitionProgress: number = 0;
  private isTransitioning: boolean = false;

  // 事件
  onSceneChange: Signal<[from: string | null, to: string]> = new Signal();
  onScenePush: Signal<[scene: string]> = new Signal();
  onScenePop: Signal<[scene: string]> = new Signal();

  constructor(engine: Engine) {
    this.engine = engine;
  }

  // 注册场景
  register(scene: Scene): void {
    scene._setEngine(this.engine);
    this.scenes.set(scene.name, scene);
  }

  // 获取场景
  get(name: string): Scene | undefined {
    return this.scenes.get(name);
  }

  // 切换场景
  async changeTo(name: string, data?: any, transition?: SceneTransition): Promise<void> {
    const newScene = this.scenes.get(name);
    if (!newScene) {
      throw new Error(`Scene not found: ${name}`);
    }

    // 开始过渡
    this.nextScene = newScene;
    this.transition = transition ?? { type: 'fade', duration: 300 };
    this.transitionProgress = 0;
    this.isTransitioning = true;

    const oldSceneName = this.currentScene?.name ?? null;

    // 退出当前场景
    if (this.currentScene) {
      await this.currentScene.exit();
    }

    // 初始化新场景 (如果需要)
    if (!newScene.initialized) {
      await newScene.init();
      newScene._setInitialized();
    }

    // 进入新场景
    await newScene.enter(data);

    // 清空堆栈，设置当前场景
    this.sceneStack = [];
    this.currentScene = newScene;
    this.nextScene = null;

    // 结束过渡
    this.isTransitioning = false;

    this.onSceneChange.emit(oldSceneName, name);
  }

  // 推入场景 (叠加)
  async push(name: string, data?: any): Promise<void> {
    const newScene = this.scenes.get(name);
    if (!newScene) {
      throw new Error(`Scene not found: ${name}`);
    }

    // 暂停当前场景
    if (this.currentScene) {
      // 可以调用 pause 方法
    }

    // 初始化新场景
    if (!newScene.initialized) {
      await newScene.init();
      newScene._setInitialized();
    }

    // 进入新场景
    await newScene.enter(data);

    // 推入堆栈
    this.sceneStack.push(newScene);
    this.currentScene = newScene;

    this.onScenePush.emit(name);
  }

  // 弹出场景
  async pop(): Promise<Scene | null> {
    if (this.sceneStack.length <= 1) {
      return null;
    }

    const oldScene = this.sceneStack.pop()!;
    await oldScene.exit();

    // 恢复上一个场景
    this.currentScene = this.sceneStack[this.sceneStack.length - 1];

    this.onScenePop.emit(oldScene.name);

    return oldScene;
  }

  // 弹出到指定场景
  async popTo(name: string): Promise<void> {
    while (this.sceneStack.length > 1) {
      const top = this.sceneStack[this.sceneStack.length - 1];
      if (top.name === name) break;
      await this.pop();
    }
  }

  // 更新
  update(dt: number): void {
    // 更新过渡
    if (this.isTransitioning) {
      this.transitionProgress += dt;
    }

    // 更新当前场景
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }

  // 渲染
  render(renderer: Renderer): void {
    // 渲染堆栈中的所有场景
    for (const scene of this.sceneStack) {
      scene.render(renderer);
    }

    // 渲染过渡效果
    if (this.isTransitioning) {
      this.renderTransition(renderer);
    }
  }

  private renderTransition(renderer: Renderer): void {
    const { type, duration, color } = this.transition;
    const progress = this.transitionProgress / duration;

    switch (type) {
      case 'fade':
        const alpha = progress < 0.5
          ? progress * 2
          : 2 - progress * 2;

        renderer.drawOverlay(color ?? Color.BLACK, alpha);
        break;

      case 'slide':
        // 滑动效果
        break;
    }
  }

  get current(): Scene | null {
    return this.currentScene;
  }

  get currentName(): string | null {
    return this.currentScene?.name ?? null;
  }

  get stack(): Scene[] {
    return [...this.sceneStack];
  }
}
```

## 使用示例

```typescript
// 定义场景
class MainMenuScene extends Scene {
  async init() {
    // 加载资源
    await this.engine.loader.loadManifest({
      logo: 'images/logo.png',
      bgm: 'audio/menu.mp3',
    });
  }

  async enter() {
    // 播放音乐
    this.engine.audio.playMusic('/assets/audio/menu.mp3');

    // 创建 UI
    const playButton = this.createButton('Play', () => {
      this.engine.scenes.changeTo('game', { level: 1 });
    });

    this.root.addChild(playButton);
  }

  async exit() {
    this.engine.audio.stopMusic();
  }

  private createButton(text: string, onClick: () => void): SceneNode {
    // ... 创建按钮节点
  }
}

class GameScene extends Scene {
  private world: World;

  async init() {
    // 初始化 ECS 世界
    this.world = new World();
  }

  async enter(data?: { level: number }) {
    const level = data?.level ?? 1;
    await this.loadLevel(level);
  }

  async exit() {
    // 保存游戏状态
  }

  update(dt: number) {
    this.world.update(dt);
    super.update(dt);
  }

  private async loadLevel(level: number) {
    // 加载关卡数据
  }
}

class PauseMenuScene extends Scene {
  async init() {
    // 创建暂停 UI
  }

  async enter() {
    // 显示暂停菜单
  }

  async exit() {
    // 隐藏暂停菜单
  }
}

// 初始化
const engine = new Engine();

// 注册场景
engine.scenes.register(new MainMenuScene('menu'));
engine.scenes.register(new GameScene('game'));
engine.scenes.register(new PauseMenuScene('pause'));

// 开始游戏
engine.start();
engine.scenes.changeTo('menu');

// 暂停游戏 (叠加场景)
engine.scenes.push('pause');

// 恢复游戏
engine.scenes.pop();
```

## 参考资源

- [Phaser Scene Manager](https://photonstorm.github.io/phaser3-docs/Phaser.Scenes.SceneManager.html)
- [Unity Scene Management](https://docs.unity3d.com/ScriptReference/SceneManagement.SceneManager.html)
- [GAMES104 - 场景管理](https://www.bilibili.com/video/BV1L44y1e7hD)
