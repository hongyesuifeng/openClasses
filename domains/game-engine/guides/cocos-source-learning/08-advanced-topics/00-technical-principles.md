# 技术原理：高级渲染技术

> 高级主题涉及后处理效果、自定义渲染管线、地形系统和阴影系统。在阅读源码之前，先理解这些高级渲染技术背后的图形学原理。

---

## 目录

- [1. 后处理管线原理](#1-后处理管线原理)
- [2. 常见后处理效果算法](#2-常见后处理效果算法)
- [3. Render Graph 理论](#3-render-graph-理论)
- [4. 阴影渲染原理](#4-阴影渲染原理)
- [5. 地形渲染原理](#5-地形渲染原理)

---

## 1. 后处理管线原理

### 什么是后处理

后处理（Post-Processing）是在场景渲染完成后，对最终画面进行的**全屏图像处理**：

```
正常渲染流程：
  3D 场景 → 直接输出到屏幕

带后处理的渲染流程：
  3D 场景 → 渲染到纹理 (RenderTexture)
                │
                ▼
         ┌──────────────┐
         │  后处理管线    │
         │              │
         │  输入：纹理   │
         │  输出：纹理   │
         │  执行：全屏四边形着色器
         │              │
         └──────┬───────┘
                │
                ▼
          输出到屏幕
```

### 后处理管线架构

```
典型的后处理管线（串联式）：

场景颜色 ──► Bloom ──► FXAA ──► DOF ──► ColorGrading ──► 屏幕
            (泛光)    (抗锯齿)  (景深)   (调色)

每个后处理效果：
  1. 读取上一级的输出纹理
  2. 执行全屏着色器
  3. 输出到新的纹理（或覆盖原纹理）

全屏四边形渲染：
  绘制一个覆盖整个屏幕的矩形
  在片元着色器中对每个像素做图像处理
```

### 多渲染目标（MRT）

```
后处理需要额外的数据，不只是颜色：

G-Buffer（几何缓冲区）：
  RT0: Albedo (RGB) + Alpha (A)      ← 物体颜色
  RT1: Normal (RGB) + Smoothness (A) ← 法线方向
  RT2: Position (RGB) + Depth (A)    ← 世界位置
  RT3: Emission (RGB)                ← 自发光

这些数据在光照计算和后处理中使用
例如 DOF 需要深度信息、Bloom 需要亮度信息
```

---

## 2. 常见后处理效果算法

### Bloom（泛光）

```
原理：提取画面中的高亮区域，模糊后叠加回去

步骤：
  1. 亮度提取
     brightness = max(color.r, color.g, color.b) - threshold
     只保留超过阈值的亮部

  2. 多级降采样模糊（Kawase Blur / Gaussian Blur）
     Level 0: 原始尺寸    ░░░░░░░
     Level 1: 1/2 尺寸     ░░░░
     Level 2: 1/4 尺寸      ░░
     Level 3: 1/8 尺寸       ░
     每级做一次模糊，逐渐扩大泛光范围

  3. 上采样累加
     将各层级结果上采样到原始尺寸并累加

  4. 混合
     finalColor = sceneColor + bloomColor × intensity
```

### FXAA（Fast Approximate Anti-Aliasing）

```
原理：在图像空间中检测并柔化锯齿边缘

步骤：
  1. 检测边缘
     对每个像素，检查亮度梯度（Luma）
     水平梯度大 → 垂直边缘
     垂直梯度大 → 水平边缘

  2. 确定混合方向
     沿边缘方向寻找亮度对比最大的两个像素

  3. 混合
     沿边缘方向在两个像素之间做线性混合
     消除锯齿

优点：只需一个 Pass，性能好
缺点：可能模糊细节纹理
```

### DOF（Depth of Field，景深）

```
原理：模拟真实相机的景深效果，焦点处清晰，远处模糊

步骤：
  1. 计算模糊半径
     基于深度值和焦距参数
     blurRadius = abs(depth - focusDistance) × aperture

     焦点处 (depth ≈ focusDistance): 半径 ≈ 0 → 清晰
     焦点外 (depth 远离 focusDistance): 半径大 → 模糊

  2. 散景模糊（Bokeh Blur）
     使用圆形/六边形采样的模糊
     模拟真实相机的光圈形状

  3. 混合
     输出 = lerp(sceneColor, blurredColor, blurFactor)
```

### 色调映射与色彩校正（Tone Mapping & Color Grading）

```
HDR → LDR 色调映射：
  真实世界的亮度范围远超显示器能表示的范围

  Reinhard:
    mappedColor = color / (1 + color)  ← 简单但有雾感

  ACES (Academy Color Encoding System):
    电影工业标准色调映射曲线
    保留高光和暗部细节

Color Grading（调色）：
  使用 LUT（Look-Up Table）查找表
  将每个原始颜色映射为目标颜色

  ┌───────────────────┐
  │  LUT 纹理 (256×16) │
  │  输入颜色 → 查表 → 输出颜色
  │  美术可以自定义 LUT 实现任意调色风格
  └───────────────────┘
```

---

## 3. Render Graph 理论

### 传统渲染管线的痛点

```
问题 1：硬编码的渲染流程
  传统：代码中固定 Pass 顺序
  难以动态添加/移除效果

问题 2：资源管理困难
  每个效果需要的临时纹理（RT）需要手动管理
  创建/销毁开销大

问题 3：性能优化困难
  难以自动合并兼容的 Pass
  难以自动做 Transient 资源优化
```

### Render Graph 的解决方案

```
Render Graph = 声明式的渲染流程描述

传统方式（命令式）：
  // 手动管理每一步
  let rt1 = createRenderTarget();
  drawSceneTo(rt1);
  let rt2 = createRenderTarget();
  applyBloom(rt1, rt2);
  present(rt2);
  destroy(rt1);
  destroy(rt2);

Render Graph（声明式）：
  // 只声明"需要什么"
  graph.addPass("scene", sceneSetup).write(color);
  graph.addPass("bloom", bloomSetup).read(color).write(bloomResult);
  graph.addPass("present", presentSetup).read(bloomResult);

  // 引擎自动：
  // 1. 分配和复用 RT
  // 2. 排序 Pass
  // 3. 合并兼容的 Pass
  // 4. 回收不再使用的 RT
```

### Render Graph 的执行

```
两个阶段：

1. 编译阶段（Compile）
   解析 Pass 之间的读写依赖关系
   构建依赖图 → 拓扑排序 → 确定执行顺序
   分配 RenderTarget（复用可以重叠的 RT）

2. 执行阶段（Execute）
   按编译后的顺序执行每个 Pass
   每个 Pass 只关注自己的逻辑
   资源管理完全由框架处理
```

> 源码 `cocos/rendering/custom/render-graph.ts` 实现了 Render Graph。`pipeline.ts` 定义了管线的编译和执行流程

---

## 4. 阴影渲染原理

### 阴影映射（Shadow Mapping）

```
原理：从光源视角渲染场景深度，再从相机视角比较深度

Pass 1：光源视角深度渲染
  从光源位置渲染场景（不画颜色，只记录深度）
  → 生成阴影贴图（Shadow Map）

Pass 2：相机视角渲染
  对每个像素：
  1. 将像素位置转换到光源空间
  2. 比较像素深度与阴影贴图中的深度
  3. 如果像素更深（被遮挡）→ 在阴影中

       Light
        │ 光源视角
        ▼
    ┌───┬───┐
    │ ■ │   │  ← 阴影贴图（深度值）
    └───┴───┘
         │
    Camera 视角下比较
         │
    ┌───┬───┐
    │ ■ │ ☀ │  ■ = 在阴影中  ☀ = 被照亮
    └───┴───┘
```

### 阴影贴图的问题

```
问题 1：阴影粉刺（Shadow Acne）
  由于分辨率有限，物体表面会自遮挡产生条纹
  解决：深度偏移（Depth Bias）

  if (pixelDepth > shadowDepth + bias) → 阴影

问题 2：彼得潘现象（Peter Panning）
  Bias 过大导致阴影与物体分离
  解决：使用法线偏移（Normal Offset）

问题 3：阴影锯齿
  阴影贴图分辨率不够导致锯齿
  解决：PCF 软阴影（多次采样取平均）
```

### CSM（Cascaded Shadow Maps，级联阴影）

```
问题：单一阴影贴图无法同时覆盖近处和远处

  近处需要高精度 → 小范围
  远处需要大范围 → 低精度

CSM 解决方案：将视锥体分割为多个级联，每个级联使用独立的阴影贴图

  ┌─────────────────────────────────────────────┐
  │                  Camera 视锥体               │
  │                                             │
  │  ┌─────┬───────────┬──────────────┬────────┐ │
  │  │ CSM0│   CSM1    │    CSM2      │  CSM3  │ │
  │  │近处  │  中近     │   中远       │ 远处   │ │
  │  │高精度│ 中精度    │  低精度      │ 最低   │ │
  │  └─────┴───────────┴──────────────┴────────┘ │
  │                                             │
  └─────────────────────────────────────────────┘

  每个级联有独立的阴影贴图，分辨率相同但覆盖范围不同
  → 近处精细、远处够用

  级联之间的过渡需要插值，避免明显的接缝
```

> 源码 `cocos/rendering/shadow/` 目录实现了阴影系统。`shadow-flow.ts` 管理阴影渲染流程，CSM 的级联分割和混合在着色器中实现

---

## 5. 地形渲染原理

### 高度场地形（Heightfield Terrain）

```
原理：用二维网格 + 高度图定义地形形状

高度图（Height Map）：
  一张灰度图，每个像素的亮度 = 该位置的高度

  亮 → 高（山峰）
  暗 → 低（谷地）

  ┌─────────────────┐
  │ ░░▒▒▓▓██▓▓▒▒░░ │  ← 高度图
  │ ░▒▓████████▓▒░ │
  │ ▒▓██████████▓▒ │     转 3D → 山脉地形
  │ ░▒▓████████▓▒░ │
  │ ░░▒▒▓▓██▓▓▒▒░░ │
  └─────────────────┘
```

### LOD（Level of Detail）

```
问题：远处的地形不需要和近处一样多的三角形

LOD 方案：根据距离调整网格密度

  近处：高密度网格（精细）
  ░░░░░░░░░░░░░░░░░░░

  远处：低密度网格（粗略）
  ─────────────────────

  难点：不同 LOD 级别之间的接缝处理
  常用方案： geomorphing（几何变形过渡）
```

### 地形纹理混合

```
问题：同一地形需要不同材质（草地、岩石、泥土、雪地）

Splat Map（飞溅图）方案：

  每个像素存储各层的权重：
  R = 草地权重
  G = 岩石权重
  B = 泥土权重
  A = 雪地权重

  最终颜色 = grassTex × R + rockTex × G + dirtTex × B + snowTex × A

  在着色器中对每个像素混合多张纹理
```

> 源码 `cocos/terrain/terrain.ts` 实现了高度场地形。`terrain-chunk.ts` 管理地形的分块加载和 LOD

---

## 延伸阅读

- [Real-Time Rendering 4th](https://www.realtimerendering.com/) — 实时渲染权威教材
- [Shadow Mapping - OpenGL Tutorial](https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping)
- [Render Graphs - GDC 2017](https://www.gdcvault.com/play/1024612/) — Frostbite 引擎的 Render Graph 演讲
- [GPU Gems - Post-Processing](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch28.html) — GPU Gems 后处理章节

---

> 理解了这些原理后，继续阅读 [01-后处理系统](./01-post-processing.md) 查看对应的源码实现。
