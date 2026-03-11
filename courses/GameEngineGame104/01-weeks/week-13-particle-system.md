# 第13周: 粒子系统与特效

> **学习目标**: 学习粒子系统和特效制作
>
> **时间安排**: 2026-05-25 ~ 2026-05-31
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 粒子系统
- [ ] 粒子生命周期
- [ ] 发射器设计
- [ ] 粒子属性（速度、加速度、颜色、大小）
- [ ] 粒子更新

### 2. 粒子渲染
- [ ] Billboard渲染
- [ ] 纹理图集
- [ ] GPU粒子
- [ ] 粒子排序

### 3. 粒子特效
- [ ] 火焰特效
- [ ] 烟雾特效
- [ ] 爆炸特效
- [ ] 魔法轨迹

### 4. 实践任务
- [ ] 创建粒子效果
- [ ] 调整粒子参数
- [ ] 制作复杂特效

---

## 核心知识点

### 粒子数据结构

```cpp
// 粒子
struct Particle {
    vec3 position{0};
    vec3 velocity{0};
    vec3 acceleration{0};
    vec4 color{1, 1, 1, 1};
    vec2 size{1, 1};
    float rotation{0};
    float rotation_speed{0};
    float life{1};
    float max_life{1};

    // 纹理图集帧
    int frame = 0;
    int frame_count = 1;

    bool isAlive() const {
        return life > 0;
    }
};

// 粒子发射器
class ParticleEmitter {
public:
    // 发射形状
    enum class Shape {
        Point,
        Sphere,
        Box,
        Cone,
        Circle
    };

    ParticleEmitter() = default;

    // 发射粒子
    void emit(float delta_time) {
        if (!m_is_emitting) return;

        // 计算要发射的粒子数
        float particles_to_emit = m_rate * delta_time;
        m_accumulated_time += particles_to_emit;

        int count = static_cast<int>(m_accumulated_time);
        m_accumulated_time -= count;

        for (int i = 0; i < count; i++) {
            if (m_particles.size() >= m_max_particles) {
                break;
            }

            Particle particle = createParticle();
            m_particles.push_back(particle);
        }
    }

    // 更新粒子
    void update(float delta_time) {
        for (auto& particle : m_particles) {
            if (!particle.isAlive()) continue;

            // 应用加速度
            particle.velocity += particle.acceleration * delta_time;

            // 应用速度
            particle.position += particle.velocity * delta_time;

            // 旋转
            particle.rotation += particle.rotation_speed * delta_time;

            // 更新生命周期
            particle.life -= delta_time;

            // 根据生命周期更新颜色和大小
            float t = 1.0f - (particle.life / particle.max_life);
            updateParticleProperties(particle, t);
        }

        // 移除死亡粒子
        m_particles.erase(
            std::remove_if(m_particles.begin(), m_particles.end(),
                [](const Particle& p) { return !p.isAlive(); }),
            m_particles.end()
        );

        // 循环播放
        if (m_looping && m_is_emitting && m_particles.empty()) {
            // 自动重新开始
        }
    }

    // 获取粒子
    const std::vector<Particle>& getParticles() const {
        return m_particles;
    }

    // 配置参数
    void setEmissionRate(float rate) { m_rate = rate; }
    void setMaxParticles(int max) { m_max_particles = max; }
    void setLooping(bool loop) { m_looping = loop; }
    void setEmitting(bool emit) { m_is_emitting = emit; }

    // 生命周期参数
    void setLifetime(float min_life, float max_life) {
        m_min_lifetime = min_life;
        m_max_lifetime = max_life;
    }

    // 速度参数
    void setSpeed(float min_speed, float max_speed) {
        m_min_speed = min_speed;
        m_max_speed = max_speed;
    }

    // 颜色渐变
    void setColorGradient(const std::vector<vec4>& colors) {
        m_color_gradient = colors;
    }

    // 大小渐变
    void setSizeGradient(const std::vector<vec2>& sizes) {
        m_size_gradient = sizes;
    }

private:
    Particle createParticle() {
        Particle particle;

        // 位置
        particle.position = getEmissionPosition();

        // 速度
        particle.velocity = getEmissionDirection() * randomRange(m_min_speed, m_max_speed);

        // 加速度
        particle.acceleration = m_acceleration;

        // 生命周期
        particle.life = randomRange(m_min_lifetime, m_max_lifetime);
        particle.max_life = particle.life;

        // 初始颜色和大小
        if (!m_color_gradient.empty()) {
            particle.color = m_color_gradient.front();
        }
        if (!m_size_gradient.empty()) {
            particle.size = m_size_gradient.front();
        }

        // 旋转
        particle.rotation = randomRange(0, 360);
        particle.rotation_speed = randomRange(m_min_rotation_speed, m_max_rotation_speed);

        return particle;
    }

    vec3 getEmissionPosition() const {
        switch (m_shape) {
            case Shape::Point:
                return m_position;

            case Shape::Sphere: {
                float theta = randomRange(0, PI * 2);
                float phi = randomRange(0, PI);
                float r = randomRange(0, m_shape_radius);
                return m_position + vec3(
                    r * sin(phi) * cos(theta),
                    r * sin(phi) * sin(theta),
                    r * cos(phi)
                );
            }

            case Shape::Box:
                return m_position + vec3(
                    randomRange(-m_shape_extents.x, m_shape_extents.x),
                    randomRange(-m_shape_extents.y, m_shape_extents.y),
                    randomRange(-m_shape_extents.z, m_shape_extents.z)
                );

            default:
                return m_position;
        }
    }

    vec3 getEmissionDirection() const {
        if (m_shape == Shape::Cone) {
            // 圆锥发射
            vec3 base_dir = vec3(0, 1, 0);  // 向上
            float angle = randomRange(0, m_cone_angle);
            float rotation = randomRange(0, PI * 2);

            // 计算偏离方向
            vec3 offset = vec3(
                sin(angle) * cos(rotation),
                cos(angle),
                sin(angle) * sin(rotation)
            );

            return normalize(base_dir + offset * m_cone_angle);
        }

        return randomInSphere();  // 球面随机
    }

    void updateParticleProperties(Particle& particle, float t) {
        // 颜色渐变
        if (m_color_gradient.size() > 1) {
            int index = static_cast<int>(t * (m_color_gradient.size() - 1));
            float local_t = (t * (m_color_gradient.size() - 1)) - index;
            int next_index = std::min(index + 1, (int)m_color_gradient.size() - 1);
            particle.color = mix(m_color_gradient[index], m_color_gradient[next_index], local_t);
        }

        // 大小渐变
        if (m_size_gradient.size() > 1) {
            int index = static_cast<int>(t * (m_size_gradient.size() - 1));
            float local_t = (t * (m_size_gradient.size() - 1)) - index;
            int next_index = std::min(index + 1, (int)m_size_gradient.size() - 1);
            particle.size = mix(m_size_gradient[index], m_size_gradient[next_index], local_t);
        }
    }

    float randomRange(float min, float max) const {
        return min + (max - min) * (rand() / (float)RAND_MAX);
    }

    vec3 randomInSphere() const {
        float theta = randomRange(0, PI * 2);
        float phi = randomRange(0, PI);
        return vec3(
            sin(phi) * cos(theta),
            sin(phi) * sin(theta),
            cos(phi)
        );
    }

    // 粒子数据
    std::vector<Particle> m_particles;

    // 发射参数
    vec3 m_position{0};
    Shape m_shape = Shape::Point;
    float m_shape_radius = 1.0f;
    vec3 m_shape_extents{1, 1, 1};
    float m_cone_angle = 45.0f;

    float m_rate = 10.0f;         // 每秒发射粒子数
    int m_max_particles = 1000;
    bool m_looping = true;
    bool m_is_emitting = true;
    float m_accumulated_time = 0;

    // 生命周期
    float m_min_lifetime = 1.0f;
    float m_max_lifetime = 3.0f;

    // 速度
    float m_min_speed = 1.0f;
    float m_max_speed = 3.0f;

    // 加速度（如重力）
    vec3 m_acceleration{0, -9.8f, 0};

    // 旋转
    float m_min_rotation_speed = -180.0f;
    float m_max_rotation_speed = 180.0f;

    // 颜色和大小渐变
    std::vector<vec4> m_color_gradient;
    std::vector<vec2> m_size_gradient;
};
```

### 粒子系统

```cpp
// 粒子系统（ECS组件）
class ParticleSystemComponent {
public:
    ParticleSystemComponent() {
        m_emitter = std::make_unique<ParticleEmitter>();
    }

    ParticleEmitter* getEmitter() {
        return m_emitter.get();
    }

    void setMaterial(std::shared_ptr<Material> material) {
        m_material = material;
    }

    std::shared_ptr<Material> getMaterial() const {
        return m_material;
    }

private:
    std::unique_ptr<ParticleEmitter> m_emitter;
    std::shared_ptr<Material> m_material;
};

// 粒子系统（System）
class ParticleSystem {
public:
    void update(float delta_time) {
        auto view = m_world->view<ParticleSystemComponent>();

        for (auto entity : view) {
            auto* particle_system = m_world->getComponent<ParticleSystemComponent>(entity);

            // 发射粒子
            particle_system->getEmitter()->emit(delta_time);

            // 更新粒子
            particle_system->getEmitter()->update(delta_time);
        }
    }

    void render(RenderContext* context) {
        auto view = m_world->view<ParticleSystemComponent, TransformComponent>();

        for (auto entity : view) {
            auto* particle_system = m_world->getComponent<ParticleSystemComponent>(entity);
            auto* transform = m_world->getComponent<TransformComponent>(entity);

            renderParticleSystem(particle_system, transform, context);
        }
    }

private:
    void renderParticleSystem(ParticleSystemComponent* system,
                              TransformComponent* transform,
                              RenderContext* context) {
        const auto& particles = system->getEmitter()->getParticles();

        if (particles.empty()) return;

        // 准备渲染
        system->getMaterial()->bind();

        // 创建粒子顶点数据
        std::vector<ParticleVertex> vertices;
        vertices.reserve(particles.size() * 4);

        mat4 world_transform = transform->getMatrix();
        vec3 camera_pos = context->getCameraPosition();
        vec3 camera_forward = context->getCameraForward();

        for (const auto& particle : particles) {
            // Billboard计算
            vec3 particle_pos = (world_transform * vec4(particle.position, 1)).xyz;
            vec3 to_camera = normalize(camera_pos - particle_pos);

            vec3 right = normalize(cross(camera_forward, vec3(0, 1, 0)));
            vec3 up = cross(right, camera_forward);

            mat3 billboard_mat;
            billboard_mat[0] = right * particle.size.x;
            billboard_mat[1] = up * particle.size.y;
            billboard_mat[2] = vec3(0);

            // 四个顶点
            vec3 corners[4] = {
                particle_pos + billboard_mat * vec3(-0.5f, -0.5f, 0),
                particle_pos + billboard_mat * vec3(0.5f, -0.5f, 0),
                particle_pos + billboard_mat * vec3(0.5f, 0.5f, 0),
                particle_pos + billboard_mat * vec3(-0.5f, 0.5f, 0)
            };

            // 添加顶点
            for (int i = 0; i < 4; i++) {
                ParticleVertex v;
                v.position = corners[i];
                v.color = particle.color;
                v.texcoord = vec2(
                    (i == 1 || i == 2) ? 1.0f : 0.0f,
                    (i == 2 || i == 3) ? 1.0f : 0.0f
                );
                vertices.push_back(v);
            }
        }

        // 上传并绘制
        m_particle_buffer->setData(vertices.data(), vertices.size() * sizeof(ParticleVertex));
        m_particle_buffer->bind();

        vkCmdDrawIndexed(cmd, particles.size() * 6, 1, 0, 0, 0);
    }

    struct ParticleVertex {
        vec3 position;
        vec4 color;
        vec2 texcoord;
    };

    std::shared_ptr<Buffer> m_particle_buffer;
};
```

### GPU粒子

```glsl
// GPU粒子计算着色器
#version 450

layout(local_size_x = 128) in;

struct Particle {
    vec3 position;
    float life;
    vec3 velocity;
    float max_life;
    vec4 color;
    float size;
    int _pad[3];
};

layout(std430, binding = 0) buffer ParticleBuffer {
    Particle particles[];
};

layout(std430, binding = 1) buffer CountBuffer {
    uint alive_count;
    uint dead_count;
};

uniform float delta_time;
uniform vec3 gravity;

void main() {
    uint index = gl_GlobalInvocationID.x;

    if (index >= alive_count) return;

    Particle p = particles[index];

    // 更新速度
    p.velocity += gravity * delta_time;

    // 更新位置
    p.position += p.velocity * delta_time;

    // 更新生命周期
    p.life -= delta_time;

    // 写回
    particles[index] = p;
}
```

---

## 常用特效配置

### 火焰特效

```cpp
auto emitter = std::make_unique<ParticleEmitter>();

// 发射参数
emitter->setEmissionRate(50.0f);
emitter->setMaxParticles(500);
emitter->setLifetime(0.5f, 1.5f);

// 速度 - 向上
emitter->setSpeed(2.0f, 4.0f);
emitter->setShape(ParticleEmitter::Shape::Cone);
emitter->setConeAngle(30.0f);

// 颜色渐变: 黄 -> 橙 -> 红 -> 烟雾灰
emitter->setColorGradient({
    vec4(1, 1, 0.2f, 1),    // 黄
    vec4(1, 0.5f, 0, 1),    // 橙
    vec4(1, 0.1f, 0, 0.8f), // 红
    vec4(0.3f, 0.3f, 0.3f, 0) // 烟雾
});

// 大小渐变
emitter->setSizeGradient({
    vec2(0.3f, 0.3f),
    vec2(0.6f, 0.6f),
    vec2(0.1f, 0.1f)
});

// 重力影响
emitter->setAcceleration(vec3(0, -0.5f, 0)); // 较弱的重力
```

### 爆炸特效

```cpp
auto emitter = std::make_unique<ParticleEmitter>();

// 瞬时爆发
emitter->setEmissionRate(1000.0f);
emitter->setMaxParticles(1000);

// 寿命短
emitter->setLifetime(0.3f, 0.8f);

// 高速扩散
emitter->setSpeed(10.0f, 20.0f);
emitter->setShape(ParticleEmitter::Shape::Sphere);

// 闪光效果
emitter->setColorGradient({
    vec4(1, 1, 1, 1),       // 白
    vec4(1, 0.8f, 0.2f, 1), // 黄
    vec4(1, 0.2f, 0, 0.5f), // 橙红
    vec4(0.2f, 0.2f, 0.2f, 0) // 灰
});

// 向外扩散
emitter->setSizeGradient({
    vec2(0.1f, 0.1f),
    vec2(0.5f, 0.5f),
    vec2(0.2f, 0.2f)
});
```

---

## 关键目录

```
runtime/function/particle/
├── particle_system.h
├── particle_emitter.h
├── particle_renderer.h
└── gpu_particle.h
```

---

## 下周预告

第14周: 光照与阴影 - PBR光照与阴影技术
