# 后处理系统

后处理系统在渲染管线的最后阶段对画面进行全局效果处理，如泛光、抗锯齿、景深、色彩校正等。

## 目录

- [架构概述](#架构概述)
- [后处理效果详解](#后处理效果详解)
- [PostProcessBuilder 构建器](#postprocessbuilder-构建器)
- [自定义后处理](#自定义后处理)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    后处理管线                             │
│                                                         │
│  场景渲染完成                                            │
│      │                                                  │
│      ▼                                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              PostProcessBuilder                   │   │
│  │                                                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│  │  │ Bloom   │→ │ DOF     │→ │ HBAO    │         │   │
│  │  │ 泛光    │  │ 景深    │  │ 环境遮蔽 │         │   │
│  │  └─────────┘  └─────────┘  └─────────┘         │   │
│  │       │                                       │   │
│  │       ▼                                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│  │  │TAA      │→ │ FXAA    │→ │Color    │         │   │
│  │  │时域抗锯齿│  │ 抗锯齿  │  │Grading  │         │   │
│  │  └─────────┘  └─────────┘  └─────────┘         │   │
│  │       │                                       │   │
│  │       ▼                                       │   │
│  │  ┌─────────┐                                  │   │
│  │  │ FSR     │  → 输出到屏幕                     │   │
│  │  │ 超分辨率 │                                  │   │
│  │  └─────────┘                                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 后处理基类 | `cocos/rendering/post-process/components/post-process.ts` | PostProcess 组件 |
| 后处理设置 | `cocos/rendering/post-process/components/post-process-setting.ts` | 全局设置 |
| 后处理构建器 | `cocos/rendering/post-process/post-process-builder.ts` | 构建渲染流程 |
| Bloom | `cocos/rendering/post-process/components/bloom.ts` | 泛光 |
| FXAA | `cocos/rendering/post-process/components/fxaa.ts` | 抗锯齿 |
| DOF | `cocos/rendering/post-process/components/dof.ts` | 景深 |
| HBAO | `cocos/rendering/post-process/components/hbao.ts` | 环境遮蔽 |
| TAA | `cocos/rendering/post-process/components/taa.ts` | 时域抗锯齿 |
| Color Grading | `cocos/rendering/post-process/components/color-grading.ts` | 色彩校正 |
| FSR | `cocos/rendering/post-process/components/fsr.ts` | 超分辨率 |

---

## 后处理效果详解

### Bloom 泛光

使亮区产生柔和光晕效果，模拟真实摄像机的镜头溢出。

```
原理:
  1. 提取亮度超过阈值的像素
  2. 多次高斯模糊（下采样 + 上采样）
  3. 与原始画面叠加

阈值: 亮度 > threshold 的区域才产生泛光
强度: bloom 强度 (intensity)
散射: 泛光扩散范围 (scatter)
```

### FXAA 抗锯齿

快速近似抗锯齿（Fast Approximate Anti-Aliasing），基于屏幕空间的边缘检测。

```
原理:
  1. 检测像素亮度变化（边缘检测）
  2. 判断边缘方向（水平/垂直）
  3. 沿边缘方向混合相邻像素

优点: 速度快，单 Pass
缺点: 轻微模糊
```

### DOF 景深

模拟真实相机的景深效果，距离焦点越远的区域越模糊。

```
原理:
  1. 计算每个像素到焦点的距离
  2. 根据距离计算模糊半径（CoC - Circle of Confusion）
  3. 应用散景模糊（Bokeh Blur）

参数:
  焦距 (focalDistance): 清晰区域到相机的距离
  光圈 (aperture): 影响模糊强度
  焦距范围 (focalRange): 清晰区域的范围
```

### HBAO 环境光遮蔽

水平环境光遮蔽（Horizon-Based Ambient Occlusion），在屏幕空间近似计算遮蔽。

```
原理:
  1. 重建屏幕空间法线和深度
  2. 沿多个方向射线步进
  3. 计算地平线角度
  4. 累积遮蔽值

效果: 角落、缝隙处变暗，增加深度感
```

### TAA 时域抗锯齿

利用前一帧的信息进行抗锯齿，质量高于 FXAA。

```
原理:
  1. 使用子像素抖动偏移（halton sequence）
  2. 混合当前帧和前一帧（指数移动平均）
  3. 使用运动矢量补偿运动模糊

优点: 高质量抗锯齿
缺点: 可能有残影（ghosting）
```

### Color Grading 色彩校正

使用查找表（LUT）对画面进行色彩调整。

```
原理:
  1. 加载 3D LUT 纹理（颜色映射表）
  2. 对每个像素的颜色值查找映射
  3. 输出调整后的颜色

用途: 色调、对比度、饱和度全局调整
```

### FSR 超分辨率

AMD FidelityFX Super Resolution，在低分辨率渲染后放大到高分辨率。

```
原理:
  1. 以较低分辨率渲染场景
  2. 使用 Edge Adaptive Upsampling 放大
  3. 应用 Sharpening 增强

优点: 显著提升性能
```

---

## PostProcessBuilder 构建器

`PostProcessBuilder` 根据启用的后处理效果，动态构建渲染流程。

```typescript
// cocos/rendering/post-process/post-process-builder.ts

class PostProcessBuilder {
    // ─── 构建后处理流程 ───
    build(camera): void;

    // 根据启用的效果创建对应的 Pass:
    // 1. 检查哪些 PostProcess 组件启用
    // 2. 按顺序创建对应的 Pass
    // 3. 分配临时 RenderTexture
    // 4. 构建 RenderPass 链
}
```

### 构建流程

```
PostProcessBuilder.build(camera)
    │
    ├── 检查启用的后处理效果
    │   ├── bloom.enabled?  → 创建 BloomPass
    │   ├── dof.enabled?    → 创建 DOFPass
    │   ├── hbao.enabled?   → 创建 HBAOPass
    │   ├── taa.enabled?    → 创建 TAAPass
    │   ├── fxaa.enabled?   → 创建 FXAAPass
    │   └── fsr.enabled?    → 创建 FSRPass
    │
    ├── 分配 RenderTexture
    │   ├── 场景渲染目标 (source)
    │   ├── 临时纹理 (temp)
    │   └── 最终输出 (output)
    │
    └── 构建 Pass 链
        source → Bloom → DOF → HBAO → TAA → FXAA → ColorGrading → FSR → output
```

---

## 自定义后处理

### 创建自定义后处理效果

```typescript
// 1. 创建自定义 Shader (Effect)
// assets/effects/custom-post.effect

// 2. 创建后处理组件
@ccclass('CustomPostProcess')
export class CustomPostProcess extends PostProcess {
    @property(EffectAsset)
    effect: EffectAsset = null!;

    @property
    intensity: number = 1.0;
}

// 3. 创建对应的 Pass
export class CustomPass extends BasePass {
    get material(): Material;
    render(source: Texture, dest: RenderPass): void;
}
```

---

## 技术原理

### 1. 全屏四边形渲染

后处理效果通过渲染全屏四边形实现：

```
┌─────────────────────────────────┐
│                                 │
│  全屏四边形（两个三角形）         │
│                                 │
│  顶点着色器: 直接输出位置        │
│  片元着色器: 采样输入纹理，      │
│             应用后处理算法       │
│                                 │
└─────────────────────────────────┘
```

### 2. Ping-Pong 缓冲

多 Pass 后处理使用两个缓冲交替读写：

```
Pass 1: source → temp1
Pass 2: temp1  → temp2
Pass 3: temp2  → temp1  (复用)
Pass 4: temp1  → output
```

### 3. 渲染目标管理

```
PostProcessBuilder 管理临时 RenderTexture:

创建:
  RT1 = device.createTexture(w, h, RGBA16F)
  RT2 = device.createTexture(w, h, RGBA16F)

使用:
  Pass 1: 输入=场景RT, 输出=RT1
  Pass 2: 输入=RT1,     输出=RT2
  Pass 3: 输入=RT2,     输出=屏幕

释放:
  后处理完成后释放临时 RT
```

---

## 下一步

完成后处理系统的学习后，继续学习 [02-自定义渲染管线](./02-custom-rendering.md)。
