# 第6周: 2D 物理基础

## 目标

- AABB 碰撞检测
- Circle 碰撞检测
- 碰撞响应
- Raycast 射线检测

## 任务清单

### 1. 形状定义 (@nova/physics2d/shapes)

- [ ] AABB (轴对齐包围盒)
  ```typescript
  interface AABB {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }
  ```

- [ ] Circle
  ```typescript
  interface Circle {
    x: number;
    y: number;
    radius: number;
  }
  ```

- [ ] OBB (有向包围盒) - 可选

### 2. 碰撞检测 (@nova/physics2d/collision)

- [ ] AABB vs AABB
  ```typescript
  function aabbVsAabb(a: AABB, b: AABB): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX &&
           a.minY <= b.maxY && a.maxY >= b.minY;
  }
  ```

- [ ] Circle vs Circle
  ```typescript
  function circleVsCircle(a: Circle, b: Circle): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = dx * dx + dy * dy;
    const radiusSum = a.radius + b.radius;
    return dist < radiusSum * radiusSum;
  }
  ```

- [ ] AABB vs Circle
- [ ] 碰撞信息 (CollisionInfo)
  - [ ] 碰撞点
  - [ ] 碰撞法线
  - [ ] 穿透深度

### 3. 碰撞响应 (@nova/physics2d/solver)

- [ ] 分离轴处理
- [ ] 速度反弹
- [ ] 简单弹性碰撞
- [ ] 摩擦力 (基础)

```typescript
interface CollisionResponse {
  separate(): void;       // 分离重叠
  resolveVelocity(): void; // 速度响应
}
```

### 4. Raycast

- [ ] Ray 定义
  ```typescript
  interface Ray {
    origin: Vec2;
    direction: Vec2;
  }
  ```

- [ ] Ray vs AABB
- [ ] Ray vs Circle
- [ ] RaycastHit 结果

```typescript
interface RaycastHit {
  hit: boolean;
  point: Vec2;
  normal: Vec2;
  distance: number;
  collider: Collider;
}
```

### 5. 物理世界 (@nova/physics2d/PhysicsWorld)

- [ ] Collider 组件
- [ ] Rigidbody 组件 (可选，简化版)
- [ ] 物理步进
- [ ] 空间分区 (可选)

```typescript
const physics = new PhysicsWorld();

// 添加碰撞体
const collider1 = physics.createAABBCollider(aabb);
const collider2 = physics.createCircleCollider(circle);

// 检测碰撞
const collisions = physics.detectCollisions();

// 响应碰撞
physics.resolveCollisions(collisions);

// Raycast
const hit = physics.raycast(ray, ['enemy']);
```

### 6. 调试渲染

- [ ] 碰撞框绘制 (线框)
- [ ] Ray 可视化

## 学习资源

- Real-Time Collision Detection (书籍)
- Game Physics Engine Development
- Box2D Lite 源码

## 交付物

- `@nova/physics2d` 包
- 碰撞检测示例
- 调试渲染工具

## 验证标准

```typescript
// AABB 碰撞测试
const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
const b = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
console.log(aabbVsAabb(a, b)); // true

// Circle 碰撞测试
const c1 = { x: 0, y: 0, radius: 5 };
const c2 = { x: 8, y: 0, radius: 5 };
console.log(circleVsCircle(c1, c2)); // true (相切)

// Raycast 测试
const ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };
const hit = raycastAABB(ray, a);
console.log(hit.distance); // 0 (从内部开始)
```

## 与 Pong 整合

在 Pong 游戏中使用本周实现的物理系统替换简单的边界检测。
