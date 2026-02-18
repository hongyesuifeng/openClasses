# 第7周: 物理系统

> **学习目标**: 理解物理模拟和碰撞检测
>
> **时间安排**: 2026-04-07 ~ 2026-04-14
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 刚体动力学
- [ ] 牛顿运动定律
- [ ] 力、扭矩、冲量
- [ ] 质量和惯性张量
- [ ] 积分方法

### 2. 碰撞检测
- [ ] 宽相检测（Broad Phase）
- [ ] 窄相检测（Narrow Phase）
- [ ] 碰撞形状
- [ ] 碰撞响应

### 3. Jolt物理引擎
- [ ] Jolt架构
- [ ] Physics Manager设计
- [ ] 物理组件
- [ ] 物理调试

### 4. 实践任务
- [ ] 创建物理对象
- [ ] 配置物理材质
- [ ] 观察碰撞效果

---

## 核心知识点

### 物理基础概念

```cpp
// 刚体状态
struct RigidBodyState {
    // 线性
    vec3 position{0, 0, 0};
    vec3 linear_velocity{0, 0, 0};
    vec3 force{0, 0, 0};
    float mass = 1.0f;
    float inv_mass = 1.0f;

    // 角度
    quat rotation{1, 0, 0, 0};
    vec3 angular_velocity{0, 0, 0};
    vec3 torque{0, 0, 0};
    mat3 inertia_tensor{1};
    mat3 inv_inertia_tensor{1};
};

// 施加力
void applyForce(RigidBodyState& body, const vec3& force, const vec3& point) {
    body.force += force;
    vec3 r = point - body.position;
    body.torque += cross(r, force);
}

// 施加冲量（瞬时力）
void applyImpulse(RigidBodyState& body, const vec3& impulse, const vec3& point) {
    body.linear_velocity += impulse * body.inv_mass;
    vec3 r = point - body.position;
    body.angular_velocity += body.inv_inertia_tensor * cross(r, impulse);
}

// 积分（半隐式欧拉）
void integrate(RigidBodyState& body, float dt) {
    // 线性
    vec3 acceleration = body.force * body.inv_mass;
    body.linear_velocity += acceleration * dt;
    body.position += body.linear_velocity * dt;

    // 角度
    vec3 angular_acceleration = body.inv_inertia_tensor * body.torque;
    body.angular_velocity += angular_acceleration * dt;

    // 四元数积分
    quat omega(0, body.angular_velocity);
    body.rotation += 0.5f * omega * body.rotation * dt;
    body.rotation = normalize(body.rotation);

    // 清除力/扭矩
    body.force = vec3(0);
    body.torque = vec3(0);
}
```

### Jolt物理引擎集成

```cpp
// Jolt初始化
#include <Jolt/Jolt.h>
#include <Jolt/RegisterTypes.h>
#include <Jolt/Core/Factory.h>
#include <Jolt/Physics/PhysicsSettings.h>
#include <Jolt/Physics/PhysicsSystem.h>
#include <Jolt/Physics/Collision/Shape/BoxShape.h>
#include <Jolt/Physics/Collision/Shape/SphereShape.h>
#include <Jolt/Physics/Body/BodyCreationSettings.h>

// 物理系统管理器
class PhysicsManager {
public:
    PhysicsManager() {
        // 初始化Jolt
        JPH::RegisterTypes();

        // 创建物理系统
        m_physics_system = new JPH::PhysicsSystem();

        // 配置
        JPH::PhysicsSettings settings;
        settings.mBaumgarte = 0.2f;
        settings.mSpeculativeContactDistance = 0.02f;
        settings.mPenetrationSlop = 0.02f;
        settings.mLinearCastThreshold = 0.75f;
        settings.mBodyPairCacheMaxDeltaPositionSq = JPH::Square(0.001f);
        settings.mBodyPairCacheCosMaxDeltaRotationDiv2 = 0.99984769515639123915701155881391f;
        settings.mContactNormalCosMaxDeltaRotation = 0.99619469809174553229501040247389f;
        settings.mContactPointPreserveLambdaMaxDistSq = JPH::Square(0.01f);
        settings.mNumVelocitySteps = 10;
        settings.mNumPositionSteps = 2;
        settings.mMinVelocityForRestitution = 1.0f;
        settings.mTimeBeforeSleep = 0.5f;
        settings.mPointVelocitySleepThreshold = 0.03f;
        settings.mDeterministicSimulation = false;
        settings.mConstraintWarmStart = true;
        settings.mUseBodyPairContactCache = true;
        settings.mUseManifoldReduction = true;
        settings.mAllowSleeping = true;
        settings.mCheckActiveEdges = true;

        m_physics_system->Init(settings, max_bodies, num_body_mutexes, max_body_pairs,
                               max_contact_constraints, broad_phase_layer_interface);

        // 设置监听器
        m_physics_system->SetBodyActivationListener(this);
        m_physics_system->SetContactListener(this);
    }

    ~PhysicsManager() {
        delete m_physics_system;
    }

    // 更新物理
    void update(float delta_time) {
        // 固定时间步
        const float time_step = 1.0f / 60.0f;
        m_accumulator += delta_time;

        while (m_accumulator >= time_step) {
            m_physics_system->Update(time_step, 1);
            m_accumulator -= time_step;
        }
    }

    // 创建刚体
    JPH::BodyID createBox(const vec3& position, const vec3& half_extents, float mass) {
        // 创建形状
        JPH::BoxShapeSettings shape_settings(JPH::Vec3(half_extents.x, half_extents.y, half_extents.z));
        JPH::ShapeSettings::ShapeResult shape_result = shape_settings.Create();
        JPH::ShapeRefC shape = shape_result.Get();

        // 创建刚体设置
        JPH::BodyCreationSettings body_settings(shape,
            JPH::RVec3(position.x, position.y, position.z),
            JPH::Quat::sIdentity(),
            JPH::EMotionType::Dynamic,
            Layers::MOVING);

        body_settings.mFriction = 0.2f;
        body_settings.mRestitution = 0.5f;
        body_settings.mLinearDamping = 0.05f;
        body_settings.mAngularDamping = 0.05f;
        body_settings.mGravityFactor = 1.0f;
        body_settings.mOverrideMassProperties = JPH::EOverrideMassProperties::CalculateMassAndInertia;
        body_settings.mMassPropertiesOverride.mMass = mass;

        // 创建刚体
        JPH::BodyInterface& body_interface = m_physics_system->GetBodyInterface();
        JPH::Body* body = body_interface.CreateBody(body_settings);
        JPH::BodyID body_id = body->GetID();
        body_interface.AddBody(body_id, JPH::EActivation::Activate);

        return body_id;
    }

    JPH::BodyID createSphere(const vec3& position, float radius, float mass) {
        JPH::SphereShapeSettings shape_settings(radius);
        JPH::ShapeSettings::ShapeResult shape_result = shape_settings.Create();
        JPH::ShapeRefC shape = shape_result.Get();

        JPH::BodyCreationSettings body_settings(shape,
            JPH::RVec3(position.x, position.y, position.z),
            JPH::Quat::sIdentity(),
            JPH::EMotionType::Dynamic,
            Layers::MOVING);

        body_settings.mFriction = 0.2f;
        body_settings.mRestitution = 0.7f;
        body_settings.mOverrideMassProperties = JPH::EOverrideMassProperties::CalculateMassAndInertia;
        body_settings.mMassPropertiesOverride.mMass = mass;

        JPH::BodyInterface& body_interface = m_physics_system->GetBodyInterface();
        JPH::Body* body = body_interface.CreateBody(body_settings);
        JPH::BodyID body_id = body->GetID();
        body_interface.AddBody(body_id, JPH::EActivation::Activate);

        return body_id;
    }

    // 获取位置
    vec3 getPosition(JPH::BodyID body_id) {
        JPH::BodyInterface& body_interface = m_physics_system->GetBodyInterface();
        JPH::Vec3 pos = body_interface.GetPosition(body_id);
        return vec3(pos.GetX(), pos.GetY(), pos.GetZ());
    }

    // 获取旋转
    quat getRotation(JPH::BodyID body_id) {
        JPH::BodyInterface& body_interface = m_physics_system->GetBodyInterface();
        JPH::Quat rot = body_interface.GetRotation(body_id);
        return quat(rot.GetW(), rot.GetX(), rot.GetY(), rot.GetZ());
    }

    // 设置位置
    void setPosition(JPH::BodyID body_id, const vec3& position) {
        JPH::BodyInterface& body_interface = m_physics_system->GetBodyInterface();
        body_interface.SetPosition(body_id, JPH::RVec3(position.x, position.y, position.z),
                                   JPH::EActivation::Activate);
    }

    // 施加力
    void addForce(JPH::BodyID body_id, const vec3& force) {
        JPH::BodyInterface& body_interface = m_physics_system->GetBodyInterface();
        body_interface.AddForce(body_id, JPH::Vec3(force.x, force.y, force.z));
    }

    // 施加冲量
    void addImpulse(JPH::BodyID body_id, const vec3& impulse) {
        JPH::BodyInterface& body_interface = m_physics_system->GetBodyInterface();
        body_interface.AddImpulse(body_id, JPH::Vec3(impulse.x, impulse.y, impulse.z));
    }

private:
    JPH::PhysicsSystem* m_physics_system;
    float m_accumulator = 0.0f;

    // Broad phase层
    static constexpr uint8_t NUM_BROAD_PHASE_LAYERS = 2;
    static constexpr uint8_t NUM_OBJECT_LAYERS = 2;

    class BroadPhaseLayerInterface : public JPH::BroadPhaseLayerInterface {
    public:
        BroadPhaseLayerInterface() {
            m_object_to_broad_phase[Layers::NON_MOVING] = BroadPhaseLayers::NON_MOVING;
            m_object_to_broad_phase[Layers::MOVING] = BroadPhaseLayers::MOVING;
        }

        virtual uint32_t GetNumBroadPhaseLayers() const override {
            return NUM_BROAD_PHASE_LAYERS;
        }

        virtual JPH::BroadPhaseLayer GetBroadPhaseLayer(JPH::ObjectLayer inLayer) const override {
            return m_object_to_broad_phase[inLayer];
        }

#if defined(JPH_EXTERNAL_PROFILE) || defined(JPH_PROFILE_ENABLED)
        virtual const char* GetBroadPhaseLayerName(JPH::BroadPhaseLayer inLayer) const override {
            switch ((JPH::BroadPhaseLayer::Type)inLayer) {
            case (JPH::BroadPhaseLayer::Type)BroadPhaseLayers::NON_MOVING: return "NON_MOVING";
            case (JPH::BroadPhaseLayer::Type)BroadPhaseLayers::MOVING: return "MOVING";
            default: return "INVALID";
            }
        }
#endif

    private:
        JPH::BroadPhaseLayer m_object_to_broad_phase[NUM_OBJECT_LAYERS];
    };

    struct Layers {
        static constexpr JPH::ObjectLayer NON_MOVING = 0;
        static constexpr JPH::ObjectLayer MOVING = 1;
    };

    struct BroadPhaseLayers {
        static constexpr JPH::BroadPhaseLayer NON_MOVING{0};
        static constexpr JPH::BroadPhaseLayer MOVING{1};
    };
};

// 物理组件
class PhysicsComponent {
public:
    PhysicsComponent(PhysicsManager* manager, JPH::BodyID body_id)
        : m_manager(manager), m_body_id(body_id) {}

    vec3 getPosition() const {
        return m_manager->getPosition(m_body_id);
    }

    quat getRotation() const {
        return m_manager->getRotation(m_body_id);
    }

    void addForce(const vec3& force) {
        m_manager->addForce(m_body_id, force);
    }

    void addImpulse(const vec3& impulse) {
        m_manager->addImpulse(m_body_id, impulse);
    }

private:
    PhysicsManager* m_manager;
    JPH::BodyID m_body_id;
};
```

### 碰撞检测

```cpp
// 碰撞形状类型
enum class CollisionShapeType {
    Box,
    Sphere,
    Capsule,
    Cylinder,
    Mesh,
    HeightField
};

// 碰撞形状
class CollisionShape {
public:
    static std::shared_ptr<CollisionShape> createBox(const vec3& half_extents) {
        return std::make_shared<BoxCollisionShape>(half_extents);
    }

    static std::shared_ptr<CollisionShape> createSphere(float radius) {
        return std::make_shared<SphereCollisionShape>(radius);
    }

    virtual CollisionShapeType getType() const = 0;
    virtual BoundingBox getBoundingBox() const = 0;

protected:
    CollisionShape() = default;
};

class BoxCollisionShape : public CollisionShape {
public:
    BoxCollisionShape(const vec3& half_extents) : m_half_extents(half_extents) {}

    CollisionShapeType getType() const override {
        return CollisionShapeType::Box;
    }

    BoundingBox getBoundingBox() const override {
        BoundingBox bbox;
        bbox.min = -m_half_extents;
        bbox.max = m_half_extents;
        return bbox;
    }

    vec3 getHalfExtents() const { return m_half_extents; }

private:
    vec3 m_half_extents;
};

class SphereCollisionShape : public CollisionShape {
public:
    SphereCollisionShape(float radius) : m_radius(radius) {}

    CollisionShapeType getType() const override {
        return CollisionShapeType::Sphere;
    }

    BoundingBox getBoundingBox() const override {
        BoundingBox bbox;
        bbox.min = vec3(-m_radius);
        bbox.max = vec3(m_radius);
        return bbox;
    }

    float getRadius() const { return m_radius; }

private:
    float m_radius;
};
```

---

## 实践任务

### 任务1: 创建物理场景

```cpp
// 创建地板
auto floor_body = physics_manager->createBox(vec3(0, -1, 0), vec3(10, 0.5f, 10), 0.0f);

// 创建堆叠的盒子
for (int i = 0; i < 10; i++) {
    vec3 pos(0, 0.5f + i * 1.1f, 0);
    auto body = physics_manager->createBox(pos, vec3(0.5f), 1.0f);
}

// 创建球体
auto sphere_body = physics_manager->createSphere(vec3(2, 5, 0), 0.5f, 1.0f);
physics_manager->addImpulse(sphere_body, vec3(-5, 0, 0));
```

### 任务2: 配置物理材质

```cpp
// 修改材质属性
JPH::BodyInterface& body_interface = physics_system->GetBodyInterface();

// 高摩擦、低弹性
body_interface.SetFriction(body_id, 0.9f);
body_interface.SetRestitution(body_id, 0.1f);

// 低摩擦、高弹性
body_interface.SetFriction(body_id, 0.1f);
body_interface.SetRestitution(body_id, 0.9f);
```

---

## 关键目录

```
runtime/function/physics/
├── physics_manager.h
├── physics_component.h
├── physics_material.h
├── collision_shape.h
└── jolt/
```

---

## 下周预告

第8周: 动画系统 - 骨骼动画原理与实现
