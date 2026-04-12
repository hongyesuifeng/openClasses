# 物理系统

物理系统提供了碰撞检测、刚体模拟和射线检测等功能。Cocos Creator 采用抽象接口设计，支持 Bullet、Cannon.js 和 PhysX 三种物理引擎后端。

## 目录

- [架构概述](#架构概述)
- [物理抽象接口](#物理抽象接口)
- [三大物理后端](#三大物理后端)
- [碰撞器系统](#碰撞器系统)
- [刚体与运动](#刚体与运动)
- [射线与扫描检测](#射线与扫描检测)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    物理系统架构                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          游戏逻辑层 (用户代码)                     │   │
│  │  RigidBody · Collider · CharacterController      │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ 调用                             │
│                       ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Framework 抽象层                         │   │
│  │  PhysicsWorld · RigidBody · Collider             │   │
│  │  (统一的 TypeScript 接口)                         │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ 实现                             │
│                       ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Spec 接口定义层                       │   │
│  │  IPhysicsWorld · IRigidBody · ICollider          │   │
│  └───────┬─────────────┬──────────────┬─────────────┘   │
│           │             │              │                  │
│           ▼             ▼              ▼                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Bullet  │  │  Cannon  │  │  PhysX   │               │
│  │  (C++)   │  │  (JS)    │  │  (C++)   │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 物理世界接口 | `cocos/physics/spec/i-physics-world.ts` | IPhysicsWorld |
| 刚体接口 | `cocos/physics/spec/i-rigid-body.ts` | IRigidBody |
| 碰撞器接口 | `cocos/physics/spec/i-collider.ts` | ICollider |
| 物理框架 | `cocos/physics/framework/` | 抽象组件 |
| Bullet 后端 | `cocos/physics/bullet/` | Bullet 实现 |
| Cannon 后端 | `cocos/physics/cannon/` | Cannon.js 实现 |
| PhysX 后端 | `cocos/physics/physx/` | PhysX 实现 |

---

## 物理抽象接口

物理系统通过 `spec/` 目录定义纯接口，上层代码只依赖接口不依赖具体实现。

### IPhysicsWorld

```typescript
// cocos/physics/spec/i-physics-world.ts

export interface IPhysicsWorld {
    // ─── 生命周期 ───
    initialize(world): void;
    step(deltaTime: number): void;    // 物理步进
    destroy(): void;

    // ─── 检测 API ───
    raycast(worldRay, options, pool, results): boolean;  // 射线检测
    sweepBox(worldRay, halfExtent, orientation, options, pool, results): boolean;
    sweepSphere(worldRay, radius, options, pool, results): boolean;
    sweepCapsule(worldRay, radius, height, orientation, options, pool, results): boolean;

    // ─── 场景设置 ───
    setGravity(value: Vec3): void;
    setAllowSleep(value: boolean): void;
    setDefaultMaterial(friction, restitution): void;

    // ─── 回调 ───
    emitEvents(): void;               // 发射碰撞事件
}
```

### IRigidBody

```typescript
// cocos/physics/spec/i-rigid-body.ts

export interface IRigidBody {
    // ─── 类型 ───
    setType(value: ERigidBodyType): void;
    // DYNAMIC   - 动态刚体（受力影响）
    // STATIC    - 静态刚体（不可移动）
    // KINEMATIC - 运动学刚体（代码驱动）

    // ─── 物理属性 ───
    setMass(value: number): void;
    setLinearDamping(value: number): void;
    setAngularDamping(value: number): void;
    setLinearFactor(value: Vec3): void;
    setAngularFactor(value: Vec3): void;

    // ─── 运动 API ───
    applyForce(force: Vec3, relativePos?: Vec3): void;
    applyImpulse(impulse: Vec3, relativePos?: Vec3): void;
    applyTorque(torque: Vec3): void;

    // ─── 状态 ───
    wakeUp(): void;
    sleep(): void;
}
```

---

## 三大物理后端

| 后端 | 语言 | 性能 | 精度 | 适用平台 |
|------|------|------|------|----------|
| **Bullet** | C++ / JSB | 高 | 高 | 原生平台 |
| **Cannon.js** | JavaScript | 中 | 中 | Web 平台 |
| **PhysX** | C++ / JSB | 最高 | 最高 | 原生平台 |

### 后端选择策略

```
运行时自动选择：
├── 原生平台 (iOS/Android/Windows/Mac)
│   ├── 优先 PhysX（最佳性能）
│   └── 备选 Bullet
│
└── Web 平台 (浏览器/小游戏)
    └── Cannon.js（纯 JS，无需 WASM）
```

---

## 碰撞器系统

### 碰撞器类型

| 碰撞器 | 路径 | 说明 |
|--------|------|------|
| BoxCollider | `framework/collider/box-collider.ts` | 盒体碰撞器 |
| SphereCollider | `framework/collider/sphere-collider.ts` | 球体碰撞器 |
| CapsuleCollider | `framework/collider/capsule-collider.ts` | 胶囊碰撞器 |
| CylinderCollider | `framework/collider/cylinder-collider.ts` | 圆柱碰撞器 |
| ConeCollider | `framework/collider/cone-collider.ts` | 圆锥碰撞器 |
| TerrainCollider | `framework/collider/terrain-collider.ts` | 地形碰撞器 |
| MeshCollider | `framework/collider/mesh-collider.ts` | 网格碰撞器 |
| SimplexCollider | `framework/collider/simplex-collider.ts` | 单纯形碰撞器 |

### 碰撞器形状示意

```
BoxCollider         SphereCollider       CapsuleCollider
┌──────────┐             ●                ╭──────╮
│          │           ╱   ╲              │      │
│          │          │  ●  │             │  ●   │
│          │           ╲   ╱              │      │
└──────────┘             ●                ╰──────╯
```

---

## 刚体与运动

### ERigidBodyType 刚体类型

```typescript
enum ERigidBodyType {
    DYNAMIC,    // 动态：受力和碰撞影响
    STATIC,     // 静态：不移动，可碰撞
    KINEMATIC,  // 运动学：代码控制移动
}
```

| 类型 | 受力影响 | 碰撞响应 | 典型用途 |
|------|---------|---------|---------|
| DYNAMIC | 是 | 是 | 角色、可推动物体 |
| STATIC | 否 | 是 | 地面、墙壁 |
| KINEMATIC | 否 | 是 | 电梯、移动平台 |

### 力学 API

```typescript
// 施加持续力（如风力）
rigidBody.applyForce(new Vec3(0, 10, 0));

// 施加冲量（如跳跃）
rigidBody.applyImpulse(new Vec3(0, 5, 0));

// 施加扭矩（旋转力）
rigidBody.applyTorque(new Vec3(0, 10, 0));
```

### CharacterController 角色控制器

角色控制器提供游戏角色专用的物理行为：

```typescript
// cocos/physics/framework/character-controller/controller.ts

export class CharacterController {
    move(moveDirection: Vec3, minDist: number, time: number): number;
    // 返回 CollisionFlag 标记碰撞方向

    // 碰撞标记
    // COLLISION_DOWN  - 脚下碰撞（着地）
    // COLLISION_UP    - 头顶碰撞
    // COLLISION_SIDE  - 侧面碰撞（撞墙）
}
```

---

## 射线与扫描检测

### 射线检测（Raycast）

```typescript
// 从起点向方向发射射线
const results = physicsSystem.raycast(
    ray,                    // 世界空间射线
    0xffffffff,             // 碰撞掩码
    1000,                   // 最大距离
    true                    // 检测触发器
);

// 遍历结果
for (const result of results) {
    console.log(result.collider.node.name);  // 碰撞的节点名
    console.log(result.distance);             // 碰撞距离
    console.log(result.hitPoint);             // 碰撞点
    console.log(result.hitNormal);            // 碰撞法线
}
```

### 扫描检测（Sweep）

```typescript
// 盒体扫描（检测盒体沿路径的碰撞）
physicsSystem.sweepBox(
    worldRay, halfExtent, orientation, options
);

// 球体扫描
physicsSystem.sweepSphere(
    worldRay, radius, options
);

// 胶囊扫描
physicsSystem.sweepCapsule(
    worldRay, radius, height, orientation, options
);
```

---

## 技术原理

### 1. 策略模式（Strategy Pattern）

物理系统使用策略模式，通过接口抽象实现多后端切换：

```
PhysicsWorld (Context)
    │
    └── IPhysicsWorld (Strategy Interface)
        ├── BulletWorld (Concrete Strategy A)
        ├── CannonWorld (Concrete Strategy B)
        └── PhysXWorld (Concrete Strategy C)
```

### 2. 物理步进

物理系统以固定时间步长（Fixed Timestep）运行，与渲染帧率解耦：

```
游戏循环:
    deltaTime = 帧间隔时间
    accumulated += deltaTime

    while (accumulated >= fixedStep) {
        physicsWorld.step(fixedStep);  // 固定步长
        accumulated -= fixedStep;
    }

    // 插值渲染位置
    alpha = accumulated / fixedStep;
    renderPosition = lerp(prevPos, currPos, alpha);
```

### 3. 碰撞事件分发

```
物理引擎内部碰撞检测
    │
    ▼
检测到碰撞/分离
    │
    ├── onCollisionEnter  ─── 第一次接触
    ├── onCollisionStay   ─── 持续接触（每物理帧）
    └── onCollisionExit   ─── 分离

通过事件系统通知用户代码
```

---

## 下一步

完成物理系统的学习后，继续学习 [03-音频系统](./03-audio-system.md)。
