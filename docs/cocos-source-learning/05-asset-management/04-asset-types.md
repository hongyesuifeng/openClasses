# 资源类型系统

资源类型系统定义了引擎中所有资源的基类和类型层次，每种资源都有唯一的 UUID 和引用计数机制。

## 目录

- [Asset 基类](#asset-基类)
- [常用资源类型](#常用资源类型)
- [资源依赖关系](#资源依赖关系)

---

## Asset 基类

所有资源都继承自 `Asset` 基类。

```typescript
// cocos/asset/assets/asset.ts

export class Asset extends CCObject {
    // ─── 标识 ───
    get uuid(): string;             // 全局唯一 ID
    get nativeUrl(): string;        // 原生文件 URL

    // ─── 引用计数 ───
    get refCount(): number;
    addRef(): Asset;                // 增加引用
    decRef(autoDestroy?: boolean): Asset;  // 减少引用

    // ─── 原生资源 ───
    get nativeAsset(): any;         // 原生资源数据
    set nativeAsset(val): void;

    // ─── 方法 ───
    toString(): string;             // 返回资源描述
    destroy(): boolean;             // 销毁资源
}
```

### UUID 系统

```
UUID 格式: "a1b2c3d4e5f6@f084a"

生成规则:
  文件路径 + 文件名 → 哈希算法 → UUID

特点:
  - 全局唯一
  - 与文件路径无关（重命名不影响 UUID）
  - 用于缓存和依赖追踪
```

---

## 常用资源类型

### 资源继承体系

```
Asset (基类)
├── Texture2D          二维纹理
├── TextureCube        立方体纹理
├── Material           材质
├── EffectAsset        着色器效果
├── JsonAsset          JSON 数据
├── TextAsset          文本数据
├── Font               字体
├── AnimationClip      动画剪辑
├── AudioClip          音频剪辑
├── SceneAsset         场景资源
├── Prefab             预制体
├── MeshAsset          网格数据
├── RenderTexture      渲染纹理
├── SpriteFrame        精灵帧
└── TerrainAsset       地形资源
```

### 各资源类型说明

| 资源类型 | 文件扩展名 | 说明 |
|----------|-----------|------|
| `Texture2D` | `.png/.jpg` | GPU 纹理，用于贴图 |
| `Material` | `.mtl` | 材质配置（Effect + 属性值） |
| `EffectAsset` | `.effect` | 着色器效果程序 |
| `JsonAsset` | `.json` | 通用 JSON 数据 |
| `Font` | `.ttf/.fnt` | 字体资源 |
| `AnimationClip` | `.anim` | 动画关键帧数据 |
| `AudioClip` | `.mp3/.wav` | 音频数据 |
| `Prefab` | `.prefab` | 可实例化的节点模板 |
| `SceneAsset` | `.scene` | 场景数据 |
| `MeshAsset` | `.mesh` | 3D 网格数据 |
| `RenderTexture` | — | 运行时创建的渲染目标 |
| `SpriteFrame` | — | 纹理的子区域（精灵图） |

---

## 资源依赖关系

资源之间存在依赖，加载时自动处理：

```
Prefab (hero)
├── Material (heroMat)
│   ├── EffectAsset (standard)
│   └── Texture2D (heroTexture)
├── AnimationClip (heroIdle)
└── MeshAsset (heroMesh)

加载 hero.prefab 时:
  1. 自动发现依赖: heroMat, heroIdle, heroMesh
  2. 递归发现: standard, heroTexture
  3. 按依赖顺序加载
  4. 所有依赖就绪后完成 hero.prefab 加载

释放 hero.prefab 时:
  1. hero.prefab refCount--
  2. heroMat, heroIdle, heroMesh refCount--
  3. standard, heroTexture refCount--
  4. refCount=0 的资源可被回收
```

---

## 下一步

完成资源管理章节后，继续学习 [06-UI 系统](../06-ui-system/README.md)。
