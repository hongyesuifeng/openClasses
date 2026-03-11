/**
 * ECS Demo - 第5周示例
 *
 * 演示:
 * 1. Entity - 实体
 * 2. Component - 组件
 * 3. System - 系统
 * 4. Query - 查询
 */

// ============ 类型定义 ============

type Entity = number;

enum ComponentType {
  Position,
  Velocity,
  Render,
  Lifetime,
}

// 组件数据 (SoA 存储)
class ComponentStorage<T> {
  data: T[];
  entities: Set<Entity> = new Set();

  constructor(private defaultValue: T, maxEntities: number = 10000) {
    this.data = new Array(maxEntities).fill(null).map(() => ({ ...defaultValue }));
  }

  add(entity: Entity, values?: Partial<T>): void {
    if (values) {
      Object.assign(this.data[entity], values);
    }
    this.entities.add(entity);
  }

  remove(entity: Entity): void {
    this.entities.delete(entity);
  }

  has(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  get(entity: Entity): T {
    return this.data[entity];
  }
}

// 组件定义
interface PositionData { x: number; y: number; }
interface VelocityData { vx: number; vy: number; }
interface RenderData { width: number; height: number; r: number; g: number; b: number; }
interface LifetimeData { remaining: number; }

// ============ World ============

class World {
  private entities: Set<Entity> = new Set();
  private nextId: Entity = 0;
  private freeIds: Entity[] = [];

  // 组件存储
  position = new ComponentStorage<PositionData>({ x: 0, y: 0 });
  velocity = new ComponentStorage<VelocityData>({ vx: 0, vy: 0 });
  render = new ComponentStorage<RenderData>({ width: 10, height: 10, r: 1, g: 1, b: 1 });
  lifetime = new ComponentStorage<LifetimeData>({ remaining: 0 });

  // 系统
  private systems: System[] = [];

  createEntity(): Entity {
    const id = this.freeIds.pop() ?? this.nextId++;
    this.entities.add(id);
    return id;
  }

  destroyEntity(entity: Entity): void {
    this.position.remove(entity);
    this.velocity.remove(entity);
    this.render.remove(entity);
    this.lifetime.remove(entity);
    this.entities.delete(entity);
    this.freeIds.push(entity);
  }

  addSystem(system: System): void {
    this.systems.push(system);
    system.init(this);
  }

  update(dt: number): void {
    for (const system of this.systems) {
      system.update(dt);
    }
  }

  get entityCount(): number {
    return this.entities.size;
  }
}

// ============ System 基类 ============

abstract class System {
  protected world!: World;

  init(world: World): void {
    this.world = world;
  }

  abstract update(dt: number): void;
}

// ============ 具体系统 ============

// 移动系统
class MovementSystem extends System {
  update(dt: number): void {
    const { position, velocity } = this.world;

    for (const entity of velocity.entities) {
      if (!position.has(entity)) continue;

      const pos = position.get(entity);
      const vel = velocity.get(entity);

      pos.x += vel.vx * dt;
      pos.y += vel.vy * dt;
    }
  }
}

// 生命周期系统
class LifetimeSystem extends System {
  private toDestroy: Entity[] = [];

  update(dt: number): void {
    const { lifetime } = this.world;

    for (const entity of lifetime.entities) {
      const life = lifetime.get(entity);
      life.remaining -= dt;

      if (life.remaining <= 0) {
        this.toDestroy.push(entity);
      }
    }

    // 销毁过期实体
    for (const entity of this.toDestroy) {
      this.world.destroyEntity(entity);
    }
    this.toDestroy = [];
  }
}

// 边界系统
class BoundarySystem extends System {
  constructor(private width: number, private height: number) {
    super();
  }

  update(dt: number): void {
    const { position, velocity } = this.world;

    for (const entity of position.entities) {
      const pos = position.get(entity);

      if (pos.x < 0 || pos.x > this.width) {
        if (velocity.has(entity)) {
          velocity.get(entity).vx *= -1;
        }
        pos.x = Math.max(0, Math.min(this.width, pos.x));
      }

      if (pos.y < 0 || pos.y > this.height) {
        if (velocity.has(entity)) {
          velocity.get(entity).vy *= -1;
        }
        pos.y = Math.max(0, Math.min(this.height, pos.y));
      }
    }
  }
}

// 渲染系统
class RenderSystem extends System {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.ctx = canvas.getContext('2d')!;
  }

  update(dt: number): void {
    const { position, render } = this.world;
    const ctx = this.ctx;

    // 清除画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 渲染所有有 Position + Render 的实体
    for (const entity of render.entities) {
      if (!position.has(entity)) continue;

      const pos = position.get(entity);
      const r = render.get(entity);

      ctx.fillStyle = `rgb(${Math.floor(r.r * 255)}, ${Math.floor(r.g * 255)}, ${Math.floor(r.b * 255)})`;
      ctx.fillRect(
        pos.x - r.width / 2,
        pos.y - r.height / 2,
        r.width,
        r.height
      );
    }
  }
}

// ============ 生成器系统 ============

class SpawnerSystem extends System {
  private spawnTimer = 0;
  private spawnInterval = 0.1;

  update(dt: number): void {
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEntity();
    }
  }

  private spawnEntity(): void {
    const world = this.world;
    const entity = world.createEntity();

    // Position
    world.position.add(entity, {
      x: Math.random() * 800,
      y: Math.random() * 600,
    });

    // Velocity
    world.velocity.add(entity, {
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
    });

    // Render
    world.render.add(entity, {
      width: 5 + Math.random() * 20,
      height: 5 + Math.random() * 20,
      r: 0.3 + Math.random() * 0.7,
      g: 0.3 + Math.random() * 0.7,
      b: 0.3 + Math.random() * 0.7,
    });

    // Lifetime (可选)
    if (Math.random() > 0.7) {
      world.lifetime.add(entity, {
        remaining: 3 + Math.random() * 5,
      });
    }
  }
}

// ============ 主程序 ============

const canvas = document.getElementById('game') as HTMLCanvasElement;
const statsEl = document.getElementById('stats') as HTMLDivElement;

// 创建 World
const world = new World();

// 添加系统
world.addSystem(new SpawnerSystem());
world.addSystem(new MovementSystem());
world.addSystem(new BoundarySystem(800, 600));
world.addSystem(new LifetimeSystem());
world.addSystem(new RenderSystem(canvas));

// 游戏循环
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let fpsTimer = 0;

function loop() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  // 更新
  world.update(dt);

  // FPS 统计
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 1) {
    fps = frameCount;
    frameCount = 0;
    fpsTimer = 0;
  }

  // 显示统计
  statsEl.textContent = `Entities: ${world.entityCount} | FPS: ${fps}`;

  requestAnimationFrame(loop);
}

loop();

console.log('🎮 ECS Demo running!');
console.log('Components: Position, Velocity, Render, Lifetime');
console.log('Systems: Spawner, Movement, Boundary, Lifetime, Render');
