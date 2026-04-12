# 阴影系统

阴影系统为场景中的物体生成阴影贴图，增强画面的深度感和真实感。Cocos Creator 3.8 使用级联阴影贴图（CSM）技术实现高质量阴影。

## 目录

- [架构概述](#架构概述)
- [ShadowFlow 阴影流程](#shadowflow-阴影流程)
- [ShadowStage 阴影阶段](#shadowstage-阴影阶段)
- [CSM 级联阴影](#csm-级联阴影)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    阴影渲染流程                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              ShadowFlow                          │   │
│  │  (阴影渲染流程)                                   │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │           ShadowStage                    │    │   │
│  │  │  1. 计算光源视图矩阵                       │    │   │
│  │  │  2. 渲染阴影贴图                           │    │   │
│  │  │  3. 应用 PCF 模糊                          │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  │                     │                            │   │
│  │                     ▼                            │   │
│  │  ┌──────────────────────────────────────────┐    │   │
│  │  │           CSMLayers                      │    │   │
│  │  │  管理级联阴影贴图                           │    │   │
│  │  └──────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 阴影流程 | `cocos/rendering/shadow/shadow-flow.ts` | ShadowFlow |
| 阴影阶段 | `cocos/rendering/shadow/shadow-stage.ts` | ShadowStage |
| CSM 层级 | `cocos/rendering/shadow/csm-layers.ts` | 级联阴影管理 |

---

## ShadowFlow 阴影流程

ShadowFlow 是阴影渲染的入口，在主渲染流程之前执行。

```typescript
// cocos/rendering/shadow/shadow-flow.ts

export class ShadowFlow extends RenderFlow {
    // ─── 执行流程 ───
    render(camera: Camera): void {
        // 1. 收集投射阴影的物体
        // 2. 计算光源投影矩阵
        // 3. 执行 ShadowStage
        // 4. 生成阴影贴图
    }
}
```

### 阴影参数

| 参数 | 说明 |
|------|------|
| `shadowEnabled` | 是否启用阴影 |
| `shadowMapSize` | 阴影贴图尺寸 (512/1024/2048) |
| `shadowDistance` | 阴影可视距离 |
| `shadowPCF` | PCF 模糊采样数 |
| `shadowBias` | 阴影偏移（减少 shadow acne） |
| `shadowNormalBias` | 法线偏移（减少 peter panning） |

---

## ShadowStage 阴影阶段

ShadowStage 负责实际的阴影贴图渲染。

```typescript
// cocos/rendering/shadow/shadow-stage.ts

export class ShadowStage extends RenderStage {
    render(camera: Camera): void {
        // 1. 设置光源相机
        //    position = 主光源位置
        //    direction = 主光源方向
        //    projection = 正交投影（覆盖阴影区域）

        // 2. 渲染深度
        //    只写入深度值到阴影贴图
        //    不需要颜色输出

        // 3. PCF 滤波（可选）
        //    对阴影贴图进行模糊
        //    软化阴影边缘
    }
}
```

---

## CSM 级联阴影

级联阴影贴图（Cascaded Shadow Maps）将视锥体分割为多个区域，每个区域使用独立的阴影贴图。

```typescript
// cocos/rendering/shadow/csm-layers.ts

export class CSMLayers {
    // ─── 级联参数 ───
    cascades: number;          // 级联数量 (1~4)
    splitScheme: SplitScheme;  // 分割方案
    shadowMapSize: number;     // 每级阴影贴图大小

    // ─── 级联分割 ───
    calculateSplitPoints(): number[];
}
```

### 级联分割示意

```
视锥体侧视图:

相机 ─────────────────────────────────────→
     │           │              │          │
     │  Cascade0 │  Cascade1   │ Cascade2 │
     │  (近处)    │  (中间)     │ (远处)   │
     │  高精度    │  中精度      │ 低精度   │
     │           │              │          │
     0m        20m            60m       150m

每级使用独立的阴影贴图:
  Cascade 0: 1024×1024 (覆盖 0~20m)
  Cascade 1: 1024×1024 (覆盖 20~60m)
  Cascade 2: 1024×1024 (覆盖 60~150m)
```

### 为什么需要 CSM

```
单张阴影贴图的问题:

场景范围 0~150m，阴影贴图 1024×1024
  像素密度 = 1024 / 150m ≈ 7 pixels/meter
  → 近处阴影锯齿严重

CSM 解决方案:
  每级 1024×1024，只覆盖对应距离
  Cascade 0: 1024 / 20m ≈ 50 pixels/meter ✓
  Cascade 1: 1024 / 40m ≈ 25 pixels/meter ✓
  Cascade 2: 1024 / 90m ≈ 11 pixels/meter ✓
```

---

## 技术原理

### 1. Shadow Map 算法

```
生成阶段:
  1. 从光源视角渲染场景深度 → 阴影贴图
  2. 只有深度，不需要颜色

采样阶段:
  1. 片元位置变换到光源空间
  2. 比较片元深度与阴影贴图深度
  3. 如果片元深度 > 阴影贴图深度 → 在阴影中

  depth_fragment > depth_shadowMap ? shadow : lit
```

### 2. Shadow Acne 与 Peter Panning

```
Shadow Acne (阴影粉刺):
  由于精度限制，物体表面自阴影产生条纹
  解决: shadow bias (偏移深度)

Peter Panning (阴影悬浮):
  Bias 过大导致阴影脱离物体
  解决: shadow normal bias (沿法线偏移)

正确的做法是平衡两个偏移值:
  bias 太小 → shadow acne
  bias 太大 → peter panning
```

### 3. PCF 软阴影

```
PCF (Percentage Closer Filtering):

  1. 采样阴影贴图周围 N×N 个像素
  2. 每个采样点做深度比较
  3. 统计通过比较的比例

  result = 0;
  for (int i = -1; i <= 1; i++)
    for (int j = -1; j <= 1; j++)
      if (depth > shadowMap[offset + ivec2(i,j)])
        result += 1.0;
  shadow = result / 9.0;

  PCF 3×3: 9 次采样
  PCF 5×5: 25 次采样（更柔和但更慢）
```

### 4. 级联过渡

```
级联之间的过渡处理:

  在级联边界区域混合两级阴影:
  if (distance > cascade[N].end - fadeRange) {
      blendFactor = (distance - (cascade[N].end - fadeRange)) / fadeRange;
      shadow = lerp(cascade[N].shadow, cascade[N+1].shadow, blendFactor);
  }

  避免级联边界出现明显的阴影质量跳变
```

---

## 下一步

恭喜你完成了所有章节的学习！回顾整个源码学习之旅，你可以回到 [主目录](../README.md) 查看完整的学习路径。
