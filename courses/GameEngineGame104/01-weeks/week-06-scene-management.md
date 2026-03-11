# 第6周: 场景管理系统

> **学习目标**: 理解场景图和空间数据结构
>
> **时间安排**: 2026-03-30 ~ 2026-04-06
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 场景图组织
- [ ] 场景图数据结构
- [ ] 层次化变换
- [ ] 父子关系管理
- [ ] 场景遍历

### 2. 空间划分
- [ ] 八叉树 (Octree)
- [ ] BVH (Bounding Volume Hierarchy)
- [ ] 视锥体裁剪
- [ ] 包围体计算

### 3. ECS框架
- [ ] Entity设计
- [ ] Component设计
- [ ] System实现
- [ ] World管理

### 4. 实践任务
- [ ] 在编辑器中创建场景层级
- [ ] 添加/删除游戏对象
- [ ] 保存和加载场景

---

## 核心知识点

### 场景图 (Scene Graph)

#### 场景图结构

```cpp
// 场景节点
class SceneNode {
public:
    SceneNode(std::string name) : m_name(name) {}

    // 层级管理
    void addChild(std::shared_ptr<SceneNode> child) {
        child->m_parent = this;
        m_children.push_back(child);
        child->updateWorldTransform();
    }

    void removeChild(std::shared_ptr<SceneNode> child) {
        auto it = std::find(m_children.begin(), m_children.end(), child);
        if (it != m_children.end()) {
            (*it)->m_parent = nullptr;
            m_children.erase(it);
        }
    }

    // 变换
    void setLocalPosition(const vec3& position) {
        m_local_position = position;
        updateWorldTransform();
    }

    void setLocalRotation(const quat& rotation) {
        m_local_rotation = rotation;
        updateWorldTransform();
    }

    void setLocalScale(const vec3& scale) {
        m_local_scale = scale;
        updateWorldTransform();
    }

    // 获取世界变换
    const mat4& getWorldTransform() const {
        return m_world_transform;
    }

    const vec3& getWorldPosition() const {
        return m_world_position;
    }

    // 遍历
    void update(float delta_time) {
        // 更新自身
        onUpdate(delta_time);

        // 更新子节点
        for (auto& child : m_children) {
            child->update(delta_time);
        }
    }

    void render(RenderContext* context) {
        // 渲染自身
        onRender(context);

        // 渲染子节点
        for (auto& child : m_children) {
            child->render(context);
        }
    }

    // 虚函数供子类重写
    virtual void onUpdate(float delta_time) {}
    virtual void onRender(RenderContext* context) {}

protected:
    void updateWorldTransform() {
        // 计算局部变换矩阵
        mat4 T = translate(m_local_position);
        mat4 R = toMat4(m_local_rotation);
        mat4 S = scale(m_local_scale);
        m_local_transform = T * R * S;

        // 计算世界变换矩阵
        if (m_parent) {
            m_world_transform = m_parent->m_world_transform * m_local_transform;
        } else {
            m_world_transform = m_local_transform;
        }

        // 提取世界位置
        vec4 pos = m_world_transform * vec4(0, 0, 0, 1);
        m_world_position = vec3(pos);

        // 传播到子节点
        for (auto& child : m_children) {
            child->updateWorldTransform();
        }
    }

private:
    std::string m_name;
    SceneNode* m_parent = nullptr;
    std::vector<std::shared_ptr<SceneNode>> m_children;

    // 局部变换
    vec3 m_local_position{0, 0, 0};
    quat m_local_rotation{1, 0, 0, 0};  // 单位四元数
    vec3 m_local_scale{1, 1, 1};
    mat4 m_local_transform{1};

    // 世界变换
    mat4 m_world_transform{1};
    vec3 m_world_position{0, 0, 0};
};

// 使用示例
auto root = std::make_shared<SceneNode>("Root");

auto car = std::make_shared<SceneNode>("Car");
car->setLocalPosition(vec3(0, 0, 0));
root->addChild(car);

auto wheel_front_left = std::make_shared<SceneNode>("WheelFL");
wheel_front_left->setLocalPosition(vec3(1.0f, 0.0f, 1.5f));
car->addChild(wheel_front_left);

// 旋转汽车，轮子跟随
car->setLocalRotation(angleAxis(radians(45.0f), vec3(0, 1, 0)));
```

---

### ECS架构 (Entity-Component-System)

#### Entity设计

```cpp
// Entity ID
using EntityID = uint32_t;

constexpr EntityID INVALID_ENTITY = 0;

class Entity {
public:
    Entity(EntityID id, World* world) : m_id(id), m_world(world) {}

    EntityID getID() const { return m_id; }

    // 添加组件
    template<typename T, typename... Args>
    T* addComponent(Args&&... args) {
        return m_world->addComponent<T>(m_id, std::forward<Args>(args)...);
    }

    // 获取组件
    template<typename T>
    T* getComponent() {
        return m_world->getComponent<T>(m_id);
    }

    // 移除组件
    template<typename T>
    void removeComponent() {
        m_world->removeComponent<T>(m_id);
    }

    // 检查是否有组件
    template<typename T>
    bool hasComponent() {
        return m_world->hasComponent<T>(m_id);
    }

    // 生命周期
    bool isValid() const { return m_id != INVALID_ENTITY; }
    void destroy() { m_world->destroyEntity(m_id); m_id = INVALID_ENTITY; }

private:
    EntityID m_id;
    World* m_world;
};
```

#### Component设计

```cpp
// 组件基类
class IComponent {
public:
    virtual ~IComponent() = default;
    virtual std::type_index getType() const = 0;
};

// 具体组件
class TransformComponent : public IComponent {
public:
    static constexpr std::type_index TYPE_INDEX = std::type_index(typeid(TransformComponent));

    vec3 position{0, 0, 0};
    quat rotation{1, 0, 0, 0};
    vec3 scale{1, 1, 1};

    mat4 getMatrix() const {
        return translate(position) * toMat4(rotation) * scale(scale);
    }

    std::type_index getType() const override { return TYPE_INDEX; }
};

class MeshComponent : public IComponent {
public:
    static constexpr std::type_index TYPE_INDEX = std::type_index(typeid(MeshComponent));

    std::shared_ptr<Mesh> mesh;
    std::shared_ptr<Material> material;

    std::type_index getType() const override { return TYPE_INDEX; }
};

class LightComponent : public IComponent {
public:
    enum class Type {
        Directional,
        Point,
        Spot
    };

    Type type = Type::Point;
    vec3 color{1, 1, 1};
    float intensity = 1.0f;
    float range = 10.0f;

    std::type_index getType() const override { return std::type_index(typeid(LightComponent)); }
};

class CameraComponent : public IComponent {
public:
    float fov = radians(60.0f);
    float near_plane = 0.1f;
    float far_plane = 100.0f;
    bool is_primary = true;

    mat4 getViewMatrix(const vec3& position, const quat& rotation) {
        vec3 forward = rotation * vec3(0, 0, -1);
        vec3 up = rotation * vec3(0, 1, 0);
        return lookAt(position, position + forward, up);
    }

    mat4 getProjectionMatrix(float aspect) {
        return perspective(fov, aspect, near_plane, far_plane);
    }
};
```

#### System设计

```cpp
// 系统基类
class ISystem {
public:
    virtual ~ISystem() = default;
    virtual void update(float delta_time) = 0;
};

// 渲染系统
class RenderSystem : public ISystem {
public:
    RenderSystem(World* world) : m_world(world) {}

    void update(float delta_time) override {
        // 收集可渲染实体
        auto view = m_world->view<TransformComponent, MeshComponent>();

        // 视锥体裁剪
        auto camera_entity = m_world->getPrimaryCamera();
        auto camera_transform = camera_entity.getComponent<TransformComponent>();
        auto camera = camera_entity.getComponent<CameraComponent>();

        mat4 view = camera->getViewMatrix(camera_transform->position, camera_transform->rotation);
        mat4 proj = camera->getProjectionMatrix(aspect);
        Frustum frustum(proj * view);

        // 排序和批处理
        std::vector<MeshToRender> meshes_to_render;

        for (auto entity : view) {
            auto transform = m_world->getComponent<TransformComponent>(entity);
            auto mesh = m_world->getComponent<MeshComponent>(entity);

            // 包围体检测
            if (frustum.isVisible(mesh->mesh->getBoundingBox())) {
                meshes_to_render.push_back({
                    mesh->mesh,
                    mesh->material,
                    transform->getMatrix()
                });
            }
        }

        // 按材质排序
        std::sort(meshes_to_render.begin(), meshes_to_render.end(),
            [](const auto& a, const auto& b) {
                return a.material->getID() < b.material->getID();
            });

        // 提交渲染
        for (auto& item : meshes_to_render) {
            submitRender(item.mesh, item.material, item.transform);
        }
    }

private:
    World* m_world;

    struct MeshToRender {
        std::shared_ptr<Mesh> mesh;
        std::shared_ptr<Material> material;
        mat4 transform;
    };
};

// 物理系统
class PhysicsSystem : public ISystem {
public:
    PhysicsSystem(World* world) : m_world(world) {}

    void update(float delta_time) override {
        auto view = m_world->view<TransformComponent, RigidBodyComponent>();

        for (auto entity : view) {
            auto transform = m_world->getComponent<TransformComponent>(entity);
            auto rigidbody = m_world->getComponent<RigidBodyComponent>(entity);

            // 从物理世界获取位置
            vec3 position = rigidbody->getPosition();
            quat rotation = rigidbody->getRotation();

            transform->position = position;
            transform->rotation = rotation;
        }
    }

private:
    World* m_world;
};

// 动画系统
class AnimationSystem : public ISystem {
public:
    AnimationSystem(World* world) : m_world(world) {}

    void update(float delta_time) override {
        auto view = m_world->view<SkeletonComponent, AnimationComponent>();

        for (auto entity : view) {
            auto skeleton = m_world->getComponent<SkeletonComponent>(entity);
            auto animation = m_world->getComponent<AnimationComponent>(entity);

            // 更新动画时间
            animation->time += delta_time * animation->speed;

            // 计算骨骼姿势
            animation->evaluate(skeleton, animation->time);
        }
    }

private:
    World* m_world;
};
```

#### World管理

```cpp
class World {
public:
    World() {
        // 注册所有组件类型
        registerComponentType<TransformComponent>();
        registerComponentType<MeshComponent>();
        registerComponentType<LightComponent>();
        registerComponentType<CameraComponent>();
        registerComponentType<RigidBodyComponent>();
        registerComponentType<SkeletonComponent>();
        registerComponentType<AnimationComponent>();
    }

    // 实体管理
    Entity createEntity(std::string name = "Entity") {
        EntityID id = m_next_id++;
        m_entities.push_back(id);
        m_entity_names[id] = name;
        return Entity(id, this);
    }

    void destroyEntity(EntityID id) {
        // 移除所有组件
        for (auto& [type_id, component_pool] : m_component_pools) {
            component_pool->remove(id);
        }
        // 移除实体
        auto it = std::find(m_entities.begin(), m_entities.end(), id);
        if (it != m_entities.end()) {
            m_entities.erase(it);
        }
    }

    // 组件管理
    template<typename T, typename... Args>
    T* addComponent(EntityID id, Args&&... args) {
        auto pool = getComponentPool<T>();
        return pool->add(id, T(std::forward<Args>(args)...));
    }

    template<typename T>
    T* getComponent(EntityID id) {
        auto pool = getComponentPool<T>();
        return pool->get(id);
    }

    template<typename T>
    void removeComponent(EntityID id) {
        auto pool = getComponentPool<T>();
        pool->remove(id);
    }

    template<typename T>
    bool hasComponent(EntityID id) {
        auto pool = getComponentPool<T>();
        return pool->has(id);
    }

    // 视图（用于系统遍历）
    template<typename... Components>
    std::vector<EntityID> view() {
        std::vector<EntityID> result;

        for (EntityID id : m_entities) {
            if ((hasComponent<Components>(id) && ...)) {
                result.push_back(id);
            }
        }

        return result;
    }

    // 系统管理
    void addSystem(std::unique_ptr<ISystem> system) {
        m_systems.push_back(std::move(system));
    }

    void update(float delta_time) {
        for (auto& system : m_systems) {
            system->update(delta_time);
        }
    }

private:
    template<typename T>
    void registerComponentType() {
        std::type_index type_id = typeid(T);
        m_component_pools[type_id] = std::make_unique<ComponentPool<T>>();
    }

    template<typename T>
    ComponentPool<T>* getComponentPool() {
        std::type_index type_id = typeid(T);
        auto it = m_component_pools.find(type_id);
        if (it != m_component_pools.end()) {
            return static_cast<ComponentPool<T>*>(it->second.get());
        }
        return nullptr;
    }

    // 组件池
    template<typename T>
    class ComponentPool {
    public:
        T* add(EntityID id, T component) {
            m_components[id] = component;
            return &m_components[id];
        }

        T* get(EntityID id) {
            auto it = m_components.find(id);
            if (it != m_components.end()) {
                return &it->second;
            }
            return nullptr;
        }

        void remove(EntityID id) {
            m_components.erase(id);
        }

        bool has(EntityID id) {
            return m_components.find(id) != m_components.end();
        }

    private:
        std::unordered_map<EntityID, T> m_components;
    };

    EntityID m_next_id = 1;
    std::vector<EntityID> m_entities;
    std::unordered_map<EntityID, std::string> m_entity_names;
    std::unordered_map<std::type_index, std::unique_ptr<IComponentPool>> m_component_pools;
    std::vector<std::unique_ptr<ISystem>> m_systems;
};
```

---

### 空间划分

#### 包围体 (Bounding Volume)

```cpp
// AABB包围盒
struct BoundingBox {
    vec3 min;
    vec3 max;

    BoundingBox() : min(FLT_MAX), max(-FLT_MAX) {}

    void expand(const vec3& point) {
        min = glm::min(min, point);
        max = glm::max(max, point);
    }

    void expand(const BoundingBox& other) {
        min = glm::min(min, other.min);
        max = glm::max(max, other.max);
    }

    vec3 getCenter() const {
        return (min + max) * 0.5f;
    }

    vec3 getExtents() const {
        return max - min;
    }

    bool contains(const vec3& point) const {
        return point.x >= min.x && point.x <= max.x &&
               point.y >= min.y && point.y <= max.y &&
               point.z >= min.z && point.z <= max.z;
    }

    bool intersects(const BoundingBox& other) const {
        return min.x <= other.max.x && max.x >= other.min.x &&
               min.y <= other.max.y && max.y >= other.min.y &&
               min.z <= other.max.z && max.z >= other.min.z;
    }
};

// 包围球
struct BoundingSphere {
    vec3 center;
    float radius;

    bool intersects(const BoundingSphere& other) const {
        float dist = length(center - other.center);
        return dist <= (radius + other.radius);
    }
};

// 从顶点计算包围盒
BoundingBox computeBoundingBox(const std::vector<vec3>& vertices) {
    BoundingBox bbox;
    for (const auto& v : vertices) {
        bbox.expand(v);
    }
    return bbox;
}

// 从包围盒转换到包围球
BoundingSphere boundingBoxToSphere(const BoundingBox& bbox) {
    BoundingSphere sphere;
    sphere.center = bbox.getCenter();
    sphere.radius = length(bbox.getExtents()) * 0.5f;
    return sphere;
}
```

#### 视锥体 (Frustum)

```cpp
// 视锥体裁剪
class Frustum {
public:
    enum Plane {
        Left, Right, Bottom, Top, Near, Far
    };

    Frustum(const mat4& view_proj_matrix) {
        // 提取6个平面
        extractPlanes(view_proj_matrix);
    }

    // 点是否在视锥体内
    bool contains(const vec3& point) const {
        for (int i = 0; i < 6; i++) {
            float distance = dot(m_planes[i].normal, point) + m_planes[i].distance;
            if (distance < 0) {
                return false;
            }
        }
        return true;
    }

    // 包围盒是否与视锥体相交
    bool intersects(const BoundingBox& bbox) const {
        for (int i = 0; i < 6; i++) {
            const vec3& normal = m_planes[i].normal;
            float distance = m_planes[i].distance;

            // 找到最远的正顶点
            vec3 positive_vertex = bbox.min;
            if (normal.x >= 0) positive_vertex.x = bbox.max.x;
            if (normal.y >= 0) positive_vertex.y = bbox.max.y;
            if (normal.z >= 0) positive_vertex.z = bbox.max.z;

            if (dot(normal, positive_vertex) + distance < 0) {
                return false;
            }
        }
        return true;
    }

private:
    struct Plane {
        vec3 normal;
        float distance;
    };

    Plane m_planes[6];

    void extractPlanes(const mat4& matrix) {
        // Left plane
        m_planes[Left].normal = vec3(matrix[0][3] + matrix[0][0],
                                      matrix[1][3] + matrix[1][0],
                                      matrix[2][3] + matrix[2][0]);
        m_planes[Left].distance = matrix[3][3] + matrix[3][0];
        m_planes[Left].normal = normalize(m_planes[Left].normal);

        // Right plane
        m_planes[Right].normal = vec3(matrix[0][3] - matrix[0][0],
                                       matrix[1][3] - matrix[1][0],
                                       matrix[2][3] - matrix[2][0]);
        m_planes[Right].distance = matrix[3][3] - matrix[3][0];
        m_planes[Right].normal = normalize(m_planes[Right].normal);

        // Bottom plane
        m_planes[Bottom].normal = vec3(matrix[0][3] + matrix[0][1],
                                        matrix[1][3] + matrix[1][1],
                                        matrix[2][3] + matrix[2][1]);
        m_planes[Bottom].distance = matrix[3][3] + matrix[3][1];
        m_planes[Bottom].normal = normalize(m_planes[Bottom].normal);

        // Top plane
        m_planes[Top].normal = vec3(matrix[0][3] - matrix[0][1],
                                     matrix[1][3] - matrix[1][1],
                                     matrix[2][3] - matrix[2][1]);
        m_planes[Top].distance = matrix[3][3] - matrix[3][1];
        m_planes[Top].normal = normalize(m_planes[Top].normal);

        // Near plane
        m_planes[Near].normal = vec3(matrix[0][3] + matrix[0][2],
                                     matrix[1][3] + matrix[1][2],
                                     matrix[2][3] + matrix[2][2]);
        m_planes[Near].distance = matrix[3][3] + matrix[3][2];
        m_planes[Near].normal = normalize(m_planes[Near].normal);

        // Far plane
        m_planes[Far].normal = vec3(matrix[0][3] - matrix[0][2],
                                    matrix[1][3] - matrix[1][2],
                                    matrix[2][3] - matrix[2][2]);
        m_planes[Far].distance = matrix[3][3] - matrix[3][2];
        m_planes[Far].normal = normalize(m_planes[Far].normal);
    }
};
```

#### 八叉树 (Octree)

```cpp
// 八叉树节点
class OctreeNode {
public:
    OctreeNode(const BoundingBox& bounds, int depth = 0, int max_depth = 8)
        : m_bounds(bounds), m_depth(depth), m_max_depth(max_depth) {}

    // 插入实体
    bool insert(EntityID id, const BoundingBox& bbox) {
        // 如果不在当前节点范围内，不插入
        if (!m_bounds.intersects(bbox)) {
            return false;
        }

        // 如果是叶子节点且未达到最大深度
        if (m_children.empty() && m_depth < m_max_depth) {
            // 如果实体数量超过阈值，分裂
            if (m_entities.size() >= MAX_ENTITIES && m_depth < m_max_depth) {
                subdivide();
            }
        }

        // 如果有子节点，尝试插入到子节点
        if (!m_children.empty()) {
            bool inserted = false;
            for (auto& child : m_children) {
                if (child->insert(id, bbox)) {
                    inserted = true;
                }
            }
            if (inserted) {
                return true;
            }
        }

        // 插入到当前节点
        m_entities.push_back(id);
        m_entity_bounds[id] = bbox;
        return true;
    }

    // 移除实体
    void remove(EntityID id) {
        m_entity_bounds.erase(id);
        m_entities.erase(
            std::remove(m_entities.begin(), m_entities.end(), id),
            m_entities.end()
        );

        // 递归删除
        for (auto& child : m_children) {
            child->remove(id);
        }
    }

    // 查询与视锥体相交的实体
    std::vector<EntityID> query(const Frustum& frustum) const {
        std::vector<EntityID> result;

        // 如果当前节点与视锥体不相交，返回空
        if (!frustum.intersects(m_bounds)) {
            return result;
        }

        // 添加当前节点的实体
        for (EntityID id : m_entities) {
            auto it = m_entity_bounds.find(id);
            if (it != m_entity_bounds.end()) {
                if (frustum.intersects(it->second)) {
                    result.push_back(id);
                }
            }
        }

        // 递归查询子节点
        for (auto& child : m_children) {
            auto child_result = child->query(frustum);
            result.insert(result.end(), child_result.begin(), child_result.end());
        }

        return result;
    }

private:
    static constexpr int MAX_ENTITIES = 16;

    void subdivide() {
        vec3 center = m_bounds.getCenter();
        vec3 extents = m_bounds.getExtents() * 0.5f;

        // 创建8个子节点
        for (int x = 0; x < 2; x++) {
            for (int y = 0; y < 2; y++) {
                for (int z = 0; z < 2; z++) {
                    vec3 child_center = center + vec3(
                        (x == 0 ? -1 : 1) * extents.x,
                        (y == 0 ? -1 : 1) * extents.y,
                        (z == 0 ? -1 : 1) * extents.z
                    );

                    BoundingBox child_bounds;
                    child_bounds.min = child_center - extents;
                    child_bounds.max = child_center + extents;

                    m_children.push_back(
                        std::make_unique<OctreeNode>(child_bounds, m_depth + 1, m_max_depth)
                    );
                }
            }
        }

        // 重新分配现有实体到子节点
        std::vector<EntityID> entities_to_redistribute = m_entities;
        m_entities.clear();

        for (EntityID id : entities_to_redistribute) {
            auto it = m_entity_bounds.find(id);
            if (it != m_entity_bounds.end()) {
                insert(id, it->second);
            }
        }
    }

    BoundingBox m_bounds;
    int m_depth;
    int m_max_depth;
    std::vector<std::unique_ptr<OctreeNode>> m_children;
    std::vector<EntityID> m_entities;
    std::unordered_map<EntityID, BoundingBox> m_entity_bounds;
};

// 八叉树管理器
class Octree {
public:
    Octree(const BoundingBox& bounds, int max_depth = 8)
        : m_root(bounds, 0, max_depth) {}

    void insert(EntityID id, const BoundingBox& bbox) {
        m_root.insert(id, bbox);
    }

    void remove(EntityID id) {
        m_root.remove(id);
    }

    std::vector<EntityID> query(const Frustum& frustum) const {
        return m_root.query(frustum);
    }

private:
    OctreeNode m_root;
};
```

---

## 关键目录

```
runtime/function/framework/
├── entity.h                    # Entity定义
├── component.h                 # Component基类
├── world.h                     # World管理
├── system.h                    # System基类
├── components/                 # 具体组件
│   ├── transform_component.h
│   ├── mesh_component.h
│   ├── light_component.h
│   ├── camera_component.h
│   └── rigidbody_component.h
├── systems/                    # 具体系统
│   ├── render_system.h
│   ├── physics_system.h
│   ├── animation_system.h
│   └── script_system.h
├── scene/                      # 场景管理
│   ├── scene.h
│   ├── scene_node.h
│   └── scene_manager.h
└── spatial/                    # 空间划分
    ├── octree.h
    ├── bvh.h
    └── frustum.h
```

---

## 实践任务

### 任务1: 创建场景层级

```cpp
// 在编辑器中创建层级结构
auto root = world->createEntity("Root");

auto car = world->createEntity("Car");
auto transform = car->addComponent<TransformComponent>();
transform->position = vec3(0, 0, 0);

auto wheel_fl = world->createEntity("WheelFL");
wheel_fl->addComponent<TransformComponent>()->position = vec3(1.0f, 0.0f, 1.5f);
```

### 任务2: 实现场景保存/加载

```cpp
// 场景序列化
void saveScene(World* world, const std::string& path) {
    nlohmann::json scene_json;

    auto entities = world->view<TransformComponent>();
    for (auto entity_id : entities) {
        nlohmann::json entity_json;
        entity_json["id"] = entity_id;
        entity_json["name"] = world->getEntityName(entity_id);

        auto transform = world->getComponent<TransformComponent>(entity_id);
        entity_json["transform"] = {
            {"position", {transform->position.x, transform->position.y, transform->position.z}},
            {"rotation", {transform->rotation.w, transform->rotation.x, transform->rotation.y, transform->rotation.z}},
            {"scale", {transform->scale.x, transform->scale.y, transform->scale.z}}
        };

        scene_json["entities"].push_back(entity_json);
    }

    std::ofstream file(path);
    file << scene_json.dump(4);
}

void loadScene(World* world, const std::string& path) {
    std::ifstream file(path);
    nlohmann::json scene_json;
    file >> scene_json;

    for (auto& entity_json : scene_json["entities"]) {
        auto entity = world->createEntity(entity_json["name"]);

        auto transform = entity->addComponent<TransformComponent>();
        auto& pos = entity_json["transform"]["position"];
        transform->position = vec3(pos[0], pos[1], pos[2]);
        // ...
    }
}
```

### 任务3: 视锥体裁剪测试

```cpp
// 测试视锥体裁剪效果
void testFrustumCulling() {
    // 创建包含大量对象的场景
    for (int i = 0; i < 1000; i++) {
        auto entity = world->createEntity("Object" + std::to_string(i));
        auto transform = entity->addComponent<TransformComponent>();
        transform->position = vec3(
            rand() % 100 - 50,
            rand() % 100 - 50,
            rand() % 100 - 50
        );
        entity->addComponent<MeshComponent>();
    }

    // 统计裁剪前后
    int total_entities = /* 总实体数 */;
    int visible_entities = /* 可见实体数 */;
    std::cout << "Culling: " << visible_entities << "/" << total_entities << std::endl;
}
```

---

## 验证标准

- [ ] 理解场景图结构
  - [ ] 能解释父子关系
  - [ ] 理解变换传播
  - [ ] 能创建层级结构

- [ ] 掌握ECS架构
  - [ ] 理解Entity-Component-System分离
  - [ ] 能创建自定义组件
  - [ ] 能实现自定义系统

- [ ] 理解空间划分
  - [ ] 知道包围体的作用
  - [ ] 理解视锥体裁剪原理
  - [ ] 了解八叉树/BVH结构

- [ ] 实践完成
  - [ ] 创建场景层级
  - [ ] 添加/删除对象
  - [ ] 保存/加载场景

---

## 下周预告

第7周将学习物理系统：
- 刚体动力学基础
- Jolt物理引擎集成
- 碰撞检测
- 物理材质和形状
