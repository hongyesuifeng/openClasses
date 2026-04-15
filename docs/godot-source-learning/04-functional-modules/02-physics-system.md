# 物理系统

Godot 的物理系统采用 **Server 模式**架构，前端通过场景节点（RigidBody3D、StaticBody3D 等）提供用户友好的 API，后端通过 PhysicsServer3D 实现高性能物理模拟。Godot 4.x 内置了自研的 GodotPhysics 引擎（2D 和 3D），同时也支持通过模块集成第三方物理引擎。

---

## 目录

1. [物理系统架构](#1-物理系统架构)
2. [PhysicsServer3D 接口](#2-physicsserver3d-接口)
3. [GodotPhysics3D 实现](#3-godotphysics3d-实现)
4. [碰撞形状与物理体](#4-碰撞形状与物理体)
5. [物理步进详解](#5-物理步进详解)
6. [PhysicsServer2D](#6-physicsserver2d)
7. [源码导航](#7-源码导航)

---

## 1. 物理系统架构

```
物理系统分层架构：

  ┌───────────────────────────────────────────────────────────┐
  │                     场景节点层 (Scene Layer)                │
  │                                                           │
  │  StaticBody3D    RigidBody3D    CharacterBody3D           │
  │  AnimatableBody3D   Area3D      SoftBody3D                │
  │  CollisionShape3D   RayCast3D   ShapeCast3D               │
  └────────────────────────┬──────────────────────────────────┘
                           │ 节点通过 RID 与 Server 交互
                           ▼
  ┌───────────────────────────────────────────────────────────┐
  │                  PhysicsServer3D (抽象接口层)               │
  │                                                           │
  │  shape_*()      body_*()       space_*()                  │
  │  area_*()       joint_*()      test_motion()              │
  │                                                           │
  │  定义在: servers/physics_3d/physics_server_3d.h            │
  └────────────────────────┬──────────────────────────────────┘
                           │ 虚函数调用
                           ▼
  ┌───────────────────────────────────────────────────────────┐
  │               GodotPhysicsServer3D (实现层)                 │
  │                                                           │
  │  GodotStep3D     GodotSpace3D      GodotBody3D            │
  │  GodotArea3D     GodotShape3D      GodotJoint3D           │
  │  GodotCollisionSolver3D                                    │
  │                                                           │
  │  定义在: modules/godot_physics_3d/                         │
  └───────────────────────────────────────────────────────────┘
```

### Server 模式的优势

| 优势 | 说明 |
|------|------|
| **解耦** | 场景节点不直接依赖物理引擎实现 |
| **可替换** | 可通过模块替换物理引擎后端（如 Bullet、PhysX） |
| **线程安全** | Server 内部可独立线程运行物理模拟 |
| **高效** | 通过 RID（资源 ID）而非对象指针引用，减少开销 |

---

## 2. PhysicsServer3D 接口

`PhysicsServer3D`（`servers/physics_3d/physics_server_3d.h`）是物理系统的抽象接口层，定义了所有物理操作的 API。

### 2.1 RID 管理的物理对象

```
PhysicsServer3D 管理的对象类型（通过 RID 引用）：

  ┌─────────────────────────────────────────────────┐
  │               PhysicsServer3D                    │
  │                                                  │
  │  Space (空间)                                     │
  │  ├── RID space = space_create()                  │
  │  ├── space_set_param(space, ...)                 │
  │  └── 一个空间 = 一个物理世界                       │
  │                                                  │
  │  Shape (形状)                                     │
  │  ├── RID shape = shape_create(TYPE)              │
  │  ├── 类型: WORLD, RAY, SPHERE, BOX, CAPSULE,    │
  │  │         CYLINDER, CONVEX_POLYGON,             │
  │  │         CONCAVE_POLYGON, HEIGHTMAP, ...       │
  │  └── shape_set_data(shape, ...)                  │
  │                                                  │
  │  Body (刚体)                                      │
  │  ├── RID body = body_create()                    │
  │  ├── body_set_shape(body, idx, shape)            │
  │  ├── body_set_mode(body, STATIC/KINEMATIC/RIGID) │
  │  ├── body_set_state(body, TRANSFORM, ...)        │
  │  └── body_set_force/body_apply_impulse           │
  │                                                  │
  │  Area (区域)                                      │
  │  ├── RID area = area_create()                    │
  │  ├── area_set_shape(area, idx, shape)            │
  │  └── 检测进入/离开的物体                          │
  │                                                  │
  │  Joint (关节)                                     │
  │  ├── RID joint = joint_create()                  │
  │  ├── 类型: PIN, HINGE, SLIDER, CONE_TWIST,      │
  │  │         GENERIC_6DOF                          │
  │  └── 连接两个 Body                                │
  └─────────────────────────────────────────────────┘
```

### 2.2 关键 API 方法

```cpp
// servers/physics_3d/physics_server_3d.h（简化）

class PhysicsServer3D : public Object {
    GDCLASS(PhysicsServer3D, Object);

public:
    // === 空间管理 ===
    virtual RID space_create() = 0;
    virtual void space_set_param(RID p_space, SpaceParameter p_param, real_t p_value) = 0;
    virtual void space_set_active(RID p_space, bool p_active) = 0;
    virtual void space_step(RID p_space, real_t p_step) = 0;  // 核心方法

    // === 形状管理 ===
    virtual RID shape_create(ShapeType p_type) = 0;
    virtual void shape_set_data(RID p_shape, const Variant &p_data) = 0;

    // === 刚体管理 ===
    virtual RID body_create() = 0;
    virtual void body_set_space(RID p_body, RID p_space) = 0;
    virtual void body_set_mode(RID p_body, BodyMode p_mode) = 0;
    virtual void body_set_shape(RID p_body, int p_idx, RID p_shape) = 0;
    virtual void body_set_state(RID p_body, BodyState p_state, const Variant &p_value) = 0;
    virtual void body_apply_force(RID p_body, const Vector3 &p_force) = 0;
    virtual void body_apply_impulse(RID p_body, const Vector3 &p_impulse,
                                    const Vector3 &p_position = Vector3()) = 0;

    // === 查询 ===
    virtual Vector<Vector3> shape_get_points(RID p_shape) const = 0;
    virtual bool body_test_motion(RID p_body, ...) = 0;  // 运动测试（用于 CharacterBody）
    virtual PhysicsDirectSpaceState3D *space_get_direct_state(RID p_space) = 0;

    // === 回调 ===
    // 物理引擎通过 Callable 回调场景节点
    virtual void body_set_force_integration_callback(
        RID p_body, const Callable &p_callback, const Variant &p_udata) = 0;
};
```

---

## 3. GodotPhysics3D 实现

### 3.1 核心类

```
GodotPhysics3D 核心类图：

  GodotPhysicsServer3D
  │   持有多个 GodotSpace3D
  │   调用 step() 驱动物理模拟
  │
  ├── GodotSpace3D
  │   │   一个物理世界（通常对应一个 SceneTree）
  │   │
  │   ├── GodotBroadPhase3D (宽相)
  │   │   └── GodotBroadPhase3DBVH
  │   │       BVH 树用于快速排除不可能碰撞的物体对
  │   │
  │   ├── GodotCollisionObject3D
  │   │   ├── GodotBody3D (刚体/静态体/运动体)
  │   │   └── GodotArea3D (检测区域)
  │   │
  │   ├── GodotShape3D
  │   │   ├── GodotSphereShape3D
  │   │   ├── GodotBoxShape3D
  │   │   ├── GodotCapsuleShape3D
  │   │   ├── GodotConvexPolygonShape3D
  │   │   ├── GodotConcavePolygonShape3D
  │   │   ├── GodotCylinderShape3D
  │   │   ├── GodotHeightMapShape3D
  │   │   └── GodotWorldBoundaryShape3D (平面)
  │   │
  │   ├── GodotJoint3D
  │   │   ├── GodotHingeJoint3D
  │   │   ├── GodotSliderJoint3D
  │   │   ├── GodotConeTwistJoint3D
  │   │   └── GodotGeneric6DOFJoint3D
  │   │
  │   └── GodotStep3D (步进器)
  │       协调整个物理步进流程
  │
  └── GodotCollisionSolver3D
      GJK/EPA 算法实现
```

### 3.2 GodotStep3D 物理步进器

`GodotStep3D`（`modules/godot_physics_3d/godot_step_3d.h`）是物理模拟的调度核心：

```cpp
// modules/godot_physics_3d/godot_step_3d.h（简化）

class GodotStep3D {
    // 空间引用
    GodotSpace3D *space = nullptr;

    // 求解器迭代次数
    int iterations = 8;          // 约束求解迭代次数
    real_t contact_recycle_radius = 0.01;
    real_t contact_max_separation = 0.05;

    // 内部状态
    SelfList<GodotBody3D>::List active_list;     // 活动刚体列表
    SelfList<GodotBody3D>::List mass_properties_list;  // 需要更新质量的体
    SelfList<GodotBody3D>::List state_query_list;      // 需要回调的体

    void _step(real_t p_delta);
};
```

---

## 4. 碰撞形状与物理体

### 4.1 物理体类型对比

```
物理体类型：

  ┌─────────────────────────────────────────────────────────┐
  │  StaticBody3D（静态体）                                   │
  │  ─────────────────────                                   │
  │  • 不会移动，不受力的影响                                   │
  │  • 用于墙壁、地面等静态环境                                 │
  │  • BodyMode: BODY_MODE_STATIC                            │
  │  • 性能最优，不参与大部分物理计算                            │
  │                                                          │
  │  RigidBody3D（刚体）                                      │
  │  ─────────────────                                       │
  │  • 受力和碰撞影响，自动模拟运动                              │
  │  • 支持 force, impulse, torque                           │
  │  • BodyMode: BODY_MODE_RIGID / RIGID_LINEAR              │
  │  • 属性: mass, friction, bounce (restitution)            │
  │                                                          │
  │  CharacterBody3D（角色体）                                 │
  │  ───────────────────────────                              │
  │  • 通过代码控制移动（move_and_slide / move_and_collide）   │
  │  • BodyMode: BODY_MODE_KINEMATIC                         │
  │  • 自带碰撞响应（滑动、楼梯检测）                            │
  │  • 不受物理力影响                                          │
  │                                                          │
  │  AnimatableBody3D（可动画体）                              │
  │  ─────────────────────────────                            │
  │  • 通过 AnimationPlayer 或代码控制                         │
  │  • 可以推动 RigidBody3D（通过质量比计算传递的动量）           │
  │  • BodyMode: BODY_MODE_KINEMATIC + special flag          │
  └─────────────────────────────────────────────────────────┘
```

### 4.2 碰撞形状类型

| 形状类型 | 说明 | 适用场景 |
|----------|------|----------|
| `WorldBoundaryShape3D` | 无限平面 | 地面、海平面 |
| `SphereShape3D` | 球体 | 球形物体、简单碰撞 |
| `BoxShape3D` | 盒体 | 箱子、门、简单建筑 |
| `CapsuleShape3D` | 胶囊体 | 角色碰撞体 |
| `CylinderShape3D` | 圆柱体 | 柱子、树干 |
| `ConvexPolygonShape3D` | 凸多面体 | 复杂凸物体 |
| `ConcavePolygonShape3D` | 凹多面体 | 关卡碰撞网格（仅静态） |
| `HeightMapShape3D` | 高度图 | 地形碰撞 |
| `SeparationRayShape3D` | 分离射线 | 角色脚下检测 |

### 4.3 CharacterBody3D 的 move_and_slide

```
move_and_slide() 实现流程：

  输入：velocity = 期望速度
  输出：实际速度（经过碰撞修正）

  1. 记录初始位置
  2. 对速度应用重力: velocity += gravity * delta

  3. 循环检测碰撞（最多 max_slides 次）：
     ┌──────────────────────────────────────────────┐
     │ motion = velocity * delta                     │
     │                                               │
     │ 调用 PhysicsServer3D::body_test_motion()      │
     │   → GodotCollisionSolver3D 进行碰撞检测        │
     │   → 返回碰撞信息（法线、深度等）                 │
     │                                               │
     │ if 碰撞:                                      │
     │   计算碰撞法线 n                               │
     │   将速度投影到碰撞面上:                         │
     │     velocity -= n * velocity.dot(n)           │
     │   （移除法线方向的速度分量，保留切线方向）         │
     │                                               │
     │ 移动物体到碰撞点（减去安全边距）                  │
     │                                               │
     │ if 无碰撞:                                    │
     │   移动物体到 motion 位置                       │
     │   break                                       │
     └──────────────────────────────────────────────┘

  4. 处理特殊碰撞：
     ├── floor: 记录 on_floor, 根据坡度判断是否可站立
     ├── ceiling: 记录 on_ceiling, 取消垂直速度
     └── wall: 记录 on_wall

  5. 返回最终速度
```

---

## 5. 物理步进详解

### 5.1 完整步进流程

```
GodotStep3D::_step(delta) 完整流程：

  ┌─────────────────────────────────────────────────────────────┐
  │                   物理步进完整流程                             │
  │                                                             │
  │  1. 更新质量属性                                              │
  │     ├── 更新所有标记为脏的质量属性                              │
  │     └── 计算 inertia_tensor（惯性张量）                       │
  │                                                             │
  │  2. 宽相碰撞检测 (Broad Phase)                                │
  │     ├── GodotBroadPhase3DBVH::update()                      │
  │     │   更新所有物体的 AABB (轴对齐包围盒)                     │
  │     │   重新平衡 BVH 树                                      │
  │     │                                                        │
  │     └── BVH 查询重叠对                                       │
  │         遍历 BVH 树，找出所有 AABB 重叠的物体对                  │
  │         生成候选碰撞对列表: [(bodyA, bodyB), ...]              │
  │                                                             │
  │  3. 窄相碰撞检测 (Narrow Phase)                               │
  │     ├── 对每个候选对调用碰撞求解器                              │
  │     │   GodotCollisionSolver3D::solve()                     │
  │     │                                                        │
  │     ├── 碰撞检测算法选择:                                      │
  │     │   ├── 凸 vs 凸: GJK + EPA                              │
  │     │   ├── 凸 vs 凹: SAT (Separating Axis Theorem)          │
  │     │   ├── 球 vs 球: 直接距离比较                             │
  │     │   ├── 球 vs 盒: 最近点算法                               │
  │     │   └── 特化形状组合: 优化路径                             │
  │     │                                                        │
  │     └── 输出碰撞信息                                          │
  │         ├── contact_points[]: Vector3[]  接触点              │
  │     ├── contact_normals[]: Vector3[]    接触法线             │
  │     └── penetration_depth: float        穿透深度             │
  │                                                             │
  │  4. 约束求解 (Constraint Solving)                             │
  │     ├── 对所有接触点构建约束                                   │
  │     │   法线约束: 防止穿透                                     │
  │     │   摩擦约束: 切线方向阻力                                 │
  │     │                                                        │
  │     ├── Sequential Impulse 迭代                               │
  │     │   for i in range(iterations):  // 默认 8 次             │
  │     │     for contact in contacts:                            │
  │     │       // 法线冲量                                       │
  │     │       j_n = -(1+e) * v_rel·n / (1/mA + 1/mB + ...)   │
  │     │       apply_impulse(bodyA, +j_n * n)                   │
  │     │       apply_impulse(bodyB, -j_n * n)                   │
  │     │                                                        │
  │     │       // 摩擦冲量                                       │
  │     │       j_t = clamp(-v_rel·t, -μ*j_n, μ*j_n)           │
  │     │       apply_impulse(...)                                │
  │     │                                                        │
  │     └── Warm Starting: 使用上一帧的冲量初始化                  │
  │                                                             │
  │  5. 积分 (Integration)                                       │
  │     ├── Semi-implicit Euler:                                 │
  │     │   v += (F/m + gravity) * delta                        │
  │     │   x += v * delta                                      │
  │     │                                                        │
  │     ├── 应用阻尼: v *= (1 - linear_damp * delta)            │
  │     └── 更新 Transform3D                                     │
  │                                                             │
  │  6. 回调通知                                                 │
  │     ├── 触发 body 的 state_query 回调                         │
  │     ├── 通知 Area 进入/离开事件                               │
  │     ├── 发射信号: body_entered, area_entered 等               │
  │     └── 调用 force_integration_callback                      │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

### 5.2 BVH 宽相实现

```
BVH (Bounding Volume Hierarchy) 结构：

  BVH 节点结构：
  struct BVHNode {
      AABB aabb;              // 轴对齐包围盒
      int left_child;         // 左子节点索引
      int right_child;        // 右子节点索引
      int body_id;            // -1 = 内部节点, >= 0 = 叶子节点(物体)
  };

  BVH 操作：
  ┌──────────────────────────────────────────────────┐
  │  插入:                                            │
  │    创建叶子节点包含物体的 AABB                      │
  │    找到最佳兄弟节点（SAH 启发式）                   │
  │    创建新内部节点合并                               │
  │    向上更新所有祖先 AABB                            │
  │                                                   │
  │  更新:                                            │
  │    物体移动后 AABB 变化                             │
  │    如果新 AABB 仍在父节点内 → 仅更新 AABB           │
  │    如果超出 → 移除并重新插入                        │
  │                                                   │
  │  查询:                                            │
  │    从根节点开始递归                                 │
  │    如果查询 AABB 与节点 AABB 不重叠 → 剪枝          │
  │    如果重叠且为叶子 → 添加到结果集                   │
  │    如果重叠且为内部 → 递归子节点                    │
  └──────────────────────────────────────────────────┘
```

### 5.3 GJK 碰撞检测算法

```
GJK 算法伪代码（modules/godot_physics_3d/godot_collision_solver_3d_gjk_epa.cpp）：

  bool GJK::solve(Shape *A, Shape *B, Transform3D transform_A, Transform3D transform_B) {
      // 初始化方向
      direction = transform_B.origin - transform_A.origin;

      // 迭代构建单纯形
      simplex = {};
      for (iteration in range(MAX_ITERATIONS)) {
          // 计算 Minkowski 差的支撑点
          support = A.support(direction) - B.support(-direction);

          // 判断是否可能包含原点
          if (support.dot(direction) < 0) {
              return false;  // 不相交，存在分离轴
          }

          // 添加到单纯形
          simplex.add(support);

          // 检查单纯形是否包含原点
          if (simplex.contains_origin()) {
              // 相交！调用 EPA 计算穿透信息
              penetration = EPA::compute_penetration(simplex, A, B);
              return true;
          }

          // 更新搜索方向
          direction = simplex.closest_point_to_origin().direction;
      }
      return false;
  }

  支撑函数 (Support Function) 示例：
  ┌─────────────────────────────────────────────┐
  │  SphereShape3D::support(dir):                │
  │    return center + radius * dir.normalized() │
  │                                              │
  │  BoxShape3D::support(dir):                   │
  │    return Vector3(                            │
  │      sign(dir.x) * half_size.x,              │
  │      sign(dir.y) * half_size.y,              │
  │      sign(dir.z) * half_size.z               │
  │    )                                         │
  └─────────────────────────────────────────────┘
```

---

## 6. PhysicsServer2D

Godot 的 2D 物理系统与 3D 结构几乎完全平行，但有一些独特的设计：

```
PhysicsServer2D vs PhysicsServer3D：

  ┌──────────────────────┬──────────────────────┬──────────────────────┐
  │       特性            │  PhysicsServer3D     │  PhysicsServer2D     │
  ├──────────────────────┼──────────────────────┼──────────────────────┤
  │  源码路径             │  servers/physics_3d/ │  servers/physics_2d/ │
  │  实现模块             │  godot_physics_3d/   │  godot_physics_2d/   │
  │  向量类型             │  Vector3             │  Vector2             │
  │  变换类型             │  Transform3D         │  Transform2D         │
  │  旋转表示             │  Quaternion          │  real_t (弧度)        │
  │  碰撞检测             │  GJK/EPA 3D          │  GJK/EPA 2D          │
  │  穿透求解             │  3D 约束             │  2D 约束              │
  │  并行处理             │  可选线程             │  可选线程             │
  └──────────────────────┴──────────────────────┴──────────────────────┘

  2D 特有形状：
    WorldBoundaryShape2D  - 无限直线
    SeparationRayShape2D  - 分离射线
    SegmentShape2D        - 线段
    RectangleShape2D      - 矩形
    CapsuleShape2D        - 2D 胶囊
    CircleShape2D         - 圆
    ConvexPolygonShape2D  - 2D 凸多边形
    ConcavePolygonShape2D - 2D 凹多边形
```

---

## 7. 源码导航

### 关键文件一览

| 文件 | 路径 | 说明 |
|------|------|------|
| PhysicsServer3D | `servers/physics_3d/physics_server_3d.h` | 3D 物理服务器接口 |
| PhysicsServer2D | `servers/physics_2d/physics_server_2d.h` | 2D 物理服务器接口 |
| GodotStep3D | `modules/godot_physics_3d/godot_step_3d.h` | 3D 物理步进器 |
| GodotSpace3D | `modules/godot_physics_3d/godot_space_3d.h` | 3D 物理空间 |
| GodotBody3D | `modules/godot_physics_3d/godot_body_3d.h` | 3D 刚体实现 |
| GodotCollisionSolver3D | `modules/godot_physics_3d/godot_collision_solver_3d.h` | 碰撞求解器 |
| GodotBroadPhase3DBVH | `modules/godot_physics_3d/godot_broad_phase_3d_bvh.h` | BVH 宽相 |
| GJK/EPA | `modules/godot_physics_3d/gjk_epa.h` | GJK/EPA 实现 |
| CollisionShape3D | `scene/3d/physics/collision_shape_3d.h` | 碰撞形状节点 |
| RigidBody3D | `scene/3d/physics/rigid_body_3d.h` | 刚体节点 |
| CharacterBody3D | `scene/3d/physics/character_body_3d.h` | 角色体节点 |
| StaticBody3D | `scene/3d/physics/static_body_3d.h` | 静态体节点 |

### 推荐阅读顺序

```
1. servers/physics_3d/physics_server_3d.h
   → 理解 Server 接口设计，所有 API 方法

2. modules/godot_physics_3d/godot_step_3d.cpp
   → 跟踪 step() 方法，理解完整物理步进流程

3. modules/godot_physics_3d/godot_space_3d.h
   → 理解物理空间的数据组织

4. modules/godot_physics_3d/godot_body_3d.h
   → 理解刚体内部状态和力/冲量处理

5. modules/godot_physics_3d/godot_collision_solver_3d_gjk_epa.cpp
   → 理解 GJK/EPA 碰撞检测核心算法

6. modules/godot_physics_3d/godot_broad_phase_3d_bvh.h
   → 理解 BVH 宽相加速结构

7. scene/3d/physics/character_body_3d.cpp
   → 理解 move_and_slide 的实现细节

8. scene/3d/physics/rigid_body_3d.h
   → 理解场景节点如何与 PhysicsServer 交互
```

---

## 下一步

- [03-音频系统](./03-audio-system.md) - 深入了解 AudioServer 架构
- [返回目录](./README.md)
