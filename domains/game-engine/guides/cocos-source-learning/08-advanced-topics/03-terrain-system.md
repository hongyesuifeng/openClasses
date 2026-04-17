# 地形系统

地形系统用于渲染大面积的户外地形，通过高度图（HeightMap）和混合纹理（SplatMap）实现真实的地表效果。

## 目录

- [核心文件](#核心文件)
- [Terrain 主类](#terrain-主类)
- [TerrainAsset 地形资源](#terrainasset-地形资源)
- [HeightField 高度场](#heightfield-高度场)
- [TerrainLOD 细节层次](#terrainlod-细节层次)
- [技术原理](#技术原理)

---

## 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 地形主类 | `cocos/terrain/terrain.ts` | 地形组件 |
| 地形资源 | `cocos/terrain/terrain-asset.ts` | 地形数据 |
| 高度场 | `cocos/terrain/height-field.ts` | 高度数据 |
| 地形 LOD | `cocos/terrain/terrain-lod.ts` | LOD 管理 |

---

## Terrain 主类

```typescript
// cocos/terrain/terrain.ts

export class Terrain extends Component {
    // ─── 地形属性 ───
    asset: TerrainAsset;            // 地形资源
    size: number;                   // 地形尺寸
    blockSize: number;              // 块大小
    heightScale: number;            // 高度缩放
    weightMapSize: number;          // 权重图尺寸
    lightMapSize: number;           // 光照图尺寸

    // ─── 地形操作 ───
    getHeightAt(x, z): number;      // 获取指定位置高度
    setHeightAt(x, z, h): void;     // 设置指定位置高度
    getNormalAt(x, z): Vec3;        // 获取法线

    // ─── 层管理 ───
    layers: TerrainLayerInfo[];     // 地形层（草地/泥土/石头等）
    setLayer(index, layer): void;
}
```

### 地形结构

```
Terrain
├── Block[0][0] ─── 地形块 (LOD 自动选择)
├── Block[0][1]
├── Block[1][0]
└── Block[1][1]

每个 Block:
  ├── 高度数据 (HeightField)
  ├── 混合权重 (SplatMap)
  └── LOD 级别
```

---

## TerrainAsset 地形资源

```typescript
// cocos/terrain/terrain-asset.ts

export class TerrainAsset extends Asset {
    // ─── 高度数据 ───
    heights: Float32Array;          // 高度数组
    width: number;                  // 高度图宽度
    height: number;                 // 高度图高度

    // ─── 混合数据 ───
    weights: Uint8Array;            // 纹理混合权重

    // ─── 层信息 ───
    tileMap: TerrainTileInfo[];     // 瓦片信息
}
```

---

## HeightField 高度场

```typescript
// cocos/terrain/height-field.ts

export class HeightField {
    data: Float32Array;             // 高度数据 (二维数组展平)
    w: number;                      // 宽度
    h: number;                      // 高度

    // ─── 采样方法 ───
    getAt(x, y): number;            // 直接获取
    sampleHeight(u, v): number;     // 双线性插值采样
    sampleNormal(u, v): Vec3;       // 计算法线
}
```

### 高度场与网格

```
高度图 (HeightMap):
  每个像素 = 一个高度值
  128×128 像素 → 128×128 顶点网格

        高度图           3D 网格
    ┌───┬───┬───┐     ┌───────────┐
    │ 0 │ 2 │ 1 │     │ /\ /\ /\  │
    ├───┼───┼───┤ →   │/  /  /  / │
    │ 5 │ 8 │ 3 │     │  /  /  /  │
    ├───┼───┼───┤     │ /  /  /   │
    │ 2 │ 4 │ 6 │     │/  /  /    │
    └───┴───┴───┘     └───────────┘
```

---

## TerrainLOD 细节层次

地形使用 LOD 根据相机距离自动调整细节级别。

```typescript
// cocos/terrain/terrain-lod.ts

export class TerrainLOD {
    // 根据 Camera 距离选择 LOD 级别
    // LOD 0: 最高精度（近处）
    // LOD 1: 中等精度
    // LOD 2: 低精度（远处）
}
```

### LOD 切换策略

```
相机距离 → LOD 选择:

距离 0~50m   → LOD 0 (每格 1m 精度)
距离 50~200m  → LOD 1 (每格 2m 精度)
距离 200m+    → LOD 2 (每格 4m 精度)

                近     →     远
LOD 0 ████████
LOD 1         ████████████
LOD 2                     ████████████
```

---

## 技术原理

### 1. 纹理混合（Splat Mapping）

```
地形使用多张纹理混合:

层 0: 草地纹理 (weight = 0.6)
层 1: 泥土纹理 (weight = 0.3)
层 2: 石头纹理 (weight = 0.1)

片元着色器:
  color = grass * weight0 + dirt * weight1 + rock * weight2

权重存储在 SplatMap (RGBA 纹理) 中:
  R = 层 0 权重
  G = 层 1 权重
  B = 层 2 权重
  A = 层 3 权重
```

### 2. 法线计算

```
高度场法线通过中心差分计算:

对于顶点 (i, j):
  dhdx = height[i+1][j] - height[i-1][j]
  dhdz = height[i][j+1] - height[i][j-1]

  normal = normalize(-dhdx, 2 * cellSize, -dhdz)
```

---

## 下一步

完成地形系统的学习后，继续学习 [04-阴影系统](./04-shadows.md)。
