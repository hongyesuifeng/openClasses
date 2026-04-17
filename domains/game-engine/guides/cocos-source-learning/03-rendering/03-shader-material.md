# 着色器与材质

着色器和材质系统是渲染管线的核心纽带，将 GPU 渲染逻辑（Shader）与美术数据（Material）结合起来。Cocos Creator 采用 Effect 资源体系，通过 `.effect` + `.chunk` 文件组合出灵活的着色器方案。

## 目录

- [架构概述](#架构概述)
- [Effect 资源体系](#effect-资源体系)
- [Chunk 着色器片段](#chunk-着色器片段)
- [Material 材质系统](#material-材质系统)
- [Pass 渲染通道](#pass-渲染通道)
- [Shader 编译流程](#shader-编译流程)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    材质渲染体系                           │
│                                                         │
│  ┌─────────────┐    引用    ┌─────────────────────────┐ │
│  │  Material   │──────────→│  EffectAsset (.effect)  │ │
│  │  (材质实例) │           │  ├─ Pass 0 (vs + fs)    │ │
│  │  属性值覆盖  │           │  ├─ Pass 1 (vs + fs)    │ │
│  └──────┬──────┘           │  └─ Pass N              │ │
│         │                  └─────────────────────────┘ │
│         │ compile                   ↑ #include          │
│         ▼                           │                   │
│  ┌─────────────┐           ┌───────┴───────┐           │
│  │  GPU Shader │           │  Chunk (.chunk)│           │
│  │  (运行时)    │           │  可复用代码片段  │           │
│  └─────────────┘           └───────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| Material | `cocos/asset/assets/material.ts` | 材质资源 |
| EffectAsset | `cocos/asset/assets/effect-asset.ts` | 着色器效果 |
| Pass | `cocos/render-scene/core/pass.ts` | 渲染通道 |
| ProgramLib | `cocos/rendering/program-lib.ts` | 着色器程序库 |
| Shader 编译 | `cocos/rendering/custom/compiler.ts` | 自定义管线编译器 |
| 内置 Effect | `editor/assets/effects/` | 82 个 .effect 文件 |
| 内置 Chunk | `editor/assets/chunks/` | 160 个 .chunk 文件 |

---

## Effect 资源体系

Effect（`.effect` 文件）是 Cocos Creator 着色器的核心载体，一个 Effect 包含一个或多个 Pass。

### Effect 文件结构

```yaml
# builtin-standard.effect (简化示例)
name: standard
techniques:
  - name: opaque
    passes:
      - vert: standard-vs       # 顶点着色器入口
        frag: standard-fs       # 片元着色器入口
        phase: forward-add      # 渲染阶段
        blendState:
          targets:
            - blend: false
        depthStencilState:
          depthTest: true
          depthWrite: true
        rasterizerState:
          cullMode: back
        properties:             # 可在材质面板调整的属性
          mainColor: { value: [1, 1, 1, 1], editor: { tooltip: 'Main Color' } }
          mainTexture: { value: grey }
          tilingOffset: { value: [1, 1, 0, 0] }
```

### 内置 Effect 分类

| Effect | 说明 |
|--------|------|
| `builtin-standard` | PBR 标准着色器 |
| `builtin-unlit` | 无光照着色器 |
| `builtin-toon` | 卡通渲染 |
| `builtin-terrain` | 地形着色器 |
| `builtin-particle` | 粒子着色器 |
| `builtin-sprite` | 2D 精灵着色器 |
| `builtin-spine` | Spine 动画着色器 |
| `advanced/car-paint` | 高级车漆 |
| `advanced/skin` | 皮肤渲染 |
| `advanced/water` | 水面渲染 |

---

## Chunk 着色器片段

Chunk（`.chunk` 文件）是可复用的着色器代码片段，通过 `#include` 指令组合到 Effect 中。

### Chunk 的作用

```
┌─── standard-vs ────────────────────────────────┐
│                                                 │
│  #include <common>           ← 通用定义          │
│  #include <lighting>         ← 光照计算          │
│  #include <shadow>           ← 阴影采样          │
│  #include <surfaces>         ← 表面数据          │
│                                                 │
│  // 顶点着色器主函数                              │
│  vec4 vert() {                                  │
│    // 使用 include 的函数                         │
│  }                                              │
└─────────────────────────────────────────────────┘
```

### Chunk 分类（共 160 个）

| 目录 | 说明 | 示例 |
|------|------|------|
| `common/` | 通用工具 | `color`, `math`, `tone-mapping` |
| `lighting/` | 光照计算 | `diffuse`, `specular`, `ambient` |
| `shadow/` | 阴影 | `shadow-map-base`, `pcw-shadow` |
| `surfaces/` | 表面数据 | `standard-surface`, `toon-surface` |
| `effect/` | 特效 | `fog`, `bloom`, `dof` |
| `for2d/` | 2D 专用 | `sprite`, `label`, `graphics` |

---

## Material 材质系统

Material 是 EffectAsset 的运行时实例，存储着色器属性值（颜色、贴图、开关等）。

### 源码解析

```typescript
// cocos/asset/assets/material.ts

export class Material extends Asset {
    // ─── 核心属性 ───
    _effectAsset: EffectAsset | null;  // 引用的 Effect 资源
    _techIdx: number;                  // 使用的 Technique 索引
    _passes: Pass[];                   // 编译后的 Pass 数组
    _props: Record<string, any>;       // 属性值覆盖

    // ─── 核心 API ───
    initialize(info): boolean;         // 初始化材质
    update(): void;                    // 更新 uniform 数据到 GPU
    getProperty(name, passIdx): any;   // 获取属性
    setProperty(name, val, passIdx): void;  // 设置属性
    recompileShaders(macros): void;    // 重编译着色器（宏变化时）
}
```

### 材质属性类型

| 类型 | GLSL 对应 | 说明 |
|------|-----------|------|
| `number` | `float` | 浮点数 |
| `[number, number]` | `vec2` | 二维向量 |
| `[number, number, number]` | `vec3` | 三维向量 / 颜色 RGB |
| `[number, number, number, number]` | `vec4` | 四维向量 / 颜色 RGBA |
| `Texture2D` | `sampler2D` | 纹理贴图 |

### 材质使用流程

```
1. 创建材质
   const mat = new Material();
   mat.initialize({ effectAsset: standardEffect });

2. 设置属性
   mat.setProperty('mainColor', new Color(255, 0, 0, 255));
   mat.setProperty('mainTexture', texture);

3. 绑定到渲染器
   renderer.material = mat;

4. 运行时
   Pipeline 编译 Pass → 生成 GPU Shader → 绑定 Uniform → Draw
```

---

## Pass 渲染通道

Pass 是 Effect 中一次完整的渲染配置，包含着色器代码和渲染状态。

### 核心属性

```typescript
// cocos/render-scene/core/pass.ts

export class Pass {
    // ─── 着色器相关 ───
    get shader(): Shader;               // 编译后的着色器
    get passes(): PipelineLayout;       // 管线布局
    get descriptorSet(): DescriptorSet;  // 描述符集

    // ─── 渲染状态 ───
    get blendState(): BlendState;        // 混合状态
    get depthStencilState(): DepthStencilState;  // 深度模板
    get rasterizerState(): RasterizerState;       // 光栅化
    get primitive(): PrimitiveMode;      // 图元类型

    // ─── Pass 信息 ───
    get phase(): number;                 // 渲染阶段 ID
    get priority(): number;              // 优先级

    // ─── 方法 ───
    tryCompile(macros): boolean;  // 尝试编译着色器
    update(): void;               // 更新 Uniform
}
```

### 一个 Effect 的多 Pass 示例

```
builtin-standard.effect
├── Technique: opaque
│   ├── Pass 0: Forward 渲染（主渲染）
│   │   ├── phase: forward
│   │   ├── blend: false（不透明）
│   │   └── depthWrite: true
│   └── Pass 1: Shadow Caster（生成阴影）
│       ├── phase: shadow-caster
│       └── depthWrite: true
│
└── Technique: transparent
    ├── Pass 0: Forward 渲染
    │   ├── phase: forward
    │   ├── blend: true（半透明）
    │   └── depthWrite: false
    └── Pass 1: Shadow Caster
```

---

## Shader 编译流程

### 编译管线

```
EffectAsset (.effect)
    │
    ▼ 解析
Technique[] → Pass[]
    │
    ▼ 宏展开
根据 Material 使用的宏组合生成 Shader 变体
    │
    ▼ #include 展开
将 Chunk 代码片段插入到着色器源码中
    │
    ▼ 编译
ProgramLib.getShader(program, macros)
    │
    ├── 检查缓存（macroHash → Shader）
    │
    ├── 未缓存则创建新的 ShaderInfo
    │   ├── 组装 VS 源码
    │   ├── 组装 FS 源码
    │   ├── 提取 Attribute 声明
    │   ├── 提取 Uniform Block 声明
    │   └── 提取 Sampler 声明
    │
    └── Device.createShader(info)
        ├── WebGL: 编译 + 链接 GLSL
        ├── WebGL2: 编译 + 链接 GLSL 300 es
        └── WebGPU: 转换为 WGSL
```

### Shader 变体（Variant）管理

```typescript
// 着色器变体由宏组合决定
// 每个宏组合产生一个唯一的 Shader 变体

// 例如 standard 着色器的宏：
{
    CC_USE_NORMALMAP: true,       // 使用法线贴图
    CC_USE_IBL: true,             // 使用环境光照
    CC_SHADOW_MAP: true,          // 启用阴影
    CC_USE_ALPHA_TEST: false,     // Alpha 测试
}

// 4 个 bool 宏 → 2^4 = 16 种变体
// 引擎通过 ProgramLib 缓存已编译的变体
```

---

## 技术原理

### 1. Effect/Chunk 模板系统

Cocos 的着色器系统类似于 Web 组件化的思想：
- **Chunk** = 可复用组件（如光照计算、阴影采样）
- **Effect** = 页面模板，组合多个 Chunk
- **Material** = 实例，填入具体数据

### 2. 宏驱动的变体系统

通过预处理宏（类似 C 的 `#ifdef`）控制着色器功能：

```glsl
// 在着色器代码中
#if CC_USE_NORMALMAP
    vec3 normal = texture2D(normalMap, uv).xyz;
#else
    vec3 normal = a_normal;
#endif
```

每种宏组合编译出一个独立的 GPU Shader，缓存在 `ProgramLib` 中。

### 3. UBO 自动管理

引擎自动将材质属性打包到 Uniform Buffer Object（UBO）中：

```
Material Properties        UBO Layout
─────────────────────      ──────────────
mainColor: [1,0,0,1]  →    offset 0: vec4
tilingOffset: [1,1,0,0] →  offset 16: vec4
metallic: 0.5         →    offset 32: float
roughness: 0.3        →    offset 36: float
```

每帧调用 `Pass.update()` 将材质属性数据更新到 GPU。

---

## 下一步

完成着色器与材质的学习后，继续学习 [04-2D 渲染](./04-2d-rendering.md)。
