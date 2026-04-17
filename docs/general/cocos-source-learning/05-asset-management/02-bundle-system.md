# Bundle 资源包

Bundle 是资源管理的基本单元，每个 Bundle 对应一组打包在一起的资源文件。通过多包机制，可以实现资源的按需加载和热更新。

## 目录

- [Bundle 设计](#bundle-设计)
- [核心 API](#核心-api)
- [内置 Bundle](#内置-bundle)
- [多包管理](#多包管理)
- [技术原理](#技术原理)

---

## Bundle 设计

```typescript
// cocos/asset/asset-manager/bundle.ts

export class Bundle {
    name: string;                   // Bundle 名称
    base: string;                   // 基础路径（URL 或本地路径）
    deps: string[];                 // 依赖的其他 Bundle

    // ─── 加载方法 ───
    load<T>(paths, type?, onProgress?, onComplete?): void;
    preload(paths, type?, onProgress?, onComplete?): void;
    loadDir<T>(dir, type?, onProgress?, onComplete?): void;
    loadScene(sceneName, options?, onProgress?, onComplete?): void;

    // ─── 查询方法 ───
    get<T>(path, type?): T | null;  // 获取已缓存资源
    getAssetInfo(path): AssetInfo;
    getDirWithPath(path): AssetInfo[];
    getConfig(): Record<string, any>;

    // ─── 释放 ───
    release(path, type?): void;
    releaseUnused(): void;
}
```

---

## 核心 API

### 加载资源

```typescript
// 获取 Bundle
const bundle = assetManager.getBundle('common');

// 加载单个资源
bundle.load('textures/hero', Texture2D, (err, texture) => {
    sprite.spriteFrame = texture;
});

// 加载目录下所有资源
bundle.loadDir('textures/', Texture2D, (err, textures) => {
    // textures 是一个数组
});

// 加载场景
bundle.loadScene('levels/level1', (err, sceneAsset) => {
    director.runScene(sceneAsset);
});

// 预加载（只下载不创建实例）
bundle.preload('textures/', Texture2D, (done, total) => {
    console.log(`进度: ${done}/${total}`);
});
```

### 获取已加载资源

```typescript
// 从缓存获取（同步，不触发加载）
const texture = bundle.get('textures/hero', Texture2D);
if (texture) {
    // 资源已加载，直接使用
}
```

---

## 内置 Bundle

| Bundle | 说明 | 用途 |
|--------|------|------|
| `resources` | 内置资源包 | `resources.load()` 的默认来源 |
| `main` | 主包 | 首包包含的资源 |
| `start-scene` | 启动场景 | 游戏启动时加载 |

### resources 目录

```
assets/
├── resources/          ← 自动包含在 resources Bundle 中
│   ├── textures/
│   │   └── hero.png
│   ├── prefabs/
│   │   └── enemy.prefab
│   └── audio/
│       └── bgm.mp3
├── scenes/
└── scripts/

// resources 目录下的文件可通过路径直接加载
resources.load('textures/hero', Texture2D);
```

---

## 多包管理

### 加载远程 Bundle

```typescript
// 从服务器加载 Bundle
assetManager.loadBundle('https://cdn.example.com/hotfix', {
    version: '1.0.1'    // 版本号（用于热更新）
}, (err, bundle) => {
    bundle.load('newHero', Prefab, (err, prefab) => {
        // 使用新资源
    });
});
```

### Bundle 依赖

```
┌─────────────────────────┐
│  main Bundle            │
│  ├── 基础 UI 资源       │
│  └── 依赖: common       │
├─────────────────────────┤
│  common Bundle          │
│  ├── 通用材质/纹理      │
│  └── 依赖: (无)         │
├─────────────────────────┤
│  level1 Bundle (按需加载)│
│  ├── 关卡 1 资源        │
│  └── 依赖: common       │
└─────────────────────────┘
```

---

## 技术原理

### 1. Bundle 配置文件

每个 Bundle 包含一个 `config.json` 描述资源映射：

```json
{
    "paths": {
        "textures/hero": {
            "uuid": "a1b2c3d4",
            "type": "cc.Texture2D",
            "path": "assets/textures/hero.png"
        }
    },
    "deps": ["common"],
    "version": "1.0.0"
}
```

### 2. 路径解析

```
用户输入: "textures/hero"
    │
    ▼ 解析
Bundle 配置查询 → UUID: "a1b2c3d4"
    │
    ▼ 查缓存
全局缓存命中? → 直接返回 Asset
    │
    ▼ 未命中
创建加载 Task → Pipeline 执行
```

---

## 下一步

完成 Bundle 系统的学习后，继续学习 [03-加载流水线](./03-loading-pipeline.md)。
