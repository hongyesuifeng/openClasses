# 物理系统设计 (@nova/physics2d)

## 概述

2D 物理系统负责碰撞检测、碰撞响应和刚体模拟。设计目标是简单高效，足以支持 2D 游戏开发，同时保持代码可读性。

## 设计原则

1. **轻量级**: 不追求完整物理引擎，专注游戏常用功能
2. **确定性**: 相同输入产生相同结果，便于网络同步
3. **可扩展**: 支持自定义碰撞形状和碰撞回调

## 核心组件

### CollisionShape - 碰撞形状

```typescript
// shape.ts
export type ShapeType = 'aabb' | 'circle' | 'obb' | 'polygon';

export abstract class CollisionShape {
  abstract readonly type: ShapeType;
  abstract readonly aabb: AABB;

  // 世界坐标变换
  abstract transform(position: Vec2, rotation: number): CollisionShape;

  // 包含点测试
  abstract contains(point: Vec2): boolean;

  // 获取最近点
  abstract getClosestPoint(point: Vec2): Vec2;
}
```

### AABB - 轴对齐包围盒

```typescript
// aabb.ts
export class AABB implements CollisionShape {
  readonly type = 'aabb';

  constructor(
    public min: Vec2 = new Vec2(),
    public max: Vec2 = new Vec2()
  ) {}

  get width(): number { return this.max.x - this.min.x; }
  get height(): number { return this.max.y - this.min.y; }
  get center(): Vec2 { return this.min.add(this.max).multiply(0.5); }
  get extents(): Vec2 { return new Vec2(this.width / 2, this.height / 2); }

  get aabb(): AABB { return this; }

  // 静态工厂
  static fromCenter(center: Vec2, halfSize: Vec2): AABB {
    return new AABB(
      center.subtract(halfSize),
      center.add(halfSize)
    );
  }

  static fromRect(x: number, y: number, width: number, height: number): AABB {
    return new AABB(
      new Vec2(x, y),
      new Vec2(x + width, y + height)
    );
  }

  // 包含测试
  contains(point: Vec2): boolean {
    return point.x >= this.min.x && point.x <= this.max.x &&
           point.y >= this.min.y && point.y <= this.max.y;
  }

  // 相交测试
  intersects(other: AABB): boolean {
    return this.min.x <= other.max.x && this.max.x >= other.min.x &&
           this.min.y <= other.max.y && this.max.y >= other.min.y;
  }

  // 合并
  union(other: AABB): AABB {
    return new AABB(
      Vec2.min(this.min, other.min),
      Vec2.max(this.max, other.max)
    );
  }

  transform(position: Vec2, rotation: number): CollisionShape {
    // AABB 忽略旋转，返回包围旋转后的 AABB
    // 简化实现：直接平移
    const size = this.max.subtract(this.min);
    return AABB.fromCenter(this.center.add(position), size.multiply(0.5));
  }

  getClosestPoint(point: Vec2): Vec2 {
    return new Vec2(
      Math.max(this.min.x, Math.min(this.max.x, point.x)),
      Math.max(this.min.y, Math.min(this.max.y, point.y))
    );
  }
}
```

### Circle - 圆形碰撞体

```typescript
// circle.ts
export class Circle implements CollisionShape {
  readonly type = 'circle';

  constructor(
    public center: Vec2 = new Vec2(),
    public radius: number = 1
  ) {}

  get aabb(): AABB {
    return AABB.fromCenter(this.center, new Vec2(this.radius, this.radius));
  }

  contains(point: Vec2): boolean {
    return this.center.distanceSquared(point) <= this.radius * this.radius;
  }

  transform(position: Vec2, rotation: number): Circle {
    return new Circle(this.center.add(position), this.radius);
  }

  getClosestPoint(point: Vec2): Vec2 {
    const dir = point.subtract(this.center);
    const len = dir.length();
    if (len === 0) return this.center.add(new Vec2(this.radius, 0));
    return this.center.add(dir.multiply(this.radius / len));
  }
}
```

### OBB - 有向包围盒

```typescript
// obb.ts
export class OBB implements CollisionShape {
  readonly type = 'obb';

  constructor(
    public center: Vec2 = new Vec2(),
    public halfExtents: Vec2 = new Vec2(0.5, 0.5),
    public rotation: number = 0
  ) {}

  get aabb(): AABB {
    // 计算旋转后的 AABB
    const cos = Math.abs(Math.cos(this.rotation));
    const sin = Math.abs(Math.sin(this.rotation));
    const w = this.halfExtents.x * cos + this.halfExtents.y * sin;
    const h = this.halfExtents.x * sin + this.halfExtents.y * cos;
    return AABB.fromCenter(this.center, new Vec2(w, h));
  }

  // 获取局部坐标轴 (分离轴定理用)
  getAxes(): Vec2[] {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    return [
      new Vec2(cos, sin),   // X 轴
      new Vec2(-sin, cos)   // Y 轴
    ];
  }

  // 获取四个顶点
  getVertices(): Vec2[] {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const hx = this.halfExtents.x;
    const hy = this.halfExtents.y;

    return [
      this.center.add(new Vec2(cos * hx - sin * hy, sin * hx + cos * hy)),
      this.center.add(new Vec2(-cos * hx - sin * hy, -sin * hx + cos * hy)),
      this.center.add(new Vec2(-cos * hx + sin * hy, -sin * hx - cos * hy)),
      this.center.add(new Vec2(cos * hx + sin * hy, sin * hx - cos * hy)),
    ];
  }

  contains(point: Vec2): boolean {
    // 将点转换到局部坐标系
    const local = point.subtract(this.center).rotate(-this.rotation);
    return Math.abs(local.x) <= this.halfExtents.x &&
           Math.abs(local.y) <= this.halfExtents.y;
  }

  transform(position: Vec2, rotation: number): OBB {
    return new OBB(
      this.center.add(position),
      this.halfExtents,
      this.rotation + rotation
    );
  }

  getClosestPoint(point: Vec2): Vec2 {
    // 转换到局部坐标系
    const local = point.subtract(this.center).rotate(-this.rotation);
    const clamped = new Vec2(
      Math.max(-this.halfExtents.x, Math.min(this.halfExtents.x, local.x)),
      Math.max(-this.halfExtents.y, Math.min(this.halfExtents.y, local.y))
    );
    return this.center.add(clamped.rotate(this.rotation));
  }
}
```

## 碰撞检测

### 碰撞检测器

```typescript
// collision-detector.ts
export interface CollisionResult {
  collided: boolean;
  normal: Vec2;      // 碰撞法线 (从 A 指向 B)
  depth: number;     // 穿透深度
  contactPoint: Vec2; // 接触点
}

export class CollisionDetector {
  // AABB vs AABB
  static AABBvsAABB(a: AABB, b: AABB): CollisionResult {
    if (!a.intersects(b)) {
      return { collided: false, normal: Vec2.ZERO, depth: 0, contactPoint: Vec2.ZERO };
    }

    // 计算穿透向量和深度
    const overlapX = Math.min(a.max.x - b.min.x, b.max.x - a.min.x);
    const overlapY = Math.min(a.max.y - b.min.y, b.max.y - a.min.y);

    let normal: Vec2;
    let depth: number;

    if (overlapX < overlapY) {
      depth = overlapX;
      normal = a.center.x < b.center.x ? new Vec2(-1, 0) : new Vec2(1, 0);
    } else {
      depth = overlapY;
      normal = a.center.y < b.center.y ? new Vec2(0, -1) : new Vec2(0, 1);
    }

    const contactPoint = a.center.add(b.center).multiply(0.5);

    return { collided: true, normal, depth, contactPoint };
  }

  // Circle vs Circle
  static CirclevsCircle(a: Circle, b: Circle): CollisionResult {
    const delta = b.center.subtract(a.center);
    const dist = delta.length();
    const minDist = a.radius + b.radius;

    if (dist >= minDist) {
      return { collided: false, normal: Vec2.ZERO, depth: 0, contactPoint: Vec2.ZERO };
    }

    const normal = dist > 0 ? delta.multiply(1 / dist) : new Vec2(1, 0);
    const depth = minDist - dist;
    const contactPoint = a.center.add(normal.multiply(a.radius - depth / 2));

    return { collided: true, normal, depth, contactPoint };
  }

  // AABB vs Circle
  static AABBvsCircle(aabb: AABB, circle: Circle): CollisionResult {
    const closest = aabb.getClosestPoint(circle.center);
    const delta = circle.center.subtract(closest);
    const dist = delta.length();

    if (dist >= circle.radius) {
      return { collided: false, normal: Vec2.ZERO, depth: 0, contactPoint: Vec2.ZERO };
    }

    const normal = dist > 0 ? delta.multiply(1 / dist) : new Vec2(0, -1);
    const depth = circle.radius - dist;
    const contactPoint = closest;

    return { collided: true, normal, depth, contactPoint };
  }

  // OBB vs OBB (分离轴定理)
  static OBBvsOBB(a: OBB, b: OBB): CollisionResult {
    const axes = [...a.getAxes(), ...b.getAxes()];
    let minOverlap = Infinity;
    let smallestAxis = Vec2.ZERO;

    for (const axis of axes) {
      const projA = this.projectOBB(a, axis);
      const projB = this.projectOBB(b, axis);
      const overlap = this.getOverlap(projA, projB);

      if (overlap <= 0) {
        return { collided: false, normal: Vec2.ZERO, depth: 0, contactPoint: Vec2.ZERO };
      }

      if (overlap < minOverlap) {
        minOverlap = overlap;
        smallestAxis = axis;
      }
    }

    // 确保法线方向正确
    const direction = b.center.subtract(a.center);
    if (direction.dot(smallestAxis) < 0) {
      smallestAxis = smallestAxis.negate();
    }

    return {
      collided: true,
      normal: smallestAxis,
      depth: minOverlap,
      contactPoint: a.center.add(b.center).multiply(0.5)
    };
  }

  private static projectOBB(obb: OBB, axis: Vec2): { min: number; max: number } {
    const vertices = obb.getVertices();
    let min = Infinity;
    let max = -Infinity;

    for (const v of vertices) {
      const proj = v.dot(axis);
      min = Math.min(min, proj);
      max = Math.max(max, proj);
    }

    return { min, max };
  }

  private static getOverlap(a: { min: number; max: number }, b: { min: number; max: number }): number {
    return Math.min(a.max - b.min, b.max - a.min);
  }
}
```

## 刚体系统

### RigidBody 组件

```typescript
// rigid-body.ts
export enum BodyType {
  Static = 'static',     // 静态，不受力影响
  Dynamic = 'dynamic',   // 动态，受力和碰撞影响
  Kinematic = 'kinematic' // 运动学，不受力但可移动
}

export class RigidBody {
  // 物理属性
  bodyType: BodyType = BodyType.Dynamic;
  mass: number = 1;
  inverseMass: number = 1;
  inertia: number = 1;
  inverseInertia: number = 1;

  // 状态
  velocity: Vec2 = new Vec2();
  angularVelocity: number = 0;
  force: Vec2 = new Vec2();
  torque: number = 0;

  // 材质属性
  friction: number = 0.5;
  restitution: number = 0.3; // 弹性系数

  // 碰撞
  shape: CollisionShape;
  isTrigger: boolean = false;

  constructor(shape: CollisionShape, bodyType: BodyType = BodyType.Dynamic) {
    this.shape = shape;
    this.bodyType = bodyType;
    this.updateMass();
  }

  updateMass(): void {
    if (this.bodyType === BodyType.Static) {
      this.mass = Infinity;
      this.inverseMass = 0;
      this.inertia = Infinity;
      this.inverseInertia = 0;
    } else {
      this.inverseMass = 1 / this.mass;
      // 简化惯性计算
      if (this.shape.type === 'circle') {
        const r = (this.shape as Circle).radius;
        this.inertia = this.mass * r * r;
      } else {
        const aabb = this.shape.aabb;
        const w = aabb.width;
        const h = aabb.height;
        this.inertia = this.mass * (w * w + h * h) / 12;
      }
      this.inverseInertia = 1 / this.inertia;
    }
  }

  applyForce(force: Vec2): void {
    this.force = this.force.add(force);
  }

  applyImpulse(impulse: Vec2, contactPoint: Vec2): void {
    this.velocity = this.velocity.add(impulse.multiply(this.inverseMass));
    // 角冲量
    const r = contactPoint.subtract(this.shape.aabb.center);
    this.angularVelocity += r.cross(impulse) * this.inverseInertia;
  }

  getTransformedShape(position: Vec2, rotation: number): CollisionShape {
    return this.shape.transform(position, rotation);
  }
}
```

### PhysicsWorld - 物理世界

```typescript
// physics-world.ts
export interface BodyDef {
  shape: CollisionShape;
  bodyType: BodyType;
  position?: Vec2;
  rotation?: number;
  mass?: number;
  friction?: number;
  restitution?: number;
  isTrigger?: boolean;
}

export class PhysicsWorld {
  private bodies: Map<number, { body: RigidBody; entityId: number; position: Vec2; rotation: number }> = new Map();
  private nextBodyId: number = 0;

  // 空间划分 (简单网格)
  private gridSize: number = 64;
  private grid: Map<string, number[]> = new Map();

  // 重力
  gravity: Vec2 = new Vec2(0, 980); // 像素/秒²

  // 碰撞回调
  onCollision: ((a: number, b: number, result: CollisionResult) => void) | null = null;
  onTrigger: ((a: number, b: number) => void) | null = null;

  createBody(entityId: number, def: BodyDef): number {
    const body = new RigidBody(def.shape, def.bodyType);
    if (def.mass !== undefined) {
      body.mass = def.mass;
      body.updateMass();
    }
    if (def.friction !== undefined) body.friction = def.friction;
    if (def.restitution !== undefined) body.restitution = def.restitution;
    if (def.isTrigger !== undefined) body.isTrigger = def.isTrigger;

    const id = this.nextBodyId++;
    const position = def.position || new Vec2();
    const rotation = def.rotation || 0;

    this.bodies.set(id, { body, entityId, position, rotation });
    this.updateGrid(id, position, body.shape.aabb);

    return id;
  }

  destroyBody(id: number): void {
    this.bodies.delete(id);
    this.removeFromGrid(id);
  }

  updatePosition(id: number, position: Vec2, rotation: number): void {
    const entry = this.bodies.get(id);
    if (entry) {
      entry.position = position;
      entry.rotation = rotation;
      this.updateGrid(id, position, entry.body.shape.aabb);
    }
  }

  step(dt: number): void {
    // 1. 应用重力和积分
    for (const [id, entry] of this.bodies) {
      const { body, position } = entry;
      if (body.bodyType !== BodyType.Dynamic) continue;

      // 应用重力
      body.applyForce(this.gravity.multiply(body.mass));

      // 速度积分
      body.velocity = body.velocity.add(body.force.multiply(body.inverseMass * dt));
      body.angularVelocity += body.torque * body.inverseInertia * dt;

      // 阻尼 (简化)
      body.velocity = body.velocity.multiply(0.99);
      body.angularVelocity *= 0.99;

      // 位置积分
      entry.position = position.add(body.velocity.multiply(dt));
      entry.rotation += body.angularVelocity * dt;

      // 清除力
      body.force = new Vec2();
      body.torque = 0;
    }

    // 2. 碰撞检测
    this.detectCollisions();

    // 3. 更新网格
    for (const [id, entry] of this.bodies) {
      this.updateGrid(id, entry.position, entry.body.shape.aabb);
    }
  }

  private detectCollisions(): void {
    const pairs: Set<string> = new Set();

    for (const [idA, entryA] of this.bodies) {
      const { body: bodyA, position: posA, rotation: rotA } = entryA;
      const aabbA = bodyA.shape.aabb;

      // 获取可能碰撞的邻近刚体
      const nearby = this.getNearbyBodies(posA, aabbA);

      for (const idB of nearby) {
        if (idA >= idB) continue;

        const pairKey = `${idA}-${idB}`;
        if (pairs.has(pairKey)) continue;
        pairs.add(pairKey);

        const entryB = this.bodies.get(idB)!;
        const { body: bodyB, position: posB, rotation: rotB } = entryB;

        // 宽相: AABB 检测
        const aabbB = bodyB.shape.aabb.translate(posB.x - bodyB.shape.aabb.center.x, posB.y - bodyB.shape.aabb.center.y);
        const translatedAabbA = aabbA.translate(posA.x - bodyA.shape.aabb.center.x, posA.y - bodyA.shape.aabb.center.y);

        if (!translatedAabbA.intersects(aabbB)) continue;

        // 窄相: 精确检测
        const shapeA = bodyA.getTransformedShape(posA, rotA);
        const shapeB = bodyB.getTransformedShape(posB, rotB);
        const result = this.testCollision(shapeA, shapeB);

        if (!result.collided) continue;

        // 触发器
        if (bodyA.isTrigger || bodyB.isTrigger) {
          this.onTrigger?.(idA, idB);
          continue;
        }

        // 碰撞回调
        this.onCollision?.(idA, idB, result);

        // 静态物体跳过求解
        if (bodyA.bodyType === BodyType.Static && bodyB.bodyType === BodyType.Static) continue;

        // 碰撞响应
        this.resolveCollision(entryA, entryB, result);
      }
    }
  }

  private testCollision(a: CollisionShape, b: CollisionShape): CollisionResult {
    // 根据形状类型选择检测方法
    if (a.type === 'aabb' && b.type === 'aabb') {
      return CollisionDetector.AABBvsAABB(a as AABB, b as AABB);
    }
    if (a.type === 'circle' && b.type === 'circle') {
      return CollisionDetector.CirclevsCircle(a as Circle, b as Circle);
    }
    if (a.type === 'aabb' && b.type === 'circle') {
      return CollisionDetector.AABBvsCircle(a as AABB, b as Circle);
    }
    if (a.type === 'circle' && b.type === 'aabb') {
      const result = CollisionDetector.AABBvsCircle(b as AABB, a as Circle);
      result.normal = result.normal.negate();
      return result;
    }
    if (a.type === 'obb' && b.type === 'obb') {
      return CollisionDetector.OBBvsOBB(a as OBB, b as OBB);
    }

    // 默认: AABB 测试
    return CollisionDetector.AABBvsAABB(a.aabb, b.aabb);
  }

  private resolveCollision(
    entryA: { body: RigidBody; position: Vec2; rotation: number },
    entryB: { body: RigidBody; position: Vec2; rotation: number },
    result: CollisionResult
  ): void {
    const { body: bodyA, position: posA } = entryA;
    const { body: bodyB, position: posB } = entryB;

    const { normal, depth, contactPoint } = result;

    // 计算相对速度
    const relVel = bodyB.velocity.subtract(bodyA.velocity);
    const velAlongNormal = relVel.dot(normal);

    // 物体正在分离，跳过
    if (velAlongNormal > 0) return;

    // 计算弹性
    const e = Math.min(bodyA.restitution, bodyB.restitution);

    // 计算冲量
    const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
    const j = -(1 + e) * velAlongNormal / totalInvMass;

    const impulse = normal.multiply(j);

    // 应用冲量
    if (bodyA.bodyType !== BodyType.Static) {
      bodyA.velocity = bodyA.velocity.subtract(impulse.multiply(bodyA.inverseMass));
      entryA.position = posA.subtract(normal.multiply(depth * bodyA.inverseMass / totalInvMass));
    }
    if (bodyB.bodyType !== BodyType.Static) {
      bodyB.velocity = bodyB.velocity.add(impulse.multiply(bodyB.inverseMass));
      entryB.position = posB.add(normal.multiply(depth * bodyB.inverseMass / totalInvMass));
    }

    // 摩擦
    const tangent = relVel.subtract(normal.multiply(velAlongNormal)).normalize();
    const jt = -relVel.dot(tangent) / totalInvMass;
    const mu = Math.sqrt(bodyA.friction * bodyA.friction + bodyB.friction * bodyB.friction);
    const frictionImpulse = Math.abs(jt) < j * mu
      ? tangent.multiply(jt)
      : tangent.multiply(-j * mu);

    if (bodyA.bodyType !== BodyType.Static) {
      bodyA.velocity = bodyA.velocity.subtract(frictionImpulse.multiply(bodyA.inverseMass));
    }
    if (bodyB.bodyType !== BodyType.Static) {
      bodyB.velocity = bodyB.velocity.add(frictionImpulse.multiply(bodyB.inverseMass));
    }
  }

  // 网格辅助方法
  private getGridKey(x: number, y: number): string {
    return `${Math.floor(x / this.gridSize)},${Math.floor(y / this.gridSize)}`;
  }

  private updateGrid(id: number, position: Vec2, aabb: AABB): void {
    this.removeFromGrid(id);

    const minX = Math.floor((position.x + aabb.min.x) / this.gridSize);
    const maxX = Math.floor((position.x + aabb.max.x) / this.gridSize);
    const minY = Math.floor((position.y + aabb.min.y) / this.gridSize);
    const maxY = Math.floor((position.y + aabb.max.y) / this.gridSize);

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const key = `${gx},${gy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key)!.push(id);
      }
    }
  }

  private removeFromGrid(id: number): void {
    for (const bodies of this.grid.values()) {
      const index = bodies.indexOf(id);
      if (index !== -1) {
        bodies.splice(index, 1);
      }
    }
  }

  private getNearbyBodies(position: Vec2, aabb: AABB): number[] {
    const result = new Set<number>();

    const minX = Math.floor((position.x + aabb.min.x) / this.gridSize);
    const maxX = Math.floor((position.x + aabb.max.x) / this.gridSize);
    const minY = Math.floor((position.y + aabb.min.y) / this.gridSize);
    const maxY = Math.floor((position.y + aabb.max.y) / this.gridSize);

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const key = `${gx},${gy}`;
        const bodies = this.grid.get(key);
        if (bodies) {
          for (const id of bodies) {
            result.add(id);
          }
        }
      }
    }

    return Array.from(result);
  }

  // 射线检测
  raycast(origin: Vec2, direction: Vec2, maxDistance: number): { hit: boolean; body?: number; point?: Vec2; normal?: Vec2 } {
    let closestDist = maxDistance;
    let hitBody: number | undefined;
    let hitPoint: Vec2 | undefined;
    let hitNormal: Vec2 | undefined;

    for (const [id, entry] of this.bodies) {
      const { body, position } = entry;
      const aabb = body.shape.aabb.translate(
        position.x - body.shape.aabb.center.x,
        position.y - body.shape.aabb.center.y
      );

      // 简化的射线-AABB 检测
      const result = this.rayAABB(origin, direction, aabb);
      if (result.hit && result.t < closestDist) {
        closestDist = result.t;
        hitBody = id;
        hitPoint = origin.add(direction.multiply(result.t));
        hitNormal = result.normal;
      }
    }

    return {
      hit: hitBody !== undefined,
      body: hitBody,
      point: hitPoint,
      normal: hitNormal
    };
  }

  private rayAABB(origin: Vec2, dir: Vec2, aabb: AABB): { hit: boolean; t: number; normal: Vec2 } {
    let tmin = 0;
    let tmax = Infinity;
    let normal = Vec2.ZERO;

    // X 轴
    if (dir.x !== 0) {
      const t1 = (aabb.min.x - origin.x) / dir.x;
      const t2 = (aabb.max.x - origin.x) / dir.x;
      const tNear = Math.min(t1, t2);
      const tFar = Math.max(t1, t2);

      if (tNear > tmin) {
        tmin = tNear;
        normal = new Vec2(t1 < t2 ? -1 : 1, 0);
      }
      tmax = Math.min(tmax, tFar);
    } else if (origin.x < aabb.min.x || origin.x > aabb.max.x) {
      return { hit: false, t: Infinity, normal: Vec2.ZERO };
    }

    // Y 轴
    if (dir.y !== 0) {
      const t1 = (aabb.min.y - origin.y) / dir.y;
      const t2 = (aabb.max.y - origin.y) / dir.y;
      const tNear = Math.min(t1, t2);
      const tFar = Math.max(t1, t2);

      if (tNear > tmin) {
        tmin = tNear;
        normal = new Vec2(0, t1 < t2 ? -1 : 1);
      }
      tmax = Math.min(tmax, tFar);
    } else if (origin.y < aabb.min.y || origin.y > aabb.max.y) {
      return { hit: false, t: Infinity, normal: Vec2.ZERO };
    }

    return { hit: tmin <= tmax && tmax >= 0, t: tmin, normal };
  }
}
```

## ECS 集成

```typescript
// physics-system.ts
import { System } from '@nova/ecs';
import { PhysicsWorld, BodyDef } from './physics-world.js';

export const Collider = defineComponent({
  bodyId: Types.ui32,
  offsetX: Types.f32,
  offsetY: Types.f32,
});

export const RigidBodyComponent = defineComponent({
  bodyId: Types.ui32,
});

export class PhysicsSystem extends System {
  private world: PhysicsWorld;
  private query = this.createQuery({
    all: [Position, Collider]
  });

  constructor() {
    super();
    this.world = new PhysicsWorld();
    this.world.onCollision = this.handleCollision.bind(this);
  }

  private handleCollision(bodyIdA: number, bodyIdB: number, result: CollisionResult): void {
    // 派发碰撞事件
    const entityA = this.getBodyEntity(bodyIdA);
    const entityB = this.getBodyEntity(bodyIdB);

    this.engine.events.emit('collision:enter', entityA, entityB, result);
  }

  update(dt: number): void {
    // 同步位置到物理世界
    for (const entity of this.query) {
      const bodyId = Collider.bodyId[entity];
      const offsetX = Collider.offsetX[entity];
      const offsetY = Collider.offsetY[entity];
      const x = Position.x[entity] + offsetX;
      const y = Position.y[entity] + offsetY;

      this.world.updatePosition(bodyId, new Vec2(x, y), 0);
    }

    // 物理步进
    this.world.step(dt);

    // 同步物理世界到位置
    for (const entity of this.query) {
      const bodyId = Collider.bodyId[entity];
      const state = this.world.getBodyState(bodyId);
      if (state) {
        Position.x[entity] = state.position.x - Collider.offsetX[entity];
        Position.y[entity] = state.position.y - Collider.offsetY[entity];
      }
    }
  }

  createCollider(entity: number, def: BodyDef): void {
    const bodyId = this.world.createBody(entity, def);
    Collider.bodyId[entity] = bodyId;
  }
}
```

## 参考资源

- [Real-Time Collision Detection](https://realtimecollisiondetection.net/)
- [Box2D](https://box2d.org/) - 2D 物理引擎参考
- [GDC - Physics for Game Programmers](https://www.gdcvault.com/)
