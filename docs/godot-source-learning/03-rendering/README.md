# 渲染系统

渲染系统是 Godot 引擎最庞大、最复杂的子系统，负责将场景中的可视对象转化为屏幕上的像素。Godot 4.x 采用基于 RenderingDevice (RD) 的现代渲染架构，以 Vulkan 风格的 GPU 抽象为核心，实现了 Forward+（Clustered Forward）渲染管线。

## 目录

- **[00-技术原理](./00-technical-principles.md) - GPU 渲染管线、现代图形 API、Forward+/Clustered Shading、GDShader、纹理与采样（建议首先阅读）**
- [01-RenderingDevice GPU 抽象层](./01-rendering-device.md) - RenderingDevice 类，Vulkan 风格 GPU 抽象
- [02-渲染管线架构](./02-render-pipeline.md) - RenderingServer、RendererCompositorRD、Forward+ 管线流程
- [03-着色器与材质](./03-shader-material.md) - ShaderLanguage、ShaderCompilerRD、Material 系统
- [04-3D 渲染详解](./04-3d-rendering.md) - Mesh、光照、阴影、环境、GI
- [05-2D 渲染系统](./05-2d-rendering.md) - CanvasItem、2D 批处理、TileMap、2D 光照

---

## 核心概念

### 渲染架构

```
┌─────────────────────────────────────────────────────────┐
│                    渲染架构分层                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │        RenderingServer (API 层)                  │   │
│  │   canvas_item_* / camera_* / light_* / ...      │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │        RendererCompositorRD (管线调度)            │   │
│  │   Forward+ / Mobile / Compatibility              │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │        RenderingDevice (GPU 抽象层)               │   │
│  │   Buffer / Texture / Shader / PipelineState     │   │
│  │   CommandBuffer / Framebuffer / RenderPass      │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                              │
│         ┌───────────────┼───────────────┐              │
│         │               │               │              │
│         ▼               ▼               ▼              │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐        │
│  │  Vulkan   │   │  Metal    │   │  D3D12    │        │
│  └───────────┘   └───────────┘   └───────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 渲染流程

```
每帧渲染流程：

Main::iteration()
    │
    ▼
SceneTree::_process()
    │
    ├──► 更新场景节点变换
    │    - Node::_process()
    │    - 更新世界变换矩阵
    │
    ▼
RenderingServer::instance()
    │
    ├──► 3D 渲染
    │    ├── 场景剔除（视锥 + 遮挡）
    │    ├── Cluster 构建
    │    ├── 阴影贴图渲染
    │    ├── 深度预pass
    │    ├── 不透明物体渲染
    │    ├── 透明物体渲染
    │    └── 后处理
    │
    ├──► 2D 渲染
    │    ├── CanvasItem 收集与排序
    │    ├── 2D 批处理合并
    │    └── 2D 光照与阴影
    │
    ▼
RenderingDevice::submit() + present()
```

---

## 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| RenderingServer | `servers/rendering/rendering_server.h` | 渲染服务器 API |
| RenderingDevice | `servers/rendering/rendering_device.h` | GPU 抽象层 |
| RendererCompositorRD | `servers/rendering/renderer_rd/renderer_compositor_rd.h` | 渲染管线调度 |
| RendererSceneRD | `servers/rendering/renderer_rd/renderer_scene_rd.h` | 3D 场景渲染 |
| RendererCanvasCpu | `servers/rendering/renderer_canvas_cpu.h` | 2D 渲染 |
| ShaderLanguage | `servers/rendering/shader_language.h` | GDShader 解析器 |
| ShaderCompilerRD | `servers/rendering/shader_compiler_rd.h` | 着色器编译器 |
| Forward+ 着色器 | `servers/rendering/renderer_rd/shaders/` | GLSL 着色器集 |

---

## 学习目标

完成本章节后，你将能够：

1. 理解 RenderingDevice 的 Vulkan 风格 GPU 抽象设计
2. 掌握 Forward+（Clustered Forward）渲染管线的完整流程
3. 理解 GDShader 的解析、编译和运行时管理
4. 掌握材质系统从 Material 到 GPU PipelineState 的完整链路
5. 理解 3D 渲染中的光照、阴影、GI 等核心特性
6. 理解 2D 渲染的批处理优化策略
7. 能够阅读和修改 Godot 渲染相关的 C++ 源码

---

## 预计时间

- 技术原理：2-3 天
- RenderingDevice：3-4 天
- 渲染管线架构：3-4 天
- 着色器与材质：3-4 天
- 3D 渲染详解：3-4 天
- 2D 渲染系统：2-3 天

**总计：16-22 天**

---

## 下一步

准备好后，从 [00-技术原理](./00-technical-principles.md) 开始学习。
