# 高级主题

高级主题章节深入探索引擎的高级渲染特性，包括后处理效果、自定义渲染管线、地形系统和阴影系统。

## 目录

- **[00-技术原理](./00-technical-principles.md) - 后处理管线、Bloom/FXAA/DOF 算法、Render Graph、CSM 阴影、地形 LOD（建议首先阅读）**
- [01-后处理系统](./01-post-processing.md) - Bloom、FXAA、DOF 等后处理效果
- [02-自定义渲染管线](./02-custom-rendering.md) - Custom Pipeline 架构
- [03-地形系统](./03-terrain-system.md) - 地形渲染与 LOD
- [04-阴影系统](./04-shadows.md) - 阴影渲染与 CSM

---

## 核心概念

### 高级渲染架构

```
┌─────────────────────────────────────────────────────────┐
│                   高级渲染特性                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              自定义渲染管线                        │   │
│  │  Compiler → Executor → Pipeline → RenderGraph    │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────┴─────────────────────────────┐   │
│  │              后处理系统                            │   │
│  │  Bloom · FXAA · DOF · TAA · HBAO · ColorGrading  │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌──────────┐  ┌──────┴──────┐  ┌──────────┐           │
│  │  阴影系统 │  │  地形系统   │  │  反射探针 │           │
│  │  CSM     │  │  HeightField│  │  Cubemap │           │
│  └──────────┘  └─────────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 后处理构建器 | `cocos/rendering/post-process/post-process-builder.ts` | 后处理流程 |
| Bloom | `cocos/rendering/post-process/components/bloom.ts` | 泛光效果 |
| FXAA | `cocos/rendering/post-process/components/fxaa.ts` | 抗锯齿 |
| DOF | `cocos/rendering/post-process/components/dof.ts` | 景深 |
| Custom Pipeline | `cocos/rendering/custom/pipeline.ts` | 自定义管线 |
| Render Graph | `cocos/rendering/custom/render-graph.ts` | 渲染图 |
| 地形 | `cocos/terrain/terrain.ts` | 地形系统 |
| 阴影 | `cocos/rendering/shadow/shadow-flow.ts` | 阴影渲染 |

---

## 学习目标

完成本章节后，你将能够：

1. 理解后处理系统的架构和各效果的实现
2. 理解自定义渲染管线的设计
3. 理解地形和阴影系统

---

## 预计时间

- 后处理系统：2 天
- 自定义渲染管线：2-3 天
- 地形系统：1 天
- 阴影系统：1-2 天

**总计：6-8 天**

---

## 下一步

准备好后，开始学习 [01-后处理系统](./01-post-processing.md)。
