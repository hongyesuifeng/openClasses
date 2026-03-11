# Piccolo引擎架构快速参考

> **用途**: 快速查找引擎各模块的位置和职责

---

## 目录速查表

```
Piccolo/
├── engine/source/
│   ├── runtime/                    # 运行时核心
│   │   ├── core/                  # ★ 基础设施
│   │   │   ├── base/             # 基础定义
│   │   │   │   └── macro.h       # 宏定义
│   │   │   │   └── typedef.h     # 类型定义
│   │   │   ├── math/             # ★ 数学库
│   │   │   │   ├── vector2/3/4.h
│   │   │   │   ├── matrix3/4.h
│   │   │   │   └── quaternion.h
│   │   │   ├── log/              # 日志系统
│   │   │   │   └── logger.h
│   │   │   └── meta/             # 反射系统
│   │   │       └── meta.h
│   │   ├── function/             # ★ 功能系统
│   │   │   ├── render/           # ★ 渲染系统
│   │   │   │   ├── render_context.h
│   │   │   │   ├── render_device.h
│   │   │   │   ├── render_pipeline.h
│   │   │   │   ├── swapchain.h
│   │   │   │   ├── frame_buffer.h
│   │   │   │   ├── command_buffer.h
│   │   │   │   ├── pipeline_state_object.h
│   │   │   │   ├── vertex_buffer.h
│   │   │   │   ├── index_buffer.h
│   │   │   │   ├── texture.h
│   │   │   │   ├── shader.h
│   │   │   │   ├── material.h
│   │   │   │   └── vulkan/
│   │   │   ├── physics/          # ★ 物理系统
│   │   │   │   ├── physics_system.h
│   │   │   │   ├── physics_actor.h
│   │   │   │   ├── physics_material.h
│   │   │   │   └── jolt/
│   │   │   ├── animation/        # ★ 动画系统
│   │   │   │   ├── animation_system.h
│   │   │   │   ├── skeleton.h
│   │   │   │   ├── animation_clip.h
│   │   │   │   └── animation_state_machine.h
│   │   │   ├── particle/         # 粒子系统
│   │   │   │   ├── particle_system.h
│   │   │   │   ├── particle_emitter.h
│   │   │   │   └── particle_renderer.h
│   │   │   ├── input/            # 输入系统
│   │   │   │   ├── input_system.h
│   │   │   │   └── input_mapping.h
│   │   │   ├── ui/               # UI系统
│   │   │   │   ├── ui_system.h
│   │   │   │   └── ui_element.h
│   │   │   ├── framework/        # ★ ECS框架
│   │   │   │   ├── entity.h
│   │   │   │   ├── component.h
│   │   │   │   ├── world.h
│   │   │   │   ├── level.h
│   │   │   │   └── scene_manager.h
│   │   │   └── controller/       # 控制器
│   │   │       └── camera_controller.h
│   │   ├── resource/             # ★ 资源管理
│   │   │   ├── resource_manager.h
│   │   │   ├── asset_loader.h
│   │   │   ├── resource_cache.h
│   │   │   └── asset_types.h
│   │   └── platform/             # 平台抽象层
│   │       ├── window.h
│   │       ├── filesystem.h
│   │       └── time.h
│   └── editor/                   # ★ 编辑器工具
│       ├── editor_core.h
│       ├── editor_ui.h
│       └── panels/
│           ├── asset_browser.h
│           ├── property_editor.h
│           └── scene_hierarchy.h
├── engine/shader/                 # 着色器文件
│   ├── vert/
│   ├── frag/
│   └── comp/
├── build_windows.bat             # Windows构建脚本
├── build_linux.sh                # Linux构建脚本
├── CMakeLists.txt                # CMake配置
└── README.md                     # 项目说明
```

---

## 模块职责表

| 模块 | 路径 | 主要职责 | 关键类 |
|------|------|----------|--------|
| **数学库** | `runtime/core/math/` | 向量、矩阵、四元数运算 | Vector3, Matrix4, Quaternion |
| **日志系统** | `runtime/core/log/` | 日志输出、分级管理 | Logger |
| **反射系统** | `runtime/core/meta/` | 类型信息、属性访问 | MetaType |
| **渲染系统** | `runtime/function/render/` | 图形渲染、Vulkan封装 | RenderDevice, RenderPipeline |
| **物理系统** | `runtime/function/physics/` | 物理模拟、碰撞检测 | PhysicsSystem, PhysicsActor |
| **动画系统** | `runtime/function/animation/` | 骨骼动画、混合 | AnimationSystem, Skeleton |
| **粒子系统** | `runtime/function/particle/` | 粒子特效 | ParticleSystem, ParticleEmitter |
| **输入系统** | `runtime/function/input/` | 输入设备处理 | InputSystem |
| **UI系统** | `runtime/function/ui/` | 用户界面 | UISystem |
| **ECS框架** | `runtime/function/framework/` | 实体组件系统 | Entity, Component, World |
| **资源管理** | `runtime/resource/` | 资源加载、缓存 | ResourceManager |
| **编辑器** | `editor/` | 编辑器工具 | EditorCore |

---

## 初始化顺序

```
1. 基础系统 (Core)
   └── runtime/core/
       ├── base::init()       # 基础类型
       ├── math::init()       # 数学库初始化
       ├── log::init()        # 日志系统
       └── meta::init()       # 反射系统

2. 平台层 (Platform)
   └── runtime/platform/
       ├── Window::create()   # 创建窗口
       ├── FileSystem::init() # 文件系统
       └── Time::init()       # 计时器

3. 资源层 (Resource)
   └── runtime/resource/
       └── ResourceManager::init()

4. 渲染层 (Render)
   └── runtime/function/render/
       ├── RenderDevice::init()      # Vulkan初始化
       ├── SwapChain::create()       # 交换链
       └── RenderPipeline::init()    # 渲染管线

5. 功能系统 (Function Systems)
   └── runtime/function/
       ├── input::InputSystem::init()
       ├── physics::PhysicsSystem::init()
       ├── animation::AnimationSystem::init()
       ├── particle::ParticleSystem::init()
       └── ui::UISystem::init()

6. 框架层 (Framework)
   └── runtime/function/framework/
       ├── World::create()
       ├── Level::load()
       └── Scene::init()

7. 编辑器 (Editor) - 仅编辑器模式
   └── editor/
       └── EditorCore::init()
```

---

## 主循环流程

```
Engine::run()
    │
    ├─> while (m_is_running)
    │   │
    │   ├─> InputSystem::update()
    │   │   └── 处理键盘/鼠标事件
    │   │
    │   ├─> calculateDeltaTime()
    │   │   └── 计算帧时间
    │   │
    │   ├─> PhysicsSystem::update(delta_time)
    │   │   └── 固定时间步更新
    │   │
    │   ├─> AnimationSystem::update(delta_time)
    │   │   └── 更新动画
    │   │
    │   ├─> ParticleSystem::update(delta_time)
    │   │   └─ 更新粒子
    │   │
    │   ├─> World::update(delta_time)
    │   │   └── 更新实体和组件
    │   │
    │   ├─> RenderSystem::beginFrame()
    │   │   └── 开始渲染
    │   │
    │   ├─> cullVisibleObjects(camera)
    │   │   └── 视锥体裁剪
    │   │
    │   ├─> renderScene(visible_objects)
    │   │   └── 提交绘制命令
    │   │
    │   ├─> RenderSystem::endFrame()
    │   │   └── 结束渲染
    │   │
    │   └─> RenderSystem::present()
    │       └── 交换缓冲区
    │
    └─> Engine::clear()
        └── 清理资源
```

---

## 数据流向图

### 场景渲染流程

```
Level (关卡)
    │
    ├─> 加载资源 (ResourceManager)
    │   ├─> 模型
    │   ├─> 纹理
    │   └─> 材质
    │
    ├─> 创建World (世界)
    │   │
    │   └─> 创建Entity (实体)
    │       │
    │       ├─> TransformComponent (变换)
    │       ├─> MeshComponent (网格)
    │       ├─> MaterialComponent (材质)
    │       ├─> AnimationComponent (动画)
    │       └─> PhysicsComponent (物理)
    │
    └─> 渲染循环
        │
        ├─> 收集可见对象 (Culling)
        │   └─> Frustum Cull / Occlusion Cull
        │
        ├─> 排序 (Sorting)
        │   └─> By Material / By Depth
        │
        ├─> 批处理 (Batching)
        │   └─> Merge Draw Calls
        │
        └─> 提交渲染 (Submit)
            │
            ├─> Set Pipeline State
            ├─> Set Descriptor Sets
            ├─> Set Vertex/Index Buffers
            └─> vkCmdDrawIndexed()
```

### 资源加载流程

```
请求资源 (AssetLoader)
    │
    ├─> 检查缓存 (ResourceCache)
    │   ├─> 命中 → 返回资源
    │   └─> 未命中 → 继续加载
    │
    ├─> 异步加载 (ThreadPool)
    │   │
    │   ├─> 解析文件
    │   │   ├─> 模型: .gltf, .obj
    │   │   ├─> 纹理: .png, .jpg
    │   │   └─> 材质: .mat
    │   │
    │   ├─> 上传GPU
    │   │   ├─> 创建Buffer
    │   │   ├─> 创建Texture
    │   │   └─> 创建Shader
    │   │
    │   └─> 加入缓存
    │
    └─> 返回资源 (Shared Resource)
        └── 引用计数管理
```

---

## 常用查找表

### 我想实现... → 该看哪？

| 需求 | 查看位置 | 相关文件 |
|------|----------|----------|
| 添加新的渲染特性 | 渲染系统 | `runtime/function/render/` |
| 创建新的游戏对象 | ECS框架 | `runtime/function/framework/` |
| 处理用户输入 | 输入系统 | `runtime/function/input/` |
| 添加物理效果 | 物理系统 | `runtime/function/physics/` |
| 播放动画 | 动画系统 | `runtime/function/animation/` |
| 加载新资源 | 资源管理 | `runtime/resource/` |
| 显示UI | UI系统 | `runtime/function/ui/` |
| 修改编辑器 | 编辑器代码 | `editor/` |
| 修改着色器 | Shader目录 | `engine/shader/` |
| 修改数学计算 | 数学库 | `runtime/core/math/` |

### 调试... → 在哪里打断点？

| 调试目标 | 断点位置 |
|----------|----------|
| 引擎启动 | `main()` |
| 渲染问题 | `RenderSystem::render()` |
| 物理问题 | `PhysicsSystem::update()` |
| 输入问题 | `InputSystem::handleEvent()` |
| 资源加载 | `AssetLoader::load()` |
| 场景更新 | `World::update()` |

---

## 关键配置文件

```
Piccolo/
├── config/
│   ├── engine.cfg          # 引擎配置
│   ├── render.cfg          # 渲染配置
│   └── physics.cfg         # 物理配置
├── assets/
│   ├── scenes/             # 场景文件
│   ├── models/             # 模型资源
│   ├── textures/           # 纹理资源
│   └── materials/          # 材质定义
└── engine/shader/          # 着色器
    ├── vert/               # 顶点着色器
    ├── frag/               # 片段着色器
    └── comp/               # 计算着色器
```

---

## 常用命令

### 构建命令

```bash
# Windows
build_windows.bat

# Linux
./build_linux.sh

# 手动CMake
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

### 运行

```bash
# Windows
.\build\bin\Release\PiccoloEditor.exe

# Linux
./build/bin/PiccoloEditor
```

### 调试

```bash
# RenderDoc捕获
renderdoccmd qbuild/bin/PiccoloEditor.exe

# 带参数运行
PiccoloEditor.exe --project path/to/project --log-level debug
```

---

**最后更新**: 2026-02-18
