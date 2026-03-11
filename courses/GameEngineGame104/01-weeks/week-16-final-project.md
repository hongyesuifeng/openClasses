# 第16周: 综合项目实践

> **学习目标**: 整合所学知识，完成综合项目
>
> **时间安排**: 2026-06-17 ~ 2026-06-30
> **学习时长**: 全天投入

---

## 本周学习重点

### 1. 项目选择
- [ ] 选择项目方向
- [ ] 确定项目范围
- [ ] 制定开发计划

### 2. 项目实现
- [ ] 核心功能开发
- [ ] 功能测试
- [ ] 性能优化

### 3. 项目文档
- [ ] 设计文档
- [ ] 实现文档
- [ ] 用户手册

### 4. 项目展示
- [ ] 演示视频
- [ ] 答辩准备
- [ ] 代码整理

---

## 项目选题

### 选项1: 实现渲染特性

#### 1.1 SSAO (屏幕空间环境光遮蔽)

**难度**: ⭐⭐⭐

**功能要求**:
- [ ] 实现基础SSAO算法
- [ ] 支持参数调整（采样半径、采样数量）
- [ ] 可模糊优化
- [ ] 集成到渲染管线

**核心实现**:
```cpp
class SSAOPass {
public:
    SSAOPass(int width, int height) {
        // 生成采样核
        generateSampleKernel();

        // 生成噪声纹理
        generateNoiseTexture();
    }

    void render(VkCommandBuffer cmd,
                VkImageView position_buffer,
                VkImageView normal_buffer,
                VkImageView output) {
        // SSAO着色器
        // ...
    }

private:
    void generateSampleKernel() {
        std::uniform_real_distribution<float> random_floats(0.0, 1.0);
        std::default_random_engine generator;

        for (unsigned int i = 0; i < 64; ++i) {
            vec3 sample(
                random_floats(generator) * 2.0 - 1.0,
                random_floats(generator) * 2.0 - 1.0,
                random_floats(generator)
            );
            sample = normalize(sample);
            sample *= random_floats(generator);

            // 更多采样靠近中心
            float scale = (float)i / 64.0;
            scale = lerp(0.1f, 1.0f, scale * scale);
            sample *= scale;

            m_ssao_kernel.push_back(sample);
        }
    }

    std::vector<vec3> m_ssao_kernel;
    std::shared_ptr<Texture> m_noise_texture;
};
```

**验证标准**:
- [ ] 能正确显示环境光遮蔽
- [ ] 参数可实时调整
- [ ] 性能可接受（<5ms）

---

#### 1.2 SSR (屏幕空间反射)

**难度**: ⭐⭐⭐⭐

**功能要求**:
- [ ] 实现屏幕空间反射
- [ ] 支持粗糙度材质
- [ ] 渐进式反射（可选）
- [ ] 与现有PBR系统集成

**验证标准**:
- [ ] 反射效果正确
- [ ] 粗糙表面反射模糊
- [ ] 性能优化良好

---

#### 1.3 体积光/体积雾

**难度**: ⭐⭐⭐⭐

**功能要求**:
- [ ] 实现体积光效果
- [ ] 支持点光源和方向光
- [ ] 体积雾散射
- [ ] 可调密度和颜色

---

### 选项2: 物理系统扩展

#### 2.1 软体物理

**难度**: ⭐⭐⭐⭐

**功能要求**:
- [ ] 实现质点-弹簧系统
- [ ] 支持布料模拟
- [ ] 与Jolt集成
- [ ] 自碰撞检测

**核心实现**:
```cpp
class SoftBody {
public:
    struct Particle {
        vec3 position{0};
        vec3 velocity{0};
        vec3 force{0};
        float mass = 1.0f;
        bool pinned = false;
    };

    struct Spring {
        int particle_a;
        int particle_b;
        float rest_length;
        float stiffness;
    };

    void simulate(float delta_time) {
        // 清除力
        for (auto& p : m_particles) {
            p.force = vec3(0, -9.8f * p.mass, 0);  // 重力
        }

        // 计算弹簧力
        for (auto& spring : m_springs) {
            Particle& a = m_particles[spring.particle_a];
            Particle& b = m_particles[spring.particle_b];

            vec3 delta = b.position - a.position;
            float distance = length(delta);
            vec3 direction = normalize(delta);

            float displacement = distance - spring.rest_length;
            float spring_force = spring.stiffness * displacement;

            vec3 force = direction * spring_force;

            a.force += force;
            b.force -= force;
        }

        // 积分
        for (auto& p : m_particles) {
            if (p.pinned) continue;

            vec3 acceleration = p.force / p.mass;
            p.velocity += acceleration * delta_time;
            p.position += p.velocity * delta_time;
        }
    }

private:
    std::vector<Particle> m_particles;
    std::vector<Spring> m_springs;
};
```

---

#### 2.2 GPU粒子流体

**难度**: ⭐⭐⭐⭐⭐

**功能要求**:
- [ ] SPH (Smoothed Particle Hydrodynamics)
- [ ] GPU计算着色器实现
- [ ] 渲染流体表面
- [ ] 交互式模拟

---

### 选项3: 性能优化项目

#### 3.1 多线程渲染

**难度**: ⭐⭐⭐⭐

**功能要求**:
- [ ] 并行命令缓冲录制
- [ ] 多线程资源创建
- [ ] 任务图依赖
- [ ] 性能提升>30%

**实现要点**:
```cpp
class MultiThreadRenderSystem {
public:
    void render(const std::vector<RenderObject>& objects) {
        // 分组任务
        size_t num_threads = std::thread::hardware_concurrency();
        size_t objects_per_thread = objects.size() / num_threads;

        std::vector<std::future<void>> futures;

        for (size_t i = 0; i < num_threads; i++) {
            size_t start = i * objects_per_thread;
            size_t end = (i == num_threads - 1) ? objects.size() : (i + 1) * objects_per_thread;

            futures.push_back(m_thread_pool.submit([this, &objects, start, end]() {
                renderRange(objects, start, end);
            }));
        }

        // 等待完成
        for (auto& f : futures) {
            f.wait();
        }

        // 提交所有命令缓冲
        submitCommandBuffers();
    }

private:
    void renderRange(const std::vector<RenderObject>& objects, size_t start, size_t end) {
        // 在单独线程录制命令缓冲
        // ...
    }

    ThreadPool m_thread_pool;
};
```

---

### 选项4: Demo场景

**难度**: ⭐⭐⭐

**功能要求**:
- [ ] 完整游戏场景
- [ ] 至少3种交互
- [ ] PBR材质展示
- [ ] 粒子特效
- [ ] 性能流畅（60FPS）

**场景示例**:
- 第三人称漫游
- 物理交互（推箱子）
- 光照切换（白天/夜晚）
- 粒子效果（瀑布、火焰）

---

## 项目时间规划

### 第1-2天: 规划和设计

```
□ 确定项目方向
□ 编写设计文档
□ 搭建开发环境
□ 创建Git分支
```

### 第3-7天: 核心开发

```
□ 实现主要功能
□ 单元测试
□ 集成到引擎
□ 初步调试
```

### 第8-10天: 完善和优化

```
□ 功能完善
□ Bug修复
□ 性能优化
□ 用户体验优化
```

### 第11-12天: 文档和演示

```
□ 编写文档
□ 录制演示视频
□ 准备答辩材料
□ 代码整理和注释
```

---

## 文档模板

### design.md 结构

```markdown
# 项目名称设计文档

## 1. 项目概述
### 1.1 项目目标
### 1.2 技术栈
### 1.3 预期成果

## 2. 需求分析
### 2.1 功能需求
### 2.2 性能需求
### 2.3 用户界面需求

## 3. 系统设计
### 3.1 整体架构
### 3.2 模块划分
### 3.3 数据结构设计
### 3.4 接口设计

## 4. 详细设计
### 4.1 核心算法
### 4.2 关键数据结构
### 4.3 类图
### 4.4 时序图

## 5. 技术难点
### 5.1 难点分析
### 5.2 解决方案

## 6. 测试计划
### 6.1 单元测试
### 6.2 集成测试
### 6.3 性能测试

## 7. 风险管理
### 7.1 潜在风险
### 7.2 应对措施
```

---

## 答辩准备

### PPT结构（15分钟）

1. **标题页** (1分钟)
   - 项目名称
   - 团队成员

2. **项目概述** (2分钟)
   - 项目目标
   - 选择原因
   - 主要成果

3. **技术背景** (2分钟)
   - 相关技术原理
   - 参考资料

4. **系统设计** (3分钟)
   - 整体架构
   - 核心模块
   - 关键算法

5. **实现细节** (4分钟)
   - 代码展示
   - 技术难点
   - 解决方案

6. **结果展示** (2分钟)
   - 效果演示
   - 性能数据
   - 对比分析

7. **总结与展望** (1分钟)
   - 完成情况
   - 不足之处
   - 未来改进

---

## 评分标准

| 项目 | 分数 | 标准 |
|------|------|------|
| **功能完整性** | 30分 | 实现主要功能，无明显bug |
| **技术难度** | 25分 | 技术深度，创新性 |
| **代码质量** | 20分 | 规范性，可读性，注释 |
| **文档质量** | 15分 | 完整性，清晰度 |
| **演示效果** | 10分 | 功能展示，视觉呈现 |

---

## 最终检查清单

```
代码
□ 功能完整可用
□ 代码符合规范
□ 有适当注释
□ 无明显bug

文档
□ 设计文档完整
□ 实现文档清晰
□ 有使用说明

演示
□ 视频清晰
□ 功能展示完整
□ 有性能数据

答辩
□ PPT准备完成
□ 预演流畅
□ 时间控制合理
```

---

## 恭喜完成！

当你完成这16周的学习后，你将：

- ✅ 理解现代游戏引擎的整体架构
- ✅ 掌握各核心模块的设计原理
- ✅ 能够阅读和修改引擎源码
- ✅ 具备开发引擎扩展的能力
- ✅ 拥有完整的个人项目作品

**这是你游戏引擎开发之路的起点，继续前进！**

---

## 课程回顾

16周的学习历程：

```
第1-3周:  基础准备 (C++, 环境搭建, 引擎编译)
第4-5周:  渲染系统 (管线, 资源管理)
第6周:    场景管理 (ECS, 空间划分)
第7周:    物理系统 (Jolt, 碰撞检测)
第8周:    动画系统 (骨骼动画, 混合)
第9周:    资源管理 (加载, 缓存, 热更新)
第10周:   输入与UI (事件系统, UI渲染)
第11周:   性能优化 (多线程, 批处理)
第12周:   编辑器架构 (工具链开发)
第13周:   粒子系统 (特效制作)
第14周:   光照与阴影 (PBR, CSM)
第15周:   后期处理 (Bloom, DoF, 光线追踪)
第16周:   综合项目 (实战应用)
```

**感谢你的坚持！祝你在游戏引擎开发的道路上越走越远！** 🎮✨
