# 第3周: 编译引擎与代码导读

> **学习目标**: 成功编译运行引擎，理解代码结构
>
> **时间安排**: 2026-03-06 ~ 2026-03-13
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 编译引擎
- [ ] 执行构建脚本
- [ ] 解决编译错误
- [ ] 理解CMake构建系统

### 2. 引擎代码导读
- [ ] 阅读 `engine.cpp` - 引擎入口点
- [ ] 理解 `runtime/` 目录结构
- [ ] 查看主循环实现
- [ ] 了解各模块初始化流程

### 3. CMake构建系统
- [ ] 理解CMakeLists.txt结构
- [ ] 学习CMake基本命令
- [ ] 了解构建配置

---

## 编译引擎

### Windows编译

```bash
# 进入项目目录
cd C:\dev\Piccolo

# 方法1: 使用批处理脚本
build_windows.bat

# 方法2: 手动编译
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022"
cmake --build . --config Release

# 方法3: 使用Visual Studio打开
cmake .. -G "Visual Studio 17 2022"
# 打开生成的 Piccolo.sln
```

### Linux编译

```bash
cd ~/dev/Piccolo

# 方法1: 使用脚本
chmod +x build_linux.sh
./build_linux.sh

# 方法2: 手动编译
mkdir build
cd build
cmake ..
make -j$(nproc)

# 方法3: 使用ccache加速
cmake -DCMAKE_C_COMPILER_LAUNCHER=ccache \
      -DCMAKE_CXX_COMPILER_LAUNCHER=ccache ..
make -j$(nproc)
```

---

## CMake基础

### CMakeLists.txt结构解析

```cmake
# Piccolo主CMakeLists.txt结构

cmake_minimum_required(VERSION 3.19)  # 最低版本要求
project(Piccolo)                      # 项目名称

# C++标准设置
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找依赖包
find_package(Vulkan REQUIRED)

# 包含子目录
add_subdirectory(engine/source)

# 可执行文件
add_executable(PiccoloEditor
    editor/main.cpp
    # ... 其他源文件
)

# 链接库
target_link_libraries(PiccoloEditor
    PRIVATE
        Vulkan::Vulkan
        # ... 其他库
)
```

### 常用CMake命令

```cmake
# 设置变量
set(MY_VAR "value")

# 添加可执行文件
add_executable(target_name source1.cpp source2.cpp)

# 添加库
add_library(lib_name STATIC source.cpp)  # 静态库
add_library(lib_name SHARED source.cpp)  # 动态库

# 链接库
target_link_libraries(target_name PRIVATE lib_name)

# 包含目录
target_include_directories(target_name PRIVATE include_dir)

# 编译定义
target_compile_definitions(target_name PRIVATE MY_DEFINE=1)

# 查找包
find_package(PackageName REQUIRED)

# 选项
option(ENABLE_FEATURE "Enable feature" ON)
```

---

## 引擎目录结构详解

### runtime/core/ - 基础设施

```
runtime/core/
├── base/                    # 基础定义
│   ├── macro.h             # 宏定义
│   └── typedef.h           # 类型定义
├── math/                    # 数学库 ★
│   ├── vector2.h
│   ├── vector3.h
│   ├── vector4.h
│   ├── matrix3.h
│   ├── matrix4.h
│   └── quaternion.h
├── log/                     # 日志系统
│   └── logger.h
└── meta/                    # 反射系统
    └── meta.h
```

### runtime/function/ - 功能系统

```
runtime/function/
├── render/                  # 渲染系统 ★
│   ├── render_context.h    # 渲染上下文
│   ├── render_pipeline.h   # 渲染管线
│   └── ...
├── physics/                 # 物理系统 ★
│   ├── physics_system.h
│   └── physics_actor.h
├── animation/               # 动画系统 ★
│   ├── animation_system.h
│   └── skeleton.h
├── particle/                # 粒子系统
│   └── particle_system.h
├── input/                   # 输入系统
│   └── input_system.h
├── ui/                      # UI系统
│   └── ui_system.h
├── framework/               # ECS框架 ★
│   ├── entity.h
│   ├── component.h
│   └── world.h
└── controller/              # 控制器
    └── camera_controller.h
```

### runtime/resource/ - 资源管理

```
runtime/resource/
├── resource_manager.h      # 资源管理器
├── asset_loader.h          # 资源加载器
└── resource_type.h         # 资源类型定义
```

---

## 引擎入口点分析

### engine.cpp 源码结构

```cpp
// engine/source/runtime/engine.cpp

#include "engine.h"

namespace Piccolo {

// 引擎类
class Engine {
private:
    bool m_is_running;           // 运行状态
    std::unique_ptr<World> m_world;  // 游戏世界

public:
    // 初始化引擎
    void initialize()
    {
        // 1. 初始化日志系统
        LogSystem::init();

        // 2. 初始化物理系统
        PhysicsSystem::init();

        // 3. 初始化渲染系统
        RenderSystem::init();

        // 4. 初始化输入系统
        InputSystem::init();

        // 5. 创建游戏世界
        m_world = std::make_unique<World>();
        m_world->initialize();

        LogInfo("Engine initialized successfully");
    }

    // 主循环
    void run()
    {
        m_is_running = true;

        while (m_is_running) {
            // 1. 处理输入
            InputSystem::update();

            // 2. 更新逻辑
            float delta_time = calculateDeltaTime();
            m_world->update(delta_time);

            // 3. 渲染
            RenderSystem::render(m_world.get());

            // 4. 交换缓冲区
            RenderSystem::present();
        }
    }

    // 清理引擎
    void clear()
    {
        m_world->clear();
        RenderSystem::clear();
        PhysicsSystem::clear();
        InputSystem::clear();
    }
};

} // namespace Piccolo
```

### 主函数 main()

```cpp
// editor/main.cpp

#include "engine.h"

int main(int argc, char* argv[])
{
    // 创建引擎实例
    Piccolo::Engine engine;

    // 初始化
    engine.initialize();

    // 运行主循环
    engine.run();

    // 清理
    engine.clear();

    return 0;
}
```

---

## 主循环详解

### 游戏循环模式

```cpp
// 基础游戏循环
while (running) {
    processInput();    // 处理输入
    updateGame();      // 更新游戏逻辑
    render();          // 渲染
}

// 带固定时间步长的循环
const float target_fps = 60.0f;
const float target_frame_time = 1.0f / target_fps;

float accumulated_time = 0.0f;
float current_time = getTime();

while (running) {
    float new_time = getTime();
    float frame_time = new_time - current_time;
    current_time = new_time;
    accumulated_time += frame_time;

    // 固定时间步长更新物理
    while (accumulated_time >= target_frame_time) {
        updatePhysics(target_frame_time);
        accumulated_time -= target_frame_time;
    }

    // 渲染（可变帧率）
    render();
}
```

### Piccolo主循环实现

```cpp
void Engine::tick(float delta_time)
{
    // 1. 更新各个系统
    m_input_system->update();
    m_physics_system->update(delta_time);  // 固定时间步
    m_animation_system->update(delta_time);
    m_script_system->update(delta_time);

    // 2. 场景更新
    m_world->update(delta_time);

    // 3. 渲染准备
    m_render_system->beginFrame();

    // 4. 收集可见对象
    auto visible_objects = m_world->getVisibleObjects(m_camera);

    // 5. 提交绘制命令
    for (auto& obj : visible_objects) {
        m_render_system->drawObject(obj);
    }

    // 6. 渲染帧
    m_render_system->endFrame();
    m_render_system->present();
}
```

---

## 模块初始化顺序

```
1. 基础系统 (Core Systems)
   ├── 日志系统 (Log)
   ├── 内存管理 (Memory)
   └── 线程系统 (Threading)

2. 平台抽象层 (Platform)
   ├── 窗口创建 (Window)
   └── 文件系统 (FileSystem)

3. 资源管理 (Resource)
   ├── 资源加载器
   └── 资源缓存

4. 渲染系统 (Render)
   ├── Vulkan初始化
   ├── 设备选择
   ├── 交换链创建
   └── 渲染通道设置

5. 功能系统 (Function Systems)
   ├── 输入系统 (Input)
   ├── 物理系统 (Physics)
   ├── 动画系统 (Animation)
   ├── 粒子系统 (Particle)
   └── UI系统 (UI)

6. 框架层 (Framework)
   ├── ECS世界
   ├── 场景加载
   └── 游戏对象

7. 编辑器 (Editor)
   ├── 编辑器UI
   ├── 资源浏览器
   └── 属性编辑器
```

---

## 代码阅读顺序

### 第一阶段：理解基础设施（第1-2天）

```cpp
// 1. 基础类型定义
runtime/core/base/typedef.h
runtime/core/base/macro.h

// 2. 数学库
runtime/core/math/vector3.h
runtime/core/math/matrix4.h
runtime/core/math/quaternion.h

// 3. 日志系统
runtime/core/log/logger.h
```

**验证标准**：
- [ ] 理解引擎使用的类型别名
- [ ] 能使用数学库进行计算
- [ ] 知道如何输出日志

### 第二阶段：理解框架层（第3-4天）

```cpp
// 1. Entity-Component-System
runtime/function/framework/entity.h
runtime/function/framework/component.h
runtime/function/framework/world.h

// 2. 对象管理
runtime/function/framework/object.h

// 3. 场景管理
runtime/function/framework/scene.h
runtime/function/framework/level.h
```

**验证标准**：
- [ ] 理解ECS架构设计
- [ ] 知道如何创建实体和组件
- [ ] 理解场景加载流程

### 第三阶段：理解核心系统（第5-7天）

```cpp
// 1. 渲染系统
runtime/function/render/render_context.h
runtime/function/render/render_pipeline.h
runtime/function/render/render_camera.h

// 2. 输入系统
runtime/function/input/input_system.h

// 3. 资源管理
runtime/resource/resource_manager.h
```

**验证标准**：
- [ ] 理解Vulkan渲染流程
- [ ] 知道输入如何处理
- [ ] 理解资源加载机制

---

## 调试技巧

### 设置断点位置

```cpp
// 关键断点位置
int main() {
    // 断点1: 引擎初始化完成
    engine.initialize();

    // 断点2: 每帧开始
    while (running) {

        // 断点3: 渲染前
        render();

        // 断点4: 渲染后
    }
}
```

### Visual Studio调试配置

```json
{
    "name": "Launch PiccoloEditor",
    "type": "cppvsdbg",
    "request": "launch",
    "program": "${workspaceFolder}/build/bin/Release/PiccoloEditor.exe",
    "args": [],
    "stopAtEntry": false,
    "cwd": "${workspaceFolder}",
    "environment": [],
    "console": "externalTerminal"
}
```

### 日志输出

```cpp
// 使用引擎日志系统
LogInfo("This is an info message");
LogWarning("This is a warning");
LogError("This is an error: {}", error_code);

// 带上下文的日志
LogInfo("Loading asset: {}", asset_path);
LogInfo("Asset loaded successfully, size: {} bytes", size);
```

---

## 实践任务

### 任务1: 成功编译引擎

- [ ] Windows: 运行 `build_windows.bat`
- [ ] Linux: 运行 `build_linux.sh`
- [ ] 解决所有编译错误和警告
- [ ] 运行生成的 PiccoloEditor

### 任务2: 理解引擎启动流程

在调试器中单步执行，记录：
1. 初始化顺序
2. 各系统初始化时做了什么
3. 主循环如何执行
4. 退出时如何清理

### 任务3: 修改代码并重新编译

```cpp
// 尝试修改引擎行为
// 例如：修改日志输出格式
// 或：添加自定义命令行参数
```

### 任务4: 分析CMake构建

- [ ] 阅读主 CMakeLists.txt
- [ ] 理解各个子目录的CMake配置
- [ ] 尝试添加新的源文件并重新构建

---

## 常见编译问题

### 问题1: Vulkan SDK未找到

```cmake
# 解决方案：手动指定Vulkan路径
set(VULKAN_SDK "C:/VulkanSDK/1.3.250.0")
find_package(Vulkan REQUIRED)
```

### 问题2: CMake版本不符

```bash
# 升级CMake
sudo apt install cmake  # Linux
# 或下载最新版本：https://cmake.org/download/
```

### 问题3: 编译器不支持C++17

```bash
# 检查GCC版本
g++ --version  # 需要 >= 7.0

# 检查MSVC版本
# Visual Studio 2017+ 支持C++17
```

### 问题4: 链接错误

```bash
# Windows: 确保链接了正确的库文件
# Linux: 检查 pkg-config 配置
pkg-config --libs vulkan
```

---

## 验证标准

- [ ] 成功编译PiccoloEditor
  - [ ] 无编译错误
  - [ ] 无严重警告
  - [ ] 能正常启动

- [ ] 能运行编辑器并查看场景
  - [ ] 窗口正常显示
  - [ ] 能看到渲染内容
  - [ ] 控制台有日志输出

- [ ] 理解引擎目录结构
  - [ ] 知道各模块职责
  - [ ] 能快速定位代码位置
  - [ ] 理解模块依赖关系

- [ ] 理解引擎初始化流程
  - [ ] 知道各系统初始化顺序
  - [ ] 理解主循环结构
  - [ ] 知道资源如何加载

---

## 学习笔记

### 编译问题记录
<!-- 在此记录编译过程中遇到的问题和解决方案 -->

### 代码结构理解
<!-- 在此记录对引擎代码结构的理解 -->

### 关键发现
<!-- 在此记录代码阅读中的关键发现 -->

---

## 下周预告

第4周将开始学习渲染系统（一）：
- 渲染管线概述
- Vulkan API基础
- RenderDevice抽象
- 交换链和帧缓冲

**准备工作**:
- [ ] 复习Vulkan基础
- [ ] 安装RenderDoc
- [ ] 预习渲染管线知识
